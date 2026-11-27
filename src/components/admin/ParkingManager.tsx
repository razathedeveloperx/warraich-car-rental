"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CircleParking,
  Search,
  Plus,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Car,
  FileText,
  Calendar,
  X,
  Loader2,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { createParkingRecordAction, updateParkingRecordStatusAction, deleteParkingRecordAction } from "@/app/actions/parking";
import { recordPaymentAction } from "@/app/actions/payments";
import Link from "next/link";

interface ParkingManagerProps {
  initialRecords: Array<any>;
}

export function ParkingManager({ initialRecords }: ParkingManagerProps) {
  const [records, setRecords] = useState(initialRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Registration Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [parkPlate, setParkPlate] = useState("");
  const [parkModel, setParkModel] = useState("");
  const [parkOwnerName, setParkOwnerName] = useState("");
  const [parkOwnerPhone, setParkOwnerPhone] = useState("");
  const [parkOwnerCnic, setParkOwnerCnic] = useState("");
  const [parkFee, setParkFee] = useState<number | string>(5000);
  const [parkSlot, setParkSlot] = useState("");
  const [parkCollectInitial, setParkCollectInitial] = useState(true);
  const [parkPaymentMethod, setParkPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE"
  >("CASH");

  // Collect Fee Modal
  const [collectingRecord, setCollectingRecord] = useState<any | null>(null);
  const [feeAmount, setFeeAmount] = useState<number | string>(5000);
  const [feeMonth, setFeeMonth] = useState(() => {
    return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  });
  const [feeMethod, setFeeMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE"
  >("CASH");
  const [feeRef, setFeeRef] = useState("");
  const [feeNotes, setFeeNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [deletingParkingId, setDeletingParkingId] = useState<string | null>(null);

  const handleDeleteParking = async (record: any) => {
    if (
      !confirm(
        `Move parking subscription "${record.vehiclePlate} (${record.ownerName})" to Trash? It will be removed from active parking yards and can be restored in Settings.`
      )
    ) {
      return;
    }

    setDeletingParkingId(record.id);
    const res = await deleteParkingRecordAction(record.id);
    setDeletingParkingId(null);

    if (!res.success) {
      alert(res.error || "Failed to delete parking vehicle");
      return;
    }

    setRecords((prev) => prev.filter((r) => r.id !== record.id));
  };

  // Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const res = await createParkingRecordAction({
      vehiclePlate: parkPlate,
      vehicleModel: parkModel,
      ownerName: parkOwnerName,
      ownerPhone: parkOwnerPhone,
      ownerCnic: parkOwnerCnic || undefined,
      monthlyFee: Number(parkFee),
      slotNumber: parkSlot || undefined,
      initialPaymentReceived: parkCollectInitial,
      paymentMethod: parkPaymentMethod,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || "Failed to register parking vehicle");
      return;
    }

    setIsRegisterModalOpen(false);
    window.location.reload();
  };

  // Submit Collect Fee
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingRecord) return;
    setIsSubmitting(true);
    setActionError(null);

    const res = await recordPaymentAction({
      parkingRecordId: collectingRecord.id,
      direction: "INFLOW",
      category: "PARKING_FEE",
      amount: Number(feeAmount),
      currency: "PKR",
      paymentMethod: feeMethod,
      paymentType: "PARKING_FEE",
      customerName: collectingRecord.ownerName,
      customerPhone: collectingRecord.ownerPhone,
      vehiclePlate: collectingRecord.vehiclePlate,
      monthBilled: feeMonth,
      transactionReference: feeRef.trim() || undefined,
      notes: feeNotes.trim() || `Monthly parking fee for ${feeMonth}`,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || "Failed to record parking fee");
      return;
    }

    setCollectingRecord(null);
    window.location.reload();
  };

  // Update Status
  const handleStatusChange = async (id: string, status: string) => {
    await updateParkingRecordStatusAction(id, status);
    window.location.reload();
  };

  // Open Collect Modal helper
  const openCollectModal = (record: any) => {
    setCollectingRecord(record);
    setFeeAmount(Number(record.monthlyFee));
    setFeeNotes(`Monthly parking fee for ${record.vehiclePlate} (${record.vehicleModel})`);
    setActionError(null);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const isOverdue = r.paidUntilDate && new Date(r.paidUntilDate) < new Date();
    const effectiveStatus = isOverdue ? "OVERDUE" : r.status;

    if (statusFilter !== "ALL" && effectiveStatus !== statusFilter) return false;

    const s = searchTerm.toLowerCase();
    return (
      r.vehiclePlate.toLowerCase().includes(s) ||
      r.vehicleModel.toLowerCase().includes(s) ||
      r.ownerName.toLowerCase().includes(s) ||
      r.ownerPhone.includes(s) ||
      (r.slotNumber && r.slotNumber.toLowerCase().includes(s))
    );
  });

  // Calculate quick stats
  const totalSubscribers = records.length;
  let activeSubscribers = 0;
  let overdueSubscribers = 0;
  let totalMonthlyRevenueExpected = 0;

  for (const r of records) {
    const isOverdue = r.paidUntilDate && new Date(r.paidUntilDate) < new Date();
    if (isOverdue) overdueSubscribers++;
    else if (r.status === "ACTIVE") activeSubscribers++;
    totalMonthlyRevenueExpected += Number(r.monthlyFee);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monthly Car Parking Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage long-term monthly vehicle parking subscriptions, monthly fee collections, and yard space.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payments"
            className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition"
          >
            View Parking in Ledger
          </Link>

          <button
            onClick={() => {
              setActionError(null);
              setParkPlate("");
              setParkModel("");
              setParkOwnerName("");
              setParkOwnerPhone("");
              setParkOwnerCnic("");
              setParkSlot("");
              setIsRegisterModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Parking Vehicle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Registered Vehicles
            </span>
            <CircleParking className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSubscribers}</div>
          <div className="text-[10px] text-slate-500">Total subscribed cars</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active & Paid
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeSubscribers}</div>
          <div className="text-[10px] text-slate-500">Up to date on payments</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Due / Overdue
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{overdueSubscribers}</div>
          <div className="text-[10px] text-slate-500">Monthly renewal pending</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monthly Recurring Value
            </span>
            <Banknote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {formatCurrency(totalMonthlyRevenueExpected, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">Per month yard capacity</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search plate, owner, model, slot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 py-1.5 px-3 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 w-full sm:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active (Paid)</option>
          <option value="OVERDUE">Due / Overdue</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table of Subscriptions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Vehicle Plate & Model</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Slot / Bay</th>
                <th className="py-3 px-4">Monthly Fee</th>
                <th className="py-3 px-4">Validity / Paid Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No parking subscribers registered yet. Click &quot;+ Register Parking Vehicle&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isOverdue = r.paidUntilDate && new Date(r.paidUntilDate) < new Date();

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {r.vehiclePlate}
                        </div>
                        <div className="text-slate-600 font-medium">{r.vehicleModel}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.ownerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.ownerPhone}</div>
                        {r.ownerCnic && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            CNIC: {r.ownerCnic}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {r.slotNumber || "Open Yard"}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        {formatCurrency(r.monthlyFee, "PKR")}
                        <span className="text-[10px] font-normal text-slate-400 block">/ month</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {r.paidUntilDate ? (
                          <div>
                            <div>{new Date(r.paidUntilDate).toLocaleDateString("en-GB")}</div>
                            <div className="text-[10px] text-slate-400">
                              Last: {r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString("en-GB") : "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold">Payment Needed</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOverdue
                              ? "bg-amber-100 text-amber-800"
                              : r.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <AlertTriangle className="w-3 h-3" /> Fee Due
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openCollectModal(r)}
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Collect Fee</span>
                        </button>

                        <button
                          onClick={() => handleDeleteParking(r)}
                          disabled={deletingParkingId === r.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition inline-block align-middle"
                          title="Move to Trash"
                        >
                          {deletingParkingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER PARKING VEHICLE                                         */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Register Monthly Parking Vehicle
                </h3>
                <p className="text-xs text-slate-500">
                  Add vehicle & owner to Warraich Motors parking subscription roster.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Plate # *
                  </label>
                  <input
                    type="text"
                    required
                    value={parkPlate}
                    onChange={(e) => setParkPlate(e.target.value)}
                    placeholder="e.g. GJT-24-1188"
                    className="w-full text-xs uppercase font-mono font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Model / Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={parkModel}
                    onChange={(e) => setParkModel(e.target.value)}
                    placeholder="e.g. Toyota Corolla GLI"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={parkOwnerName}
                    onChange={(e) => setParkOwnerName(e.target.value)}
                    placeholder="e.g. Ch. Bilal Warraich"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Phone # *
                  </label>
                  <input
                    type="text"
                    required
                    value={parkOwnerPhone}
                    onChange={(e) => setParkOwnerPhone(e.target.value)}
                    placeholder="0300-9876543"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CNIC (Optional)
                  </label>
                  <input
                    type="text"
                    value={parkOwnerCnic}
                    onChange={(e) => setParkOwnerCnic(e.target.value)}
                    placeholder="34201-XXXXXXX-X"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parking Bay / Slot #
                  </label>
                  <input
                    type="text"
                    value={parkSlot}
                    onChange={(e) => setParkSlot(e.target.value)}
                    placeholder="e.g. Slot P-04"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Fee (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={parkFee}
                    onChange={(e) => setParkFee(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={parkPaymentMethod}
                    onChange={(e) => setParkPaymentMethod(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="POS">POS / Card</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="collectInitPkg"
                  checked={parkCollectInitial}
                  onChange={(e) => setParkCollectInitial(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="collectInitPkg" className="text-xs font-bold text-emerald-900 cursor-pointer">
                  Collect & log 1st month fee now (PKR {Number(parkFee).toLocaleString()})
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COLLECT MONTHLY PARKING FEE                                      */}
      {/* ========================================================================= */}
      {collectingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Collect Monthly Parking Fee</h3>
                <p className="text-xs text-slate-500">
                  {collectingRecord.vehiclePlate} — {collectingRecord.ownerName}
                </p>
              </div>
              <button
                onClick={() => setCollectingRecord(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCollectFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Month *
                </label>
                <input
                  type="text"
                  required
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(e.target.value)}
                  placeholder="e.g. November 2026"
                  className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={feeMethod}
                    onChange={(e) => setFeeMethod(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="POS">POS / Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slip / Reference # (Optional)
                </label>
                <input
                  type="text"
                  value={feeRef}
                  onChange={(e) => setFeeRef(e.target.value)}
                  placeholder="e.g. Slip # 8492"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Receipt Remarks
                </label>
                <input
                  type="text"
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  placeholder="e.g. Monthly parking fee paid in full"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-2 shadow"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Fee & Issue Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
