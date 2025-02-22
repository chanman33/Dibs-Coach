'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import type { MarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ServerActionContext } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"

export interface GeneralFormData {
  displayName: string
  bio: string | null
  yearsExperience: number
  primaryMarket: string
}

export interface CoachProfileFormData {
  specialties: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  calendlyUrl?: string;
  eventTypeUrl?: string;
}

interface ProfessionalRecognition {
  ulid: string;
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  description?: string | null;
  verificationUrl?: string | null;
  certificateUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
}

export const fetchUserProfile = withServerAction<GeneralFormData, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Get user data first
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          displayName,
          bio
        `)
        .eq("ulid", userUlid)
        .single()

      if (userError) {
        console.error("[USER_FETCH_ERROR]", { userUlid, error: userError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: userError
          }
        }
      }

      // Get realtor profile data
      const { data: profileData, error: profileError } = await supabase
        .from("RealtorProfile")
        .select(`
          yearsExperience,
          primaryMarket
        `)
        .eq("userUlid", userUlid)
        .single()

      if (profileError) {
        console.error("[PROFILE_FETCH_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user profile',
            details: profileError
          }
        }
      }

      return {
        data: {
          displayName: userData.displayName || "",
          bio: userData.bio,
          yearsExperience: profileData.yearsExperience || 0,
          primaryMarket: profileData.primaryMarket || ""
        },
        error: null
      }
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const updateUserProfile = withServerAction<GeneralFormData, GeneralFormData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Update user data first
      const { error: userError } = await supabase
        .from("User")
        .update({
          displayName: data.displayName,
          bio: data.bio,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)

      if (userError) {
        console.error("[USER_UPDATE_ERROR]", { userUlid, error: userError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user data',
            details: userError
          }
        }
      }

      // Update realtor profile
      const { error: profileError } = await supabase
        .from("RealtorProfile")
        .update({
          yearsExperience: data.yearsExperience,
          primaryMarket: data.primaryMarket,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)

      if (profileError) {
        console.error("[PROFILE_UPDATE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update realtor profile',
            details: profileError
          }
        }
      }

      return {
        data: {
          displayName: data.displayName,
          bio: data.bio,
          yearsExperience: data.yearsExperience,
          primaryMarket: data.primaryMarket
        },
        error: null
      }
    } catch (error) {
      console.error("[PROFILE_UPDATE_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const fetchCoachProfile = withServerAction<any, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          specialties,
          yearsCoaching,
          hourlyRate,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          calendlyUrl,
          eventTypeUrl,
          professionalRecognitions
        `)
        .eq("userUlid", userUlid)
        .single()

      if (coachError) {
        console.error("[COACH_PROFILE_ERROR]", { userUlid, error: coachError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: coachError
          }
        }
      }

      return {
        data: {
          ...coachProfile,
          _rawRealtorProfile: []
        },
        error: null
      }
    } catch (error) {
      console.error("[COACH_PROFILE_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const updateCoachProfile = withServerAction<{ success: boolean }, any>(
  async (formData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { error: updateError } = await supabase
        .from("CoachProfile")
        .update({
          ...formData,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)

      if (updateError) {
        console.error("[COACH_PROFILE_UPDATE_ERROR]", { userUlid, error: updateError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: updateError
          }
        }
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error("[COACH_PROFILE_UPDATE_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

/**
 * Fetches marketing information for the current user's realtor profile
 */
export async function fetchMarketingInfo() {
  try {
    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" }
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
      console.error("[MARKETING_FETCH_ERROR] User not found:", userError)
      return { success: false, error: "User not found" }
    }

    // Get marketing information from realtor profile
    const { data: marketingData, error: marketingError } = await supabase
      .from("RealtorProfile")
      .select(`
        slogan,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        marketingAreas,
        testimonials
      `)
      .eq("userDbId", userData.id)
      .single()

    if (marketingError) {
      console.error("[MARKETING_FETCH_ERROR]", marketingError)
      return { success: false, error: "Failed to fetch marketing information" }
    }

    return { 
      success: true, 
      data: {
        ...marketingData,
        marketingAreas: Array.isArray(marketingData.marketingAreas) 
          ? marketingData.marketingAreas.join(", ")
          : marketingData.marketingAreas || "",
        testimonials: marketingData.testimonials || []
      } as MarketingInfo
    }
  } catch (error) {
    console.error("[MARKETING_FETCH_ERROR]", error)
    return { success: false, error: "Failed to fetch marketing information" }
  }
}

// Fetch user's database ID
export async function fetchUserDbId() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const supabase = await createAuthClient()
    const { data: user, error } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (error) {
      console.error('[FETCH_USER_ID_ERROR]', error)
      throw error
    }

    return user?.id || null
  } catch (error) {
    console.error('[FETCH_USER_ID_ERROR]', error)
    throw error
  }
} 