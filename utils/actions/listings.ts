'use server'

import { createAuthClient } from "@/utils/auth"
import { revalidatePath } from "next/cache"
import { CreateListing, UpdateListing } from "@/utils/types/listing"
import { ListingWithRealtor } from "@/utils/supabase/types"
import { auth } from "@clerk/nextjs/server"

export async function fetchListings(filters?: {
  status?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createAuthClient()

    let query = supabase
      .from("Listing")
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
          userDbId,
          bio,
          yearsExperience
        )
      `)

    // Apply filters if provided
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    if (filters?.propertyType) {
      query = query.eq("propertyType", filters.propertyType)
    }
    if (filters?.minPrice) {
      query = query.gte("listPrice", filters.minPrice)
    }
    if (filters?.maxPrice) {
      query = query.lte("listPrice", filters.maxPrice)
    }

    const { data, error } = await query

    if (error) {
      console.error("[FETCH_LISTINGS_ERROR]", error)
      throw new Error("Failed to fetch listings")
    }

    return { data, error: null }
  } catch (error) {
    console.error("[FETCH_LISTINGS_ERROR]", error)
    return { data: null, error: "Failed to fetch listings" }
  }
}

export async function createListing(data: CreateListing): Promise<{ data: ListingWithRealtor | null, error: string | null }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createAuthClient()

    // First get the user's realtorProfile ID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select(`
        id,
        realtorProfile:RealtorProfile (
          id
        )
      `)
      .eq("userId", userId)
      .single() as { data: { id: number; realtorProfile: { id: number } } | null, error: any }

    if (userError || !userData?.realtorProfile?.id) {
      console.error("[CREATE_LISTING_ERROR]", "No realtor profile found", userError)
      return { data: null, error: "Realtor profile not found" }
    }

    // Create the listing with the realtorProfileId
    const { data: listing, error } = await supabase
      .from("Listing")
      .insert({
        ...data,
        realtorProfileId: userData.realtorProfile.id,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
          userDbId,
          bio,
          yearsExperience
        )
      `)
      .single()

    if (error) {
      console.error("[CREATE_LISTING_ERROR]", error)
      return { data: null, error: "Failed to create listing" }
    }

    revalidatePath("/dashboard/listings")
    return { data: listing, error: null }
  } catch (error) {
    console.error("[CREATE_LISTING_ERROR]", error)
    return { data: null, error: "Failed to create listing" }
  }
}

export async function updateListing(id: number, data: UpdateListing): Promise<{ data: ListingWithRealtor | null, error: string | null }> {
  try {
    const supabase = await createAuthClient()

    const { data: listing, error } = await supabase
      .from("Listing")
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
          userDbId,
          bio,
          yearsExperience
        )
      `)
      .single()

    if (error) {
      console.error("[UPDATE_LISTING_ERROR]", error)
      return { data: null, error: "Failed to update listing" }
    }

    revalidatePath("/dashboard/listings")
    return { data: listing, error: null }
  } catch (error) {
    console.error("[UPDATE_LISTING_ERROR]", error)
    return { data: null, error: "Failed to update listing" }
  }
}

export async function deleteListing(id: number): Promise<{ error: string | null }> {
  try {
    const supabase = await createAuthClient()

    const { error } = await supabase
      .from("Listing")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[DELETE_LISTING_ERROR]", error)
      return { error: "Failed to delete listing" }
    }

    revalidatePath("/dashboard/listings")
    return { error: null }
  } catch (error) {
    console.error("[DELETE_LISTING_ERROR]", error)
    return { error: "Failed to delete listing" }
  }
} 