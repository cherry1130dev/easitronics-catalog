'use client';

import AmazonSearchBar from './AmazonSearchBar';

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
    <section className="bg-[#232f3e] py-3 sm:py-4 text-white border-b border-slate-700/80 shadow-inner">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Prominent & Highly Visible Amazon Search Bar */}
        <div className="mb-2.5 sm:mb-3">
          <AmazonSearchBar
            value={searchQuery}
            scope={searchScope}
            onSearchChange={onSearchChange}
            onScopeChange={onScopeChange}
          />
        </div>

        {/* Popular Quick-Filter Buttons (Preserved Exactly) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 -mx-2 sm:mx-0 sm:flex-wrap sm:justify-center text-xs">
          <span className="text-amber-400 font-bold shrink-0 hidden sm:inline mr-1 text-xs">
            Popular:
          </span>
          <button
            type="button"
            onClick={() => onQuickFilter('branch', 'ECE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            ⚡ ECE
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('branch', 'CSE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            💻 CSE
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('branch', 'EEE')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🔋 EEE
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('domain', 'IoT')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🌐 IoT
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('domain', 'Robotics')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🤖 Robotics
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('domain', 'Machine Learning')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🧠 Machine Learning
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('price', { bracket: 'under-10k', min: 0, max: 10000 })}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🏷️ Under ₹10,000
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter('type', 'Prototype')}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 text-white font-medium transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            🔬 Prototypes
          </button>
        </div>
      </div>
    </section>
  );
}
