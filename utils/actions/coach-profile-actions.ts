'use server'

import { createAuthClient, getUserUlidAndRole } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { PROFILE_STATUS, type ProfileStatus } from "@/utils/types/coach"
import { calculateProfileCompletion, PUBLICATION_THRESHOLD } from "@/utils/actions/calculateProfileCompletion"
import { auth } from "@clerk/nextjs/server"
import { ProfessionalRecognition } from "@/utils/types/recognition"
import { generateUlid, isValidUlid } from "@/utils/ulid"

export interface CoachProfileFormData {
  coachSkills: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  calendlyUrl?: string;
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
  calendlyUrl: string;
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

export const fetchCoachProfile = withServerAction<CoachProfileResponse, void>(
  async (_, { userUlid }) => {
    try {
      console.log("[FETCH_COACH_PROFILE_START]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient();

      // Fetch user data including capabilities and profile info
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          capabilities,
          firstName,
          lastName,
          bio,
          profileImageUrl,
          realEstateDomains
        `)
        .eq("ulid", userUlid)
        .single();

      if (userError) {
        console.error("[FETCH_COACH_PROFILE_USER_ERROR]", {
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

      if (!userData?.capabilities?.includes("COACH")) {
        console.error("[FETCH_COACH_PROFILE_UNAUTHORIZED]", {
          userUlid,
          capabilities: userData?.capabilities,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "User does not have coach capability",
            details: null
          }
        };
      }

      // First try to create profile if it doesn't exist
      const { data: ensuredProfile, error: ensureError } = await createCoachProfileIfNeeded(userUlid);
      
      if (ensureError) {
        console.error("[ENSURE_COACH_PROFILE_ERROR]", {
          userUlid,
          error: ensureError,
          timestamp: new Date().toISOString()
        });
        // Don't return error here, continue to try fetching existing profile
      }

      // Fetch coach profile with professional recognitions
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          *,
          ProfessionalRecognition (
            ulid,
            title,
            type,
            issueDate,
            issuer,
            description,
            isVisible,
            industryType,
            status,
            verificationUrl,
            certificateUrl,
            expiryDate
          )
        `)
        .eq("userUlid", userUlid)
        .maybeSingle();

      if (coachError) {
        console.error("[FETCH_COACH_PROFILE_ERROR]", {
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

      const profileData = {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        bio: userData?.bio,
        profileImageUrl: userData?.profileImageUrl,
        coachingSpecialties: coachProfile?.coachSkills || [],
        hourlyRate: coachProfile?.hourlyRate || null,
        yearsCoaching: coachProfile?.yearsCoaching || null,
        calendlyUrl: coachProfile?.calendlyUrl || null,
        eventTypeUrl: coachProfile?.eventTypeUrl || null,
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
        calendlyUrl: coachProfile?.calendlyUrl || "",
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
        calendlyUrl: formData.calendlyUrl,
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

      console.log("[UPDATE_COACH_PROFILE_DATA]", {
        userUlid,
        coachProfileData,
        timestamp: new Date().toISOString()
      });

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
              coachSkills,
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
          coachingSpecialties: coachProfile?.coachSkills || [],
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

export async function saveCoachSkills({
  skills
}: {
  skills: string[]
}) {
  'use server'

  try {
    const { userId } = await auth();
    if (!userId) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const supabase = await createAuthClient();
    const { userUlid } = await getUserUlidAndRole(userId);

    // Get the existing profile
    const { data: profile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('ulid')
      .eq('userUlid', userUlid)
      .single();

    if (profileError) {
      console.error('[SAVE_COACH_SKILLS_ERROR]', {
        error: profileError,
        userId,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Coach profile not found' } };
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
        userId,
        userUlid,
        profileUlid: profile.ulid,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to update skills' } };
    }

    revalidatePath('/dashboard/coach/profile');
    return { data: { skills }, error: null };
  } catch (error) {
    console.error('[SAVE_COACH_SKILLS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return { data: null, error: { message: 'Failed to save skills' } };
  }
} 