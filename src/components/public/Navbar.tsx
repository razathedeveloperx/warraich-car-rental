"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, UserCircle, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/cars", label: "Fleet" },
    { href: "/about", label: "About" },
    { href: "/terms", label: "Rules" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Slim info bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3 truncate">
          <span className="truncate">GT Rd, Small Industrial Area, Gujrat</span>
          <span className="hidden sm:inline text-slate-600">&bull;</span>
          <a
            href="tel:+923136225135"
            className="hidden sm:inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-brand-300" />
            <span>0313 6225135 (24/7)</span>
          </a>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://wa.me/923136225135?text=Hello%20Warraich%20Motors,%20I%20want%20to%20inquire%20about%20car%20rental"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>
          <span className="text-slate-700">|</span>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <UserCircle className="w-3 h-3 text-slate-400" />
            <span>Staff</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/Warraich-Motors-logo.png"
              alt="Warraich Motors Gujrat"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              WARRAICH <span className="text-brand-600">MOTORS</span>
            </div>
            <div className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
              Rent A Car &bull; Gujrat
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-brand-600 ${
                  isActive ? "text-brand-600 font-semibold" : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+923136225135"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 transition"
          >
            <Phone className="w-3.5 h-3.5 text-brand-600" />
            <span>0313 6225135</span>
          </a>
          <Link
            href="/cars"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <a
            href="https://wa.me/923136225135"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-brand-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-5 pt-2 pb-5 space-y-1.5 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a
              href="tel:+923136225135"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-800"
            >
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Call 0313 6225135</span>
            </a>
            <Link
              href="/cars"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
