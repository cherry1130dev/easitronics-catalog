'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface AmazonSearchBarProps {
  value: string;
  scope: string;
  onSearchChange: (query: string) => void;
  onScopeChange: (scope: string) => void;
  branches?: string[];
  domains?: string[];
  placeholder?: string;
}

export default function AmazonSearchBar({
  value,
  scope,
  onSearchChange,
  onScopeChange,
  branches = ['ECE', 'CSE', 'EEE', 'Mechanical', 'Civil', 'Medical'],
  domains = ['IoT', 'Embedded', 'Robotics', 'Machine Learning', 'Simulation', 'Large AI'],
  placeholder = 'Search engineering project titles, keywords, domains...',
}: AmazonSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedScope, setSelectedScope] = useState(scope || 'All');

  // Keep in sync with incoming props
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    setSelectedScope(scope || 'All');
  }, [scope]);

  const isInitialMount = useRef(true);

  // Debounced notification to parent
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm, onSearchChange]);

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScope = e.target.value;
    setSelectedScope(newScope);
    onScopeChange(newScope);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchTerm);
    onScopeChange(selectedScope);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-4xl mx-auto shadow-md rounded-lg overflow-hidden border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-[#f3a847] focus-within:border-[#e77600] transition-all"
    >
      <div className="flex items-stretch h-11 sm:h-12">
        {/* Amazon-style Scope/Category dropdown - Compact on mobile */}
        <div className="relative flex items-center bg-[#f3f4f6] border-r border-slate-300 hover:bg-[#e5e7eb] transition-colors shrink-0 max-w-[95px] sm:max-w-none">
          <select
            value={selectedScope}
            onChange={handleScopeChange}
            aria-label="Search department or scope"
            className="appearance-none bg-transparent text-[#0f1111] text-xs sm:text-sm font-semibold pl-2.5 sm:pl-4 pr-6 sm:pr-8 py-2 h-full cursor-pointer outline-none z-10 truncate"
          >
            <option value="All" className="bg-white text-[#0f1111]">
              All
            </option>
            <optgroup label="Engineering Branch" className="bg-white text-slate-600 font-bold">
              {branches.map((b) => (
                <option key={b} value={`branch:${b}`} className="bg-white text-[#0f1111] font-normal">
                  {b}
                </option>
              ))}
            </optgroup>
            <optgroup label="Technology Domain" className="bg-white text-slate-600 font-bold">
              {domains.map((d) => (
                <option key={d} value={`domain:${d}`} className="bg-white text-[#0f1111] font-normal">
                  {d}
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-500 absolute right-1.5 sm:right-2.5 pointer-events-none" />
        </div>

        {/* Search input field */}
        <div className="relative flex-1 flex items-center bg-white min-w-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full px-3 sm:px-4 text-xs sm:text-sm md:text-base text-[#0f1111] placeholder-slate-400 bg-transparent outline-none truncate font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="w-7 h-7 mr-1 sm:mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              title="Clear search"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Amazon-style search button (Signature Amber) */}
        <button
          type="submit"
          aria-label="Submit search"
          className="bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e69335] text-[#0f1111] font-bold px-4 sm:px-6 min-w-[48px] flex items-center justify-center transition-colors shadow-inner shrink-0 cursor-pointer"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span className="sr-only">Search</span>
        </button>
      </div>
    </form>
  );
}
