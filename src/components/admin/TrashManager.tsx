"use client";

import { useState, useMemo } from "react";
import { formatDateTime } from "@/lib/utils";
import {
  Trash2,
  RotateCcw,
  Search,
  Car,
  Users,
  CalendarCheck,
  CreditCard,
  CircleParking,
  Wrench,
  Receipt,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  TrashItem,
  TrashEntityType,
  restoreEntityAction,
  permanentDeleteEntityAction,
  emptyTrashAction,
} from "@/app/actions/trash";

interface TrashManagerProps {
  initialItems: TrashItem[];
}

export function TrashManager({ initialItems }: TrashManagerProps) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isEmptying, setIsEmptying] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Restore Handler
  const handleRestore = async (item: TrashItem) => {
    setProcessingId(item.id);
    setActionMessage(null);

    const res = await restoreEntityAction(item.entityType, item.id);
    setProcessingId(null);

    if (!res.success) {
      setActionMessage({ type: "error", text: res.error || "Failed to restore item" });
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setActionMessage({
      type: "success",
      text: `Restored "${item.title}" successfully back to active records.`,
    });
  };

  // Permanent Delete Handler
  const handlePermanentDelete = async (item: TrashItem) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete "${item.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setProcessingId(item.id);
    setActionMessage(null);

    const res = await permanentDeleteEntityAction(item.entityType, item.id);
    setProcessingId(null);

    if (!res.success) {
      setActionMessage({ type: "error", text: res.error || "Failed to delete item permanently" });
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setActionMessage({
      type: "success",
      text: `Permanently deleted "${item.title}".`,
    });
  };

  // Empty Trash Handler
  const handleEmptyTrash = async () => {
    const targetType = activeTab === "ALL" ? undefined : (activeTab as TrashEntityType);
    const label = activeTab === "ALL" ? "all items" : `all ${activeTab} items`;

    if (
      !confirm(
        `CAUTION: Are you sure you want to PERMANENTLY clear ${label} from the Trash Can? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsEmptying(true);
    setActionMessage(null);

    const res = await emptyTrashAction(targetType);
    setIsEmptying(false);

    if (!res.success) {
      setActionMessage({ type: "error", text: res.error || "Failed to empty trash" });
      return;
    }

    if (targetType) {
      setItems((prev) => prev.filter((i) => i.entityType !== targetType));
    } else {
      setItems([]);
    }

    setActionMessage({
      type: "success",
      text: `Trash can emptied successfully.`,
    });
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchTab = activeTab === "ALL" || item.entityType === activeTab;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        item.title.toLowerCase().includes(s) ||
        item.subtitle.toLowerCase().includes(s) ||
        (item.details && item.details.toLowerCase().includes(s));

      return matchTab && matchSearch;
    });
  }, [items, activeTab, searchTerm]);

  const getEntityIcon = (type: TrashEntityType) => {
    switch (type) {
      case "CAR":
        return <Car className="w-4 h-4 text-blue-600" />;
      case "CUSTOMER":
        return <Users className="w-4 h-4 text-indigo-600" />;
      case "BOOKING":
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case "PAYMENT":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case "PARKING":
        return <CircleParking className="w-4 h-4 text-amber-600" />;
      case "MAINTENANCE":
        return <Wrench className="w-4 h-4 text-rose-600" />;
      case "INVOICE":
        return <Receipt className="w-4 h-4 text-brand-600" />;
    }
  };

  const getEntityBadge = (type: TrashEntityType) => {
    switch (type) {
      case "CAR":
        return "bg-blue-100 text-blue-800";
      case "CUSTOMER":
        return "bg-indigo-100 text-indigo-800";
      case "BOOKING":
        return "bg-emerald-100 text-emerald-800";
      case "PAYMENT":
        return "bg-purple-100 text-purple-800";
      case "PARKING":
        return "bg-amber-100 text-amber-800";
      case "MAINTENANCE":
        return "bg-rose-100 text-rose-800";
      case "INVOICE":
        return "bg-brand-100 text-brand-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/5 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Empty Trash */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <div className="flex items-center gap-2 font-black text-slate-900 text-base">
            <Trash2 className="w-5 h-5 text-red-600" />
            <span>Trash Can & Recycle Bin</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deleted items are held safely here and excluded from active values, lists, and statistics. You can restore them anytime or delete them permanently.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={isEmptying}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
          >
            {isEmptying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Empty Trash Can</span>
          </button>
        )}
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: "ALL", label: `All (${items.length})` },
            { id: "CAR", label: `Cars (${items.filter((i) => i.entityType === "CAR").length})` },
            { id: "CUSTOMER", label: `Customers (${items.filter((i) => i.entityType === "CUSTOMER").length})` },
            { id: "BOOKING", label: `Bookings (${items.filter((i) => i.entityType === "BOOKING").length})` },
            { id: "PAYMENT", label: `Payments (${items.filter((i) => i.entityType === "PAYMENT").length})` },
            { id: "PARKING", label: `Parking (${items.filter((i) => i.entityType === "PARKING").length})` },
            { id: "MAINTENANCE", label: `Maintenance (${items.filter((i) => i.entityType === "MAINTENANCE").length})` },
            { id: "INVOICE", label: `Invoices (${items.filter((i) => i.entityType === "INVOICE").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items in trash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Trash2 className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <div className="font-bold text-slate-600 text-sm">Trash Can is Empty</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || activeTab !== "ALL"
                ? "No deleted items match your search or filter."
                : "No deleted items currently in trash. Everything deleted will appear here for safe restoration."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <div
                key={`${item.entityType}-${item.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getEntityIcon(item.entityType)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getEntityBadge(
                          item.entityType
                        )}`}
                      >
                        {item.entityType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{item.subtitle}</div>
                    {item.details && (
                      <div className="text-[11px] text-slate-400">{item.details}</div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Deleted on {formatDateTime(item.deletedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={processingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs"
                    title="Restore item back to active software records"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(item)}
                    disabled={processingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition shadow-2xs"
                    title="Permanently remove from database"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-700" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
