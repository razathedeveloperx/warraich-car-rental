"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Car, Clock, MapPin, Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();

  const getDefaultPickup = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultReturn = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [pickupDateTime, setPickupDateTime] = useState(getDefaultPickup());
  const [returnDateTime, setReturnDateTime] = useState(getDefaultReturn());
  const [pickupLocation, setPickupLocation] = useState("Warraich Motors Hub, GT Rd Small Industrial Area, Gujrat");
  const [category, setCategory] = useState("ALL");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupDateTime) params.set("pickup", new Date(pickupDateTime).toISOString());
    if (returnDateTime) params.set("return", new Date(returnDateTime).toISOString());
    if (pickupLocation) params.set("location", pickupLocation);
    if (category && category !== "ALL") params.set("category", category);

    router.push(`/cars?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3.5 sm:p-4 border border-white/80 text-left"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1.2fr_0.95fr_auto] gap-3 items-end">
        {/* Location */}
        <div className="min-w-0">
          <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Pickup Location</span>
          </label>
          <select
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-50 focus:bg-white px-3 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition truncate"
          >
            <option value="Warraich Motors Hub, GT Rd Small Industrial Area, Gujrat">
              Gujrat Hub (GT Rd, Small Industrial Area)
            </option>
            <option value="Gujrat City Center / Court Road / Rehman Shaheed Rd">
              Gujrat City Center / Court Road
            </option>
            <option value="Kharian Cantt / Lalamusa / Jalalpur Jattan">
              Kharian / Lalamusa / Jalalpur Jattan
            </option>
            <option value="Sialkot International Airport (SKT)">
              Sialkot Airport (SKT) Delivery
            </option>
            <option value="Islamabad International Airport (ISB)">
              Islamabad Airport (ISB) Delivery
            </option>
            <option value="Lahore Allama Iqbal Airport (LHE)">
              Lahore Airport (LHE) Delivery
            </option>
            <option value="Custom Doorstep Address (Gujrat & Surroundings)">
              Doorstep Delivery (Gujrat)
            </option>
          </select>
        </div>

        {/* Pickup Date & Time */}
        <div className="min-w-0">
          <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Pickup Date</span>
          </label>
          <input
            type="datetime-local"
            value={pickupDateTime}
            onChange={(e) => setPickupDateTime(e.target.value)}
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-50 focus:bg-white px-3 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition"
            required
          />
        </div>

        {/* Return Date & Time */}
        <div className="min-w-0">
          <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Return Date</span>
          </label>
          <input
            type="datetime-local"
            value={returnDateTime}
            onChange={(e) => setReturnDateTime(e.target.value)}
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-50 focus:bg-white px-3 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition"
            required
          />
        </div>

        {/* Vehicle Category */}
        <div className="min-w-0">
          <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Vehicle Type</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-50 focus:bg-white px-3 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition"
          >
            <option value="ALL">All Vehicles</option>
            <option value="LUXURY_SUV">Luxury SUV</option>
            <option value="SUV">SUV 4x4</option>
            <option value="SEDAN">Executive Sedan</option>
            <option value="ECONOMY">Economy</option>
            <option value="VAN">Hiace Van</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="w-full lg:w-auto h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 rounded-xl flex items-center justify-center gap-2 transition text-sm whitespace-nowrap shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Find Car</span>
          </button>
        </div>
      </div>
    </form>
  );
}
