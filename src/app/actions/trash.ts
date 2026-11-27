"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export type TrashEntityType =
  | "CAR"
  | "CUSTOMER"
  | "BOOKING"
  | "PAYMENT"
  | "PARKING"
  | "MAINTENANCE";

export interface TrashItem {
  id: string;
  entityType: TrashEntityType;
  title: string;
  subtitle: string;
  deletedAt: string;
  details?: string;
}

export async function softDeleteEntityAction(entityType: TrashEntityType, id: string) {
  const staff = await requireAuth(["ADMIN", "STAFF"]);

  try {
    const now = new Date();

    switch (entityType) {
      case "CAR":
        await prisma.car.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
        });
        revalidatePath("/admin/cars");
        revalidatePath("/cars");
        break;

      case "CUSTOMER":
        await prisma.customer.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
        });
        revalidatePath("/admin/customers");
        break;

      case "BOOKING":
        const booking = await prisma.booking.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
          include: { car: true },
        });

        // If car was marked rented solely by this booking, check and free it
        if (booking.status === "ACTIVE") {
          const otherActive = await prisma.booking.count({
            where: { carId: booking.carId, id: { not: id }, status: "ACTIVE", isDeleted: false },
          });
          if (otherActive === 0) {
            await prisma.car.update({
              where: { id: booking.carId },
              data: { operationalStatus: "AVAILABLE" },
            });
          }
        }
        revalidatePath("/admin/bookings");
        break;

      case "PAYMENT":
        const payment = await prisma.payment.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
        });

        // If linked to booking, subtract payment from booking amountPaid
        if (payment.bookingId) {
          const b = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
          if (b) {
            const currentPaid = Number(b.amountPaid);
            const amt = Number(payment.amount);
            const newPaid = payment.paymentType === "REFUND"
              ? currentPaid + amt
              : Math.max(0, currentPaid - amt);
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { amountPaid: newPaid },
            });
          }
        }
        revalidatePath("/admin/payments");
        revalidatePath("/admin/bookings");
        break;

      case "PARKING":
        await prisma.parkingRecord.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
        });
        revalidatePath("/admin/parking");
        revalidatePath("/admin/payments");
        break;

      case "MAINTENANCE":
        const maint = await prisma.maintenanceRecord.update({
          where: { id },
          data: { isDeleted: true, deletedAt: now },
        });

        if (maint.status === "IN_PROGRESS") {
          const ongoing = await prisma.maintenanceRecord.count({
            where: { carId: maint.carId, id: { not: id }, status: "IN_PROGRESS", isDeleted: false },
          });
          if (ongoing === 0) {
            await prisma.car.update({
              where: { id: maint.carId },
              data: { operationalStatus: "AVAILABLE" },
            });
          }
        }
        revalidatePath("/admin/maintenance");
        revalidatePath("/admin/cars");
        break;
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Soft delete error:", error);
    return { success: false, error: error.message || "Failed to move item to trash" };
  }
}

export async function restoreEntityAction(entityType: TrashEntityType, id: string) {
  await requireAuth(["ADMIN"]);

  try {
    switch (entityType) {
      case "CAR":
        await prisma.car.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });
        revalidatePath("/admin/cars");
        revalidatePath("/cars");
        break;

      case "CUSTOMER":
        await prisma.customer.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });
        revalidatePath("/admin/customers");
        break;

      case "BOOKING":
        await prisma.booking.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });
        revalidatePath("/admin/bookings");
        break;

      case "PAYMENT":
        const payment = await prisma.payment.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });

        if (payment.bookingId) {
          const b = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
          if (b) {
            const currentPaid = Number(b.amountPaid);
            const amt = Number(payment.amount);
            const newPaid = payment.paymentType === "REFUND"
              ? Math.max(0, currentPaid - amt)
              : currentPaid + amt;
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { amountPaid: newPaid },
            });
          }
        }
        revalidatePath("/admin/payments");
        revalidatePath("/admin/bookings");
        break;

      case "PARKING":
        await prisma.parkingRecord.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });
        revalidatePath("/admin/parking");
        revalidatePath("/admin/payments");
        break;

      case "MAINTENANCE":
        await prisma.maintenanceRecord.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });
        revalidatePath("/admin/maintenance");
        revalidatePath("/admin/cars");
        break;
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restore item" };
  }
}

