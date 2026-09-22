'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, parseBranches, parseDomains } from '@/lib/types';
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
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl transition-all shadow-sm">
      {/* Left: Index, Title & Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-xs font-mono text-slate-500 font-bold px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
            #{String(index + 1).padStart(2, '0')}
          </span>

          {parseBranches(project.branch).map((b) => (
            <span key={b} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {b}
            </span>
          ))}

          {parseDomains(project.domain).map((d) => (
            <span key={d} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              {d}
            </span>
          ))}

          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              project.type === 'Product'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {project.type}
          </span>

          {project.featured && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#febd69] text-slate-950 shadow-sm">
              <Sparkles className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}

          {project.isEdited && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Updated
            </span>
          )}
        </div>

        <Link href={`/projects/${project.id}`} className="block group/title">
          <h4 className="text-base font-bold text-slate-900 group-hover/title:text-amber-700 transition-colors leading-snug break-words">
            <HighlightText text={project.title} query={searchQuery} />
          </h4>
        </Link>

        <p className="text-xs text-slate-600 mt-1 line-clamp-2 sm:line-clamp-1 leading-relaxed">
          <HighlightText text={project.description} query={searchQuery} />
        </p>

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Price & Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200">
        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Estimated Cost</span>
          <span className="text-base sm:text-lg font-black text-slate-900 flex items-center sm:justify-end">
            <IndianRupee className="w-3.5 h-3.5 inline shrink-0" />
            {project.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-amber-700 font-medium block">
            *Estimation only
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy project specifications and quotation details"
            className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span className="text-[10px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 transition-colors active:scale-95 border border-[#fcd200] cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
