'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { Copy, Check } from 'lucide-react';
import { formatProjectDetailsForCopy } from '@/lib/copyUtils';

export default function CopyProjectButton({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatProjectDetailsForCopy(project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
        copied
          ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
      }`}
      title="Copy complete project specifications, quotation estimate & contact info"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Full Details Copied to Clipboard!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-slate-400" />
          <span>Copy Project Details & Estimate</span>
        </>
      )}
    </button>
  );
}
