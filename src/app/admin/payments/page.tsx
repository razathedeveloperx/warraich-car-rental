import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PaymentLedgerManager } from "@/components/admin/PaymentLedgerManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const user = await requireAuth(["ADMIN", "STAFF"]).catch(() => null);
  if (!user) {
    redirect("/admin/login");
  }

  // Fetch all payments with relations
  const payments = await prisma.payment.findMany({
    where: { isDeleted: false },
    include: {
      booking: {
        include: {
          customer: { select: { fullName: true, phone: true } },
          car: { select: { make: true, model: true, registrationNumber: true } },
        },
      },
      parkingRecord: true,
      car: {
        select: { make: true, model: true, registrationNumber: true },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  // Fetch active bookings for payment link
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      isDeleted: false,
    },
    include: {
      customer: { select: { fullName: true, phone: true } },
      car: { select: { make: true, model: true, registrationNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Fetch registered parking records
  const parkingRecords = await prisma.parkingRecord.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  // Fetch fleet cars for maintenance / oil expenses
  const cars = await prisma.car.findMany({
    where: { isDeleted: false },
    select: { id: true, make: true, model: true, registrationNumber: true },
    orderBy: { make: "asc" },
  });

  return (
    <PaymentLedgerManager
      initialPayments={payments}
      bookings={bookings}
      parkingRecords={parkingRecords}
      cars={cars}
      userRole={user.role}
    />
  );
}
