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
