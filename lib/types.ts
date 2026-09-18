export type DomainType = 
  | 'IoT' 
  | 'Embedded' 
  | 'Robotics' 
  | 'Machine Learning' 
  | 'Simulation' 
  | 'Large AI'
  | string;

export type BranchType = 
  | 'ECE' 
  | 'CSE' 
  | 'EEE' 
  | 'Mechanical' 
  | 'Medical' 
  | 'Civil'
  | string;

export type ProjectKind = 'Product' | 'Prototype';

export interface Project {
  id: string;
  title: string;
  domain: string;
  branch: string;
  type: ProjectKind;
  price: number;
  description: string;
  imageUrl?: string;
  demoVideoUrl?: string;
  tags: string[];
  featured: boolean;
  source?: 'sheet' | 'custom';
  isEdited?: boolean;
  orderIndex?: number;
}

export interface FilterState {
  searchQuery: string;
  searchScope: string; // 'All' | branch name | domain name
  domains: string[];
  branches: string[];
  type: ProjectKind | 'All';
  minPrice: number;
  maxPrice: number;
  priceBracket?: string; // 'under-10k' | '10k-20k' | '20k-30k' | 'above-30k' | 'all'
}

/**
 * Safely parse branches string (e.g. "ECE, EEE, Mechanical" or "ECE") into an array of clean branch names
 */
export function parseBranches(branchStr?: string | string[]): string[] {
  if (!branchStr) return ['ECE'];
  if (Array.isArray(branchStr)) {
    const list = branchStr.map((b) => String(b).trim()).filter(Boolean);
    return list.length > 0 ? list : ['ECE'];
  }
  const parts = branchStr.split(/[,/|]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : ['ECE'];
}

/**
 * Safely parse domains string (e.g. "IoT, Embedded" or "IoT") into an array of clean domain names
 */
export function parseDomains(domainStr?: string | string[]): string[] {
  if (!domainStr) return ['IoT'];
  if (Array.isArray(domainStr)) {
    const list = domainStr.map((d) => String(d).trim()).filter(Boolean);
    return list.length > 0 ? list : ['IoT'];
  }
  const parts = domainStr.split(/[,/|]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : ['IoT'];
}
