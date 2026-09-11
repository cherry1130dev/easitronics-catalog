'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { IndianRupee, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { formatProjectDetailsForCopy } from '@/lib/copyUtils';

interface ProjectCardProps {
  project: Project;
}

const DOMAIN_COLOR_MAP: Record<string, { badge: string; border: string }> = {
  IoT: { badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60', border: 'border-cyan-500/20' },
  Embedded: { badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60', border: 'border-amber-500/20' },
  Robotics: { badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60', border: 'border-emerald-500/20' },
  'Machine Learning': { badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60', border: 'border-indigo-500/20' },
  Simulation: { badge: 'bg-rose-950/70 text-rose-300 border-rose-800/60', border: 'border-rose-500/20' },
  'Large AI': { badge: 'bg-purple-950/70 text-purple-300 border-purple-800/60', border: 'border-purple-500/20' },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const domainStyle = DOMAIN_COLOR_MAP[project.domain] || {
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    border: 'border-slate-800',
  };

  const handleCopyTitle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(formatProjectDetailsForCopy(project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Top Header Row: Category & Badges */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Domain Badge */}
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${domainStyle.badge}`}>
              {project.domain}
            </span>

            {/* Branch Badge */}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {project.branch}
            </span>

            {/* Project Type Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                project.type === 'Product'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/70'
              }`}
            >
              {project.type}
            </span>
          </div>

          {/* Featured or Demo Indicator */}
          <div className="flex items-center gap-1.5">
            {project.featured && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                <Sparkles className="w-3 h-3 fill-current" />
                Featured
              </span>
            )}
            {project.source === 'custom' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                New
              </span>
            )}
          </div>
        </div>

        {/* Project Title (Image-Free, Large & Clear) */}
        <Link href={`/projects/${project.id}`} className="block">
          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded hover:text-slate-200"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{project.tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Price & Actions */}
      <div className="pt-3 border-t border-slate-800 flex items-end justify-between mt-2 gap-2">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
            Estimated Cost
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-white flex items-center tracking-tight text-amber-300">
            <IndianRupee className="w-4 h-4 inline" />
            {project.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-400/90 font-medium block leading-tight mt-0.5">
            *Estimation only (Not fixed cost)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Copy Title & Full Specs */}
          <button
            onClick={handleCopyTitle}
            title="Copy complete project specifications, overview & quotation details"
            className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
              copied
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Details Link */}
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 transition-all shadow-sm"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
