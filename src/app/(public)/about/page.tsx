import { Car, Award, ShieldCheck, MapPin, Users, HeartHandshake } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
          About Warraich Motors Gujrat
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Gujrat&apos;s Premier Vehicle Fleet Operator
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Founded on GT Road Gujrat, Warraich Motors has established a standard for vehicle quality, prompt communication, and transparent dealings for domestic and international travelers alike.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Uncompromising Maintenance</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every car is mechanically inspected, detailed, and checked for air conditioning and tire safety before each client handover.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Chauffeur Excellence</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our drivers are vetted, courteous, and strictly non-smoking, offering hassle-free navigation across Punjab, Islamabad, and northern highways.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Zero Hidden Extras</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            What you agree upon booking is what you pay. No unexpected return fees or ambiguous calculations.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-4 border border-slate-800">
        <h2 className="text-2xl font-bold">Main Headquarters &amp; Depot</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Located prominently along the historic Grand Trunk (GT) Road in Gujrat, our facility features a secure vehicle dispatch yard, customer reception lounge, and dedicated servicing bays.
        </p>
        <div className="pt-2 text-xs text-slate-300 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-300" />
          <span>Mian, GT Rd, Small Industrial Area, Punjab, Gujrat, 50700</span>
        </div>
      </div>
    </div>
  );
}
