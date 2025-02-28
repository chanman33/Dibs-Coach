'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export interface CommercialProfileData {
  companyName?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  specializations: string[];
  certifications: string[];
  languages: string[];
  propertyTypes: string[];
  dealTypes: string[];
  typicalDealSize?: number;
  totalTransactionVolume?: number;
  completedDeals?: number;
  primaryMarket?: string;
  serviceAreas: string[];
}

interface CommercialProfileResponse {
  success: boolean;
  profile: CommercialProfileData | null;
}

export const fetchCommercialProfile = withServerAction<CommercialProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: profile, error } = await supabase
        .from('CommercialProfile')
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
        console.error('[FETCH_COMMERCIAL_PROFILE_ERROR]', {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch commercial profile',
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
      console.error('[FETCH_COMMERCIAL_PROFILE_ERROR]', {
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

export const updateCommercialProfile = withServerAction<CommercialProfileResponse, Partial<CommercialProfileData>>(
  async (profileData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('CommercialProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle()

      const timestamp = new Date().toISOString()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('CommercialProfile')
          .update({
            ...profileData,
            updatedAt: timestamp
          })
          .eq('userUlid', userUlid)
          .select()
      } else {
        // Create new profile
        result = await supabase
          .from('CommercialProfile')
          .insert({
            ...profileData,
            userUlid,
            createdAt: timestamp,
            updatedAt: timestamp
          })
          .select()
      }

      if (result.error) {
        console.error('[UPDATE_COMMERCIAL_PROFILE_ERROR]', {
          userUlid,
          error: result.error,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update commercial profile',
            details: result.error
          }
        }
      }

      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/commercial')

      return {
        data: {
          success: true,
          profile: result.data?.[0] || null
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_COMMERCIAL_PROFILE_ERROR]', {
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