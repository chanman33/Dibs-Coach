'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

export interface PropertyManagerProfileData {
  yearsExperience: number;
  companyName: string;
  licenseNumber: string;
  licenseState: string;
  propertyTypes: string[];
  serviceAreas: string[];
  specializations: string[];
  unitsManaged?: number;
  propertiesManaged?: number;
  certifications: string[];
  languages: string[];
}

interface PropertyManagerProfileResponse {
  success: boolean;
  profile: PropertyManagerProfileData | null;
}

export const fetchPropertyManagerProfile = withServerAction<PropertyManagerProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: profile, error } = await supabase
        .from('PropertyManagerProfile')
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
        console.error('[FETCH_PROPERTY_MANAGER_PROFILE_ERROR]', {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch property manager profile',
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
      console.error('[FETCH_PROPERTY_MANAGER_PROFILE_ERROR]', {
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

export const updatePropertyManagerProfile = withServerAction<PropertyManagerProfileResponse, Partial<PropertyManagerProfileData>>(
  async (profileData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('PropertyManagerProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle()

      const timestamp = new Date().toISOString()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('PropertyManagerProfile')
          .update({
            ...profileData,
            updatedAt: timestamp
          })
          .eq('userUlid', userUlid)
          .select()
      } else {
        // Create new profile
        result = await supabase
          .from('PropertyManagerProfile')
          .insert({
            ...profileData,
            userUlid,
            createdAt: timestamp,
            updatedAt: timestamp
          })
          .select()
      }

      if (result.error) {
        console.error('[UPDATE_PROPERTY_MANAGER_PROFILE_ERROR]', {
          userUlid,
          error: result.error,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update property manager profile',
            details: result.error
          }
        }
      }

      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/property-manager')

      return {
        data: {
          success: true,
          profile: result.data?.[0] || null
        },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_PROPERTY_MANAGER_PROFILE_ERROR]', {
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