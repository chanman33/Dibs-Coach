'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { PROFILE_STATUS, type ProfileStatus } from "@/utils/types/coach"
import { calculateProfileCompletion, PUBLICATION_THRESHOLD } from "@/utils/actions/calculateProfileCompletion"

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
  domainSpecialties?: string[];
  certifications?: string[];
  languages?: string[];
  professionalRecognitions?: ProfessionalRecognition[];
}

interface ProfessionalRecognition {
  ulid?: string;
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization: string | null;
  description: string | null;
  isVisible: boolean;
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
  professionalRecognitions: ProfessionalRecognition[];
  domainSpecialties: string[];
  capabilities: string[];
  _rawCoachProfile: any;
  _rawRealtorProfile: any;
  _rawMortgageProfile: any;
  _rawInsuranceProfile: any;
  _rawPropertyManagerProfile: any;
  profileStatus: ProfileStatus;
  completionPercentage: number;
  canPublish: boolean;
  missingFields: string[];
}

export const fetchCoachProfile = withServerAction<CoachProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = createAuthClient();

      // Fetch coach profile with professional recognitions
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          *,
          ProfessionalRecognition (
            ulid,
            title,
            type,
            year,
            organization,
            description,
            isVisible,
            industryType
          )
        `)
        .eq("userUlid", userUlid)
        .single();

      if (coachError) {
        console.error("[COACH_PROFILE_FETCH_ERROR]", {
          userUlid,
          error: coachError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch coach profile",
            details: coachError
          }
        };
      }

      // Get active recognitions from the coach profile
      const activeRecognitions = coachProfile?.ProfessionalRecognition?.filter(
        (recognition: any) => recognition.isVisible
      ) || [];

      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          firstName,
          lastName,
          bio,
          profileImageUrl,
          languages
        `)
        .eq("ulid", userUlid)
        .single();

      if (userError) {
        console.error("[USER_FETCH_ERROR]", {
          userUlid,
          error: userError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user data",
            details: userError
          }
        };
      }

      const profileData = {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        bio: userData?.bio,
        profileImageUrl: userData?.profileImageUrl,
        coachingSpecialties: coachProfile?.specialties || [],
        hourlyRate: coachProfile?.hourlyRate || null,
        yearsCoaching: coachProfile?.yearsCoaching || null,
        calendlyUrl: coachProfile?.calendlyUrl || null,
        eventTypeUrl: coachProfile?.eventTypeUrl || null,
      };
      
      const { percentage, missingFields, canPublish } = calculateProfileCompletion(profileData);

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
        languages: Array.isArray(userData?.languages) ? userData.languages : ['en'],
        certifications: [],
        professionalRecognitions: activeRecognitions,
        domainSpecialties: coachProfile?.domainSpecialties || [],
        capabilities: [],
        _rawCoachProfile: coachProfile || null,
        _rawRealtorProfile: null,
        _rawMortgageProfile: null,
        _rawInsuranceProfile: null,
        _rawPropertyManagerProfile: null,
        profileStatus: "DRAFT",
        completionPercentage: percentage,
        canPublish,
        missingFields
      };

      return { data: responseData, error: null };
    } catch (error) {
      console.error("[FETCH_COACH_PROFILE_ERROR]", {
        userUlid,
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
)

interface UpdateCoachProfileResponse {
  success: boolean;
  completionPercentage: number;
  profileStatus: ProfileStatus;
  canPublish: boolean;
  missingFields: string[];
}

export const updateCoachProfile = withServerAction<UpdateCoachProfileResponse, CoachProfileFormData>(
  async (formData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select(`
          firstName,
          lastName,
          bio,
          profileImageUrl,
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

      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio,
        profileImageUrl: userData.profileImageUrl,
        coachingSpecialties: formData.specialties,
        hourlyRate: formData.hourlyRate,
        yearsCoaching: formData.yearsCoaching,
        calendlyUrl: formData.calendlyUrl,
        eventTypeUrl: formData.eventTypeUrl,
      };
      
      const { percentage, missingFields, canPublish } = calculateProfileCompletion(profileData);
      
      // Check existing profile status
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('CoachProfile')
        .select('profileStatus')
        .eq('userUlid', userUlid)
        .maybeSingle();

      // Determine profile status
      let profileStatus: ProfileStatus = PROFILE_STATUS.DRAFT;
      if (canPublish && existingProfile?.profileStatus === PROFILE_STATUS.PUBLISHED) {
        profileStatus = PROFILE_STATUS.PUBLISHED;
      }

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
        profileStatus,
        completionPercentage: percentage,
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
        data: { 
          success: true,
          completionPercentage: percentage,
          profileStatus,
          canPublish,
          missingFields
        },
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

interface UpdateProfileStatusResponse {
  success: boolean;
  profileStatus: ProfileStatus;
}

export const updateProfileStatus = withServerAction<UpdateProfileStatusResponse, { status: ProfileStatus }>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      if (data.status === PROFILE_STATUS.PUBLISHED) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select(`
            firstName,
            lastName,
            bio,
            profileImageUrl,
            coachProfile:CoachProfile (
              specialties,
              yearsCoaching,
              hourlyRate,
              calendlyUrl,
              eventTypeUrl,
              completionPercentage
            )
          `)
          .eq('ulid', userUlid)
          .single()

        if (userError) {
          console.error('[DEBUG] Error fetching user for status update:', userError)
          return {
            data: null,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch user data',
              details: { error: userError }
            }
          }
        }

        const coachProfile = Array.isArray(userData.coachProfile) 
          ? userData.coachProfile[0] 
          : userData.coachProfile;

        const profileData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          bio: userData.bio,
          profileImageUrl: userData.profileImageUrl,
          coachingSpecialties: coachProfile?.specialties || [],
          hourlyRate: coachProfile?.hourlyRate || null,
          yearsCoaching: coachProfile?.yearsCoaching || null,
          calendlyUrl: coachProfile?.calendlyUrl || null,
          eventTypeUrl: coachProfile?.eventTypeUrl || null,
        };
        
        const { canPublish, percentage } = calculateProfileCompletion(profileData);
        
        if (!canPublish) {
          return {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Your profile is only ${percentage}% complete. It needs to be at least ${PUBLICATION_THRESHOLD}% complete to publish.`,
              details: { 
                completionPercentage: percentage || 0,
                requiredThreshold: PUBLICATION_THRESHOLD
              }
            }
          }
        }
      }

      const { error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          profileStatus: data.status,
          updatedAt: new Date().toISOString()
        })
        .eq('userUlid', userUlid)

      if (updateError) {
        console.error('[DEBUG] Error updating profile status:', updateError)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update profile status',
            details: { error: updateError }
          }
        }
      }

      revalidatePath('/dashboard/coach/profile')
      return { 
        data: { 
          success: true,
          profileStatus: data.status
        },
        error: null
      }
    } catch (error) {
      console.error('[DEBUG] Error in updateProfileStatus:', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile status',
          details: { error }
        }
      }
    }
  }
) 