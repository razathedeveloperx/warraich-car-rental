"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { addPaymentSchema } from "@/lib/validations/booking";
import { revalidatePath } from "next/cache";

function generateReceiptNumber(): string {
  const d = new Date();
  const yearMonth = `${d.getFullYear().toString().slice(-2)}${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WM-${yearMonth}-${random}`;
}

export async function recordPaymentAction(input: {
  bookingId?: string;
  parkingRecordId?: string;
  carId?: string;
  direction?: "INFLOW" | "OUTFLOW";
  category?: string;
  amount: number;
  currency?: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE";
  paymentType:
    | "RENTAL"
    | "DEPOSIT"
    | "REFUND"
    | "DAMAGE_CHARGE"
    | "PARKING_FEE"
    | "MAINTENANCE_OIL"
    | "SALARY"
    | "FUEL"
    | "EXPENSE"
    | "OTHER";
  customerName?: string;
  customerPhone?: string;
  vehiclePlate?: string;
  monthBilled?: string;
  transactionReference?: string;
  notes?: string;
  paidAt?: string;
}) {
  const staff = await requireAuth(["ADMIN", "STAFF"]);

  const validation = addPaymentSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid payment details" };
  }

  // Determine direction
  let direction = input.direction;
  if (!direction) {
    if (["REFUND", "MAINTENANCE_OIL", "SALARY", "FUEL", "EXPENSE"].includes(input.paymentType)) {
      direction = "OUTFLOW";
    } else {
      direction = "INFLOW";
    }
  }

  const receiptNumber = generateReceiptNumber();
  const paymentDate = input.paidAt ? new Date(input.paidAt) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      let bookingCurrency = input.currency || "PKR";
      let bookingCustomerName = input.customerName;
      let bookingCustomerPhone = input.customerPhone;
      let bookingVehiclePlate = input.vehiclePlate;

      // If tied to booking, load booking info & update balance
      if (input.bookingId) {
        const booking = await tx.booking.findUnique({
          where: { id: input.bookingId },
          include: { customer: true, car: true },
        });

        if (booking) {
          bookingCurrency = booking.currency;
          if (!bookingCustomerName) bookingCustomerName = booking.customer.fullName;
          if (!bookingCustomerPhone) bookingCustomerPhone = booking.customer.phone;
          if (!bookingVehiclePlate) bookingVehiclePlate = booking.car.registrationNumber;

          // Adjust booking amountPaid (refund subtracts, rental/deposit adds)
          const currentPaid = Number(booking.amountPaid);
          const adjustment = input.paymentType === "REFUND" ? -input.amount : input.amount;
          const newPaid = Math.max(0, currentPaid + adjustment);

          await tx.booking.update({
            where: { id: input.bookingId },
            data: { amountPaid: newPaid },
          });

          // Write audit log for the booking
          await tx.bookingAuditLog.create({
            data: {
              bookingId: input.bookingId,
              userId: staff.id,
              action: "PAYMENT_RECORDED",
              details: `Recorded ${input.paymentType} payment of ${input.amount} ${bookingCurrency} (${input.paymentMethod}) [Receipt: ${receiptNumber}]. Staff: ${staff.name}.`,
            },
          });
        }
      }

      // If tied to Parking record, update parking payment status
      if (input.parkingRecordId) {
        const parking = await tx.parkingRecord.findUnique({
          where: { id: input.parkingRecordId },
        });

        if (parking) {
          if (!bookingCustomerName) bookingCustomerName = parking.ownerName;
          if (!bookingCustomerPhone) bookingCustomerPhone = parking.ownerPhone;
          if (!bookingVehiclePlate) bookingVehiclePlate = parking.vehiclePlate;

          // calculate next paidUntilDate (advance by 1 month from now or current paidUntilDate)
          const baseDate = parking.paidUntilDate && new Date(parking.paidUntilDate) > new Date()
            ? new Date(parking.paidUntilDate)
            : new Date();
          const nextMonth = new Date(baseDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await tx.parkingRecord.update({
            where: { id: input.parkingRecordId },
            data: {
              status: "ACTIVE",
              lastPaymentDate: paymentDate,
              paidUntilDate: nextMonth,
            },
          });
        }
      }

      // Create Payment ledger record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          direction,
          category: input.category || input.paymentType,
          bookingId: input.bookingId || null,
          parkingRecordId: input.parkingRecordId || null,
          carId: input.carId || null,
          customerName: bookingCustomerName || null,
          customerPhone: bookingCustomerPhone || null,
          vehiclePlate: bookingVehiclePlate || null,
          monthBilled: input.monthBilled || null,
          amount: input.amount,
          currency: bookingCurrency,
          paymentMethod: input.paymentMethod,
          paymentType: input.paymentType,
          status: "COMPLETED",
          transactionReference: input.transactionReference || null,
          notes: input.notes || null,
          paidAt: paymentDate,
        },
      });

      return payment;
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/payments");
    revalidatePath("/admin");

    return { success: true, payment: result };
  } catch (error: any) {
    console.error("Payment recording error:", error);
    return { success: false, error: error.message || "Failed to record payment" };
  }
}

export async function deletePaymentAction(paymentId: string) {
  const staff = await requireAuth(["ADMIN"]);

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) throw new Error("Payment record not found");

      // If linked to a booking, recalculate or deduct from booking
      if (payment.bookingId) {
        const booking = await tx.booking.findUnique({ where: { id: payment.bookingId } });
        if (booking) {
          const currentPaid = Number(booking.amountPaid);
          const amt = Number(payment.amount);
          const newPaid = payment.paymentType === "REFUND"
            ? currentPaid + amt
            : Math.max(0, currentPaid - amt);

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { amountPaid: newPaid },
          });

          await tx.bookingAuditLog.create({
            data: {
              bookingId: payment.bookingId,
              userId: staff.id,
              action: "PAYMENT_VOIDED",
              details: `Payment receipt ${payment.receiptNumber || payment.id} voided by Admin ${staff.name}`,
            },
          });
        }
      }

      await tx.payment.delete({
        where: { id: paymentId },
      });
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete payment" };
  }
}
