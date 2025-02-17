"use server"

import { createAuthClient } from "@/utils/auth"
import { marketingInfoSchema, type UpdateMarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export const removeTestimonial = withServerAction<{ success: true, data: any[] }, { index: number }>(
  async ({ index }, { userUlid }) => {
    try {
      console.log("[MARKETING_INFO] Removing testimonial at index:", index)

      const supabase = await createAuthClient()

      // Get realtor profile and current testimonials
      const { data: profileData, error: profileError } = await supabase
        .from("RealtorProfile")
        .select("ulid, testimonials")
        .eq("userUlid", userUlid)
        .single()

      if (profileError || !profileData) {
        console.error("[MARKETING_PROFILE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Realtor profile not found'
          }
        }
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
        .eq("ulid", profileData.ulid)

      if (updateError) {
        console.error("[MARKETING_UPDATE_ERROR]", { userUlid, error: updateError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to remove testimonial'
          }
        }
      }

      // Revalidate the profile page
      revalidatePath("/dashboard/profile")

      return { 
        data: { 
          success: true, 
          data: updatedTestimonials 
        },
        error: null
      }
    } catch (error) {
      console.error("[MARKETING_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove testimonial',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const updateMarketingInfo = withServerAction<{ success: true }, UpdateMarketingInfo>(
  async (data, { userUlid }) => {
    try {
      console.log("[MARKETING_INFO] Received data:", JSON.stringify(data, null, 2))

      // Validate input data
      const validatedData = marketingInfoSchema.parse(data)
      console.log("[MARKETING_INFO] Validated data:", JSON.stringify(validatedData, null, 2))

      // Get supabase client
      const supabase = await createAuthClient()

      // Get realtor profile ID
      const { data: profileData, error: profileError } = await supabase
        .from("RealtorProfile")
        .select("ulid")
        .eq("userUlid", userUlid)
        .single()

      if (profileError || !profileData) {
        console.error("[MARKETING_PROFILE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Realtor profile not found'
          }
        }
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
        .eq("ulid", profileData.ulid)

      if (updateError) {
        console.error("[MARKETING_UPDATE_ERROR]", { userUlid, error: updateError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update marketing information'
          }
        }
      }

      // Revalidate the profile page
      revalidatePath("/dashboard/profile")

      return { 
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error("[MARKETING_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update marketing information',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 