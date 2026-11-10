import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Warraich Motors Gujrat | Rent A Car & Luxury Fleet Services",
  description:
    "Warraich Motors Gujrat - 24/7 Car Rental Services on GT Road Gujrat. Land Cruiser Prado, Fortuner Legender, Civic RS, Corolla Altis, Yaris, and Hiace Grand Cabin with verified chauffeurs.",
  icons: {
    icon: [
      { url: "/Warraich-Motors-logo.png", sizes: "any" },
      { url: "/Warraich-Motors-logo.png", type: "image/png" },
    ],
    shortcut: "/Warraich-Motors-logo.png",
    apple: "/Warraich-Motors-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans antialiased bg-[#FAF8F6] text-stone-900">{children}</body>
    </html>
  );
}
