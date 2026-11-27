"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { parkingRecordSchema } from "@/lib/validations/booking";
import { recordPaymentAction } from "@/app/actions/payments";
import { revalidatePath } from "next/cache";

export async function createParkingRecordAction(input: {
  vehiclePlate: string;
  vehicleModel: string;
  ownerName: string;
  ownerPhone: string;
  ownerCnic?: string;
  monthlyFee: number;
  slotNumber?: string;
  startDate?: string;
  notes?: string;
  initialPaymentReceived?: boolean;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE";
}) {
  const staff = await requireAuth(["ADMIN", "STAFF"]);

  const validation = parkingRecordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid parking details" };
  }

  try {
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const paidUntil = new Date(startDate);
    if (input.initialPaymentReceived) {
      paidUntil.setMonth(paidUntil.getMonth() + 1);
    }

    const record = await prisma.parkingRecord.create({
      data: {
        vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
        vehicleModel: input.vehicleModel.trim(),
        ownerName: input.ownerName.trim(),
        ownerPhone: input.ownerPhone.trim(),
        ownerCnic: input.ownerCnic?.trim() || null,
        monthlyFee: input.monthlyFee,
        slotNumber: input.slotNumber?.trim() || null,
        startDate,
        status: "ACTIVE",
        notes: input.notes?.trim() || null,
        lastPaymentDate: input.initialPaymentReceived ? new Date() : null,
        paidUntilDate: input.initialPaymentReceived ? paidUntil : null,
      },
    });

    // If initial payment was made at registration, create ledger entry
    if (input.initialPaymentReceived) {
      const monthName = startDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      await recordPaymentAction({
        parkingRecordId: record.id,
        direction: "INFLOW",
        category: "PARKING_FEE",
        amount: input.monthlyFee,
        currency: "PKR",
        paymentMethod: input.paymentMethod || "CASH",
        paymentType: "PARKING_FEE",
        customerName: record.ownerName,
        customerPhone: record.ownerPhone,
        vehiclePlate: record.vehiclePlate,
        monthBilled: monthName,
        notes: `Initial monthly parking fee for ${record.vehiclePlate} (${monthName})`,
      });
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin");

    return { success: true, record };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create parking subscription" };
  }
}

export async function updateParkingRecordStatusAction(id: string, status: string) {
  await requireAuth(["ADMIN", "STAFF"]);
  try {
    const updated = await prisma.parkingRecord.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/payments");
    return { success: true, record: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update parking status" };
  }
}
