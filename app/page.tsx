'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Project, FilterState, ProjectKind } from '@/lib/types';
import Hero from '@/components/Hero';
import FilterPanel from '@/components/FilterPanel';
import ProjectGrid from '@/components/ProjectGrid';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  X 
} from 'lucide-react';

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'featured' | 'title-asc'>('recent');

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<FilterState>(() => {
    const q = searchParams.get('q') || '';
    const scope = searchParams.get('scope') || 'All';
    const domains = searchParams.get('domains')?.split(',').filter(Boolean) || [];
    const branches = searchParams.get('branches')?.split(',').filter(Boolean) || [];
    const type = (searchParams.get('type') as ProjectKind | 'All') || 'All';
    const minPrice = parseInt(searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(searchParams.get('maxPrice') || '100000', 10);
    const priceBracket = searchParams.get('bracket') || 'all';

    return {
      searchQuery: q,
      searchScope: scope,
      domains,
      branches,
      type,
      minPrice,
      maxPrice,
      priceBracket,
    };
  });

  // Fetch projects from /api/projects
  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const url = forceRefresh ? '/api/projects?refresh=true' : '/api/projects';
      const res = await fetch(url);
      const data = await res.json();

      if (data.projects) {
        let projects: Project[] = data.projects;
        try {
          const stored = localStorage.getItem('easitronics_project_overrides');
          if (stored) {
            const overridesObj = JSON.parse(stored);
            projects = projects.map((p) => {
              const override = overridesObj[p.id] || (p.title ? overridesObj[p.title] : null);
              if (override) {
                return { ...p, ...override, isEdited: true };
              }
              return p;
            });
          }
        } catch (_) {}
        setAllProjects(projects);
        setIsFallback(Boolean(data.isFallback));
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Sync URL query params with current filter state
  const updateQueryParams = useCallback((newFilters: FilterState) => {
    if (!isMounted.current) return;
    const params = new URLSearchParams();

    if (newFilters.searchQuery.trim()) {
      params.set('q', newFilters.searchQuery.trim());
    }
    if (newFilters.searchScope && newFilters.searchScope !== 'All') {
      params.set('scope', newFilters.searchScope);
    }
    if (newFilters.domains.length > 0) {
      params.set('domains', newFilters.domains.join(','));
    }
    if (newFilters.branches.length > 0) {
      params.set('branches', newFilters.branches.join(','));
    }
    if (newFilters.type !== 'All') {
      params.set('type', newFilters.type);
    }
    if (newFilters.minPrice > 0) {
      params.set('minPrice', newFilters.minPrice.toString());
    }
    if (newFilters.maxPrice < 100000) {
      params.set('maxPrice', newFilters.maxPrice.toString());
    }
    if (newFilters.priceBracket && newFilters.priceBracket !== 'all') {
      params.set('bracket', newFilters.priceBracket);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    updateQueryParams(newFilters);
  };

  const handleResetFilters = () => {
    const resetState: FilterState = {
      searchQuery: '',
      searchScope: 'All',
      domains: [],
      branches: [],
      type: 'All',
      minPrice: 0,
      maxPrice: 100000,
      priceBracket: 'all',
    };
    setFilters(resetState);
    updateQueryParams(resetState);
  };

  // Quick filter helper from Hero
  const handleQuickFilter = (key: 'branch' | 'domain' | 'price' | 'type', value: any) => {
    let newFilters = { ...filters };
    if (key === 'branch') {
      newFilters.branches = [value];
    } else if (key === 'domain') {
      newFilters.domains = [value];
    } else if (key === 'type') {
      newFilters.type = value;
    } else if (key === 'price') {
      newFilters.priceBracket = value.bracket;
      newFilters.minPrice = value.min;
      newFilters.maxPrice = value.max;
    }
    setFilters(newFilters);
    updateQueryParams(newFilters);
  };

  // Calculate live branch and domain counts
  const { branchCounts, domainCounts, typeCounts } = useMemo(() => {
    const bCounts: Record<string, number> = {};
    const dCounts: Record<string, number> = {};
    const tCounts: Record<string, number> = {};

    allProjects.forEach((p) => {
      bCounts[p.branch] = (bCounts[p.branch] || 0) + 1;
      dCounts[p.domain] = (dCounts[p.domain] || 0) + 1;
      tCounts[p.type] = (tCounts[p.type] || 0) + 1;
    });

    return { branchCounts: bCounts, domainCounts: dCounts, typeCounts: tCounts };
  }, [allProjects]);

  // Compute filtered & sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...allProjects];

    // 1. Scope filter (from Amazon search bar dropdown)
    if (filters.searchScope && filters.searchScope !== 'All') {
      if (filters.searchScope.startsWith('branch:')) {
        const targetBranch = filters.searchScope.replace('branch:', '').trim();
        result = result.filter((p) => p.branch.toLowerCase() === targetBranch.toLowerCase());
      } else if (filters.searchScope.startsWith('domain:')) {
        const targetDomain = filters.searchScope.replace('domain:', '').trim();
        result = result.filter((p) => p.domain.toLowerCase() === targetDomain.toLowerCase());
      }
    }

    // 2. Text Search Query Filter (Title, Description, Tags, Branch, Domain)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.branch.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }

    // 3. Branch Multi-Select Filter
    if (filters.branches.length > 0) {
      result = result.filter((p) => filters.branches.includes(p.branch));
    }

    // 4. Domain Multi-Select Filter
    if (filters.domains.length > 0) {
      result = result.filter((p) => filters.domains.includes(p.domain));
    }

    // 5. Project Type Filter
    if (filters.type !== 'All') {
      result = result.filter((p) => p.type === filters.type);
    }

    // 6. Cost / Price Filter
    if (filters.minPrice > 0 || filters.maxPrice < 100000) {
      result = result.filter(
        (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
      );
    }

    // 7. Sorting
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.orderIndex || 0) - (a.orderIndex || 0);
      }
      if (sortBy === 'price-asc') {
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        return (b.orderIndex || 0) - (a.orderIndex || 0);
      }
      if (sortBy === 'price-desc') {
        if (a.price !== b.price) {
          return b.price - a.price;
        }
        return (b.orderIndex || 0) - (a.orderIndex || 0);
      }
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.orderIndex || 0) - (a.orderIndex || 0);
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [allProjects, filters, sortBy]);

  // Active filter chips logic
  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery.trim()) {
      chips.push({
        label: `"${filters.searchQuery.trim()}"`,
        onRemove: () => handleFilterChange({ ...filters, searchQuery: '' }),
      });
    }

    if (filters.searchScope && filters.searchScope !== 'All') {
      chips.push({
        label: `Scope: ${filters.searchScope.replace(/^(branch|domain):/, '')}`,
        onRemove: () => handleFilterChange({ ...filters, searchScope: 'All' }),
      });
    }

    filters.branches.forEach((b) => {
      chips.push({
        label: `Branch: ${b}`,
        onRemove: () =>
          handleFilterChange({
            ...filters,
            branches: filters.branches.filter((x) => x !== b),
          }),
      });
    });

    filters.domains.forEach((d) => {
      chips.push({
        label: `Domain: ${d}`,
        onRemove: () =>
          handleFilterChange({
            ...filters,
            domains: filters.domains.filter((x) => x !== d),
          }),
      });
    });

    if (filters.type !== 'All') {
      chips.push({
        label: `Type: ${filters.type}`,
        onRemove: () => handleFilterChange({ ...filters, type: 'All' }),
      });
    }

    if (filters.priceBracket && filters.priceBracket !== 'all') {
      chips.push({
        label:
          filters.priceBracket === 'under-10k'
            ? 'Under ₹10,000'
            : filters.priceBracket === '10k-15k'
            ? '₹10,000 - ₹15,000'
            : filters.priceBracket === '15k-20k'
            ? '₹15,000 - ₹20,000'
            : filters.priceBracket === '20k-25k'
            ? '₹20,000 - ₹25,000'
            : filters.priceBracket === 'above-25k'
            ? '₹25,000+'
            : `₹${filters.minPrice} - ₹${filters.maxPrice}`,
        onRemove: () =>
          handleFilterChange({
            ...filters,
            minPrice: 0,
            maxPrice: 100000,
            priceBracket: 'all',
          }),
      });
    }

    return chips;
  }, [filters]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.searchScope && filters.searchScope !== 'All') count++;
    count += filters.branches.length;
    count += filters.domains.length;
    if (filters.type !== 'All') count++;
    if (filters.priceBracket && filters.priceBracket !== 'all') count++;
    else if (filters.minPrice > 0 || filters.maxPrice < 100000) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section with Amazon-Style Search Bar */}
      <Hero
        searchQuery={filters.searchQuery}
        searchScope={filters.searchScope}
        onSearchChange={(q) => handleFilterChange({ ...filters, searchQuery: q })}
        onScopeChange={(s) => handleFilterChange({ ...filters, searchScope: s })}
        onQuickFilter={handleQuickFilter}
      />

      {/* Main Catalog Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-1">
        {/* Top Control Bar: Results Count & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-6 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          {/* Left: Project Count Summary */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-bold text-white">Project Catalog</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Showing <span className="font-semibold text-amber-400">{filteredProjects.length}</span> of {allProjects.length} titles
            </span>
          </div>

          {/* Right: Sort Control & Mobile Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 ml-auto">
            {/* Quick Sort Switcher Pills for Desktop/Tablet */}
            <div className="hidden md:flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  sortBy === 'recent'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="First Preference: Recently added titles (from last in Excel sheet)"
              >
                <span>🔥</span>
                <span>Recently Added</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('price-asc')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  sortBy === 'price-asc'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Show low cost to high cost"
              >
                <span>💰</span>
                <span>Low to High</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('featured')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  sortBy === 'featured'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⭐</span>
                <span>Featured</span>
              </button>
            </div>

            {/* Sort Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="sortSelect" className="text-slate-400 font-medium hidden sm:inline">
                Sort:
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="recent" className="bg-slate-900 text-white">🔥 Recently Added (First Preference)</option>
                <option value="price-asc" className="bg-slate-900 text-white">💰 Price: Low to High</option>
                <option value="price-desc" className="bg-slate-900 text-white">📈 Price: High to Low</option>
                <option value="featured" className="bg-slate-900 text-white">⭐ Featured First</option>
                <option value="title-asc" className="bg-slate-900 text-white">🔤 Title: A to Z</option>
              </select>
            </div>

            {/* Mobile Filter Button with active count badge */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 p-2.5 sm:p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] sm:text-xs">Active filters:</span>
            {activeFilterChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-medium text-[11px] sm:text-xs"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="hover:text-amber-400 transition-colors p-0.5"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleResetFilters}
              className="text-amber-400 hover:text-amber-300 font-bold underline ml-2 transition-colors text-[11px] sm:text-xs"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column: Filter Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-20">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              branchCounts={branchCounts}
              domainCounts={domainCounts}
              typeCounts={typeCounts}
            />
          </div>

          {/* Right Column: Project Catalog (Image-Free Grid / List) */}
          <div className="lg:col-span-3">
            <ProjectGrid
              projects={filteredProjects}
              loading={loading}
              totalCount={allProjects.length}
              searchQuery={filters.searchQuery}
            />
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer Overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Sticky Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-base">Filter Projects</span>
                {activeFilterCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                branchCounts={branchCounts}
                domainCounts={domainCounts}
                typeCounts={typeCounts}
              />
            </div>

            {/* Sticky Drawer Footer with Live Project Counter */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Show {filteredProjects.length} Projects</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
