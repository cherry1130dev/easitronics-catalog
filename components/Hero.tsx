'use client';

import AmazonSearchBar from './AmazonSearchBar';
import { EASITRONICS } from '@/lib/constants';
import { Sparkles } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  searchScope: string;
  onSearchChange: (query: string) => void;
  onScopeChange: (scope: string) => void;
  onQuickFilter: (key: 'branch' | 'domain' | 'price' | 'type', value: any) => void;
}

export default function Hero({
  searchQuery,
  searchScope,
  onSearchChange,
  onScopeChange,
  onQuickFilter,
}: HeroProps) {
  return (
    <section className="bg-slate-950 pt-5 pb-6 sm:pt-8 sm:pb-10 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
        {/* Sub-badge & Easi AI Launcher */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] sm:text-xs text-amber-300 font-medium">
            <span>Official Catalog • {EASITRONICS.name}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-gemini-chat'));
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/40 text-[11px] sm:text-xs text-amber-300 hover:text-amber-200 font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Chat with Easi - AI Project Advisor (Powered by Gemini AI)"
          >
            <Sparkles className="w-3 h-3 text-amber-400 fill-current" />
            <span>Ask <strong>Easi</strong></span>
          </button>
        </div>

        {/* Title - Responsive & Clear */}
        <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white max-w-3xl mx-auto mb-1.5 sm:mb-2 leading-tight">
          {EASITRONICS.name} Projects & Titles
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mb-4 sm:mb-6 leading-relaxed px-1">
          Explore verified engineering projects across ECE, CSE, EEE, Mech, Civil & Medical.
        </p>

        {/* Amazon-Style Search Bar */}
        <div className="mb-3 sm:mb-4">
          <AmazonSearchBar
            value={searchQuery}
            scope={searchScope}
            onSearchChange={onSearchChange}
            onScopeChange={onScopeChange}
          />
        </div>

        {/* Quick Filter Pill Suggestions - Horizontal swipeable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 -mx-2 sm:mx-0 sm:flex-wrap sm:justify-center text-xs text-slate-400">
          <span className="text-slate-500 font-medium shrink-0 hidden sm:inline mr-1">Popular:</span>
          <button
            onClick={() => onQuickFilter('branch', 'ECE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            ⚡ ECE
          </button>
          <button
            onClick={() => onQuickFilter('branch', 'CSE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            💻 CSE
          </button>
          <button
            onClick={() => onQuickFilter('branch', 'EEE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🔋 EEE
          </button>
          <button
            onClick={() => onQuickFilter('domain', 'IoT')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🌐 IoT
          </button>
          <button
            onClick={() => onQuickFilter('domain', 'Robotics')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🤖 Robotics
          </button>
          <button
            onClick={() => onQuickFilter('domain', 'Machine Learning')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🧠 Machine Learning
          </button>
          <button
            onClick={() => onQuickFilter('price', { bracket: 'under-10k', min: 0, max: 10000 })}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🏷️ Under ₹10,000
          </button>
          <button
            onClick={() => onQuickFilter('type', 'Prototype')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors shrink-0 active:bg-slate-800"
          >
            🔬 Prototypes
          </button>
        </div>
      </div>
    </section>
  );
}
