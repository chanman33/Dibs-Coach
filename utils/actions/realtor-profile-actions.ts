'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"
import type { RealtorProfile } from "@/utils/types/realtor"

export interface RealtorProfileData {
  displayName: string;
  bio: string | null;
  yearsExperience: number;
  primaryMarket: string;
  languages: string[];
  certifications: string[];
  propertyTypes: string[];
  specializations: string[];
  marketingAreas: string[];
  testimonials: any[];
  geographicFocus: {
    cities: string[];
    neighborhoods: string[];
    counties: string[];
  };
}

export interface MarketingInfo {
  slogan: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  marketingAreas: string;
  testimonials: Array<{
    name: string;
    title?: string;
    content: string;
    date?: string;
  }>;
}

interface RealtorProfileResponse {
  success: boolean;
  profile: RealtorProfile | null;
}

export const fetchRealtorProfile = withServerAction<RealtorProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: profile, error } = await supabase
        .from('RealtorProfile')
        .select(`
          *,
          professionalRecognitions:ProfessionalRecognition (
            ulid,
            title,
            type,
            issueDate,
            expiryDate,
            issuer,
            description,
            verificationUrl,
            certificateUrl,
            status,
            industryType,
            isVisible
          )
        `)
        .eq('userUlid', userUlid)
        .single()

      if (error) {
        console.error('[FETCH_REALTOR_PROFILE_ERROR]', {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch realtor profile',
            details: error
          }
        }
      }

      return {
        data: {
          success: true,
          profile
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_REALTOR_PROFILE_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
)

export const updateRealtorProfile = withServerAction<RealtorProfileResponse, Partial<RealtorProfile>>(
  async (profileData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('RealtorProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle()

      const timestamp = new Date().toISOString()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('RealtorProfile')
          .update({
            ...profileData,
            updatedAt: timestamp
          })
          .eq('userUlid', userUlid)
          .select()
      } else {
        // Create new profile
        result = await supabase
          .from('RealtorProfile')
          .insert({
            ...profileData,
            userUlid,
            createdAt: timestamp,
            updatedAt: timestamp
          })
          .select()
      }

      if (result.error) {
        console.error('[UPDATE_REALTOR_PROFILE_ERROR]', {
          userUlid,
          error: result.error,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update realtor profile',
            details: result.error
          }
        }
      }

      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/realtor')

      return {
        data: {
          success: true,
          profile: result.data?.[0] || null
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_REALTOR_PROFILE_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
)

export const fetchMarketingInfo = withServerAction<MarketingInfo, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data, error } = await supabase
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
        .eq("userUlid", userUlid)
        .single()

      if (error) {
        console.error("[MARKETING_FETCH_ERROR]", { userUlid, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch marketing information',
            details: { error }
          }
        }
      }

      return {
        data: {
          ...data,
          marketingAreas: Array.isArray(data.marketingAreas) 
            ? data.marketingAreas.join(", ")
            : data.marketingAreas || "",
          testimonials: data.testimonials || []
        },
        error: null
      }
    } catch (error) {
      console.error("[MARKETING_FETCH_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 