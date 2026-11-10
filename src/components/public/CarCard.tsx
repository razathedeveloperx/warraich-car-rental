import Link from "next/link";
import { Users, Fuel, Gauge, ArrowRight, MessageCircle, Clock, Lock, ShieldCheck } from "lucide-react";

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
    dailyRate?: any;
    weeklyRate?: any;
    currency?: string;
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

  const queryParams = new URLSearchParams();
  if (pickup) queryParams.set("pickup", pickup);
  if (returnDate) queryParams.set("return", returnDate);
  const detailUrl = `/cars/${car.slug}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const waText = encodeURIComponent(
    `Hello Warraich Motors, I would like to request availability & package details for the ${car.make} ${car.model} (${car.year}).`
  );
  const whatsappUrl = `https://wa.me/923136225135?text=${waText}`;

  const isAvailableNow =
    car.funnelStatus === "AVAILABLE_NOW" || car.operationalStatus === "AVAILABLE";
  const isAvailableSoon = car.funnelStatus === "AVAILABLE_SOON";
  const isBooked =
    car.funnelStatus === "CURRENTLY_BOOKED" || car.operationalStatus === "RENTED";

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_32px_rgba(92,11,22,0.09)] hover:border-brand-300/80 transition-all duration-300 flex flex-col">
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-transparent to-stone-950/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-stone-950/80 backdrop-blur-sm text-stone-100 text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider">
            {car.category.replace("_", " ")}
          </span>
          <span className="bg-white/95 text-stone-900 text-[10px] font-bold px-2 py-1 rounded-md">
            {car.year}
          </span>
        </div>

        {/* Funnel Status Badge */}
        <div className="absolute top-3 right-3">
          {isAvailableNow && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50/95 text-emerald-900 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Available Now
            </span>
          )}
          {isAvailableSoon && (
            <span className="inline-flex items-center gap-1 bg-amber-50/95 text-amber-900 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-amber-200 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-amber-700" />
              Available Soon
            </span>
          )}
          {isBooked && (
            <span className="inline-flex items-center gap-1 bg-brand-600/95 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-brand-500 backdrop-blur-sm">
              <Lock className="w-3 h-3 text-gold-200" />
              Currently Booked
            </span>
          )}
        </div>

        {car.availabilityNote && (
          <div className="absolute bottom-2.5 left-3 right-3">
            <div className="bg-stone-950/75 backdrop-blur-sm text-stone-100 text-[11px] font-normal px-2.5 py-1 rounded-md truncate border border-white/10">
              {car.availabilityNote}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg leading-snug tracking-tight group-hover:text-brand-600 transition">
              <span className="font-bold text-stone-950">{car.make}</span>{" "}
              <span className="font-light text-stone-700">{car.model}</span>
            </h3>
          </div>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 py-2.5 border-y border-stone-100 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>{car.seatingCapacity} Seats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="capitalize">{car.transmission.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="capitalize">{car.fuelType.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Service Option & Actions (No Prices Shown) */}
        <div className="mt-4 pt-1">
          <div className="flex items-center justify-between mb-3.5 text-xs">
            <div className="inline-flex items-center gap-1.5 text-stone-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Self-Drive / Chauffeur</span>
            </div>

            <div>
              {isBooked ? (
                <span className="text-brand-600 font-semibold">On Active Duty</span>
              ) : isAvailableSoon ? (
                <span className="text-amber-700 font-semibold">Advance Slot</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Ready in Gujrat</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-800 text-xs font-semibold py-2.5 px-2 rounded-xl border border-stone-200 hover:border-emerald-300 transition"
              title="Request quote on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Get Quote</span>
            </a>

            {isBooked ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 bg-stone-900 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              >
                <span>Join Waitlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : isAvailableSoon ? (
              <Link
                href={detailUrl}
                className="inline-flex items-center justify-center gap-1 bg-stone-900 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              >
                <span>Pre-Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href={detailUrl}
                className="inline-flex items-center justify-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition shadow-sm"
              >
                <span>Reserve Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
