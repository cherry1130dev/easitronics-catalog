'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search project titles, keywords, hardware..." }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync internal state if prop changes externally
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce notification to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, onChange]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-4 text-base sm:text-lg bg-slate-900/90 text-white placeholder-slate-400 rounded-2xl border border-indigo-500/30 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 shadow-xl shadow-indigo-950/40 backdrop-blur-md outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              onChange('');
            }}
            className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
