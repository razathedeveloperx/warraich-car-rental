"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
  Plus,
  FileText,
  User,
  Phone,
  Car,
  MapPin,
  X,
  Loader2,
  Calendar,
  Wrench,
  ShieldCheck,
  Printer,
  CheckCircle,
  Sparkles,
  Fuel,
  Gauge,
  ClipboardCheck,
} from "lucide-react";
import { updateBookingStatusAction } from "@/app/actions/bookings";
import { recordPaymentAction } from "@/app/actions/payments";
import { submitVehicleInspectionAction } from "@/app/actions/inspections";
import { BookingStatus, PaymentMethod, PaymentType } from "@/types";

interface BookingManagerProps {
  initialBookings: Array<any>;
  cars: Array<any>;
}

export function BookingManager({ initialBookings, cars }: BookingManagerProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [durationFilter, setDurationFilter] = useState("ALL");

  // Selected booking for detail drawer
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Status transition modal
  const [transitioningBooking, setTransitioningBooking] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<BookingStatus>("CONFIRMED");
  const [transitionReason, setTransitionReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Payment modal
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentType, setPaymentType] = useState<PaymentType>("RENTAL");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Vehicle Inspection Modal
  const [inspectingBooking, setInspectingBooking] = useState<any | null>(null);
  const [inspectionType, setInspectionType] = useState<"PRE_RENTAL" | "POST_RENTAL">("PRE_RENTAL");
  const [isMonthlyRental, setIsMonthlyRental] = useState(false);
  const [oilChanged, setOilChanged] = useState(false);
  const [oilBrand, setOilBrand] = useState("Mobil 1 10W-40 Synthetic");
  const [oilCost, setOilCost] = useState<number | string>(8500);
  const [odometerReading, setOdometerReading] = useState<number | string>(55000);
  const [nextOilOdometer, setNextOilOdometer] = useState<number | string>(60000);
  const [logOilCostToLedger, setLogOilCostToLedger] = useState(true);

  // Inspection Checklist (Ok / Not Ok)
  const [engineOk, setEngineOk] = useState(true);
  const [brakesOk, setBrakesOk] = useState(true);
  const [tiresOk, setTiresOk] = useState(true);
  const [acOk, setAcOk] = useState(true);
  const [lightsOk, setLightsOk] = useState(true);
  const [bodyClean, setBodyClean] = useState(true);
  const [scratchesNotes, setScratchesNotes] = useState("");
  const [fuelLevel, setFuelLevel] = useState("FULL");
  const [toolsAndSpare, setToolsAndSpare] = useState(true);
  const [isVehicleApproved, setIsVehicleApproved] = useState(true);
  const [inspectedBy, setInspectedBy] = useState("Staff");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  // Printable Inspection Certificate
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  // Helper to calculate days
  const getRentalDays = (start: string | Date, end: string | Date): number => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffHours = (e - s) / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(diffHours / 24));
  };

  const openInspectionModal = (b: any) => {
    const days = getRentalDays(b.pickupDateTime, b.returnDateTime);
    const isMonthly = days >= 30;

    setInspectingBooking(b);
    setInspectionType(b.status === "ACTIVE" ? "POST_RENTAL" : "PRE_RENTAL");
    setIsMonthlyRental(isMonthly);
    // In monthly rental, the Mobil oil IS changed! In 2-3 days, oil cost is not added.
    setOilChanged(isMonthly);
    setOilBrand(isMonthly ? "Mobil 1 10W-40 Synthetic" : "Standard Engine Check");
    setOilCost(isMonthly ? 8500 : 0);
    setLogOilCostToLedger(isMonthly);
    setEngineOk(true);
    setBrakesOk(true);
    setTiresOk(true);
    setAcOk(true);
    setLightsOk(true);
    setBodyClean(true);
    setScratchesNotes("");
    setFuelLevel("FULL");
    setToolsAndSpare(true);
    setIsVehicleApproved(true);
    setInspectionNotes(
      isMonthly
        ? "Monthly vehicle procedure completed: Mobil oil replaced, oil filter changed, full multi-point vehicle inspection passed."
        : "Short-term rental: 2-3 days standard inspection completed. Engine oil level verified (no oil change required). Car OK."
    );
    setActionError(null);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningBooking) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    const res = await updateBookingStatusAction({
      bookingId: transitioningBooking.id,
      status: targetStatus,
      reason: transitionReason.trim() || undefined,
    });

    setIsUpdatingStatus(false);
    if (!res.success) {
      setActionError(res.error || "Failed to update status");
      return;
    }

    setTransitioningBooking(null);
    window.location.reload();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBooking) return;
    setIsRecordingPayment(true);
    setActionError(null);

    const res = await recordPaymentAction({
      bookingId: paymentBooking.id,
      amount: Number(paymentAmount),
      paymentMethod,
      paymentType,
      transactionReference: transactionRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    setIsRecordingPayment(false);
    if (!res.success) {
      setActionError(res.error || "Failed to record payment");
      return;
    }

    setPaymentBooking(null);
    window.location.reload();
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingBooking) return;
    setIsSubmittingInspection(true);
    setActionError(null);

    const res = await submitVehicleInspectionAction({
      bookingId: inspectingBooking.id,
      inspectionType,
      isMonthlyRental,
      oilChanged,
      oilBrand: oilBrand.trim() || undefined,
      oilCost: oilChanged ? Number(oilCost) : 0,
      odometerReading: odometerReading ? Number(odometerReading) : undefined,
      nextOilOdometer: nextOilOdometer ? Number(nextOilOdometer) : undefined,
      engineOk,
      brakesOk,
      tiresOk,
      acOk,
      lightsOk,
      bodyClean,
      scratchesNotes: scratchesNotes.trim() || undefined,
      fuelLevel,
      toolsAndSpare,
      isVehicleApproved,
      inspectedBy: inspectedBy.trim() || undefined,
      notes: inspectionNotes.trim() || undefined,
      logOilCostToLedger,
    });

    setIsSubmittingInspection(false);
    if (!res.success) {
      setActionError(res.error || "Failed to record inspection");
      return;
    }

    setInspectingBooking(null);
    window.location.reload();
  };

  const filteredBookings = bookings.filter((b) => {
    const days = getRentalDays(b.pickupDateTime, b.returnDateTime);

    let matchDuration = true;
    if (durationFilter === "SHORT") {
      matchDuration = days <= 3;
    } else if (durationFilter === "MONTHLY") {
      matchDuration = days >= 30;
    } else if (durationFilter === "WEEKLY") {
      matchDuration = days > 3 && days < 30;
    }

    const matchSearch =
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.phone.includes(searchTerm) ||
      b.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.car.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchStatus && matchDuration;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <Car className="w-3 h-3" /> Active Rental
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reference, customer, phone, car..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active Rental</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-semibold text-slate-700"
          >
            <option value="ALL">All Rental Types</option>
            <option value="SHORT">Short-Term (1-3 Days)</option>
            <option value="MONTHLY">Monthly Rentals (30+ Days)</option>
            <option value="WEEKLY">Weekly / Multi-Day</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref & Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Rental Duration & Type</th>
                <th className="py-3 px-4">Inspection / Mobil Oil</th>
                <th className="py-3 px-4">Financials (Total / Paid)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const total = Number(b.totalAmount);
                const paid = Number(b.amountPaid);
                const balance = total - paid;
                const days = getRentalDays(b.pickupDateTime, b.returnDateTime);
                const isMonthly = days >= 30;
                const isShort = days <= 3;
                const latestInspection = b.inspections?.[0];

                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-sm">
                        {b.bookingReference}
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5">{b.customer.fullName}</div>
                      <div className="text-[11px] text-slate-500">{b.customer.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {b.car.make} {b.car.model}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {b.car.registrationNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div>
                        {isMonthly ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" /> Monthly Package ({days}d)
                          </span>
                        ) : isShort ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            ⚡ Short-Term ({days} Days)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            🗓️ Multi-Day ({days} Days)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateTime(b.pickupDateTime)} &rarr; {formatDateTime(b.returnDateTime)}
                      </div>
                    </td>

                    {/* Inspection & Mobil Oil Status */}
                    <td className="py-3.5 px-4">
                      {latestInspection ? (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              latestInspection.isVehicleApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {latestInspection.isVehicleApproved ? "Car Inspected (OK)" : "Inspection Issues"}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {latestInspection.oilChanged ? (
                              <span className="text-amber-700 font-semibold">
                                Mobil Oil Changed (Rs. {Number(latestInspection.oilCost || 0).toLocaleString()})
                              </span>
                            ) : (
                              <span className="text-slate-400">Standard Check (No Oil Added)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 italic">
                          <Clock className="w-3 h-3" />
                          {isMonthly ? "Oil Change & Check Required" : "Pending Check"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">
                        {formatCurrency(total, b.currency)}
                      </div>
                      <div className="text-[11px]">
                        <span className="text-emerald-600 font-semibold">
                          Paid: {formatCurrency(paid, b.currency)}
                        </span>
                        {balance > 0 && (
                          <span className="text-amber-600 font-semibold ml-1.5">
                            (Due: {formatCurrency(balance, b.currency)})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      {/* Vehicle Inspection Procedure Button */}
                      <button
                        onClick={() => openInspectionModal(b)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 ${
                          isMonthly && !latestInspection
                            ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                        title="Conduct Vehicle Health & Mobil Oil Procedure"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Inspect / Oil</span>
                      </button>

                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                      >
                        Details
                      </button>

                      {b.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setTransitioningBooking(b);
                            setTargetStatus("CONFIRMED");
                            setActionError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition"
                        >
                          Approve
                        </button>
                      )}

                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => {
                            setTransitioningBooking(b);
                            setTargetStatus("ACTIVE");
                            setActionError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                        >
                          Handover
                        </button>
                      )}

                      {b.status === "ACTIVE" && (
                        <button
                          onClick={() => {
                            setTransitioningBooking(b);
                            setTargetStatus("COMPLETED");
                            setActionError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] shadow-sm transition"
                        >
                          Return
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPaymentBooking(b);
                          setPaymentAmount(balance > 0 ? balance : 10000);
                          setActionError(null);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        title="Record payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VEHICLE INSPECTION & MOBIL OIL PROCEDURE                         */}
      {/* ========================================================================= */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                  Warraich Motors Standard Operating Procedure
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Vehicle Inspection & Mobil Oil Check
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectingBooking.car.make} {inspectingBooking.car.model} ({inspectingBooking.car.registrationNumber}) &bull; Ref: {inspectingBooking.bookingReference}
                </p>
              </div>
              <button
                onClick={() => setInspectingBooking(null)}
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

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              {/* Inspection Type & Duration Logic Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Phase</label>
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="PRE_RENTAL">Pre-Rental Handover (Vehicle Dispatch)</option>
                    <option value="POST_RENTAL">Post-Rental Return (Check-In & Settlement)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rental Plan Type</label>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800">
                    {isMonthlyRental ? "🌟 Monthly Rental (30+ Days)" : "⚡ Short-Term (1-3 Days)"}
                  </div>
                </div>
              </div>

              {/* Client Business Rule Banner */}
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isMonthlyRental
                    ? "bg-purple-50 border-purple-200 text-purple-950"
                    : "bg-blue-50 border-blue-200 text-blue-950"
                }`}
              >
                <div className="font-extrabold flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>
                    {isMonthlyRental
                      ? "Monthly Rental Procedure: Mobil Oil MUST Be Changed & Certified"
                      : "2-3 Days Rental: No Mobil Oil Cost Added (Standard Check)"}
                  </span>
                </div>
                <p className="text-[11px] opacity-90">
                  {isMonthlyRental
                    ? "As per company policy for monthly rentals, engine Mobil oil and oil filter are renewed. The entire vehicle procedure is completed and logged into the General Ledger and Maintenance records."
                    : "For 1-3 day short rentals, Mobil oil is within service interval. Perform standard fluid and safety inspection before customer handover."}
                </p>
              </div>

              {/* Mobil Oil Service Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" /> Mobil Oil & Engine Service
                  </span>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oilChanged}
                      onChange={(e) => setOilChanged(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-900">Mobil Oil Changed</span>
                  </label>
                </div>

                {oilChanged && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Oil Brand & Grade
                      </label>
                      <input
                        type="text"
                        value={oilBrand}
                        onChange={(e) => setOilBrand(e.target.value)}
                        placeholder="e.g. Mobil 1 10W-40 Synthetic"
                        className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Total Cost (Oil + Filter PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={oilCost}
                        onChange={(e) => setOilCost(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Next Oil Change Odo (km)
                      </label>
                      <input
                        type="number"
                        value={nextOilOdometer}
                        onChange={(e) => setNextOilOdometer(e.target.value)}
                        placeholder="e.g. 60000"
                        className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="logLedger"
                        checked={logOilCostToLedger}
                        onChange={(e) => setLogOilCostToLedger(e.target.checked)}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <label htmlFor="logLedger" className="text-slate-800 font-bold cursor-pointer">
                        Automatically record PKR {Number(oilCost).toLocaleString()} to Payments Ledger & Vehicle Maintenance Log
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete Multi-Point Procedure (OK / NOT OK) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Multi-Point Vehicle Health Inspection
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={engineOk}
                      onChange={(e) => setEngineOk(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Engine & Fluids OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={brakesOk}
                      onChange={(e) => setBrakesOk(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Brakes & ABS OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tiresOk}
                      onChange={(e) => setTiresOk(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Tires & Pressure OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acOk}
                      onChange={(e) => setAcOk(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">AC & Climate OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lightsOk}
                      onChange={(e) => setLightsOk(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Lights & Horn OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bodyClean}
                      onChange={(e) => setBodyClean(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Interior Clean</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toolsAndSpare}
                      onChange={(e) => setToolsAndSpare(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold">Spare Wheel & Jack</span>
                  </label>

                  <div>
                    <select
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="FULL">Fuel: FULL</option>
                      <option value="75%">Fuel: 75% (3/4)</option>
                      <option value="50%">Fuel: 50% (1/2)</option>
                      <option value="25%">Fuel: 25% (1/4)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Body Scratches / Dents Check
                    </label>
                    <input
                      type="text"
                      value={scratchesNotes}
                      onChange={(e) => setScratchesNotes(e.target.value)}
                      placeholder="e.g. Minor scratch on rear bumper right side"
                      className="w-full rounded-xl border border-slate-300 p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Current Odometer (km)
                    </label>
                    <input
                      type="number"
                      value={odometerReading}
                      onChange={(e) => setOdometerReading(e.target.value)}
                      placeholder="e.g. 55000"
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Inspection Summary Notes
                  </label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="e.g. Car in immaculate condition, fully approved for handover"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
              </div>

              {/* Handover Approval & Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-900 text-white rounded-2xl items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVehicleApproved}
                    onChange={(e) => setIsVehicleApproved(e.target.checked)}
                    className="rounded text-emerald-500 w-5 h-5 focus:ring-emerald-400"
                  />
                  <span className="font-black text-sm">
                    {isVehicleApproved ? "✓ CAR APPROVED FOR CLIENT HANDOVER" : "✗ HOLD / REJECT HANDOVER"}
                  </span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[11px] text-slate-400">Inspected By:</span>
                  <input
                    type="text"
                    value={inspectedBy}
                    onChange={(e) => setInspectedBy(e.target.value)}
                    className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectingBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInspection}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 shadow"
                >
                  {isSubmittingInspection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Inspection & Complete Procedure</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE VEHICLE INSPECTION & HANDOVER CERTIFICATE              */}
      {/* ========================================================================= */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 print:m-0 print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vehicle Inspection Certificate
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Paper */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-5 text-slate-800 font-sans print:border-none print:p-0">
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  WARRAICH MOTORS GUJRAT
                </h2>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Official Vehicle Handover & Inspection Certificate
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Mian, GT Road, Small Industrial Area, Gujrat • 0313 6225135
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 text-xs gap-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Booking Ref</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    {selectedBooking?.bookingReference}
                  </div>
                  <div className="font-bold text-slate-700">{selectedBooking?.customer.fullName}</div>
                  <div className="text-slate-500 font-mono">{selectedBooking?.customer.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Vehicle</div>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedBooking?.car.make} {selectedBooking?.car.model}
                  </div>
                  <div className="font-mono font-bold text-blue-700">
                    {selectedBooking?.car.registrationNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Date: {formatDateTime(viewingCertificate.createdAt)}
                  </div>
                </div>
              </div>

              {/* Mobil Oil Status Box */}
              <div
                className={`p-4 rounded-xl border text-xs ${
                  viewingCertificate.oilChanged
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  <span>
                    {viewingCertificate.oilChanged
                      ? "Mobil Oil Changed & Engine Certified"
                      : "Standard Inspection (No Oil Change Added)"}
                  </span>
                </div>
                {viewingCertificate.oilChanged ? (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-amber-200 font-semibold">
                    <div>Brand: {viewingCertificate.oilBrand || "Mobil 1"}</div>
                    <div>Cost: PKR {Number(viewingCertificate.oilCost || 0).toLocaleString()}</div>
                    <div>Next Due: {viewingCertificate.nextOilOdometer || "N/A"} km</div>
                  </div>
                ) : (
                  <p className="text-[11px] opacity-80">
                    Vehicle is on a short-term rental plan (1-3 days). Engine fluid levels and condition verified.
                  </p>
                )}
              </div>

              {/* Checklist Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Procedure Health Results
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Engine & Fluids: <strong>{viewingCertificate.engineOk ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Brakes: <strong>{viewingCertificate.brakesOk ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Tires & Pressure: <strong>{viewingCertificate.tiresOk ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Air Conditioning: <strong>{viewingCertificate.acOk ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Lights & Horn: <strong>{viewingCertificate.lightsOk ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Interior Clean: <strong>{viewingCertificate.bodyClean ? "✓ OK" : "✗ ISSUE"}</strong></div>
                  <div>Fuel Gauge: <strong>{viewingCertificate.fuelLevel}</strong></div>
                  <div>Spare Wheel & Tools: <strong>{viewingCertificate.toolsAndSpare ? "✓ Present" : "✗ Missing"}</strong></div>
                </div>
                {viewingCertificate.scratchesNotes && (
                  <div className="pt-2 border-t text-[11px] text-slate-600">
                    <strong>Exterior Notes:</strong> {viewingCertificate.scratchesNotes}
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl text-center font-bold">
                {viewingCertificate.isVehicleApproved
                  ? "✓ VEHICLE PASSED ALL CHECKS & APPROVED FOR ROAD USE"
                  : "✗ VEHICLE FLAGGED — REQUIRES ATTENTION"}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
                <div>
                  <div className="border-t border-slate-300 w-32 mx-auto mb-1"></div>
                  Customer Acknowledgment
                </div>
                <div>
                  <div className="border-t border-slate-300 w-32 mx-auto mb-1"></div>
                  Inspector: {viewingCertificate.inspectedBy || "Warraich Motors"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Booking Summary
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedBooking.bookingReference}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Quick Transition */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Current Status</div>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openInspectionModal(selectedBooking)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Inspect Vehicle / Oil</span>
                </button>

                {selectedBooking.status !== "CANCELLED" && selectedBooking.status !== "COMPLETED" && (
                  <button
                    onClick={() => {
                      setTransitioningBooking(selectedBooking);
                      setTargetStatus("CANCELLED");
                      setActionError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

            {/* Inspection & Mobil Oil History */}
            {selectedBooking.inspections && selectedBooking.inspections.length > 0 && (
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" /> Inspection & Mobil Oil Procedure Records
                  </span>
                  <span className="text-[11px] text-purple-600 font-bold">
                    {selectedBooking.inspections.length} recorded
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedBooking.inspections.map((insp: any) => (
                    <div
                      key={insp.id}
                      className="p-3 bg-white rounded-xl border border-purple-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{insp.inspectionType === "PRE_RENTAL" ? "Pre-Rental Handover" : "Post-Rental Return"}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              insp.isVehicleApproved ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {insp.isVehicleApproved ? "PASSED (OK)" : "ISSUES"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {insp.oilChanged ? (
                            <span className="text-amber-700 font-semibold">
                              Mobil Oil Changed: {insp.oilBrand || "Standard"} (Rs. {Number(insp.oilCost || 0).toLocaleString()})
                            </span>
                          ) : (
                            <span>Short rental: No oil change added</span>
                          )}
                          &bull; Inspected by {insp.inspectedBy || "Staff"} on {formatDateTime(insp.createdAt)}
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingCertificate(insp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[10px] hover:bg-slate-800 transition"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Certificate</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer & Vehicle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider">Customer</div>
                <div><strong>Name:</strong> {selectedBooking.customer.fullName}</div>
                <div><strong>Phone:</strong> {selectedBooking.customer.phone}</div>
                <div><strong>Email:</strong> {selectedBooking.customer.email}</div>
                <div><strong>ID/License:</strong> {selectedBooking.customer.drivingLicenceDetails || "N/A"}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider">Vehicle</div>
                <div><strong>Car:</strong> {selectedBooking.car.make} {selectedBooking.car.model}</div>
                <div><strong>Plate:</strong> {selectedBooking.car.registrationNumber}</div>
                <div><strong>Pickup:</strong> {formatDateTime(selectedBooking.pickupDateTime)}</div>
                <div><strong>Return:</strong> {formatDateTime(selectedBooking.returnDateTime)}</div>
              </div>
            </div>

            {/* Pricing Snapshot */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider">Financial Snapshot</div>
              <div className="flex justify-between text-slate-600">
                <span>Rental Base:</span>
                <span>{formatCurrency(selectedBooking.rentalPrice, selectedBooking.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Extras Total:</span>
                <span>{formatCurrency(selectedBooking.extrasTotal, selectedBooking.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Security Deposit:</span>
                <span>{formatCurrency(selectedBooking.depositAmount, selectedBooking.currency)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatCurrency(selectedBooking.totalAmount, selectedBooking.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Amount Paid:</span>
                <span>{formatCurrency(selectedBooking.amountPaid, selectedBooking.currency)}</span>
              </div>
            </div>

            {/* Audit Logs */}
            {selectedBooking.auditLogs && selectedBooking.auditLogs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status History</div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {selectedBooking.auditLogs.map((log: any) => (
                    <div key={log.id} className="p-2 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-800">{log.action}:</span> {log.details} &bull; <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {transitioningBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Transition Booking: {transitioningBooking.bookingReference}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Current status: <strong>{transitioningBooking.status}</strong> &rarr; Target: <strong>{targetStatus}</strong>
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as BookingStatus)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CONFIRMED">CONFIRMED (Approved)</option>
                  <option value="ACTIVE">ACTIVE (Vehicle Handed Over)</option>
                  <option value="COMPLETED">COMPLETED (Returned & Settled)</option>
                  <option value="CANCELLED">CANCELLED (Rejected / Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Identity verified and advance received."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransitioningBooking(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow"
                >
                  {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Status Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {paymentBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Record Payment: {paymentBooking.bookingReference}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Customer: {paymentBooking.customer.fullName} &bull; Total: {formatCurrency(paymentBooking.totalAmount, paymentBooking.currency)}
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (PKR) *</label>
                <input
                  type="number"
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="POS">POS / Card Swipe</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RENTAL">Rental Advance</option>
                    <option value="DEPOSIT">Security Deposit</option>
                    <option value="REFUND">Refund</option>
                    <option value="DAMAGE_CHARGE">Damage Charge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Reference (Bank TX / Receipt #)</label>
                <input
                  type="text"
                  placeholder="e.g. HBL-TX-998822"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received at Gujrat Counter."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentBooking(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow"
                >
                  {isRecordingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
