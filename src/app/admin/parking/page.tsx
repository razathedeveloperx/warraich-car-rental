import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ParkingManager } from "@/components/admin/ParkingManager";

export const dynamic = "force-dynamic";

export default async function AdminParkingPage() {
  const user = await requireAuth(["ADMIN", "STAFF"]).catch(() => null);
  if (!user) {
    redirect("/admin/login");
  }

  const records = await prisma.parkingRecord.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return <ParkingManager initialRecords={records} />;
}
