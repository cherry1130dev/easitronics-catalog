'use client';

import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { EASITRONICS } from '@/lib/constants';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#131921] border-b border-[#232f3e] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-white/10 border border-white/20 p-0.5 flex items-center justify-center shrink-0 shadow-sm group-hover:border-amber-400 transition-colors">
            <img
              src={EASITRONICS.logoUrl}
              alt="EasiCart Logo"
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-lg sm:text-2xl tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                EasiCart
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                by Easitronics
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium hidden sm:block truncate">
              Engineering Projects & Electronics Store
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-3 sm:space-x-4 shrink-0">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors"
          >
            Catalog
          </Link>

          <a
            href={EASITRONICS.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-200 hover:text-amber-400 transition-colors"
            title="Visit Easitronics Official Website"
          >
            <span>Store</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Ask Easi (Powered by Gemini AI) */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-gemini-chat'));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold bg-[#febd69] hover:bg-[#f3a847] text-[#0f1111] shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            title="Ask Easi - AI Project Advisor (Powered by Gemini AI)"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Ask Easi</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-950/15 text-slate-950 hidden lg:inline">
              Gemini AI
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
