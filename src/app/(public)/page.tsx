import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { HeroSearch } from "@/components/public/HeroSearch";
import { CarCard } from "@/components/public/CarCard";
import {
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  ArrowRight,
  Plane,
  Star,
  Users,
} from "lucide-react";

import { FALLBACK_CARS, FALLBACK_SETTINGS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let settings: any = FALLBACK_SETTINGS;

  let availableCars: any[] = [];
  let availableSoonCars: any[] = [];
  let currentlyBookedCars: any[] = [];

  try {
    const allCars = await prisma.car.findMany({
      where: {
        isPublished: true,
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { dailyRate: "desc" },
    });

    const dbSettings = await prisma.businessSettings.findFirst();
    if (dbSettings) settings = dbSettings;

    if (allCars.length > 0) {
      allCars.forEach((c) => {
        const fallbackMatch = FALLBACK_CARS.find((fc) => fc.slug === c.slug);
        const funnel =
          fallbackMatch?.funnelStatus ||
          (c.operationalStatus === "AVAILABLE"
            ? "AVAILABLE_NOW"
            : c.operationalStatus === "MAINTENANCE"
            ? "AVAILABLE_SOON"
            : "CURRENTLY_BOOKED");

        const enrichedCar = {
          ...c,
          funnelStatus: funnel,
          availabilityNote: fallbackMatch?.availabilityNote,
        };

        if (funnel === "AVAILABLE_NOW" || c.operationalStatus === "AVAILABLE") {
          availableCars.push(enrichedCar);
        } else if (funnel === "AVAILABLE_SOON" || c.operationalStatus === "MAINTENANCE") {
          availableSoonCars.push(enrichedCar);
        } else {
          currentlyBookedCars.push(enrichedCar);
        }
      });
    } else {
      throw new Error("No cars found in DB");
    }
  } catch (error) {
    settings = FALLBACK_SETTINGS;

    availableCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "AVAILABLE_NOW");
    availableSoonCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "AVAILABLE_SOON");
    currentlyBookedCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "CURRENTLY_BOOKED");
  }

  if (availableCars.length === 0) {
    availableCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "AVAILABLE_NOW");
  }
  if (availableSoonCars.length === 0) {
    availableSoonCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "AVAILABLE_SOON");
  }
  if (currentlyBookedCars.length === 0) {
    currentlyBookedCars = FALLBACK_CARS.filter((c) => c.funnelStatus === "CURRENTLY_BOOKED");
  }

  return (
    <div className="bg-stone-50/60">
      {/* Minimal Hero & 85% Width Banner */}
      <section className="pt-8 pb-12 sm:pt-10 sm:pb-14 bg-white border-b border-slate-200/70">
        {/* Minimal, to-the-point header copy */}
        <div className="w-[85%] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Gujrat &bull; 24/7 Car Rental
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Warraich Motors &amp; Rent A Car
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Self-drive and chauffeur-driven vehicles in Gujrat &mdash; transparent PKR rates and airport transfers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="tel:03136225135"
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-lg transition text-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>0313 6225135</span>
            </a>
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20rent%20a%20car%20in%20Gujrat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold px-4 py-2.5 rounded-lg transition text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 85% Width Showroom Banner Image */}
        <div className="w-[85%] mx-auto mt-6">
          <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-900">
            <Image
              src="/warraich-motors-banner.JPG"
              alt="Warraich Motors and Rent A Car Gujrat Banner"
              fill
              className="object-cover"
              priority
              sizes="85vw"
            />
          </div>
        </div>

        {/* Search Bar aligned at 85% width */}
        <div className="w-[85%] mx-auto mt-6">
          <HeroSearch />
        </div>
      </section>

      {/* Calm Hub Location Strip */}
      <div className="bg-slate-900 text-slate-300 py-2.5 text-xs border-b border-slate-800">
        <div className="w-[85%] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-300 shrink-0" />
            <span>Mian, GT Rd, Small Industrial Area, Punjab, Gujrat, 50700</span>
          </div>
          <div className="text-slate-400">
            Serving Gujrat, Kharian, Dinga &amp; Lalamusa &bull;{" "}
            <span className="text-slate-200 font-medium">24/7 Helpline: 0313 6225135</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FUNNEL STAGE 1: AVAILABLE NOW */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 w-[85%] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Ready Today</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Available Now in Gujrat
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Inspected and ready at our GT Road hub for immediate self-drive or chauffeur handover.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20what%20cars%20are%20available%20for%20rent%20right%20now?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Current Slot</span>
            </a>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {availableCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FUNNEL STAGE 2: AVAILABLE SOON */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/70">
        <div className="w-[85%] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Advance Booking</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Will Be Available Soon
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Returning soon from active trips or detailing &mdash; pre-book to lock your upcoming dates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableSoonCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FUNNEL STAGE 3: CURRENTLY BOOKED */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 w-[85%] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              <span>On Active Duty</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Currently Booked Fleet
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Vehicles currently serving weddings, VIP protocol, and outstation tours. Join the waitlist for their next slot.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20inquire%20about%20future%20dates%20for%20your%20luxury%20fleet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 px-3.5 py-2 rounded-lg border border-brand-200 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Join Priority Waitlist</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {currentlyBookedCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* Overseas Pakistanis & Airport Transfers Section */}
      <section className="bg-slate-900 text-white py-14 sm:py-16 border-y border-slate-800">
        <div className="w-[85%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Plane className="w-3.5 h-3.5" />
                <span>Airport Concierge</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
                Arriving from Abroad?{" "}
                <span className="text-brand-300">We Meet You at the Terminal</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Direct terminal handovers at Sialkot, Islamabad, and Lahore airports. We track your flight and coordinate on WhatsApp so your vehicle is waiting when you land.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80">
                  <div className="font-semibold text-white text-sm">Sialkot (SKT)</div>
                  <div className="text-xs text-brand-300 mt-1">~45 Mins Express</div>
                  <p className="text-[11px] text-slate-400 mt-1">Direct GT Road delivery</p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80">
                  <div className="font-semibold text-white text-sm">Islamabad (ISB)</div>
                  <div className="text-xs text-brand-300 mt-1">~2 Hrs Via M-2</div>
                  <p className="text-[11px] text-slate-400 mt-1">Terminal chauffeur pickup</p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80">
                  <div className="font-semibold text-white text-sm">Lahore (LHE)</div>
                  <div className="text-xs text-brand-300 mt-1">~2.5 Hrs Motorway</div>
                  <p className="text-[11px] text-slate-400 mt-1">Allama Iqbal terminal</p>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20am%20arriving%20at%20the%20airport%20and%20need%20a%20car"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-5 rounded-lg transition text-xs sm:text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Book Airport Pickup</span>
                </a>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  &ldquo;Booked a Fortuner Legender for our family wedding in Kharian coming from Birmingham. Spotless vehicle, courteous driver, and transparent pricing.&rdquo;
                </p>
                <div className="text-xs font-medium text-slate-400 flex justify-between pt-1">
                  <span className="text-white">Chaudhry Kamran &bull; Birmingham, UK</span>
                  <span>Fortuner Legender</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  &ldquo;Rented a Corolla Grande for two weeks in Jalalpur Jattan. Sialkot airport handover was right on time and the deposit was returned promptly.&rdquo;
                </p>
                <div className="text-xs font-medium text-slate-400 flex justify-between pt-1">
                  <span className="text-white">Naveed Warraich &bull; Oslo, Norway</span>
                  <span>Corolla Altis Grande</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Warraich Motors */}
      <section className="bg-white py-14 sm:py-16 border-b border-slate-200/70">
        <div className="w-[85%] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-xs font-semibold text-brand-600 tracking-wider uppercase">
              Our Standard
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Why Gujrat Trusts Warraich Motors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200/70 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">25-Point Inspection</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Brakes, tires, fluids, and AC are checked before every handover, with clean sanitized interiors.
              </p>
            </div>

            <div className="bg-stone-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Verified Chauffeurs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Courteous, uniformed drivers experienced with GT Road, Motorways, weddings, and northern routes.
              </p>
            </div>

            <div className="bg-stone-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">24/7 Roadside Care</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our Gujrat dispatch team is on call 24/7 for immediate support or vehicle replacement if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gujrat Hub Location & CTA */}
      <section className="py-12 sm:py-16 w-[85%] mx-auto">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Mian, GT Rd, Small Industrial Area, Gujrat</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to Reserve Your Car?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Book online or message us on WhatsApp. Our team will confirm availability and prepare your car.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free cancellation 24h before
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cash &amp; Bank Transfer
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Doorstep Delivery
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="tel:03136225135"
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-5 rounded-xl text-center transition flex items-center justify-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Call 0313 6225135</span>
            </a>
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20reserve%20a%20car"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-5 rounded-xl text-center transition flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Booking</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
