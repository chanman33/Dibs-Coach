'use server'

import { createAuthClient, getUserUlidAndRole } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { PROFILE_STATUS, type ProfileStatus } from "@/utils/types/coach"
import { calculateProfileCompletion, PUBLICATION_THRESHOLD } from "@/utils/actions/calculateProfileCompletion"
import { auth } from "@clerk/nextjs/server"
import { ProfessionalRecognition } from "@/utils/types/recognition"

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
      const supabase = await createAuthClient();

      console.log("[FETCH_COACH_PROFILE_START]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

      // Fetch coach profile with professional recognitions
      let { data: coachProfile, error: coachError } = await supabase
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

      // If no profile exists, try to create one
      if (coachError?.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await createCoachProfileIfNeeded(userUlid);
        if (createError) {
          console.error("[COACH_PROFILE_CREATE_ERROR]", {
            userUlid,
            error: createError,
            timestamp: new Date().toISOString()
          });
          return {
            data: null,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create coach profile",
              details: createError
            }
          };
        }
        if (newProfile) {
          coachProfile = newProfile;
          coachError = null;
        }
      } else if (coachError) {
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
          realEstateDomains
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

      console.log("[UPDATE_COACH_USER_FETCHED]", {
        userUlid,
        userData,
        timestamp: new Date().toISOString()
      });

      const realtorProfileUlid = userData.realtorProfile[0].ulid;

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
      
      // Check existing profile status
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('CoachProfile')
        .select('profileStatus')
        .eq('userUlid', userUlid)
        .maybeSingle();

      if (existingProfileError) {
        console.error('[UPDATE_COACH_EXISTING_PROFILE_ERROR]', {
          userUlid,
          error: existingProfileError,
          timestamp: new Date().toISOString()
        });
      }

      console.log("[UPDATE_COACH_PROFILE_STATUS_CHECK]", {
        userUlid,
        existingProfile,
        canPublish,
        timestamp: new Date().toISOString()
      });

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

      const { error: coachError } = await supabase
        .from('CoachProfile')
        .upsert(coachProfileData, {
          onConflict: 'userUlid'
        })
        .select()

      if (coachError) {
        console.error('[UPDATE_COACH_PROFILE_ERROR]', {
          userUlid,
          error: coachError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: { error: coachError }
          }
        }
      }

      console.log("[UPDATE_COACH_PROFILE_SUCCESS]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

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

    // Create or update the coach profile with the new skills
    const { data, error } = await supabase
      .from('CoachProfile')
      .upsert({
        userUlid,
        coachSkills: skills,
        yearsCoaching: 0,
        hourlyRate: 0,
        defaultDuration: 60,
        minimumDuration: 30,
        maximumDuration: 120,
        allowCustomDuration: false,
        profileStatus: 'DRAFT',
        completionPercentage: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, {
        onConflict: 'userUlid',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[SAVE_COACH_SKILLS_ERROR]', {
        error,
        userId,
        skills,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: { message: 'Failed to save skills' } };
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

    // Create new coach profile with default values
    const { data: newProfile, error: createError } = await supabase
      .from('CoachProfile')
      .insert({
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