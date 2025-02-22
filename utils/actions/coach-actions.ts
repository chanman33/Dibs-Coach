'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"

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

interface CoachProfileResponse {
  specialties: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  calendlyUrl: string;
  eventTypeUrl: string;
  languages: string[];
  certifications: string[];
  marketExpertise: string;
  professionalRecognitions: ProfessionalRecognition[];
  _rawCoachProfile: any;
  _rawRealtorProfile: any;
}

export const fetchCoachProfile = withServerAction<CoachProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      console.log('[DEBUG] Starting fetchCoachProfile...');
      
      const supabase = await createAuthClient()

      const { data, error } = await supabase
        .from('User')
        .select(`
          coachProfile:CoachProfile (*),
          realtorProfile:RealtorProfile (
            *,
            professionalRecognitions:ProfessionalRecognition (
              ulid,
              title,
              type,
              issuer,
              issueDate,
              expiryDate,
              description,
              verificationUrl,
              certificateUrl,
              status,
              createdAt,
              updatedAt
            )
          )
        `)
        .eq('ulid', userUlid)
        .single()

      if (error) {
        console.error('[DEBUG] Error fetching profiles:', error);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: { error }
          }
        }
      }

      const coachProfile = Array.isArray(data.coachProfile) ? data.coachProfile[0] : data.coachProfile;
      const realtorProfile = Array.isArray(data.realtorProfile) ? data.realtorProfile[0] : data.realtorProfile;

      const activeRecognitions = realtorProfile?.professionalRecognitions?.filter(
        (recognition: any) => recognition.status === 'ACTIVE'
      ) || [];

      const responseData: CoachProfileResponse = {
        specialties: coachProfile?.specialties || [],
        yearsCoaching: coachProfile?.yearsCoaching || 0,
        hourlyRate: Number(coachProfile?.hourlyRate) || 0,
        defaultDuration: coachProfile?.defaultDuration || 60,
        minimumDuration: coachProfile?.minimumDuration || 30,
        maximumDuration: coachProfile?.maximumDuration || 120,
        allowCustomDuration: coachProfile?.allowCustomDuration || false,
        calendlyUrl: coachProfile?.calendlyUrl || "",
        eventTypeUrl: coachProfile?.eventTypeUrl || "",
        languages: Array.isArray(realtorProfile?.languages) ? realtorProfile.languages : [],
        certifications: Array.isArray(realtorProfile?.certifications) ? realtorProfile.certifications : [],
        marketExpertise: realtorProfile?.bio || "",
        professionalRecognitions: activeRecognitions,
        _rawCoachProfile: coachProfile,
        _rawRealtorProfile: realtorProfile
      };

      return {
        data: responseData,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_COACH_PROFILE_ERROR]', error)
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

interface UpdateCoachProfileResponse {
  success: boolean;
}

export const updateCoachProfile = withServerAction<UpdateCoachProfileResponse, CoachProfileFormData>(
  async (formData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select(`
          realtorProfile:RealtorProfile!inner(ulid)
        `)
        .eq('ulid', userUlid)
        .single()

      if (userError) {
        console.error('[DEBUG] Error fetching user:', userError)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: { error: userError }
          }
        }
      }

      const realtorProfileUlid = userData.realtorProfile[0].ulid;

      const coachProfileData = {
        userUlid,
        specialties: formData.specialties,
        yearsCoaching: formData.yearsCoaching,
        hourlyRate: formData.hourlyRate,
        calendlyUrl: formData.calendlyUrl,
        eventTypeUrl: formData.eventTypeUrl,
        defaultDuration: formData.defaultDuration,
        minimumDuration: formData.minimumDuration,
        maximumDuration: formData.maximumDuration,
        allowCustomDuration: formData.allowCustomDuration,
        updatedAt: new Date().toISOString(),
      }

      const { error: coachError } = await supabase
        .from('CoachProfile')
        .upsert(coachProfileData, {
          onConflict: 'userUlid'
        })
        .select()

      if (coachError) {
        console.error('[DEBUG] Error updating coach profile:', coachError)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: { error: coachError }
          }
        }
      }

      revalidatePath('/dashboard/coach/profile')
      return { 
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[COACH_PROFILE_UPDATE_ERROR]', error)
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