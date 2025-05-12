import type { Database as DatabaseGenerated } from '@/types/supabase'
import { PortfolioItemType } from "@/utils/types/portfolio";

// Re-export generated types
export type Database = DatabaseGenerated

// Table row types
export type DbUser = Database["public"]["Tables"]["User"]["Row"]

// Supabase client types
export type SupabaseClient = ReturnType<typeof import('@supabase/supabase-js').createClient>
export type SupabaseResponse<T> = {
  data: T | null
  error: Error | null
}

// Define custom types for Supabase tables that aren't yet in generated types
export type PortfolioItemRow = {
  ulid: string;
  userUlid: string;
  type: PortfolioItemType;
  title: string;
  description: string | null;
  imageUrls: string[] | null;
  address: string | null;
  location: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  financialDetails: {
    amount?: number;
    currency?: string;
    percentAboveAsk?: number;
    interestRate?: number;
    term?: number;
    otherDetails?: Record<string, any>;
  } | null;
  metrics: Record<string, any> | null;
  date: string;
  tags: string[];
  featured: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioItemInsert = Omit<PortfolioItemRow, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt: string;
};

export type PortfolioItemUpdate = Partial<Omit<PortfolioItemRow, "ulid" | "createdAt" | "updatedAt">> & {
  updatedAt: string;
}; 