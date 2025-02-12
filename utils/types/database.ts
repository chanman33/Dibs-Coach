import { Database as DatabaseGenerated } from "@/types/supabase"

// Strongly typed database response types
export type Database = DatabaseGenerated

export type DbUser = Database["public"]["Tables"]["User"]["Row"]
export type DbRealtorProfile = Database["public"]["Tables"]["RealtorProfile"]["Row"]
export type DbListing = Database["public"]["Tables"]["Listing"]["Row"]

// Common response types with nested relations
export type UserWithProfile = {
  id: number
  realtorProfile: {
    id: number
  } | null
}

export type ListingWithRealtor = DbListing & {
  realtorProfile: DbRealtorProfile
} 