"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateRentalDays } from "@/lib/booking-engine/pricing";
import { submitPublicBookingAction } from "@/app/actions/bookings";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface BookingFormProps {
  car: {
    id: string;
    make: string;
    model: string;
    dailyRate: any;
    weeklyRate: any;
    monthlyRate: any;
    currency: string;
  };
  extras: Array<{
    id: string;
    name: string;
    description?: string | null;
    price: any;
    priceType: string;
  }>;
  initialPickup?: string;
  initialReturn?: string;
}

export function BookingForm({ car, extras, initialPickup, initialReturn }: BookingFormProps) {
  const router = useRouter();

  const getDefaultPickup = () => {
    if (initialPickup) return new Date(initialPickup).toISOString().slice(0, 16);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultReturn = () => {
    if (initialReturn) return new Date(initialReturn).toISOString().slice(0, 16);
    const d = new Date();
    d.setDate(d.getDate() + 4);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [pickupDateTime, setPickupDateTime] = useState(getDefaultPickup());
  const [returnDateTime, setReturnDateTime] = useState(getDefaultReturn());
  const [pickupLocation, setPickupLocation] = useState("Warraich Motors Hub, GT Road Gujrat");
  const [returnLocation, setReturnLocation] = useState("Warraich Motors Hub, GT Road Gujrat");

  // Selected extras state: Record<extraId, boolean>
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});

  // Customer contact details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nationalIdOrPassport, setNationalIdOrPassport] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute valid rental duration
  const rentalDays = useMemo(() => {
    try {
      return calculateRentalDays(new Date(pickupDateTime), new Date(returnDateTime));
    } catch {
      return null;
    }
  }, [pickupDateTime, returnDateTime]);

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rentalDays) {
      setError("Please select valid pickup and return dates.");
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your full name, email, and phone number.");
      return;
    }

    setIsSubmitting(true);

    const extrasPayload = extras
      .filter((e) => selectedExtras[e.id])
      .map((e) => ({ extraId: e.id, quantity: 1 }));

    const res = await submitPublicBookingAction({
      carId: car.id,
      pickupDateTime: new Date(pickupDateTime).toISOString(),
      returnDateTime: new Date(returnDateTime).toISOString(),
      pickupLocation,
      returnLocation,
      fullName,
      email,
      phone,
      address,
      nationalIdOrPassport,
      customerNotes,
      extras: extrasPayload,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to submit reservation.");
      return;
    }

    // Redirect to customer booking confirmation/status page
    router.push(`/booking/${res.bookingReference}?email=${encodeURIComponent(email)}&new=true`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
      <div className="border-b pb-4 mb-6">
        <h2 className="font-display text-xl font-bold text-stone-900 tracking-tight">Reserve This Vehicle</h2>
        <p className="text-xs text-stone-500 mt-1">
          Submit your dates and requirements. Our Gujrat team will confirm availability and share package details via WhatsApp/call.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Dates & Location */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">1</span>
            Rental Period &amp; Locations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Pickup Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={pickupDateTime}
                onChange={(e) => setPickupDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Return Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={returnDateTime}
                onChange={(e) => setReturnDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Pickup Location
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Return Location
              </label>
              <input
                type="text"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 2: Extras & Packages */}
        {extras.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">2</span>
              Optional Packages &amp; Add-ons
            </h3>
            <div className="space-y-2.5">
              {extras.map((extra) => {
                const isChecked = !!selectedExtras[extra.id];
                return (
                  <label
                    key={extra.id}
                    className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? "bg-brand-50/70 border-brand-300 ring-1 ring-brand-400"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleExtra(extra.id)}
                        className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <div>
                        <div className="text-sm font-semibold text-stone-900">{extra.name}</div>
                        {extra.description && (
                          <div className="text-xs text-stone-500 mt-0.5">{extra.description}</div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Customer Information */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">3</span>
            Your Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Tariq Mehmood"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                placeholder="e.g. 0313 6225135"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. warraichmotorsgujrat@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC or Passport Number
              </label>
              <input
                type="text"
                placeholder="e.g. 34201-1234567-1"
                value={nationalIdOrPassport}
                onChange={(e) => setNationalIdOrPassport(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential / Hotel Address
              </label>
              <input
                type="text"
                placeholder="e.g. Model Town, Gujrat"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Requests or Notes (Flight number, pickup instructions)
              </label>
              <textarea
                rows={2}
                placeholder="Any special notes or requirements..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Duration summary */}
        {rentalDays && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-600 uppercase tracking-wider">
              Selected Duration
            </span>
            <span className="font-bold text-brand-600 text-sm">
              {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
            </span>
          </div>
        )}

        {/* Policy notice */}
        <div className="flex items-start gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Manual Review Policy:</strong> Submitting creates a reservation request. Our staff will confirm vehicle readiness and package quote via WhatsApp/call.
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rentalDays}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying & Reserving...</span>
            </>
          ) : (
            <>
              <span>Submit Booking Request</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
