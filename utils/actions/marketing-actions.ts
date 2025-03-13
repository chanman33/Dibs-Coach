"use server"

import { createAuthClient } from "@/utils/auth"
import { marketingInfoSchema, type UpdateMarketingInfo, type Testimonial } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export const removeTestimonial = withServerAction<{ success: true, data: any[] }, { index: number }>(
  async ({ index }, { userUlid }) => {
    try {
      console.log("[MARKETING_INFO] Removing testimonial at index:", index)

      const supabase = await createAuthClient()

      // Get marketing profile and current testimonials
      const { data: profileData, error: profileError } = await supabase
        .from("MarketingProfile")
        .select("ulid, testimonials")
        .eq("userUlid", userUlid)
        .single()

      if (profileError || !profileData) {
        console.error("[MARKETING_PROFILE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Marketing profile not found'
          }
        }
      }

      // Remove the testimonial at the specified index
      let updatedTestimonials: Testimonial[] = [];
      
      if (profileData.testimonials) {
        // If testimonials is a JSON object, parse it if it's a string or use it directly if it's already an object
        const currentTestimonials = typeof profileData.testimonials === 'string' 
          ? JSON.parse(profileData.testimonials) 
          : profileData.testimonials;
          
        // Ensure it's an array
        if (Array.isArray(currentTestimonials)) {
          updatedTestimonials = [...currentTestimonials];
          updatedTestimonials.splice(index, 1);
        }
      }

      // Update the database with the new testimonials array
      const { error: updateError } = await supabase
        .from("MarketingProfile")
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

      // Get marketing profile ID
      const { data: profileData, error: profileError } = await supabase
        .from("MarketingProfile")
        .select("ulid")
        .eq("userUlid", userUlid)
        .single()

      if (profileError || !profileData) {
        console.error("[MARKETING_PROFILE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Marketing profile not found'
          }
        }
      }

      // Update marketing information
      const { error: updateError } = await supabase
        .from("MarketingProfile")
        .update({
          websiteUrl: data.websiteUrl,
          facebookUrl: data.facebookUrl,
          instagramUrl: data.instagramUrl,
          linkedinUrl: data.linkedinUrl,
          youtubeUrl: data.youtubeUrl,
          marketingAreas: Array.isArray(data.marketingAreas) ? data.marketingAreas : [],
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
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