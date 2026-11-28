"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { softDeleteEntityAction } from "./trash";

function generateInvoiceNumber(): string {
  const d = new Date();
  const yearMonth = `${d.getFullYear().toString().slice(-2)}${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WM-INV-${yearMonth}-${random}`;
}

export async function createInvoiceAction(input: {
  bookingId?: string;
  customerId?: string;
  carId?: string;
  invoiceDate?: string;
  dueDate?: string;
  customerName: string;
  customerCnic?: string;
  customerPhone: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  vehicleColor?: string;
  vehicleMakeModel: string;
  modelYearNumber: string;
  rentalStartDate: string;
  rentalEndDate: string;
  rentPerDay: number;
  numberOfDays?: number;
  advancePaid?: number;
  otherCharges?: number;
  discount?: number;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE";
  status?: string;
  terms?: string;
  notes?: string;
}) {
  await requireAuth(["ADMIN", "STAFF"]);

  if (!input.customerName || !input.customerPhone || !input.vehicleMakeModel) {
    return { success: false, error: "Please fill required customer and vehicle details" };
  }

  try {
    const start = new Date(input.rentalStartDate);
    const end = new Date(input.rentalEndDate);

    // Calculate days if not provided
    let days = input.numberOfDays;
    if (!days || days <= 0) {
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      days = Math.max(1, Math.ceil(diffHours / 24));
    }

    const rentPerDay = Number(input.rentPerDay) || 0;
    const totalRent = Math.round(rentPerDay * days);
    const otherCharges = Number(input.otherCharges) || 0;
    const discount = Number(input.discount) || 0;
    const grandTotal = Math.max(0, totalRent + otherCharges - discount);
    const advancePaid = Number(input.advancePaid) || 0;
    const balanceDue = Math.max(0, grandTotal - advancePaid);

    let status = input.status || "UNPAID";
    if (balanceDue === 0 && grandTotal > 0) {
      status = "PAID";
    } else if (advancePaid > 0 && balanceDue > 0) {
      status = "PARTIAL";
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : end,
        currency: "PKR",
        status,
        bookingId: input.bookingId || null,
        customerId: input.customerId || null,
        carId: input.carId || null,
        customerName: input.customerName.trim(),
        customerCnic: input.customerCnic?.trim() || null,
        customerPhone: input.customerPhone.trim(),
        pickupLocation: input.pickupLocation?.trim() || "Gujrat Main Hub",
        dropoffLocation: input.dropoffLocation?.trim() || "Gujrat Main Hub",
        vehicleColor: input.vehicleColor?.trim() || null,
        vehicleMakeModel: input.vehicleMakeModel.trim(),
        modelYearNumber: input.modelYearNumber.trim(),
        rentalStartDate: start,
        rentalEndDate: end,
        rentPerDay,
        numberOfDays: days,
        totalRent,
        advancePaid,
        otherCharges,
        discount,
        grandTotal,
        balanceDue,
        paymentMethod: input.paymentMethod || "CASH",
        terms: input.terms || undefined,
        notes: input.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/invoices");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    return { success: true, invoice };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create invoice" };
  }
}

export async function createInvoiceFromBookingAction(bookingId: string) {
  await requireAuth(["ADMIN", "STAFF"]);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        car: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Check if an active invoice already exists for this booking
    const existing = await prisma.invoice.findFirst({
      where: { bookingId, isDeleted: false },
    });
    if (existing) {
      return { success: true, invoice: existing, alreadyExisted: true };
    }

    const start = new Date(booking.pickupDateTime);
    const end = new Date(booking.returnDateTime);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(diffHours / 24));

    const totalRent = Number(booking.rentalPrice);
    const rentPerDay = Math.round(totalRent / days);
    const otherCharges = Number(booking.extrasTotal) + Number(booking.depositAmount);
    const discount = Number(booking.discount) || 0;
    const grandTotal = Number(booking.totalAmount);
    const advancePaid = Number(booking.amountPaid);
    const balanceDue = Math.max(0, grandTotal - advancePaid);

    let status = "UNPAID";
    if (balanceDue === 0 && grandTotal > 0) status = "PAID";
    else if (advancePaid > 0) status = "PARTIAL";

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: end,
        currency: booking.currency || "PKR",
        status,
        bookingId: booking.id,
        customerId: booking.customerId,
        carId: booking.carId,
        customerName: booking.customer.fullName,
        customerCnic: booking.customer.drivingLicenceDetails || null,
        customerPhone: booking.customer.phone,
        pickupLocation: booking.pickupLocation || "Gujrat Main Hub",
        dropoffLocation: booking.returnLocation || "Gujrat Main Hub",
        vehicleColor: "Standard",
        vehicleMakeModel: `${booking.car.make} ${booking.car.model}`,
        modelYearNumber: `${booking.car.year} / ${booking.car.registrationNumber}`,
        rentalStartDate: start,
        rentalEndDate: end,
        rentPerDay,
        numberOfDays: days,
        totalRent,
        advancePaid,
        otherCharges,
        discount,
        grandTotal,
        balanceDue,
        paymentMethod: "CASH",
        notes: `Generated from booking reference ${booking.bookingReference}`,
      },
    });

    revalidatePath("/admin/invoices");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    return { success: true, invoice };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate invoice from booking" };
  }
}

export async function updateInvoiceStatusAction(id: string, status: string) {
  await requireAuth(["ADMIN", "STAFF"]);

  try {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/invoices");
    return { success: true, invoice: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update invoice status" };
  }
}

export async function deleteInvoiceAction(id: string) {
  await requireAuth(["ADMIN"]);
  return softDeleteEntityAction("INVOICE", id);
}
