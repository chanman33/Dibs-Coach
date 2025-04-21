"use server"

import { createAuthClient } from "@/utils/auth"
import { marketingInfoSchema, type UpdateMarketingInfo, type Testimonial } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"
import { generateUlid } from "@/utils/ulid"
import { z } from "zod"

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

      // Check if marketing profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("MarketingProfile")
        .select("ulid")
        .eq("userUlid", userUlid)
        .maybeSingle() // Use maybeSingle to handle 0 or 1 result

      if (fetchError) {
        console.error("[MARKETING_FETCH_ERROR]", { userUlid, error: fetchError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error checking for existing marketing profile'
          }
        }
      }
      
      const marketingDataToSave = {
        websiteUrl: validatedData.websiteUrl,
        facebookUrl: validatedData.facebookUrl,
        instagramUrl: validatedData.instagramUrl,
        linkedinUrl: validatedData.linkedinUrl,
        youtubeUrl: validatedData.youtubeUrl,
        marketingAreas: Array.isArray(validatedData.marketingAreas) ? validatedData.marketingAreas : [],
        // Ensure testimonials are handled correctly, avoiding nested JSON strings if possible
        testimonials: Array.isArray(validatedData.testimonials) ? validatedData.testimonials : [],
        updatedAt: new Date().toISOString(),
      };

      let operationError = null;

      if (existingProfile) {
        // Update existing profile
        console.log("[MARKETING_INFO] Updating existing profile:", existingProfile.ulid);
        const { error: updateError } = await supabase
          .from("MarketingProfile")
          .update(marketingDataToSave)
          .eq("ulid", existingProfile.ulid);
        operationError = updateError;
      } else {
        // Insert new profile
        const newUlid = generateUlid();
        console.log("[MARKETING_INFO] Inserting new profile with ULID:", newUlid);
        const { error: insertError } = await supabase
          .from("MarketingProfile")
          .insert({
            ...marketingDataToSave,
            ulid: newUlid,
            userUlid: userUlid,
            socialMediaLinks: {}, // Default empty object if not provided
            createdAt: new Date().toISOString(),
          });
        operationError = insertError;
      }

      if (operationError) {
        console.error("[MARKETING_UPSERT_ERROR]", { userUlid, error: operationError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to save marketing information'
          }
        }
      }

      // Revalidate the profile page (adjust path if needed)
      revalidatePath("/dashboard/coach/profile") // Updated path

      return { 
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error("[MARKETING_ERROR]", error)
      // Handle potential Zod validation errors
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid marketing data format.',
            details: error.flatten()
          }
        }
      }
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