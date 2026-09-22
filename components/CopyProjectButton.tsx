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
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
        copied
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
      }`}
      title="Copy complete project specifications, quotation estimate & contact info"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          <span>Full Details Copied to Clipboard!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-slate-500" />
          <span>Copy Project Details & Estimate</span>
        </>
      )}
    </button>
  );
}
