import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InvoiceManager } from "@/components/admin/InvoiceManager";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const user = await requireAuth(["ADMIN", "STAFF"]).catch(() => null);
  if (!user) {
    redirect("/admin/login");
  }

  // Fetch all non-deleted invoices with relations
  const invoices = await prisma.invoice.findMany({
    where: { isDeleted: false },
    orderBy: { invoiceDate: "desc" },
  });

  // Fetch active bookings for invoice generation dropdown
  const bookings = await prisma.booking.findMany({
    where: { isDeleted: false },
    include: {
      customer: { select: { fullName: true, phone: true, drivingLicenceDetails: true } },
      car: { select: { make: true, model: true, year: true, registrationNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Fetch active fleet cars
  const cars = await prisma.car.findMany({
    where: { isDeleted: false },
    select: { id: true, make: true, model: true, year: true, registrationNumber: true, dailyRate: true },
    orderBy: { make: "asc" },
  });

  // Fetch customers
  const customers = await prisma.customer.findMany({
    where: { isDeleted: false },
    select: { id: true, fullName: true, phone: true, drivingLicenceDetails: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <InvoiceManager
      initialInvoices={invoices}
      bookings={bookings}
      cars={cars}
      customers={customers}
      userRole={user.role}
    />
  );
}
