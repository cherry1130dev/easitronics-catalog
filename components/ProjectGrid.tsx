'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import ProjectCard from './ProjectCard';
import ProjectListRow from './ProjectListRow';
import { LayoutGrid, List, SearchX, Layers } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
  loading?: boolean;
  totalCount: number;
  searchQuery?: string;
}

export default function ProjectGrid({ projects, loading = false, totalCount, searchQuery = '' }: ProjectGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 animate-pulse">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-56 bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-16 bg-slate-800 rounded-full"></div>
                  <div className="h-4 w-12 bg-slate-800 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-full bg-slate-800/60 rounded mb-1"></div>
                <div className="h-4 w-2/3 bg-slate-800/60 rounded"></div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <div className="h-6 w-20 bg-slate-800 rounded"></div>
                <div className="h-8 w-20 bg-slate-800 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Bar: Count & Grid/List switcher */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800 text-slate-400 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            <strong className="text-white">{projects.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> titles
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="Card View"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-95 ${
              viewMode === 'grid'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-95 ${
              viewMode === 'list'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center my-6">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">No matching projects found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
            Try broadening your search term, resetting active filters, or changing the branch selection.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Image-Free Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {projects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} searchQuery={searchQuery} index={idx} />
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div className="space-y-2.5 sm:space-y-3">
          {projects.map((project, idx) => (
            <ProjectListRow key={project.id} project={project} index={idx} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
