'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export interface MortgageProfileData {
  companyName: string;
  licenseNumber: string;
  yearsExperience: number;
  loanTypes: string[];
  specializations: string[];
  serviceAreas: string[];
  licensedStates: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  typicalInterestRate?: {
    min: number;
    max: number;
  };
  averageClosingTime?: number;
  monthlyTransactions?: number;
  totalLoanVolume?: number;
  certifications: string[];
  languages: string[];
  lenderRelationships: string[];
}

interface MortgageProfileResponse {
  success: boolean;
  profile: MortgageProfileData | null;
}

export const fetchMortgageProfile = withServerAction<MortgageProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: profile, error } = await supabase
        .from('MortgageProfile')
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
        console.error('[FETCH_MORTGAGE_PROFILE_ERROR]', {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch mortgage profile',
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
      console.error('[FETCH_MORTGAGE_PROFILE_ERROR]', {
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

export const updateMortgageProfile = withServerAction<MortgageProfileResponse, Partial<MortgageProfileData>>(
  async (profileData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('MortgageProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle()

      const timestamp = new Date().toISOString()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('MortgageProfile')
          .update({
            ...profileData,
            updatedAt: timestamp
          })
          .eq('userUlid', userUlid)
          .select()
      } else {
        // Create new profile
        result = await supabase
          .from('MortgageProfile')
          .insert({
            ...profileData,
            userUlid,
            createdAt: timestamp,
            updatedAt: timestamp
          })
          .select()
      }

      if (result.error) {
        console.error('[UPDATE_MORTGAGE_PROFILE_ERROR]', {
          userUlid,
          error: result.error,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update mortgage profile',
            details: result.error
          }
        }
      }

      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/mortgage')

      return {
        data: {
          success: true,
          profile: result.data?.[0] || null
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_MORTGAGE_PROFILE_ERROR]', {
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