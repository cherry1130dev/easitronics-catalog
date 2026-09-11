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
    <section className="bg-slate-950 pt-8 pb-10 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Sub-badge & Easi AI Launcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-300 font-medium">
            <span>Official Catalog of {EASITRONICS.name}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-gemini-chat'));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/40 text-xs text-amber-300 hover:text-amber-200 font-semibold transition-all cursor-pointer shadow-sm hover:scale-105"
            title="Chat with Easi - AI Project Advisor (Powered by Gemini AI)"
          >
            <Sparkles className="w-3 h-3 text-amber-400 fill-current" />
            <span>Ask <strong>Easi</strong> (Powered by Gemini AI)</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white max-w-3xl mx-auto mb-2">
          {EASITRONICS.name} Engineering Projects & Titles
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mb-6">
          {EASITRONICS.tagline} Explore verified projects across ECE, CSE, EEE, Mechanical, Civil & Medical.
        </p>

        {/* Amazon-Style Search Bar */}
        <div className="mb-4">
          <AmazonSearchBar
            value={searchQuery}
            scope={searchScope}
            onSearchChange={onSearchChange}
            onScopeChange={onScopeChange}
          />
        </div>

        {/* Quick Filter Tag Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
          <span className="text-slate-500 font-medium mr-1">Popular:</span>
          <button
            onClick={() => onQuickFilter('branch', 'ECE')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            ECE Projects
          </button>
          <button
            onClick={() => onQuickFilter('branch', 'CSE')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            CSE Projects
          </button>
          <button
            onClick={() => onQuickFilter('domain', 'IoT')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            IoT
          </button>
          <button
            onClick={() => onQuickFilter('domain', 'Machine Learning')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            Machine Learning
          </button>
          <button
            onClick={() => onQuickFilter('price', { bracket: 'under-10k', min: 0, max: 10000 })}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            Under ₹10,000
          </button>
          <button
            onClick={() => onQuickFilter('type', 'Prototype')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition-colors"
          >
            Prototypes
          </button>
        </div>
      </div>
    </section>
  );
}
