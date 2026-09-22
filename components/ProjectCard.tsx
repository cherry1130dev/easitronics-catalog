'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, parseBranches, parseDomains } from '@/lib/types';
import { IndianRupee, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { formatProjectDetailsForCopy } from '@/lib/copyUtils';
import HighlightText from './HighlightText';

interface ProjectCardProps {
  project: Project;
  searchQuery?: string;
  index?: number;
}

const DOMAIN_COLOR_MAP: Record<string, { badge: string }> = {
  IoT: { badge: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  Embedded: { badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  Robotics: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  'Machine Learning': { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  Simulation: { badge: 'bg-rose-50 text-rose-800 border-rose-200' },
  'Large AI': { badge: 'bg-purple-50 text-purple-800 border-purple-200' },
};

export default function ProjectCard({ project, searchQuery = '', index }: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTitle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(formatProjectDetailsForCopy(project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-200">
      {/* Top Header Row: Badges & Identifiers */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {index !== undefined && (
              <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                #{String(index + 1).padStart(2, '0')}
              </span>
            )}

            {/* Domain Badges */}
            {parseDomains(project.domain).map((dom) => {
              const domainStyle = DOMAIN_COLOR_MAP[dom] || {
                badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
              };
              return (
                <span key={dom} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${domainStyle.badge}`}>
                  {dom}
                </span>
              );
            })}

            {/* Branch Badges */}
            {parseBranches(project.branch).map((br) => (
              <span key={br} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {br}
              </span>
            ))}

            {/* Project Type Badge */}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                project.type === 'Product'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {project.type}
            </span>
          </div>

          {/* Featured or Demo Indicator */}
          <div className="flex items-center gap-1.5">
            {project.featured && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#febd69] text-slate-950 shadow-sm">
                <Sparkles className="w-3 h-3 fill-current" />
                Featured
              </span>
            )}
            {project.source === 'custom' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                New
              </span>
            )}
            {project.isEdited && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Updated
              </span>
            )}
          </div>
        </div>

        {/* Project Title (Image-Free, Large, Clear & Search-Highlighted) */}
        <Link href={`/projects/${project.id}`} className="block group/title">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover/title:text-amber-700 transition-colors leading-snug mb-2 break-words">
            <HighlightText text={project.title} query={searchQuery} />
          </h3>
        </Link>

        {/* Description with Search Highlighting */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-3 leading-relaxed">
          <HighlightText text={project.description} query={searchQuery} />
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded hover:text-slate-900"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{project.tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Price & Actions */}
      <div className="pt-3 border-t border-slate-200 flex items-end justify-between mt-2 gap-2">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold truncate">
            Estimated Cost
          </span>
          <span className="text-base sm:text-xl font-black text-slate-900 flex items-center tracking-tight">
            <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline shrink-0" />
            {project.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium block leading-tight mt-0.5">
            *Estimation only
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Copy Title & Full Specs */}
          <button
            onClick={handleCopyTitle}
            title="Copy complete project specifications, overview & quotation details"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span className="text-[10px] sm:text-[11px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] sm:text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Details Link */}
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 transition-all shadow-sm active:scale-95 border border-[#fcd200] cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
