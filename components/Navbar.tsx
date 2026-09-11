'use client';

import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { EASITRONICS } from '@/lib/constants';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm group-hover:border-amber-400 transition-colors">
            <img
              src={EASITRONICS.logoUrl}
              alt="Easitronics Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback icon if remote image is blocked
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {EASITRONICS.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                Projects
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Engineering Projects & Electronics Store
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Catalog
          </Link>

          <a
            href={EASITRONICS.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors"
            title="Visit Easitronics Official Website"
          >
            <span>Official Website</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          {/* Ask Easi (Powered by Gemini AI) */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-gemini-chat'));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ask Easi - AI Project Advisor (Powered by Gemini AI)"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Ask Easi</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-950/20 text-slate-950 hidden sm:inline">
              Gemini AI
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
