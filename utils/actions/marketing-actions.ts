"use server"

import { createAuthClient } from "@/utils/auth"
import { marketingInfoSchema, type UpdateMarketingInfo } from "@/utils/types/marketing"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

/**
 * Removes a testimonial at the specified index and updates the database
 */
export async function removeTestimonial(index: number) {
  try {
    console.log("[MARKETING_INFO] Removing testimonial at index:", index)

    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      throw new Error("Unauthorized")
    }

    // Get supabase client
    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", session.userId)
      .single()

    if (userError || !userData) {
      console.error("[MARKETING_USER_ERROR]", userError)
      throw new Error("User not found")
    }

    // Get realtor profile and current testimonials
    const { data: profileData, error: profileError } = await supabase
      .from("RealtorProfile")
      .select("id, testimonials")
      .eq("userDbId", userData.id)
      .single()

    if (profileError || !profileData) {
      console.error("[MARKETING_PROFILE_ERROR]", profileError)
      throw new Error("Realtor profile not found")
    }

    // Remove the testimonial at the specified index
    const updatedTestimonials = [...(profileData.testimonials || [])]
    updatedTestimonials.splice(index, 1)

    // Update the database with the new testimonials array
    const { error: updateError } = await supabase
      .from("RealtorProfile")
      .update({
        testimonials: updatedTestimonials,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", profileData.id)

    if (updateError) {
      console.error("[MARKETING_UPDATE_ERROR]", updateError)
      throw new Error("Failed to remove testimonial")
    }

    // Revalidate the profile page
    revalidatePath("/dashboard/profile")

    return { success: true, data: updatedTestimonials }
  } catch (error) {
    console.error("[MARKETING_ERROR]", error)
    return { error: error instanceof Error ? error.message : "Failed to remove testimonial" }
  }
}

/**
 * Updates the marketing information for a realtor profile
 */
export async function updateMarketingInfo(data: UpdateMarketingInfo) {
  try {
    console.log("[MARKETING_INFO] Received data:", JSON.stringify(data, null, 2))

    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      throw new Error("Unauthorized")
    }

    // Validate input data
    try {
      const validatedData = marketingInfoSchema.parse(data)
      console.log("[MARKETING_INFO] Validated data:", JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      console.error("[MARKETING_VALIDATION_ERROR] Schema validation failed:", validationError)
      throw validationError
    }

    // Get supabase client
    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", session.userId)
      .single()

    if (userError || !userData) {
      console.error("[MARKETING_USER_ERROR]", userError)
      throw new Error("User not found")
    }

    // Get realtor profile ID
    const { data: profileData, error: profileError } = await supabase
      .from("RealtorProfile")
      .select("id")
      .eq("userDbId", userData.id)
      .single()

    if (profileError || !profileData) {
      console.error("[MARKETING_PROFILE_ERROR]", profileError)
      throw new Error("Realtor profile not found")
    }

    // Update marketing information
    const { error: updateError } = await supabase
      .from("RealtorProfile")
      .update({
        slogan: data.slogan,
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        linkedinUrl: data.linkedinUrl,
        youtubeUrl: data.youtubeUrl,
        marketingAreas: data.marketingAreas ? data.marketingAreas.split(",").map(area => area.trim()) : [],
        testimonials: data.testimonials,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", profileData.id)

    if (updateError) {
      console.error("[MARKETING_UPDATE_ERROR]", updateError)
      throw new Error("Failed to update marketing information")
    }

    // Revalidate the profile page
    revalidatePath("/dashboard/profile")

    return { success: true }
  } catch (error) {
    console.error("[MARKETING_ERROR]", error)
    return { error: error instanceof Error ? error.message : "Failed to update marketing information" }
  }
} 