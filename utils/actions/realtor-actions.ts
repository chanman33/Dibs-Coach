'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types"

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

export const fetchRealtorProfile = withServerAction<RealtorProfileData, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: profile, error } = await supabase
        .from('RealtorProfile')
        .select('*')
        .eq('userUlid', userUlid)
        .single()

      if (error) {
        console.error('[REALTOR_PROFILE_ERROR]', error)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch realtor profile',
            details: error
          }
        }
      }

      if (!profile) {
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Realtor profile not found'
          }
        }
      }

      return {
        data: {
          displayName: profile.displayName,
          bio: profile.bio,
          yearsExperience: profile.yearsExperience,
          primaryMarket: profile.primaryMarket,
          languages: profile.languages,
          certifications: profile.certifications,
          propertyTypes: profile.propertyTypes,
          specializations: profile.specializations,
          marketingAreas: profile.marketingAreas,
          testimonials: profile.testimonials,
          geographicFocus: profile.geographicFocus
        },
        error: null
      }
    } catch (error) {
      console.error('[REALTOR_PROFILE_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    }
  }
)

export const updateRealtorProfile = withServerAction<RealtorProfileData, Partial<RealtorProfileData>>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: profile, error } = await supabase
        .from('RealtorProfile')
        .update(data)
        .eq('userUlid', userUlid)
        .select()
        .single()

      if (error) {
        console.error('[UPDATE_REALTOR_PROFILE_ERROR]', error)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update realtor profile',
            details: error
          }
        }
      }

      return {
        data: {
          displayName: profile.displayName,
          bio: profile.bio,
          yearsExperience: profile.yearsExperience,
          primaryMarket: profile.primaryMarket,
          languages: profile.languages,
          certifications: profile.certifications,
          propertyTypes: profile.propertyTypes,
          specializations: profile.specializations,
          marketingAreas: profile.marketingAreas,
          testimonials: profile.testimonials,
          geographicFocus: profile.geographicFocus
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_REALTOR_PROFILE_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
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