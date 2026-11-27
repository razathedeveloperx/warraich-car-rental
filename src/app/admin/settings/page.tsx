import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getTrashItems } from "@/app/actions/trash";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireAuth(["ADMIN"]).catch(() => null);
  if (!user) {
    redirect("/admin");
  }

  const [settings, trashItems] = await Promise.all([
    prisma.businessSettings.findFirst(),
    getTrashItems(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Settings & Trash Hub</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business rules, operating parameters, and restore or purge deleted records from the Trash Can.
        </p>
      </div>

      <SettingsForm initialSettings={settings} initialTrashItems={trashItems} />
    </div>
  );
}
