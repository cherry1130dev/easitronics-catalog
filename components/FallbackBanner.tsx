'use client';

import { useState } from 'react';
import { AlertCircle, FileSpreadsheet, X, Key, Check } from 'lucide-react';

interface FallbackBannerProps {
  error?: string;
  isFallback: boolean;
}

export default function FallbackBanner({ error, isFallback }: FallbackBannerProps) {
  const [closed, setClosed] = useState(false);

  if (!isFallback || closed) return null;

  return (
    <div className="bg-amber-950/70 border-b border-amber-500/30 text-amber-200 py-3 px-4 sm:px-6 relative backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-300">Google Sheet Connection Status: </span>
            <span className="text-amber-200/90">
              Currently displaying 20 realistic sample projects from local dataset. 
              {error ? ` (${error})` : ' Add your Google Sheet credentials to .env.local to connect live!'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setClosed(true)}
            className="p-1 rounded-lg text-amber-400 hover:text-amber-100 hover:bg-amber-900/50 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