export async function permanentDeleteEntityAction(entityType: TrashEntityType, id: string) {
  await requireAuth(["ADMIN"]);

  try {
    switch (entityType) {
      case "CAR":
        await prisma.$transaction(async (tx) => {
          await tx.carImage.deleteMany({ where: { carId: id } });
          await tx.maintenanceRecord.deleteMany({ where: { carId: id } });
          await tx.car.delete({ where: { id } });
        });
        break;

      case "CUSTOMER":
        await prisma.customer.delete({ where: { id } });
        break;

      case "BOOKING":
        await prisma.$transaction(async (tx) => {
          await tx.bookingExtraItem.deleteMany({ where: { bookingId: id } });
          await tx.vehicleInspection.deleteMany({ where: { bookingId: id } });
          await tx.bookingAuditLog.deleteMany({ where: { bookingId: id } });
          await tx.payment.deleteMany({ where: { bookingId: id } });
          await tx.booking.delete({ where: { id } });
        });
        break;

      case "PAYMENT":
        await prisma.payment.delete({ where: { id } });
        break;

      case "PARKING":
        await prisma.$transaction(async (tx) => {
          await tx.payment.deleteMany({ where: { parkingRecordId: id } });
          await tx.parkingRecord.delete({ where: { id } });
        });
        break;

      case "MAINTENANCE":
        await prisma.maintenanceRecord.delete({ where: { id } });
        break;
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to permanently delete item" };
  }
}

export async function emptyTrashAction(entityType?: TrashEntityType) {
  await requireAuth(["ADMIN"]);

  try {
    if (!entityType || entityType === "PAYMENT") {
      await prisma.payment.deleteMany({ where: { isDeleted: true } });
    }
    if (!entityType || entityType === "MAINTENANCE") {
      await prisma.maintenanceRecord.deleteMany({ where: { isDeleted: true } });
    }
    if (!entityType || entityType === "PARKING") {
      await prisma.parkingRecord.deleteMany({ where: { isDeleted: true } });
    }
    if (!entityType || entityType === "BOOKING") {
      const deletedBookings = await prisma.booking.findMany({
        where: { isDeleted: true },
        select: { id: true },
      });
      const ids = deletedBookings.map((b) => b.id);
      if (ids.length > 0) {
        await prisma.bookingExtraItem.deleteMany({ where: { bookingId: { in: ids } } });
        await prisma.vehicleInspection.deleteMany({ where: { bookingId: { in: ids } } });
        await prisma.bookingAuditLog.deleteMany({ where: { bookingId: { in: ids } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: ids } } });
        await prisma.booking.deleteMany({ where: { id: { in: ids } } });
      }
    }
    if (!entityType || entityType === "CAR") {
      const deletedCars = await prisma.car.findMany({
        where: { isDeleted: true },
        select: { id: true },
      });
      const cids = deletedCars.map((c) => c.id);
      if (cids.length > 0) {
        await prisma.carImage.deleteMany({ where: { carId: { in: cids } } });
        await prisma.maintenanceRecord.deleteMany({ where: { carId: { in: cids } } });
        await prisma.car.deleteMany({ where: { id: { in: cids } } });
      }
    }
    if (!entityType || entityType === "CUSTOMER") {
      await prisma.customer.deleteMany({ where: { isDeleted: true } });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to empty trash" };
  }
}

export async function getTrashItems(): Promise<TrashItem[]> {
  await requireAuth(["ADMIN", "STAFF"]);

  const [cars, customers, bookings, payments, parking, maintenance] = await Promise.all([
    prisma.car.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { isDeleted: true },
      include: { car: true, customer: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.parkingRecord.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.maintenanceRecord.findMany({
      where: { isDeleted: true },
      include: { car: true },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const items: TrashItem[] = [];

  for (const c of cars) {
    items.push({
      id: c.id,
      entityType: "CAR",
      title: `${c.make} ${c.model} (${c.year})`,
      subtitle: `Plate: ${c.registrationNumber} • Category: ${c.category}`,
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : new Date().toISOString(),
      details: `Daily Rate: PKR ${Number(c.dailyRate).toLocaleString()} • Status: ${c.operationalStatus}`,
    });
  }

  for (const cust of customers) {
    items.push({
      id: cust.id,
      entityType: "CUSTOMER",
      title: cust.fullName,
      subtitle: `Phone: ${cust.phone} • Email: ${cust.email}`,
      deletedAt: cust.deletedAt ? cust.deletedAt.toISOString() : new Date().toISOString(),
      details: cust.address || "No address specified",
    });
  }

  for (const b of bookings) {
    items.push({
      id: b.id,
      entityType: "BOOKING",
      title: `Booking ${b.bookingReference} — ${b.customer.fullName}`,
      subtitle: `Vehicle: ${b.car.make} ${b.car.model} (${b.car.registrationNumber})`,
      deletedAt: b.deletedAt ? b.deletedAt.toISOString() : new Date().toISOString(),
      details: `Total: PKR ${Number(b.totalAmount).toLocaleString()} • Status: ${b.status}`,
    });
  }

  for (const p of payments) {
    items.push({
      id: p.id,
      entityType: "PAYMENT",
      title: `Receipt ${p.receiptNumber || p.id.slice(0, 8)} — PKR ${Number(p.amount).toLocaleString()}`,
      subtitle: `Type: ${p.paymentType} • Method: ${p.paymentMethod}`,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : new Date().toISOString(),
      details: p.notes || `Direction: ${p.direction}`,
    });
  }

  for (const pr of parking) {
    items.push({
      id: pr.id,
      entityType: "PARKING",
      title: `Parking: ${pr.vehiclePlate} — ${pr.ownerName}`,
      subtitle: `Model: ${pr.vehicleModel} • Slot: ${pr.slotNumber || "Yard"}`,
      deletedAt: pr.deletedAt ? pr.deletedAt.toISOString() : new Date().toISOString(),
      details: `Monthly Fee: PKR ${Number(pr.monthlyFee).toLocaleString()} • Phone: ${pr.ownerPhone}`,
    });
  }

  for (const m of maintenance) {
    items.push({
      id: m.id,
      entityType: "MAINTENANCE",
      title: `Service: ${m.car.make} ${m.car.model} (${m.car.registrationNumber})`,
      subtitle: m.description,
      deletedAt: m.deletedAt ? m.deletedAt.toISOString() : new Date().toISOString(),
      details: `Cost: PKR ${Number(m.cost || 0).toLocaleString()} • Status: ${m.status}`,
    });
  }

  // Sort newest deleted first
  items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  return items;
}
