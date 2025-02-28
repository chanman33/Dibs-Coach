'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export interface InsuranceProfileData {
  companyName: string;
  licenseNumber: string;
  yearsExperience: number;
  insuranceTypes: string[];
  specializations: string[];
  serviceAreas: string[];
  licensedStates: string[];
  annualPremiumVolume?: number;
  totalPoliciesManaged?: number;
  averageClaimProcessingTime?: number;
  certifications: string[];
  languages: string[];
  carrierRelationships: string[];
}

interface InsuranceProfileResponse {
  success: boolean;
  profile: InsuranceProfileData | null;
}

export const fetchInsuranceProfile = withServerAction<InsuranceProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: profile, error } = await supabase
        .from('InsuranceProfile')
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
        console.error('[FETCH_INSURANCE_PROFILE_ERROR]', {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch insurance profile',
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
      console.error('[FETCH_INSURANCE_PROFILE_ERROR]', {
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

export const updateInsuranceProfile = withServerAction<InsuranceProfileResponse, Partial<InsuranceProfileData>>(
  async (profileData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('InsuranceProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle()

      const timestamp = new Date().toISOString()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('InsuranceProfile')
          .update({
            ...profileData,
            updatedAt: timestamp
          })
          .eq('userUlid', userUlid)
          .select()
      } else {
        // Create new profile
        result = await supabase
          .from('InsuranceProfile')
          .insert({
            ...profileData,
            userUlid,
            createdAt: timestamp,
            updatedAt: timestamp
          })
          .select()
      }

      if (result.error) {
        console.error('[UPDATE_INSURANCE_PROFILE_ERROR]', {
          userUlid,
          error: result.error,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update insurance profile',
            details: result.error
          }
        }
      }

      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/insurance')

      return {
        data: {
          success: true,
          profile: result.data?.[0] || null
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_INSURANCE_PROFILE_ERROR]', {
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