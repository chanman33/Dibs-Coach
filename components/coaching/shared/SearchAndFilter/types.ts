import { LucideIcon } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: LucideIcon;
}

export interface CoachFilters {
  domain?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  className?: string;
}

export interface FilterSidebarProps {
  onFiltersChange: (filters: CoachFilters) => void;
  initialFilters?: CoachFilters;
  className?: string;
  domains?: FilterOption[];
}

export type FilterChangeHandler = (filters: CoachFilters) => void;
export type SearchChangeHandler = (query: string) => void; 