"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  Receipt,
  Search,
  Plus,
  Printer,
  Trash2,
  Calendar,
  User,
  Phone,
  Car,
  MapPin,
  X,
  Loader2,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import {
  createInvoiceAction,
  updateInvoiceStatusAction,
  deleteInvoiceAction,
} from "@/app/actions/invoices";
import Image from "next/image";

interface InvoiceManagerProps {
  initialInvoices: Array<any>;
  bookings: Array<any>;
  cars: Array<any>;
  customers: Array<any>;
  userRole?: string;
}

export function InvoiceManager({
  initialInvoices,
  bookings,
  cars,
  customers,
  userRole,
}: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Printable Invoice Voucher Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCnic, setCustomerCnic] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Ramtalai Chowk, Gujrat Hub");
  const [dropoffLocation, setDropoffLocation] = useState("Ramtalai Chowk, Gujrat Hub");
  const [vehicleMakeModel, setVehicleMakeModel] = useState("");
  const [modelYearNumber, setModelYearNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("White");
  const [rentalStartDate, setRentalStartDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [rentalEndDate, setRentalEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [rentPerDay, setRentPerDay] = useState<number | string>(15000);
  const [numberOfDays, setNumberOfDays] = useState<number | string>(1);
  const [otherCharges, setOtherCharges] = useState<number | string>(0);
  const [discount, setDiscount] = useState<number | string>(0);
  const [advancePaid, setAdvancePaid] = useState<number | string>(5000);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "POS" | "CHEQUE"
  >("CASH");
  const [notes, setNotes] = useState("");

  // Handle Booking auto-fill
  const handleSelectBooking = (bId: string) => {
    setSelectedBookingId(bId);
    if (!bId) return;

    const b = bookings.find((item) => item.id === bId);
    if (!b) return;

    setCustomerName(b.customer?.fullName || "");
    setCustomerPhone(b.customer?.phone || "");
    setCustomerCnic(b.customer?.drivingLicenceDetails || "");
    setPickupLocation(b.pickupLocation || "Ramtalai Chowk, Gujrat Hub");
    setDropoffLocation(b.returnLocation || "Ramtalai Chowk, Gujrat Hub");
    setVehicleMakeModel(`${b.car?.make} ${b.car?.model}`);
    setModelYearNumber(`${b.car?.year} / ${b.car?.registrationNumber}`);
    setVehicleColor("Standard");

    const s = new Date(b.pickupDateTime);
    const e = new Date(b.returnDateTime);
    setRentalStartDate(s.toISOString().slice(0, 16));
    setRentalEndDate(e.toISOString().slice(0, 16));

    const diffHours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(diffHours / 24));
    setNumberOfDays(days);

    const totalRental = Number(b.rentalPrice) || 0;
    const daily = Math.round(totalRental / days);
    setRentPerDay(daily);

    const extras = Number(b.extrasTotal) + Number(b.depositAmount);
    setOtherCharges(extras);
    setDiscount(Number(b.discount) || 0);
    setAdvancePaid(Number(b.amountPaid) || 0);
  };

  // Auto calculate day count when dates change
  const handleDatesChange = (startStr: string, endStr: string) => {
    setRentalStartDate(startStr);
    setRentalEndDate(endStr);
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const diffHours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
        const days = Math.max(1, Math.ceil(diffHours / 24));
        setNumberOfDays(days);
      }
    } catch {}
  };

  // Calculations
  const calculatedTotalRent = Math.round(
    (Number(rentPerDay) || 0) * (Number(numberOfDays) || 1)
  );
  const calculatedGrandTotal = Math.max(
    0,
    calculatedTotalRent + (Number(otherCharges) || 0) - (Number(discount) || 0)
  );
  const calculatedBalanceDue = Math.max(
    0,
    calculatedGrandTotal - (Number(advancePaid) || 0)
  );

  // Submit new invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !vehicleMakeModel) {
      setFormError("Please fill in Customer Name, Phone, and Vehicle Details.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await createInvoiceAction({
      bookingId: selectedBookingId || undefined,
      customerName,
      customerPhone,
      customerCnic,
      pickupLocation,
      dropoffLocation,
      vehicleMakeModel,
      modelYearNumber,
      vehicleColor,
      rentalStartDate,
      rentalEndDate,
      rentPerDay: Number(rentPerDay) || 0,
      numberOfDays: Number(numberOfDays) || 1,
      advancePaid: Number(advancePaid) || 0,
      otherCharges: Number(otherCharges) || 0,
      discount: Number(discount) || 0,
      paymentMethod,
      notes,
    });

    setIsSubmitting(false);

    if (!res.success || !res.invoice) {
      setFormError(res.error || "Failed to create invoice");
      return;
    }

    setInvoices([res.invoice, ...invoices]);
    setIsCreateModalOpen(false);
    setSelectedInvoice(res.invoice);
  };

  // Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateInvoiceStatusAction(id, newStatus);
    if (res.success && res.invoice) {
      setInvoices(invoices.map((inv) => (inv.id === id ? res.invoice : inv)));
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(res.invoice);
      }
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (inv: any) => {
    if (
      !confirm(
        `Move Proforma Invoice "${inv.invoiceNumber}" for ${inv.customerName} to trash?`
      )
    ) {
      return;
    }

    setDeletingId(inv.id);
    const res = await deleteInvoiceAction(inv.id);
    setDeletingId(null);

    if (res.success) {
      setInvoices(invoices.filter((i) => i.id !== inv.id));
      if (selectedInvoice?.id === inv.id) {
        setSelectedInvoice(null);
      }
    } else {
      alert(res.error || "Failed to move invoice to trash");
    }
  };

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesCust = inv.customerName?.toLowerCase().includes(q);
        const matchesPhone = inv.customerPhone?.toLowerCase().includes(q);
        const matchesCnic = inv.customerCnic?.toLowerCase().includes(q);
        const matchesCar = inv.vehicleMakeModel?.toLowerCase().includes(q);
        const matchesPlate = inv.modelYearNumber?.toLowerCase().includes(q);
        if (
          !matchesNum &&
          !matchesCust &&
          !matchesPhone &&
          !matchesCnic &&
          !matchesCar &&
          !matchesPlate
        ) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalInvoiced = invoices.reduce(
      (sum, i) => sum + Number(i.grandTotal || 0),
      0
    );
    const totalAdvance = invoices.reduce(
      (sum, i) => sum + Number(i.advancePaid || 0),
      0
    );
    const totalBalance = invoices.reduce(
      (sum, i) => sum + Number(i.balanceDue || 0),
      0
    );
    return { totalCount, totalInvoiced, totalAdvance, totalBalance };
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PAID
          </span>
        );
      case "PARTIAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            PARTIAL
          </span>
        );
      case "ISSUED":
      case "UNPAID":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-blue-600" />
            UNPAID
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-brand-600" />
            Invoices & Proforma Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official Warraich Motors vehicle rental proforma invoicing, advance
            tracking, and printable vouchers.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setSelectedBookingId("");
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm shadow-brand-500/20 text-xs flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Proforma Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoices
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active billing vouchers
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(stats.totalInvoiced)}
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            Total rental billings
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Advance Collected
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(stats.totalAdvance)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Paid upfront / deposited
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Balance Due
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(stats.totalBalance)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            Remaining balance on return
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer, phone, car, plate..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Invoices" },
            { id: "UNPAID", label: "Unpaid" },
            { id: "PARTIAL", label: "Partial" },
            { id: "PAID", label: "Paid" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Invoice Info</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle & Period</th>
                <th className="py-3.5 px-4">Rate Breakdown</th>
                <th className="py-3.5 px-4">Financials</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    No proforma invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const grand = Number(inv.grandTotal || 0);
                  const adv = Number(inv.advancePaid || 0);
                  const bal = Number(inv.balanceDue || 0);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Invoice Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-brand-700 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(inv.invoiceDate)}
                        </div>
                        {inv.bookingId && (
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold mt-1">
                            Linked to Booking
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {inv.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{inv.customerPhone}</span>
                        </div>
                        {inv.customerCnic && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            CNIC: {inv.customerCnic}
                          </div>
                        )}
                      </td>

                      {/* Vehicle & Period */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {inv.vehicleMakeModel}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.modelYearNumber}
                          {inv.vehicleColor ? ` • ${inv.vehicleColor}` : ""}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDate(inv.rentalStartDate)} →{" "}
                            {formatDate(inv.rentalEndDate)} (
                            {inv.numberOfDays || 1}d)
                          </span>
                        </div>
                      </td>

                      {/* Rate Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">
                          {formatCurrency(inv.rentPerDay)} / day ×{" "}
                          {inv.numberOfDays || 1}d
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Rent: {formatCurrency(inv.totalRent)}
                        </div>
                        {(Number(inv.otherCharges) > 0 ||
                          Number(inv.discount) > 0) && (
                          <div className="text-[10px] text-slate-400">
                            {Number(inv.otherCharges) > 0 &&
                              `+Charges: ${formatCurrency(inv.otherCharges)} `}
                            {Number(inv.discount) > 0 &&
                              `-Disc: ${formatCurrency(inv.discount)}`}
                          </div>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          {formatCurrency(grand)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          Advance: {formatCurrency(adv)}
                        </div>
                        {bal > 0 ? (
                          <div className="text-[11px] text-amber-600 font-bold">
                            Due: {formatCurrency(bal)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Settled
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(inv.status)}
                          <select
                            value={inv.status}
                            onChange={(e) =>
                              handleStatusChange(inv.id, e.target.value)
                            }
                            className="block w-full text-[10px] bg-slate-50 border border-slate-200 rounded py-0.5 px-1 text-slate-600 focus:outline-none"
                          >
                            <option value="UNPAID">UNPAID</option>
                            <option value="PARTIAL">PARTIAL</option>
                            <option value="PAID">PAID</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold shadow-sm transition inline-flex items-center gap-1"
                          title="Print or view Proforma Invoice Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          disabled={deletingId === inv.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Move to trash"
                        >
                          {deletingId === inv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
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
      {/* MODAL 1: CREATE PROFORMA INVOICE                                          */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Generate Proforma Invoice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create an official Warraich Motors vehicle rental billing
                    voucher
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-5 mt-4">
              {/* Optional: Link to Existing Booking */}
              {bookings.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Prefill from Existing Booking (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Auto-populates customer, car, dates & rates
                    </span>
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => handleSelectBooking(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">
                      -- Select an active booking or enter manually --
                    </option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingReference} — {b.customer?.fullName} (
                        {b.car?.make} {b.car?.model})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Section 1: Customer Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      CNIC / ID Card No.
                    </label>
                    <input
                      type="text"
                      value={customerCnic}
                      onChange={(e) => setCustomerCnic(e.target.value)}
                      placeholder="34201-XXXXXXX-X"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Trip & Vehicle Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-brand-600" />
                  Vehicle & Rental Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Vehicle Make / Model *
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleMakeModel}
                      onChange={(e) => setVehicleMakeModel(e.target.value)}
                      placeholder="e.g. Toyota Prado V8 / Honda Civic"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Model Year / Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={modelYearNumber}
                      onChange={(e) => setModelYearNumber(e.target.value)}
                      placeholder="2024 / LEB-24-9988"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Vehicle Colour
                    </label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="e.g. Pearl White / Black"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Pickup From
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Drop-off To
                    </label>
                    <input
                      type="text"
                      value={dropoffLocation}
                      onChange={(e) => setDropoffLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Rental Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={rentalStartDate}
                      onChange={(e) =>
                        handleDatesChange(e.target.value, rentalEndDate)
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Rental End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={rentalEndDate}
                      onChange={(e) =>
                        handleDatesChange(rentalStartDate, e.target.value)
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Financials & Rates Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                    Proforma Rental Charges Grid
                  </span>
                  <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-mono">
                    Currency: PKR
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Rent Per Day (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={rentPerDay}
                      onChange={(e) => setRentPerDay(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      No. of Days *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={numberOfDays}
                      onChange={(e) => setNumberOfDays(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Total Rent (PKR)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatCurrency(calculatedTotalRent)}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Advance Paid (PKR)
                    </label>
                    <input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Other Charges (PKR)
                    </label>
                    <input
                      type="number"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Discount (PKR)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Grand Total (PKR)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatCurrency(calculatedGrandTotal)}
                      className="w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                      Balance Due (PKR)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatCurrency(calculatedBalanceDue)}
                      className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-amber-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="POS">POS Terminal</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Internal Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Advance paid via cash, balance on return"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-500/20 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Generate Proforma Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE PROFORMA INVOICE VOUCHER (CLIENT EXCEL SPECIFICATION)  */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            {/* Top Toolbar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Proforma Invoice Voucher
                </span>
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Proforma Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE INVOICE SHEET (Matches exact proforma spreadsheet layout) */}
            <div className="printable-proforma-sheet bg-white text-slate-900 font-sans">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <Image
                        src="/Warraich-Motors-logo.png"
                        alt="Warraich Motors"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                        WARRAICH MOTORS & RENT A CAR
                      </h1>
                      <div className="text-xs font-extrabold uppercase tracking-widest text-brand-700">
                        VEHICLE RENTAL — PROFORMA INVOICE
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Ramtalai Chowk, Near Old Fruit Mandi, Gujrat
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tel: +92 300 6211116 • +92 53 3521116
                      </div>
                    </div>
                  </div>

                  {/* Metadata Block */}
                  <div className="text-right border-l pl-4 border-slate-200">
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-500">
                        Invoice No.:{" "}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {selectedInvoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <span className="font-bold text-slate-500">Date: </span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(selectedInvoice.invoiceDate)}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <span className="font-bold text-slate-500">
                        Currency:{" "}
                      </span>
                      <span className="font-bold text-brand-700">
                        {selectedInvoice.currency || "PKR"}
                      </span>
                    </div>
                    <div className="mt-1.5">{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                </div>
              </div>

              {/* Customer & Rental Details 2-Column Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/2 py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Customer Name
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedInvoice.customerName}
                        </span>
                      </td>
                      <td className="w-1/2 py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Pickup From
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedInvoice.pickupLocation ||
                            "Ramtalai Chowk, Gujrat"}
                        </span>
                      </td>
                    </tr>

                    <tr className="divide-x divide-slate-200">
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          CNIC / ID Card No.
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedInvoice.customerCnic || "N/A"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Drop-off To
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedInvoice.dropoffLocation ||
                            "Ramtalai Chowk, Gujrat"}
                        </span>
                      </td>
                    </tr>

                    <tr className="divide-x divide-slate-200">
                      <td className="py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Phone Number
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedInvoice.customerPhone}
                        </span>
                      </td>
                      <td className="py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Vehicle Colour
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedInvoice.vehicleColor || "Standard"}
                        </span>
                      </td>
                    </tr>

                    <tr className="divide-x divide-slate-200">
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Vehicle Make / Model
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedInvoice.vehicleMakeModel}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Model Year / Number
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedInvoice.modelYearNumber}
                        </span>
                      </td>
                    </tr>

                    <tr className="divide-x divide-slate-200">
                      <td className="py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Rental Start Date
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(selectedInvoice.rentalStartDate)}
                        </span>
                      </td>
                      <td className="py-2 px-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Rental End Date
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(selectedInvoice.rentalEndDate)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rental Charges Grid */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Unit / Days</th>
                      <th className="py-2.5 px-3 text-right">Rate (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        Vehicle Rental ({selectedInvoice.vehicleMakeModel})
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {selectedInvoice.numberOfDays || 1} Day(s)
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {formatCurrency(selectedInvoice.rentPerDay)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(selectedInvoice.totalRent)}
                      </td>
                    </tr>

                    {Number(selectedInvoice.otherCharges) > 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2 px-3 text-slate-600 italic"
                        >
                          Other Charges / Security Deposit
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">
                          + {formatCurrency(selectedInvoice.otherCharges)}
                        </td>
                      </tr>
                    )}

                    {Number(selectedInvoice.discount) > 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2 px-3 text-emerald-700 italic"
                        >
                          Special Discount
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                          - {formatCurrency(selectedInvoice.discount)}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-slate-900 text-right uppercase text-[11px]"
                      >
                        Grand Total:
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(selectedInvoice.grandTotal)}
                      </td>
                    </tr>

                    <tr className="bg-emerald-50/50">
                      <td
                        colSpan={3}
                        className="py-2 px-3 text-emerald-800 text-right uppercase text-[11px] font-bold"
                      >
                        Advance Paid:
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(selectedInvoice.advancePaid)}
                      </td>
                    </tr>

                    <tr className="bg-amber-50 font-black border-t border-amber-200">
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-amber-900 text-right uppercase text-[11px]"
                      >
                        Balance Due (Payable on Return):
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-800 text-base">
                        {formatCurrency(selectedInvoice.balanceDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Standard Terms and Notes */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 mb-6">
                <div className="font-bold text-slate-800 uppercase mb-1">
                  Terms & Conditions:
                </div>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>
                    Customer is responsible for returning the vehicle in the agreed
                    condition.
                  </li>
                  <li>
                    Fuel, tolls, fines, damages and late-return charges (if
                    applicable) are subject to the rental agreement.
                  </li>
                  <li>
                    This is a proforma invoice; final charges may be adjusted as
                    agreed upon vehicle check-in.
                  </li>
                </ol>
                {selectedInvoice.notes && (
                  <div className="mt-2 text-slate-700 font-semibold italic">
                    Note: {selectedInvoice.notes}
                  </div>
                )}
              </div>

              {/* Signatures Area */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                <div>
                  <div className="h-10 border-b border-slate-400 mb-1"></div>
                  <div className="font-bold text-slate-800">
                    Customer Signature
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Acknowledged and accepted
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-slate-400 mb-1"></div>
                  <div className="font-bold text-slate-800">
                    Authorized Signature & Stamp
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Warraich Motors Gujrat
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
