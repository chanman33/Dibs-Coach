'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { PROFILE_STATUS, type ProfileStatus, ALLOWED_STATUS_TRANSITIONS, PROFILE_REQUIREMENTS, canTransitionTo, RealEstateDomain } from "@/utils/types/coach"
import { calculateProfileCompletion, PUBLICATION_THRESHOLD } from "@/utils/actions/calculateProfileCompletion"
import { auth } from "@clerk/nextjs/server"
import { ProfessionalRecognition } from "@/utils/types/recognition"
import { generateUlid, isValidUlid } from "@/utils/ulid"
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { updateUserDomains } from '@/utils/actions/user-profile-actions'

export interface CoachProfileFormData {
  coachSkills: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  eventTypeUrl?: string;
  realEstateDomains?: string[];
  certifications?: string[];
  professionalRecognitions?: ProfessionalRecognition[];
  skipRevalidation?: boolean;
}

interface CoachProfileResponse {
  coachSkills: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  eventTypeUrl: string;
  certifications: string[];
  professionalRecognitions: ProfessionalRecognition[];
  realEstateDomains: string[];
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
  missingRequiredFields: string[];
  optionalMissingFields: string[];
  validationMessages: Record<string, string>;
}

interface ProfessionalRecognitionData {
  ulid: string;
  title: string;
  type: string;
  issueDate: string;
  issuer: string;
  description?: string;
  isVisible: boolean;
  industryType?: string;
  status: string;
  verificationUrl?: string;
  certificateUrl?: string;
  expiryDate?: string | null;
  coachProfileUlid?: string;
}

