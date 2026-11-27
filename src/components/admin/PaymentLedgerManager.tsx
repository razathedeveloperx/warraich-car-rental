"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Printer,
  Trash2,
  Car,
  CircleParking,
  Wrench,
  Fuel,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  X,
  Loader2,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import { recordPaymentAction, deletePaymentAction } from "@/app/actions/payments";
import { createParkingRecordAction } from "@/app/actions/parking";
import Link from "next/link";

interface PaymentLedgerManagerProps {
  initialPayments: Array<any>;
  bookings: Array<any>;
  parkingRecords: Array<any>;
  cars: Array<any>;
  userRole?: string;
}

export function PaymentLedgerManager({
  initialPayments,
  bookings,
  parkingRecords,
  cars,
  userRole,
}: PaymentLedgerManagerProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Record Payment Modal
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isRegisterParkingModalOpen, setIsRegisterParkingModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Payment
  const [paymentDirection, setPaymentDirection] = useState<"INFLOW" | "OUTFLOW">("INFLOW");
  const [paymentType, setPaymentType] = useState<string>("RENTAL");
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedParkingId, setSelectedParkingId] = useState<string>("");
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [amount, setAmount] = useState<number | string>(10000);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE"
  >("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [monthBilled, setMonthBilled] = useState(() => {
    return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  });
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 16));

  // Form State for Parking Registration
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Handlers for dynamic dropdown population
  const handleBookingSelect = (bId: string) => {
    setSelectedBookingId(bId);
    if (!bId) return;
    const b = bookings.find((item) => item.id === bId);
    if (b) {
      setCustomerName(b.customer?.fullName || "");
      setCustomerPhone(b.customer?.phone || "");
      setVehiclePlate(b.car?.registrationNumber || "");
      const remaining = Number(b.totalAmount) - Number(b.amountPaid);
      if (remaining > 0) setAmount(remaining);
    }
  };

  const handleParkingSelect = (pId: string) => {
    setSelectedParkingId(pId);
    if (!pId) return;
    const p = parkingRecords.find((item) => item.id === pId);
    if (p) {
      setCustomerName(p.ownerName);
      setCustomerPhone(p.ownerPhone);
      setVehiclePlate(p.vehiclePlate);
      setAmount(Number(p.monthlyFee));
      setNotes(`Monthly parking fee for ${p.vehiclePlate} (${p.vehicleModel})`);
    }
  };

  const handleCarSelect = (cId: string) => {
    setSelectedCarId(cId);
    if (!cId) return;
    const c = cars.find((item) => item.id === cId);
    if (c) {
      setVehiclePlate(c.registrationNumber);
      if (paymentType === "MAINTENANCE_OIL") {
        setNotes(`Mobil oil & filter change for ${c.make} ${c.model} (${c.registrationNumber})`);
      }
    }
  };

  const handleTypeChange = (newType: string) => {
    setPaymentType(newType);
    if (["REFUND", "MAINTENANCE_OIL", "EXPENSE", "FUEL", "SALARY"].includes(newType)) {
      setPaymentDirection("OUTFLOW");
    } else {
      setPaymentDirection("INFLOW");
    }

    if (newType === "PARKING_FEE") {
      setNotes(`Monthly car parking fee - ${monthBilled}`);
    } else if (newType === "MAINTENANCE_OIL") {
      setNotes("Mobil 1 10W-40 / Shell Helix oil change + filter");
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const res = await recordPaymentAction({
      bookingId: selectedBookingId || undefined,
      parkingRecordId: selectedParkingId || undefined,
      carId: selectedCarId || undefined,
      direction: paymentDirection,
      category: paymentType,
      amount: Number(amount),
      currency: "PKR",
      paymentMethod,
      paymentType: paymentType as any,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
      monthBilled: paymentType === "PARKING_FEE" ? monthBilled : undefined,
      transactionReference: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
      paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || "Failed to record payment");
      return;
    }

    setIsAddPaymentModalOpen(false);
    window.location.reload();
  };

  // Submit Parking Registration
  const handleSubmitParking = async (e: React.FormEvent) => {
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

    setIsRegisterParkingModalOpen(false);
    window.location.reload();
  };

  // Handle Delete Payment
  const handleDeletePayment = async (id: string) => {
    if (!confirm("Are you sure you want to void/delete this payment record? This will adjust balances accordingly.")) {
      return;
    }
    setDeletingId(id);
    const res = await deletePaymentAction(id);
    setDeletingId(null);
    if (!res.success) {
      alert(res.error || "Failed to delete payment");
      return;
    }
    window.location.reload();
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Tab filter
      let matchTab = true;
      if (activeTab === "RENTAL") {
        matchTab = p.paymentType === "RENTAL" || p.category === "RENTAL";
      } else if (activeTab === "PARKING") {
        matchTab = p.paymentType === "PARKING_FEE" || p.category === "PARKING_FEE";
      } else if (activeTab === "DEPOSITS_REFUNDS") {
        matchTab = p.paymentType === "DEPOSIT" || p.paymentType === "REFUND";
      } else if (activeTab === "OIL_MAINTENANCE") {
        matchTab = p.paymentType === "MAINTENANCE_OIL" || p.category === "MAINTENANCE_OIL";
      } else if (activeTab === "EXPENSES") {
        matchTab = ["EXPENSE", "FUEL", "SALARY"].includes(p.paymentType);
      }

      // Method filter
      const matchMethod = methodFilter === "ALL" || p.paymentMethod === methodFilter;

      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(search)) ||
        (p.customerName && p.customerName.toLowerCase().includes(search)) ||
        (p.booking?.customer?.fullName && p.booking.customer.fullName.toLowerCase().includes(search)) ||
        (p.booking?.bookingReference && p.booking.bookingReference.toLowerCase().includes(search)) ||
        (p.vehiclePlate && p.vehiclePlate.toLowerCase().includes(search)) ||
        (p.notes && p.notes.toLowerCase().includes(search)) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(search));

      return matchTab && matchMethod && matchSearch;
    });
  }, [payments, activeTab, methodFilter, searchTerm]);

  // Financial Calculations
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let rentalCollected = 0;
    let parkingCollected = 0;
    let depositsHeld = 0;
    let refundsDisbursed = 0;
    let oilMaintenanceCost = 0;
    let operationalExpenses = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      const isOutflow =
        p.direction === "OUTFLOW" ||
        ["REFUND", "MAINTENANCE_OIL", "EXPENSE", "FUEL", "SALARY"].includes(p.paymentType);

      if (isOutflow) {
        totalOutflow += amt;
        if (p.paymentType === "REFUND") refundsDisbursed += amt;
        else if (p.paymentType === "MAINTENANCE_OIL") oilMaintenanceCost += amt;
        else operationalExpenses += amt;
      } else {
        totalInflow += amt;
        if (p.paymentType === "RENTAL" || p.paymentType === "DAMAGE_CHARGE") rentalCollected += amt;
        else if (p.paymentType === "PARKING_FEE") parkingCollected += amt;
        else if (p.paymentType === "DEPOSIT") depositsHeld += amt;
      }
    }

    const netCashFlow = totalInflow - totalOutflow;
    const activeDepositsBalance = Math.max(0, depositsHeld - refundsDisbursed);

    return {
      totalInflow,
      totalOutflow,
      netCashFlow,
      rentalCollected,
      parkingCollected,
      activeDepositsBalance,
      oilMaintenanceCost,
      operationalExpenses,
    };
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payments & General Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete financial hub for Warraich Motors: Car Rentals, Monthly Parking Subscriptions, Mobil Oil & Maintenance, and Operating Expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActionError(null);
              setParkPlate("");
              setParkModel("");
              setParkOwnerName("");
              setParkOwnerPhone("");
              setIsRegisterParkingModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition"
          >
            <CircleParking className="w-4 h-4" />
            <span>+ Register Parking Vehicle</span>
          </button>

          <button
            onClick={() => {
              setActionError(null);
              setSelectedBookingId("");
              setSelectedParkingId("");
              setSelectedCarId("");
              setCustomerName("");
              setCustomerPhone("");
              setVehiclePlate("");
              setNotes("");
              setTransactionRef("");
              setPaymentType("RENTAL");
              setPaymentDirection("INFLOW");
              setIsAddPaymentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Payment / Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Inflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Cash Inflow
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {formatCurrency(stats.totalInflow, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">Rentals, parking & deposits</div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Outflow / Costs
            </span>
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-600">
            {formatCurrency(stats.totalOutflow, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">Maintenance, oil, refunds & exp.</div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Net Operating Balance
            </span>
            <Banknote className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`text-xl font-black ${stats.netCashFlow >= 0 ? "text-slate-900" : "text-red-600"}`}>
            {formatCurrency(stats.netCashFlow, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">Net in-hand / bank funds</div>
        </div>

        {/* Monthly Parking Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monthly Parking Fees
            </span>
            <CircleParking className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-600">
            {formatCurrency(stats.parkingCollected, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">{parkingRecords.length} registered vehicles</div>
        </div>

        {/* Mobil Oil & Maintenance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Mobil Oil & Service
            </span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-600">
            {formatCurrency(stats.oilMaintenanceCost, "PKR")}
          </div>
          <div className="text-[10px] text-slate-500">Fleet oil changes & repairs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: "ALL", label: "All Transactions" },
            { id: "RENTAL", label: "Car Rentals" },
            { id: "PARKING", label: "Monthly Parking" },
            { id: "DEPOSITS_REFUNDS", label: "Deposits & Refunds" },
            { id: "OIL_MAINTENANCE", label: "Mobil Oil & Service" },
            { id: "EXPENSES", label: "Business Expenses" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Method Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, customer, car..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white w-48 sm:w-64"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="POS">POS / Card</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt & Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Party / Customer</th>
                <th className="py-3 px-4">Vehicle / Reg #</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                {userRole === "ADMIN" && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "ADMIN" ? 8 : 7} className="py-12 text-center text-slate-400">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isOutflow =
                    p.direction === "OUTFLOW" ||
                    ["REFUND", "MAINTENANCE_OIL", "EXPENSE", "FUEL", "SALARY"].includes(p.paymentType);

                  const displayName =
                    p.customerName ||
                    p.booking?.customer?.fullName ||
                    p.parkingRecord?.ownerName ||
                    "General Business";

                  const displayVehicle =
                    p.vehiclePlate ||
                    (p.booking?.car ? `${p.booking.car.make} ${p.booking.car.model} (${p.booking.car.registrationNumber})` : null) ||
                    (p.parkingRecord ? `${p.parkingRecord.vehiclePlate} (${p.parkingRecord.vehicleModel})` : null) ||
                    (p.car ? `${p.car.make} ${p.car.model} (${p.car.registrationNumber})` : "-");

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Receipt & Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-blue-600">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{p.receiptNumber || `WM-${p.id.slice(0, 8)}`}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDateTime(p.paidAt)}
                        </div>
                        {p.notes && (
                          <div className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                            {p.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.paymentType === "RENTAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.paymentType === "PARKING_FEE"
                              ? "bg-purple-100 text-purple-800"
                              : p.paymentType === "DEPOSIT"
                              ? "bg-blue-100 text-blue-800"
                              : p.paymentType === "REFUND"
                              ? "bg-pink-100 text-pink-800"
                              : p.paymentType === "MAINTENANCE_OIL"
                              ? "bg-amber-100 text-amber-800"
                              : p.paymentType === "FUEL"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {p.paymentType === "PARKING_FEE" ? (
                            <>
                              <CircleParking className="w-3 h-3" /> Parking Fee
                            </>
                          ) : p.paymentType === "MAINTENANCE_OIL" ? (
                            <>
                              <Wrench className="w-3 h-3" /> Mobil Oil / Service
                            </>
                          ) : (
                            p.paymentType.replace("_", " ")
                          )}
                        </span>
                        {p.monthBilled && (
                          <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
                            For: {p.monthBilled}
                          </div>
                        )}
                      </td>

                      {/* Customer / Party */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{displayName}</div>
                        {(p.customerPhone || p.booking?.customer?.phone) && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.customerPhone || p.booking?.customer?.phone}
                          </div>
                        )}
                        {p.booking?.bookingReference && (
                          <Link
                            href={`/admin/bookings?search=${p.booking.bookingReference}`}
                            className="text-[10px] font-mono text-blue-600 hover:underline block"
                          >
                            Ref: {p.booking.bookingReference}
                          </Link>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <div className="font-mono font-bold text-slate-900">{displayVehicle}</div>
                      </td>

                      {/* Method & Ref */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <div>{p.paymentMethod.replace("_", " ")}</div>
                        {p.transactionReference && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {p.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3.5 px-4 text-right font-black text-sm ${
                          isOutflow ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {isOutflow ? "- " : "+ "}
                        {formatCurrency(p.amount, p.currency)}
                      </td>

                      {/* View & Print Receipt */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setViewingReceipt(p)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="Print / View Official Voucher"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Admin Void */}
                      {userRole === "ADMIN" && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Void Payment"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD PAYMENT / TRANSACTION                                     */}
      {/* ========================================================================= */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Record Ledger Transaction</h3>
                <p className="text-xs text-slate-500">
                  Add rental advances, parking fees, deposits, Mobil oil service, or expenses.
                </p>
              </div>
              <button
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Inflow vs Outflow toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentDirection("INFLOW");
                    setPaymentType("RENTAL");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    paymentDirection === "INFLOW"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cash Inflow (Income / Fee)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentDirection("OUTFLOW");
                    setPaymentType("MAINTENANCE_OIL");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    paymentDirection === "OUTFLOW"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cash Outflow (Expense / Refund)
                </button>
              </div>

              {/* Category / Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Purpose / Category
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {paymentDirection === "INFLOW" ? (
                    <>
                      <option value="RENTAL">Car Rental Payment / Advance</option>
                      <option value="PARKING_FEE">Monthly Car Parking Fee</option>
                      <option value="DEPOSIT">Security Deposit Received</option>
                      <option value="DAMAGE_CHARGE">Damage Recovery / Settlement</option>
                      <option value="OTHER">Other Business Income / Commission</option>
                    </>
                  ) : (
                    <>
                      <option value="MAINTENANCE_OIL">Mobil Oil Change & Filter Service</option>
                      <option value="REFUND">Security Deposit Refund (To Client)</option>
                      <option value="EXPENSE">Vehicle Repair / Mechanical Maintenance</option>
                      <option value="FUEL">Fuel / Petrol / Diesel</option>
                      <option value="SALARY">Driver / Staff Salary & Allowance</option>
                      <option value="OTHER">Facility Rent & Utility Expenses</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dynamic Context Selector based on Category */}
              {paymentType === "RENTAL" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Active Booking (Optional)
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => handleBookingSelect(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="">-- Standalone or Select Booking --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingReference} — {b.customer?.fullName} ({b.car?.make} {b.car?.model}) - Due: PKR{" "}
                        {Number(b.totalAmount) - Number(b.amountPaid)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentType === "PARKING_FEE" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Parking Vehicle
                    </label>
                    <select
                      value={selectedParkingId}
                      onChange={(e) => handleParkingSelect(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value="">-- Select Registered Vehicle --</option>
                      {parkingRecords.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.vehiclePlate} — {p.ownerName} ({p.vehicleModel})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Billing Month
                    </label>
                    <input
                      type="text"
                      value={monthBilled}
                      onChange={(e) => setMonthBilled(e.target.value)}
                      placeholder="e.g. November 2026"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              {(paymentType === "MAINTENANCE_OIL" || paymentType === "EXPENSE") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Fleet Vehicle (Optional)
                  </label>
                  <select
                    value={selectedCarId}
                    onChange={(e) => handleCarSelect(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="">-- Fleet Vehicle --</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.make} {c.model} ({c.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="POS">POS / Credit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Customer / Payee info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Payee Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Plate #
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. LEA-22-1234"
                    className="w-full text-xs uppercase font-mono rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Date & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank / Slip Reference #
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. HBL-TRX-94827"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Mobil 1 10W-40 oil + oil filter replacement"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
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
                  <span>Save Transaction & Issue Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER NEW MONTHLY PARKING SUBSCRIBER                          */}
      {/* ========================================================================= */}
      {isRegisterParkingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Register Monthly Parking Vehicle
                </h3>
                <p className="text-xs text-slate-500">
                  Add monthly subscriber to Warraich Motors parking yard & take initial fee.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterParkingModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitParking} className="space-y-4">
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
                    Vehicle Model / Color *
                  </label>
                  <input
                    type="text"
                    required
                    value={parkModel}
                    onChange={(e) => setParkModel(e.target.value)}
                    placeholder="e.g. Honda Civic White"
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
                    Parking Slot / Bay #
                  </label>
                  <input
                    type="text"
                    value={parkSlot}
                    onChange={(e) => setParkSlot(e.target.value)}
                    placeholder="e.g. Bay P-04"
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
                  id="collectInit"
                  checked={parkCollectInitial}
                  onChange={(e) => setParkCollectInitial(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="collectInit" className="text-xs font-bold text-emerald-900 cursor-pointer">
                  Collect and record 1st month fee now into Ledger (PKR {Number(parkFee).toLocaleString()})
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterParkingModalOpen(false)}
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
                  <span>Register & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BRANDED RECEIPT / VOUCHER VIEW & PRINT                           */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8 print:m-0 print:p-0 print:shadow-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Transaction Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-5 text-slate-800 font-sans print:border-none print:p-0">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  WARRAICH MOTORS
                </h2>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Car Rental & Parking Management Hub — Gujrat
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Mian, GT Road, Small Industrial Area, Gujrat • 0313 6225135
                </div>
              </div>

              {/* Voucher Meta */}
              <div className="grid grid-cols-2 text-xs gap-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Voucher No.</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    {viewingReceipt.receiptNumber || `WM-${viewingReceipt.id.slice(0, 8)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Date & Time</div>
                  <div className="font-bold text-slate-800">
                    {formatDateTime(viewingReceipt.paidAt)}
                  </div>
                </div>
              </div>

              {/* Details Table */}
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500 font-semibold">Transaction Category:</span>
                  <span className="font-bold text-slate-900">
                    {viewingReceipt.paymentType.replace("_", " ")}
                  </span>
                </div>

                <div className="p-3 flex justify-between">
                  <span className="text-slate-500 font-semibold">Party / Customer Name:</span>
                  <span className="font-bold text-slate-900">
                    {viewingReceipt.customerName ||
                      viewingReceipt.booking?.customer?.fullName ||
                      viewingReceipt.parkingRecord?.ownerName ||
                      "N/A"}
                  </span>
                </div>

                {(viewingReceipt.customerPhone || viewingReceipt.booking?.customer?.phone) && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500 font-semibold">Contact Phone:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {viewingReceipt.customerPhone || viewingReceipt.booking?.customer?.phone}
                    </span>
                  </div>
                )}

                {(viewingReceipt.vehiclePlate || viewingReceipt.booking?.car) && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500 font-semibold">Vehicle Registration:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {viewingReceipt.vehiclePlate || viewingReceipt.booking?.car?.registrationNumber}
                    </span>
                  </div>
                )}

                {viewingReceipt.monthBilled && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500 font-semibold">Month Billed:</span>
                    <span className="font-bold text-purple-700">{viewingReceipt.monthBilled}</span>
                  </div>
                )}

                <div className="p-3 flex justify-between">
                  <span className="text-slate-500 font-semibold">Payment Method:</span>
                  <span className="font-bold text-slate-900">
                    {viewingReceipt.paymentMethod.replace("_", " ")}
                  </span>
                </div>

                {viewingReceipt.transactionReference && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500 font-semibold">Reference / Slip #:</span>
                    <span className="font-mono text-slate-700">
                      {viewingReceipt.transactionReference}
                    </span>
                  </div>
                )}

                {viewingReceipt.notes && (
                  <div className="p-3">
                    <span className="text-slate-500 font-semibold block mb-0.5">Remarks:</span>
                    <span className="text-slate-700 italic">{viewingReceipt.notes}</span>
                  </div>
                )}
              </div>

              {/* Total Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  Total Amount Paid
                </span>
                <span className="text-xl font-black">
                  {formatCurrency(viewingReceipt.amount, viewingReceipt.currency)}
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
                <div>
                  <div className="border-t border-slate-300 w-32 mx-auto mb-1"></div>
                  Customer / Payer Signature
                </div>
                <div>
                  <div className="border-t border-slate-300 w-32 mx-auto mb-1"></div>
                  Authorized Staff (Warraich Motors)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
