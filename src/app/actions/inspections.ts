"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { vehicleInspectionSchema } from "@/lib/validations/booking";
import { recordPaymentAction } from "@/app/actions/payments";
import { revalidatePath } from "next/cache";

export async function submitVehicleInspectionAction(input: {
  bookingId: string;
  inspectionType: "PRE_RENTAL" | "POST_RENTAL";
  isMonthlyRental: boolean;
  oilChanged: boolean;
  oilBrand?: string;
  oilCost?: number;
  odometerReading?: number;
  nextOilOdometer?: number;
  engineOk: boolean;
  brakesOk: boolean;
  tiresOk: boolean;
  acOk: boolean;
  lightsOk: boolean;
  bodyClean: boolean;
  scratchesNotes?: string;
  fuelLevel: string;
  toolsAndSpare: boolean;
  isVehicleApproved: boolean;
  inspectedBy?: string;
  notes?: string;
  logOilCostToLedger?: boolean;
}) {
  const staff = await requireAuth(["ADMIN", "STAFF"]);

  const validation = vehicleInspectionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid inspection data" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { car: true, customer: true },
  });

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  try {
    const inspection = await prisma.$transaction(async (tx) => {
      // 1. Create inspection record
      const record = await tx.vehicleInspection.create({
        data: {
          bookingId: input.bookingId,
          inspectionType: input.inspectionType,
          isMonthlyRental: input.isMonthlyRental,
          oilChanged: input.oilChanged,
          oilBrand: input.oilBrand?.trim() || null,
          oilCost: input.oilCost || null,
          odometerReading: input.odometerReading || null,
          nextOilOdometer: input.nextOilOdometer || null,
          engineOk: input.engineOk,
          brakesOk: input.brakesOk,
          tiresOk: input.tiresOk,
          acOk: input.acOk,
          lightsOk: input.lightsOk,
          bodyClean: input.bodyClean,
          scratchesNotes: input.scratchesNotes?.trim() || null,
          fuelLevel: input.fuelLevel,
          toolsAndSpare: input.toolsAndSpare,
          isVehicleApproved: input.isVehicleApproved,
          inspectedBy: input.inspectedBy?.trim() || staff.name,
          notes: input.notes?.trim() || null,
        },
      });

      // 2. If oil was changed and cost is specified, create maintenance entry
      if (input.oilChanged && input.oilCost && input.oilCost > 0) {
        await tx.maintenanceRecord.create({
          data: {
            carId: booking.carId,
            startDateTime: new Date(),
            endDateTime: new Date(),
            description: `Mobil oil & filter change (${input.oilBrand || "Standard Oil"}). Odo: ${input.odometerReading || "N/A"} km [Booking Ref: ${booking.bookingReference}]`,
            cost: input.oilCost,
            status: "COMPLETED",
          },
        });
      }

      // 3. Write booking audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: input.bookingId,
          userId: staff.id,
          action: "VEHICLE_INSPECTION_RECORDED",
          details: `${input.inspectionType === "PRE_RENTAL" ? "Pre-rental handover" : "Post-rental return"} inspection conducted by ${staff.name}. Status: ${input.isVehicleApproved ? "PASSED (Car OK)" : "FLAGGED ISSUES"}. ${input.oilChanged ? `Mobil oil changed (${input.oilBrand || "N/A"}, Rs. ${input.oilCost || 0})` : "No oil change (short rental)"}.`,
        },
      });

      return record;
    });

    // 4. If logOilCostToLedger is enabled, record payment entry in ledger
    if (input.oilChanged && input.oilCost && input.oilCost > 0 && input.logOilCostToLedger) {
      await recordPaymentAction({
        direction: "OUTFLOW",
        category: "MAINTENANCE_OIL",
        carId: booking.carId,
        bookingId: booking.id,
        amount: input.oilCost,
        currency: "PKR",
        paymentMethod: "CASH",
        paymentType: "MAINTENANCE_OIL",
        vehiclePlate: booking.car.registrationNumber,
        notes: `Mobil oil change (${input.oilBrand || "Engine Oil"}) for ${booking.car.make} ${booking.car.model} (${booking.car.registrationNumber}) [Booking: ${booking.bookingReference}]`,
      });
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/maintenance");
    revalidatePath("/admin");

    return { success: true, inspection };
  } catch (error: any) {
    console.error("Inspection recording error:", error);
    return { success: false, error: error.message || "Failed to record vehicle inspection" };
  }
}
