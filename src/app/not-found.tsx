import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-base/80 p-8 sm:p-10 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto text-[#0b4736] shadow-sm">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-[0.25em] text-[#b8922a] uppercase font-bold">
            ROUTE UNDEFINED &bull; 404
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-navy font-semibold tracking-tight">
            Destination Not Found
          </h1>
          <p className="text-xs sm:text-sm text-secondary/70 leading-relaxed font-sans">
            The page or journey route you are seeking is unavailable or has moved. Let us guide you back on your path.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0b4736] hover:bg-[#07261d] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/customer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-navy border border-base text-xs font-semibold uppercase tracking-wider transition-all duration-200"
          >
            <span>Book Chauffeur</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
