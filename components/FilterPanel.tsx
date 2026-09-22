'use client';

import { useState } from 'react';
import { FilterState, ProjectKind } from '@/lib/types';
import { Filter, RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  branchCounts?: Record<string, number>;
  domainCounts?: Record<string, number>;
  typeCounts?: Record<string, number>;
}

const ALL_BRANCHES = ['ECE', 'CSE', 'EEE', 'Mechanical', 'Civil', 'Medical'];
const ALL_DOMAINS = ['IoT', 'Embedded', 'Robotics', 'Machine Learning', 'Simulation', 'Large AI'];

const PRICE_BRACKETS = [
  { id: 'all', label: 'All Prices', min: 0, max: 100000 },
  { id: 'under-10k', label: 'Under ₹10,000', min: 0, max: 10000 },
  { id: '10k-15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { id: '15k-20k', label: '₹15,000 - ₹20,000', min: 15000, max: 20000 },
  { id: '20k-25k', label: '₹20,000 - ₹25,000', min: 20000, max: 25000 },
  { id: 'above-25k', label: '₹25,000 & Above', min: 25000, max: 100000 },
];

export default function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  branchCounts = {},
  domainCounts = {},
  typeCounts = {},
}: FilterPanelProps) {
  const [customMin, setCustomMin] = useState<string>(
    filters.minPrice > 0 ? String(filters.minPrice) : ''
  );
  const [customMax, setCustomMax] = useState<string>(
    filters.maxPrice < 100000 ? String(filters.maxPrice) : ''
  );

  const [openSections, setOpenSections] = useState({
    branch: true,
    price: true,
    domain: true,
    type: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle single branch
  const toggleBranch = (branch: string) => {
    const isSelected = filters.branches.includes(branch);
    const updated = isSelected
      ? filters.branches.filter((b) => b !== branch)
      : [...filters.branches, branch];
    onFilterChange({ ...filters, branches: updated });
  };

  // Toggle single domain
  const toggleDomain = (domain: string) => {
    const isSelected = filters.domains.includes(domain);
    const updated = isSelected
      ? filters.domains.filter((d) => d !== domain)
      : [...filters.domains, domain];
    onFilterChange({ ...filters, domains: updated });
  };

  // Select price bracket
  const handleSelectBracket = (bracketId: string, min: number, max: number) => {
    onFilterChange({
      ...filters,
      priceBracket: bracketId,
      minPrice: min,
      maxPrice: max,
    });
    setCustomMin(min > 0 ? String(min) : '');
    setCustomMax(max < 100000 ? String(max) : '');
  };

  // Apply custom price range
  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(customMin.replace(/[^0-9]/g, ''), 10) || 0;
    const max = parseInt(customMax.replace(/[^0-9]/g, ''), 10) || 100000;
    onFilterChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
      priceBracket: 'custom',
    });
  };

  const hasActiveFilters =
    filters.branches.length > 0 ||
    filters.domains.length > 0 ||
    filters.type !== 'All' ||
    (filters.minPrice > 0 && filters.minPrice !== 0) ||
    filters.maxPrice < 100000 ||
    Boolean(filters.searchQuery) ||
    Boolean(filters.searchScope && filters.searchScope !== 'All');

  return (
    <aside className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 transition-colors font-semibold active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>

      {/* 1. Branch Filter (Collapsible) */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => toggleSection('branch')}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              Branch
            </span>
            {filters.branches.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#febd69] text-slate-950">
                {filters.branches.length}
              </span>
            )}
          </div>
          {openSections.branch ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.branch && (
          <div className="space-y-1.5 mt-2.5">
            {ALL_BRANCHES.map((branch) => {
              const isSelected = filters.branches.includes(branch);
              const count = branchCounts[branch] ?? 0;
              return (
                <button
                  key={branch}
                  onClick={() => toggleBranch(branch)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-[#febd69] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-amber-400'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{branch}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Cost / Price Filter (Collapsible) */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              Estimated Budget
            </span>
            {filters.priceBracket !== 'all' && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#febd69] text-slate-950">
                Active
              </span>
            )}
          </div>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.price && (
          <div className="mt-2.5">
            <p className="text-[10px] text-amber-700 font-medium mb-2">
              *Costs are estimation only, not fixed.
            </p>
            <div className="space-y-1 mb-3">
              {PRICE_BRACKETS.map((bracket) => {
                const isSelected = filters.priceBracket === bracket.id;
                return (
                  <button
                    key={bracket.id}
                    onClick={() => handleSelectBracket(bracket.id, bracket.min, bracket.max)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'bg-[#febd69] text-slate-950 font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{bracket.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Price Range input form */}
            <form onSubmit={handleApplyCustomPrice} className="pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-600 font-medium block mb-1.5">Custom Range (₹)</span>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Min"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-1/2 px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="text"
                  placeholder="Max"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-1/2 px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors active:scale-95 cursor-pointer"
              >
                Apply Custom Budget
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Domain Filter (Collapsible) */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => toggleSection('domain')}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              Technology Domain
            </span>
            {filters.domains.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#febd69] text-slate-950">
                {filters.domains.length}
              </span>
            )}
          </div>
          {openSections.domain ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.domain && (
          <div className="space-y-1.5 mt-2.5">
            {ALL_DOMAINS.map((domain) => {
              const isSelected = filters.domains.includes(domain);
              const count = domainCounts[domain] ?? 0;
              return (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-[#febd69] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-amber-400'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{domain}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Project Type Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          Project Type
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          {(['All', 'Prototype', 'Product'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange({ ...filters, type })}
              className={`py-2 rounded-md font-semibold transition-all active:scale-95 cursor-pointer ${
                filters.type === type
                  ? 'bg-[#febd69] text-slate-950 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
