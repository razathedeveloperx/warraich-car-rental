import Link from "next/link";
import { Users, Fuel, Gauge, ArrowRight, MessageCircle, CheckCircle, Clock, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CarCardProps {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    slug: string;
    category: string;
    transmission: string;
    fuelType: string;
    seatingCapacity: number;
    luggageCapacity: number;
    dailyRate: any;
    weeklyRate?: any;
    currency: string;
    operationalStatus: string;
    funnelStatus?: "AVAILABLE_NOW" | "AVAILABLE_SOON" | "CURRENTLY_BOOKED" | string;
    availabilityNote?: string;
    images: Array<{ imageUrl: string; altText?: string | null }>;
  };
  pickup?: string;
  returnDate?: string;
}

export function CarCard({ car, pickup, returnDate }: CarCardProps) {
  const imageUrl =
    car.images && car.images.length > 0
      ? car.images[0].imageUrl
      : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

  // Build detail link with date params if present
  const queryParams = new URLSearchParams();
  if (pickup) queryParams.set("pickup", pickup);
  if (returnDate) queryParams.set("return", returnDate);
  const detailUrl = `/cars/${car.slug}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  // WhatsApp quick text
  const waText = encodeURIComponent(
    `Hello Warraich Motors, I want to rent/reserve the ${car.make} ${car.model} (${car.year}) [Reg: ${car.slug}]. Please share current availability & rates.`
  );
  const whatsappUrl = `https://wa.me/923136225135?text=${waText}`;

  // Determine status display
  const isAvailableNow =
    car.funnelStatus === "AVAILABLE_NOW" || car.operationalStatus === "AVAILABLE";
  const isAvailableSoon = car.funnelStatus === "AVAILABLE_SOON";
  const isBooked =
    car.funnelStatus === "CURRENTLY_BOOKED" || car.operationalStatus === "RENTED";

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300 flex flex-col">
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />

        {/* Soft bottom gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider">
            {car.category.replace("_", " ")}
          </span>
          <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md">
            {car.year}
          </span>
        </div>

        {/* Funnel Status Badge */}
        <div className="absolute top-3 right-3">
          {isAvailableNow && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50/95 text-emerald-800 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200/80 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Available Now
            </span>
          )}
          {isAvailableSoon && (
            <span className="inline-flex items-center gap-1 bg-amber-50/95 text-amber-900 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-amber-200/80 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-amber-700" />
              Available Soon
            </span>
          )}
          {isBooked && (
            <span className="inline-flex items-center gap-1 bg-brand-50/95 text-brand-800 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-brand-200/80 backdrop-blur-sm">
              <Lock className="w-3 h-3 text-brand-700" />
              Currently Booked
            </span>
          )}
        </div>

        {/* Bottom Banner inside Image if note exists */}
        {car.availabilityNote && (
          <div className="absolute bottom-2.5 left-3 right-3">
            <div className="bg-slate-950/70 backdrop-blur-sm text-slate-100 text-[11px] font-normal px-2.5 py-1 rounded-md truncate">
              {car.availabilityNote}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-brand-600 transition leading-snug">
              {car.make} {car.model}
            </h3>
          </div>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-3 gap-2 mt-3 py-2.5 border-y border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>{car.seatingCapacity} Seats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="capitalize">{car.transmission.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="capitalize">{car.fuelType.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Pricing and Actions */}
        <div className="mt-4 pt-1">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Daily Rate
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatCurrency(car.dailyRate, car.currency)}
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
            </div>

            <div className="text-right text-[11px]">
              {isBooked ? (
                <span className="text-brand-600 font-medium">In Rotation</span>
              ) : isAvailableSoon ? (
                <span className="text-amber-700 font-medium">Advance Booking</span>
              ) : (
                <span className="text-emerald-700 font-medium">Ready Today</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold py-2.5 px-2 rounded-xl border border-slate-200 hover:border-emerald-200 transition"
              title="Inquire directly on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>WhatsApp</span>
            </a>

            {isBooked ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              >
                <span>Waitlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : isAvailableSoon ? (
              <Link
                href={detailUrl}
                className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              >
                <span>Pre-Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href={detailUrl}
                className="inline-flex items-center justify-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              >
                <span>Book Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
