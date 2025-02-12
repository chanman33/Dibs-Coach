import { Database as DatabaseGenerated } from "@/types/supabase"

// Re-export generated types
export type Database = DatabaseGenerated

// Table row types
export type DbUser = Database["public"]["Tables"]["User"]["Row"]
export type DbRealtorProfile = Database["public"]["Tables"]["RealtorProfile"]["Row"]
export type DbListing = Database["public"]["Tables"]["Listing"]["Row"]

// Common response types with nested relations
export type UserWithProfile = DbUser & {
  realtorProfile: DbRealtorProfile | null
}

export type ListingWithRealtor = DbListing & {
  realtorProfile: DbRealtorProfile
}

// Supabase client types
export type SupabaseClient = ReturnType<typeof import('@supabase/supabase-js').createClient>
export type SupabaseResponse<T> = {
  data: T | null
  error: Error | null
} 