'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { IndianRupee, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';
import { formatProjectDetailsForCopy } from '@/lib/copyUtils';
import HighlightText from './HighlightText';

interface ProjectListRowProps {
  project: Project;
  index: number;
  searchQuery?: string;
}

export default function ProjectListRow({ project, index, searchQuery = '' }: ProjectListRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(formatProjectDetailsForCopy(project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all">
      {/* Left: Index, Title & Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-xs font-mono text-slate-400 font-bold px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">
            #{String(index + 1).padStart(2, '0')}
          </span>

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            {project.branch}
          </span>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
            {project.domain}
          </span>

          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              project.type === 'Product'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
            }`}
          >
            {project.type}
          </span>

          {project.featured && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
              <Sparkles className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}
        </div>

        <Link href={`/projects/${project.id}`} className="block group/title">
          <h4 className="text-base font-bold text-white group-hover/title:text-amber-400 transition-colors leading-snug break-words">
            <HighlightText text={project.title} query={searchQuery} />
          </h4>
        </Link>

        <p className="text-xs text-slate-400 mt-1 line-clamp-2 sm:line-clamp-1">
          <HighlightText text={project.description} query={searchQuery} />
        </p>

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Price & Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800">
        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Estimated Cost</span>
          <span className="text-base sm:text-lg font-extrabold text-amber-300 flex items-center sm:justify-end">
            <IndianRupee className="w-3.5 h-3.5 inline shrink-0" />
            {project.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-amber-400/90 font-medium block">
            *Estimation only
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy project specifications and quotation details"
            className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors active:scale-95"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
