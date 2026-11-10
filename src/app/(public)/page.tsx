import Link from "next/link";
import { prisma } from "@/lib/db";
import { HeroSearch } from "@/components/public/HeroSearch";
import { HeroSlider } from "@/components/public/HeroSlider";
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
    <div className="bg-[#FAF8F6]">
      {/* Full-Width Screen-Height Hero with Centered Text & Search Form */}
      <section className="relative w-full min-h-[500px] lg:h-[calc(100vh-84px)] lg:max-h-[680px] flex items-center justify-center overflow-hidden bg-[#121318]">
        <HeroSlider />

        {/* Centered Text + Form */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center text-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200">
              <span>GT Road, Gujrat</span>
              <span className="text-white/40">&bull;</span>
              <span>24/7 Service</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-[50px] tracking-tight text-white leading-[1.12]">
              <span className="font-extrabold">Warraich Motors</span>{" "}
              <span className="font-extralight text-gold-200">&amp; Rent A Car</span>
            </h1>
            <p className="text-sm sm:text-base text-stone-200 font-light max-w-xl mx-auto">
              Verified self-drive &amp; chauffeur vehicles in Gujrat &mdash; instant quotes and airport transfers.
            </p>
          </div>

          <div className="w-full max-w-5xl">
            <HeroSearch />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:03136225135"
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition text-xs border border-brand-500/40"
            >
              <Phone className="w-3.5 h-3.5 text-gold-200" />
              <span>0313 6225135</span>
            </a>
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20rent%20a%20car%20in%20Gujrat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-stone-900 font-semibold px-4 py-2 rounded-lg transition text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>WhatsApp Dispatch</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FUNNEL STAGE 1: AVAILABLE NOW */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 w-[88%] max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-9 pb-5 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-600">
                01 &mdash; Ready Today
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-4xl text-stone-950 tracking-tight">
              <span className="font-extrabold">Available Now</span>{" "}
              <span className="font-light text-brand-600">in Gujrat</span>
            </h2>
            <p className="text-stone-600 text-sm font-light mt-1.5 max-w-xl">
              Inspected and ready at our GT Road showroom for immediate self-drive or chauffeur handover.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20what%20cars%20are%20available%20for%20rent%20right%20now?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Current Slot</span>
            </a>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>Full Fleet</span>
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
      <section className="py-14 sm:py-16 bg-white border-y border-stone-200/80">
        <div className="w-[88%] max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-9 pb-5 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-amber-700">
                  02 &mdash; Advance Booking
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <h2 className="text-2xl sm:text-4xl text-stone-950 tracking-tight">
                <span className="font-extrabold">Will Be</span>{" "}
                <span className="font-light text-stone-600">Available Soon</span>
              </h2>
              <p className="text-stone-600 text-sm font-light mt-1.5 max-w-xl">
                Returning soon from active trips or scheduled detailing &mdash; pre-book to lock your upcoming dates.
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
      <section className="py-14 sm:py-16 w-[88%] max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-9 pb-5 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-600">
                03 &mdash; Active Duty
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            </div>
            <h2 className="text-2xl sm:text-4xl text-stone-950 tracking-tight">
              <span className="font-extrabold">Currently</span>{" "}
              <span className="font-light text-brand-600">Booked Fleet</span>
            </h2>
            <p className="text-stone-600 text-sm font-light mt-1.5 max-w-xl">
              Vehicles currently serving weddings, VIP protocol, and outstation tours. Join the waitlist for their next slot.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <a
              href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20inquire%20about%20future%20dates%20for%20your%20luxury%20fleet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-white bg-brand-50 hover:bg-brand-600 px-3.5 py-2 rounded-lg border border-brand-200 hover:border-brand-600 transition"
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
      <section className="bg-[#121318] text-white py-16 sm:py-20 border-y border-stone-800">
        <div className="w-[88%] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/60 border border-brand-700/50 text-gold-200 text-[11px] font-semibold uppercase tracking-widest">
                <Plane className="w-3.5 h-3.5 text-gold-300" />
                <span>Airport Concierge</span>
              </div>
              <h2 className="text-3xl sm:text-4xl tracking-tight leading-snug text-white">
                <span className="font-extrabold">Arriving from Abroad?</span>{" "}
                <span className="font-extralight text-gold-200">We Meet You at the Terminal</span>
              </h2>
              <p className="text-stone-300 text-sm font-light leading-relaxed">
                Direct terminal handovers at Sialkot, Islamabad, and Lahore airports. We track your flight and coordinate on WhatsApp so your vehicle is waiting when you land.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="font-semibold text-white text-sm">Sialkot (SKT)</div>
                  <div className="text-xs text-gold-300 mt-1 font-medium">~45 Mins Express</div>
                  <p className="text-[11px] text-stone-400 mt-1">Direct GT Road delivery</p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="font-semibold text-white text-sm">Islamabad (ISB)</div>
                  <div className="text-xs text-gold-300 mt-1 font-medium">~2 Hrs Via M-2</div>
                  <p className="text-[11px] text-stone-400 mt-1">Terminal chauffeur pickup</p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="font-semibold text-white text-sm">Lahore (LHE)</div>
                  <div className="text-xs text-gold-300 mt-1 font-medium">~2.5 Hrs Motorway</div>
                  <p className="text-[11px] text-stone-400 mt-1">Allama Iqbal terminal</p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20am%20arriving%20at%20the%20airport%20and%20need%20a%20car"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-5 rounded-lg transition text-xs sm:text-sm border border-brand-500/40"
                >
                  <MessageCircle className="w-4 h-4 text-gold-200" />
                  <span>Book Airport Pickup</span>
                </a>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center gap-1 text-gold-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold-300" />
                  ))}
                </div>
                <p className="text-sm text-stone-200 leading-relaxed italic">
                  &ldquo;Booked a Fortuner Legender for our family wedding in Kharian coming from Birmingham. Spotless vehicle, courteous driver, and seamless coordination.&rdquo;
                </p>
                <div className="text-xs font-medium text-stone-400 flex justify-between pt-1">
                  <span className="text-white font-semibold">Chaudhry Kamran &bull; Birmingham, UK</span>
                  <span className="text-gold-300">Fortuner Legender</span>
                </div>
              </div>

              <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center gap-1 text-gold-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold-300" />
                  ))}
                </div>
                <p className="text-sm text-stone-200 leading-relaxed italic">
                  &ldquo;Rented a Corolla Grande for two weeks in Jalalpur Jattan. Sialkot airport handover was right on time and the service was top class.&rdquo;
                </p>
                <div className="text-xs font-medium text-stone-400 flex justify-between pt-1">
                  <span className="text-white font-semibold">Naveed Warraich &bull; Oslo, Norway</span>
                  <span className="text-gold-300">Corolla Altis Grande</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Warraich Motors */}
      <section className="bg-white py-16 sm:py-20 border-b border-stone-200/80">
        <div className="w-[88%] max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-[11px] font-bold text-brand-600 tracking-[0.18em] uppercase">
              Our Standard
            </p>
            <h2 className="text-2xl sm:text-4xl text-stone-950 tracking-tight mt-1.5">
              <span className="font-extrabold">Why Gujrat Trusts</span>{" "}
              <span className="font-light text-brand-600">Warraich Motors</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAF8F6] p-7 rounded-2xl border border-stone-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-gold-200 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-stone-950 tracking-tight">25-Point Inspection</h3>
              <p className="text-sm text-stone-600 font-light leading-relaxed">
                Brakes, tires, fluids, and AC are checked before every handover, with clean sanitized interiors.
              </p>
            </div>

            <div className="bg-[#FAF8F6] p-7 rounded-2xl border border-stone-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-gold-200 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-stone-950 tracking-tight">Verified Chauffeurs</h3>
              <p className="text-sm text-stone-600 font-light leading-relaxed">
                Courteous, uniformed drivers experienced with GT Road, Motorways, weddings, and northern routes.
              </p>
            </div>

            <div className="bg-[#FAF8F6] p-7 rounded-2xl border border-stone-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-gold-200 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-stone-950 tracking-tight">24/7 Roadside Care</h3>
              <p className="text-sm text-stone-600 font-light leading-relaxed">
                Our Gujrat dispatch team is on call 24/7 for immediate support or vehicle replacement if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gujrat Hub Location & CTA */}
      <section className="py-14 sm:py-16 w-[88%] max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#121318] via-[#1c1014] to-[#2c070d] text-white rounded-2xl p-8 sm:p-11 flex flex-col lg:flex-row items-center justify-between gap-6 border border-brand-800/40 shadow-lg">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold-200 uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5 text-gold-300" />
              <span>Mian, GT Rd, Small Industrial Area, Gujrat</span>
            </div>
            <h2 className="text-2xl sm:text-4xl tracking-tight">
              <span className="font-extrabold">Ready to</span>{" "}
              <span className="font-light text-gold-200">Reserve Your Car?</span>
            </h2>
            <p className="text-stone-300 text-sm font-light leading-relaxed">
              Book online or message us on WhatsApp for instant availability and tailored rental packages.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free cancellation 24h before
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Self-Drive &amp; Chauffeur
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Doorstep Delivery
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="tel:03136225135"
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-5 rounded-xl text-center transition flex items-center justify-center gap-2 text-sm border border-brand-500/40"
            >
              <Phone className="w-4 h-4 text-gold-200" />
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
