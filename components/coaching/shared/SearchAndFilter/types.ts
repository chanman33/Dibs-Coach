export interface FilterOption {
  label: string;
  value: string;
}

export interface SearchFilters {
  query: string;
  specialties: string[];
  priceRange?: [number, number];
  sortBy?: string;
}

export interface SearchAndFilterProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: string[]) => void;
  specialties?: string[];
  vertical?: boolean;
  variant?: 'public' | 'private';
}

export type FilterChangeHandler = (filters: SearchFilters) => void;
export type SearchChangeHandler = (query: string) => void; 