export const fetchCoachProfile = withServerAction<CoachProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      console.log("[FETCH_COACH_PROFILE_START]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient();

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select(`
          firstName,
          lastName,
          bio,
          profileImageUrl,
          realEstateDomains
        `)
        .eq('ulid', userUlid)
        .single();

      if (userError) {
        console.error('[FETCH_COACH_USER_ERROR]', userError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: userError
          }
        };
      }

      // Get coach profile data
      const { data: coachProfile, error: coachError } = await supabase
        .from('CoachProfile')
        .select(`
          *,
          professionalRecognitions:ProfessionalRecognition (*)
        `)
        .eq('userUlid', userUlid)
        .single();

      if (coachError && coachError.code !== 'PGRST116') {
        console.error('[FETCH_COACH_PROFILE_ERROR]', coachError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: coachError
          }
        };
      }

      // Check for availability schedule
      const { data: availabilitySchedules, error: availabilityError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('ulid')
        .eq('userUlid', userUlid)
        .eq('active', true)
        .limit(1);

      if (availabilityError) {
        console.error('[FETCH_COACH_AVAILABILITY_ERROR]', availabilityError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch availability schedule',
            details: availabilityError
          }
        };
      }

      // Filter active recognitions and convert dates
      const activeRecognitions = ((coachProfile?.professionalRecognitions || []) as any[])
        .filter(rec => rec.status === 'ACTIVE' && rec.isVisible)
        .map(rec => {
          const issueDate = new Date(rec.issueDate);
          const expiryDate = rec.expiryDate ? new Date(rec.expiryDate) : null;
          
          return {
            ...rec,
            issueDate,
            expiryDate,
            type: rec.type as "AWARD" | "ACHIEVEMENT"
          } satisfies ProfessionalRecognition;
        });

      const profileData = {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        bio: userData?.bio,
        profileImageUrl: userData?.profileImageUrl,
        coachingSpecialties: coachProfile?.coachSkills || [],
        hourlyRate: coachProfile?.hourlyRate || null,
        yearsCoaching: coachProfile?.yearsCoaching || null,
        eventTypeUrl: coachProfile?.eventTypeUrl || null,
        hasAvailabilitySchedule: availabilitySchedules && availabilitySchedules.length > 0
      };
      
      const { percentage, missingFields, canPublish } = calculateProfileCompletion(profileData);

      const responseData: CoachProfileResponse = {
        coachSkills: coachProfile?.coachSkills || [],
        yearsCoaching: coachProfile?.yearsCoaching || 0,
        hourlyRate: Number(coachProfile?.hourlyRate) || 0,
        defaultDuration: coachProfile?.defaultDuration || 60,
        minimumDuration: coachProfile?.minimumDuration || 30,
        maximumDuration: coachProfile?.maximumDuration || 120,
        allowCustomDuration: coachProfile?.allowCustomDuration || false,
        eventTypeUrl: coachProfile?.eventTypeUrl || "",
        certifications: [],
        professionalRecognitions: activeRecognitions,
        realEstateDomains: userData?.realEstateDomains || [],
        capabilities: [],
        _rawCoachProfile: coachProfile || null,
        _rawRealtorProfile: null,
        _rawMortgageProfile: null,
        _rawInsuranceProfile: null,
        _rawPropertyManagerProfile: null,
        profileStatus: coachProfile?.profileStatus || "DRAFT",
        completionPercentage: percentage,
        canPublish,
        missingFields,
        missingRequiredFields: [],
        optionalMissingFields: [],
        validationMessages: {}
      };

      return { data: responseData, error: null };
    } catch (error) {
      console.error('[FETCH_COACH_PROFILE_ERROR]', error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
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
      console.log("[UPDATE_COACH_PROFILE_START]", {
        userUlid,
        formData,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()
      
      // Get existing coach profile to check status
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('CoachProfile')
        .select('profileStatus, ulid')
        .eq('userUlid', userUlid)
        .single();

      if (existingProfileError) {
        console.error('[UPDATE_COACH_PROFILE_ERROR]', {
          userUlid,
          error: existingProfileError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: { error: existingProfileError }
          }
        }
      }

      // Get user data for profile completion calculation
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('firstName, lastName, bio, profileImageUrl')
        .eq('ulid', userUlid)
        .single();

      if (userError) {
        console.error('[UPDATE_COACH_USER_ERROR]', {
          userUlid,
          error: userError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: { error: userError }
          }
        }
      }

      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio,
        profileImageUrl: userData.profileImageUrl,
        coachingSpecialties: formData.coachSkills,
        hourlyRate: formData.hourlyRate,
        yearsCoaching: formData.yearsCoaching,
        eventTypeUrl: formData.eventTypeUrl,
      };
      
      const { percentage, missingFields, canPublish } = calculateProfileCompletion(profileData);
      
      // Determine profile status
      let profileStatus: ProfileStatus = PROFILE_STATUS.DRAFT;
      if (canPublish && existingProfile?.profileStatus === PROFILE_STATUS.PUBLISHED) {
        profileStatus = PROFILE_STATUS.PUBLISHED;
      }

      const coachProfileData = {
        userUlid,
        coachSkills: formData.coachSkills,
        yearsCoaching: formData.yearsCoaching,
        hourlyRate: formData.hourlyRate,
        eventTypeUrl: formData.eventTypeUrl,
        defaultDuration: formData.defaultDuration,
        minimumDuration: formData.minimumDuration,
        maximumDuration: formData.maximumDuration,
        allowCustomDuration: formData.allowCustomDuration,
        profileStatus,
        completionPercentage: percentage,
        updatedAt: new Date().toISOString(),
      }

      console.log("[UPDATE_COACH_PROFILE_DATA]", {
        userUlid,
        coachProfileData,
        timestamp: new Date().toISOString()
      });

      // Update the User model with the coach skills as realEstateDomains
      // This will also handle primaryDomain synchronization
      const userDomainsResult = await updateUserDomains({
        realEstateDomains: formData.coachSkills
      });

      if (userDomainsResult.error) {
        console.error('[USER_DOMAINS_UPDATE_ERROR]', {
          userUlid,
          error: userDomainsResult.error,
          timestamp: new Date().toISOString()
        });
        // Continue with coach profile update even if user domains update fails
        // Just log the error but don't return
      }

      const { error: updateError } = await supabase
        .from('CoachProfile')
        .update(coachProfileData)
        .eq('ulid', existingProfile.ulid);

      if (updateError) {
        console.error('[UPDATE_COACH_PROFILE_ERROR]', {
          userUlid,
          error: updateError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: { error: updateError }
          }
        }
      }

      // Only revalidate if this is not part of a larger form submission
      if (!formData.skipRevalidation) {
        revalidatePath('/dashboard/coach/profile');
      }

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
      console.error('[UPDATE_COACH_PROFILE_ERROR]', {
        userUlid,
        error,
        formData,
        timestamp: new Date().toISOString()
      });
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

interface UpdateProfileStatusParams {
  status: ProfileStatus
  isSystemOwner: boolean
}

interface CoachProfileRecord {
  profileStatus: ProfileStatus
  completionPercentage: number
  realEstateDomains: string[]
  hourlyRate: number
  updatedAt: string
}

export const updateProfileStatus = withServerAction<UpdateProfileStatusResponse, UpdateProfileStatusParams>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      // Get current profile status
      const { data: profile, error: profileError } = await supabase
        .from('CoachProfile')
        .select(`
          profileStatus,
          completionPercentage,
          realEstateDomains,
          hourlyRate
        `)
        .eq('userUlid', userUlid)
        .single() as { data: CoachProfileRecord | null, error: any }

      if (profileError || !profile) {
        console.error('[UPDATE_STATUS_ERROR]', { error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch current profile status',
            details: profileError
          }
        }
      }

      // Check if transition is allowed for the user's role
      if (!canTransitionTo(profile.profileStatus, data.status, data.isSystemOwner)) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: data.isSystemOwner 
              ? `Cannot transition from ${profile.profileStatus} to ${data.status}`
              : 'You do not have permission to perform this action',
            details: { 
              currentStatus: profile.profileStatus, 
              requestedStatus: data.status,
              isSystemOwner: data.isSystemOwner
            }
          }
        }
      }

      // Validate publication requirements
      if (data.status === PROFILE_STATUS.PUBLISHED) {
        const requirements = {
          completionMet: profile.completionPercentage >= PROFILE_REQUIREMENTS.MINIMUM_COMPLETION,
          domainsMet: (profile.realEstateDomains?.length || 0) >= PROFILE_REQUIREMENTS.MINIMUM_DOMAINS,
          rateMet: PROFILE_REQUIREMENTS.REQUIRES_HOURLY_RATE ? (profile.hourlyRate || 0) > 0 : true
        }

        const missingRequirements = Object.entries(requirements)
          .filter(([_, met]) => !met)
          .map(([req]) => req.replace(/Met$/, ''))

        if (missingRequirements.length > 0) {
          return {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Profile does not meet publication requirements',
              details: {
                missingRequirements,
                currentCompletion: profile.completionPercentage,
                requiredCompletion: PROFILE_REQUIREMENTS.MINIMUM_COMPLETION
              }
            }
          }
        }
      }

      // Update profile status
      const { error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          profileStatus: data.status as any, // temporary fix for Supabase enum type mismatch
          updatedAt: new Date().toISOString()
        })
        .eq('userUlid', userUlid)

      if (updateError) {
        console.error('[UPDATE_STATUS_ERROR]', { error: updateError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update profile status',
            details: updateError
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
      console.error('[UPDATE_STATUS_ERROR]', { error })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile status',
          details: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
) 

export async function createCoachProfileIfNeeded(userUlid: string) {
  'use server'

  try {
    const supabase = await createAuthClient();

    // First check if user has COACH capability and isCoach flag
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('isCoach, capabilities')
      .eq('ulid', userUlid)
      .single();

    if (userError) {
      console.error('[CREATE_COACH_PROFILE_USER_ERROR]', {
        userUlid,
        error: userError,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to fetch user data' } };
    }

    // Only proceed if user is a coach
    if (!userData.isCoach || !userData.capabilities?.includes('COACH')) {
      return { data: null, error: { message: 'User is not a coach' } };
    }

    // Check if coach profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('ulid')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[CREATE_COACH_PROFILE_CHECK_ERROR]', {
        userUlid,
        error: profileError,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to check existing profile' } };
    }

    // If profile already exists, return it
    if (existingProfile) {
      return { data: existingProfile, error: null };
    }

    // Generate new ULID for the profile
    const newUlid = generateUlid();
    
    if (!isValidUlid(newUlid)) {
      console.error('[CREATE_COACH_PROFILE_ULID_ERROR]', {
        userUlid,
        newUlid,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to generate valid ULID' } };
    }

    // Create new coach profile with default values
    const { data: newProfile, error: createError } = await supabase
      .from('CoachProfile')
      .insert({
        ulid: newUlid,
        userUlid,
        coachSkills: [],
        yearsCoaching: null,
        hourlyRate: null,
        defaultDuration: 60,
        minimumDuration: 30,
        maximumDuration: 120,
        allowCustomDuration: false,
        profileStatus: 'DRAFT',
        completionPercentage: 0,
        isActive: true,
        totalSessions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('[CREATE_COACH_PROFILE_ERROR]', {
        userUlid,
        newUlid,
        error: createError,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to create coach profile' } };
    }

    revalidatePath('/dashboard/coach/profile');
    return { data: newProfile, error: null };
  } catch (error) {
    console.error('[CREATE_COACH_PROFILE_ERROR]', {
      userUlid,
      error,
      timestamp: new Date().toISOString()
    });
    return { data: null, error: { message: 'Failed to create coach profile' } };
  }
} 

export const saveCoachSkills = withServerAction<{ skills: string[] }, { skills: string[] }>(
  async ({ skills }, { userUlid }) => {
    try {
      const supabase = await createAuthClient();

      // Get the existing profile
      const { data: profile, error: profileError } = await supabase
        .from('CoachProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .single();

      if (profileError) {
        console.error('[SAVE_COACH_SKILLS_ERROR]', {
          error: profileError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Coach profile not found',
            details: profileError
          }
        };
      }

      // Update skills on existing profile
      const { data, error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          coachSkills: skills,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', profile.ulid)
        .select()
        .single();

      if (updateError) {
        console.error('[SAVE_COACH_SKILLS_ERROR]', {
          error: updateError,
          userUlid,
          profileUlid: profile.ulid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update skills',
            details: updateError
          }
        };
      }

      revalidatePath('/dashboard/coach/profile');
      return { data: { skills }, error: null };
    } catch (error) {
      console.error('[SAVE_COACH_SKILLS_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save skills',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
); 