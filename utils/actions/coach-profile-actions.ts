'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { PROFILE_STATUS, type ProfileStatus, ALLOWED_STATUS_TRANSITIONS, PROFILE_REQUIREMENTS, canTransitionTo, RealEstateDomain, profileSlugSchema } from "@/utils/types/coach"
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
  coachRealEstateDomains?: string[];
  coachPrimaryDomain?: string | null;
  certifications?: string[];
  professionalRecognitions?: ProfessionalRecognition[];
  skipRevalidation?: boolean;
  displayName?: string;
  slogan?: string;
  profileSlug?: string;
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
  slogan: string;
  profileSlug: string | null;
  lastSlugUpdateAt: string | null;
  certifications: string[];
  professionalRecognitions: ProfessionalRecognition[];
  realEstateDomains: string[];
  coachRealEstateDomains: string[];
  coachPrimaryDomain: string | null;
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
          ulid,
          userUlid,
          yearsCoaching,
          coachSkills,
          hourlyRate,
          isActive,
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration,
          totalSessions,
          averageRating,
          profileStatus,
          completionPercentage,
          coachRealEstateDomains,
          coachPrimaryDomain,
          eventTypeUrl,
          slogan,
          profileSlug,
          lastSlugUpdateAt,
          createdAt,
          updatedAt
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

      // Safely cast coachProfile to avoid type errors
      const safeCoachProfile = coachError ? null : (coachProfile as any);

      // Fetch professional recognitions directly by userUlid
      const { data: recognitionsData, error: recognitionsError } = await supabase
        .from('ProfessionalRecognition')
        .select('*')
        .eq('userUlid', userUlid);

      if (recognitionsError) {
        console.error('[FETCH_RECOGNITIONS_ERROR]', recognitionsError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch professional recognitions',
            details: recognitionsError
          }
        };
      }

      // Log the raw query results for debugging
      console.log("[FETCH_RECOGNITIONS_QUERY_RESULT]", {
        userUlid,
        count: recognitionsData?.length || 0,
        data: recognitionsData,
        timestamp: new Date().toISOString()
      });

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
      console.log("[FETCH_COACH_PROFILE_RECOGNITIONS]", {
        rawRecognitions: recognitionsData || [],
        timestamp: new Date().toISOString()
      });

      const activeRecognitions = ((recognitionsData || []) as any[])
        .filter(rec => {
          // Check if the recognition should be visible
          // The isVisible property is now a direct field
          const isVisible = rec.isVisible !== false; // Default to true if not specified
          const status = rec.status || 'ACTIVE'; // Default to ACTIVE if no status
          
          console.log("[RECOGNITION_FILTER]", {
            ulid: rec.ulid,
            title: rec.title,
            isVisible,
            industryType: rec.industryType,
            status,
            include: (status === 'ACTIVE' || !rec.status) && isVisible,
            timestamp: new Date().toISOString()
          });
          
          // Include recognitions that are active AND visible
          return (status === 'ACTIVE' || !rec.status) && isVisible;
        })
        .map(rec => {
          // Convert string dates to Date objects
          const issueDate = rec.issueDate ? new Date(rec.issueDate) : new Date();
          const expiryDate = rec.expiryDate ? new Date(rec.expiryDate) : null;
          
          // Ensure all required fields are present
          return {
            ulid: rec.ulid,
            userUlid: rec.userUlid,
            coachUlid: rec.coachUlid,
            title: rec.title || '',
            type: rec.type as "AWARD" | "ACHIEVEMENT",
            issuer: rec.issuer || '',
            issueDate,
            expiryDate,
            description: rec.description || null,
            verificationUrl: rec.verificationUrl || null,
            isVisible: rec.isVisible !== false,
            industryType: rec.industryType || null,
            metadata: rec.metadata || {}
          } satisfies ProfessionalRecognition;
        });

      console.log("[FETCH_COACH_PROFILE_ACTIVE_RECOGNITIONS]", {
        activeCount: activeRecognitions.length,
        activeRecognitions: JSON.stringify(activeRecognitions, (key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }, 2),
        timestamp: new Date().toISOString()
      });

      // Log the coach profile data for debugging
      console.log("[PROFILE_FIELD_CHECK]", {
        slogan: safeCoachProfile?.slogan,
        coachSkills: safeCoachProfile?.coachSkills,
        coachRealEstateDomains: safeCoachProfile?.coachRealEstateDomains,
        coachPrimaryDomain: safeCoachProfile?.coachPrimaryDomain,
        profileSlug: safeCoachProfile?.profileSlug,
        timestamp: new Date().toISOString()
      });

      const profileData = {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        bio: userData?.bio,
        profileImageUrl: userData?.profileImageUrl,
        coachingSpecialties: safeCoachProfile?.coachSkills || [],
        hourlyRate: safeCoachProfile?.hourlyRate || null,
        yearsCoaching: safeCoachProfile?.yearsCoaching || null,
        eventTypeUrl: safeCoachProfile?.eventTypeUrl || null,
        hasAvailabilitySchedule: availabilitySchedules && availabilitySchedules.length > 0,
        coachRealEstateDomains: safeCoachProfile?.coachRealEstateDomains || [],
        coachPrimaryDomain: safeCoachProfile?.coachPrimaryDomain || null,
        profileSlug: safeCoachProfile?.profileSlug || null
      };
      
      const { percentage, missingFields, canPublish } = calculateProfileCompletion(profileData);

      const responseData: CoachProfileResponse = {
        coachSkills: safeCoachProfile?.coachSkills || [],
        yearsCoaching: safeCoachProfile?.yearsCoaching || 0,
        hourlyRate: Number(safeCoachProfile?.hourlyRate) || 0,
        defaultDuration: safeCoachProfile?.defaultDuration || 60,
        minimumDuration: safeCoachProfile?.minimumDuration || 30,
        maximumDuration: safeCoachProfile?.maximumDuration || 120,
        allowCustomDuration: safeCoachProfile?.allowCustomDuration || false,
        eventTypeUrl: safeCoachProfile?.eventTypeUrl || "",
        slogan: safeCoachProfile?.slogan || "",
        profileSlug: safeCoachProfile?.profileSlug || null,
        lastSlugUpdateAt: safeCoachProfile?.lastSlugUpdateAt || null,
        certifications: [],
        professionalRecognitions: activeRecognitions,
        realEstateDomains: userData?.realEstateDomains || [],
        coachRealEstateDomains: safeCoachProfile?.coachRealEstateDomains || [],
        coachPrimaryDomain: safeCoachProfile?.coachPrimaryDomain || null,
        capabilities: [],
        _rawCoachProfile: safeCoachProfile || null,
        _rawRealtorProfile: null,
        _rawMortgageProfile: null,
        _rawInsuranceProfile: null,
        _rawPropertyManagerProfile: null,
        profileStatus: safeCoachProfile?.profileStatus || "DRAFT",
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
  slogan?: string;
  profileSlug?: string | null;
  coachPrimaryDomain?: string | null;
  coachSkills?: string[];
  coachRealEstateDomains?: string[];
}

export const updateCoachProfile = withServerAction<UpdateCoachProfileResponse, CoachProfileFormData>(
  async (formData, { userUlid }) => {
    try {
      // Ensure numeric values are properly typed before any operations
      // This is crucial as JavaScript might convert these values to strings during JSON serialization
      const yearsCoaching = Number(formData.yearsCoaching); 
      const hourlyRate = Number(formData.hourlyRate);
      
      console.log("[UPDATE_COACH_PROFILE_START]", {
        formData: {
          coachSkills: formData.coachSkills,
          yearsCoaching: {
            originalValue: formData.yearsCoaching,
            originalType: typeof formData.yearsCoaching,
            convertedValue: yearsCoaching,
            convertedType: typeof yearsCoaching
          },
          hourlyRate: {
            originalValue: formData.hourlyRate,
            originalType: typeof formData.hourlyRate,
            convertedValue: hourlyRate,
            convertedType: typeof hourlyRate
          },
          defaultDuration: formData.defaultDuration,
          minimumDuration: formData.minimumDuration,
          maximumDuration: formData.maximumDuration,
          allowCustomDuration: formData.allowCustomDuration,
          eventTypeUrl: formData.eventTypeUrl,
          slogan: formData.slogan,
          profileSlug: formData.profileSlug,
          coachRealEstateDomains: formData.coachRealEstateDomains,
          coachPrimaryDomain: formData.coachPrimaryDomain
        },
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient();

      // Get existing coach profile
      const { data: coachProfileData, error: profileError } = await supabase
        .from('CoachProfile')
        .select('*')
        .eq('userUlid', userUlid)
        .single();

      if (profileError) {
        console.error('[UPDATE_COACH_PROFILE_ERROR]', {
          error: profileError,
          userUlid,
          timestamp: new Date().toISOString()
        });

        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: { error: profileError }
          }
        };
      }

      // Handle profile slug update with rate limiting
      let profileSlug = formData.profileSlug;
      let lastSlugUpdateAt = (coachProfileData as any)?.lastSlugUpdateAt;
      
      if (profileSlug !== undefined && profileSlug !== (coachProfileData as any)?.profileSlug) {
        // Validate the slug format
        try {
          if (profileSlug) {
            profileSlugSchema.parse(profileSlug);
          }
        } catch (error) {
          console.error('[UPDATE_COACH_PROFILE_SLUG_VALIDATION_ERROR]', error);
          return {
            data: null,
            error: {
              code: 'INVALID_SLUG',
              message: 'Invalid profile URL format. URLs can only contain lowercase letters, numbers, and hyphens.'
            }
          };
        }
        
        // Check for rate limiting - allow updates once per 24 hours
        if (lastSlugUpdateAt) {
          const lastUpdate = new Date(lastSlugUpdateAt);
          const now = new Date();
          const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastUpdate < 24) {
            return {
              data: null,
              error: {
                code: 'RATE_LIMITED',
                message: 'You can only update your profile URL once every 24 hours. A consistent URL helps improve your visibility in search results and makes it easier for mentees to find and share your profile. Consider keeping it static for better traffic and brand recognition.'
              }
            };
          }
        }
        
        // Check if the slug is already taken
        if (profileSlug) {
          const { data: existingProfile, error: slugCheckError } = await supabase
            .from('CoachProfile')
            .select('ulid')
            .eq('profileSlug', profileSlug)
            .neq('userUlid', userUlid)
            .maybeSingle();
            
          if (slugCheckError) {
            console.error('[UPDATE_COACH_PROFILE_SLUG_CHECK_ERROR]', slugCheckError);
            return {
              data: null,
              error: {
                code: 'DATABASE_ERROR',
                message: 'Error checking profile URL availability.'
              }
            };
          }
          
          if (existingProfile) {
            return {
              data: null,
              error: {
                code: 'SLUG_TAKEN',
                message: 'This profile URL is already taken. Please choose another one.'
              }
            };
          }
          
          // If we get here, the slug is available
          console.log('[UPDATE_COACH_PROFILE_SLUG_AVAILABLE]', {
            profileSlug,
            timestamp: new Date().toISOString()
          });
        }
        
        // Update the lastSlugUpdateAt timestamp
        lastSlugUpdateAt = new Date().toISOString();
      }

      // Calculate profile completion percentage with properly typed numeric values
      const { percentage, canPublish, missingFields } = calculateProfileCompletion({
        ...coachProfileData,
        ...formData,
        yearsCoaching,
        hourlyRate
      });

      // Get the coach's primary domain
      const coachPrimaryDomain = formData.coachPrimaryDomain !== undefined 
        ? formData.coachPrimaryDomain 
        : coachProfileData?.coachPrimaryDomain || null;
      
      // Get the coach's domains
      const coachRealEstateDomains = formData.coachRealEstateDomains || coachProfileData?.coachRealEstateDomains || [];

      // Log pre-update state with detailed type information
      console.log('[UPDATE_COACH_PROFILE_PRE_UPDATE]', {
        yearsCoaching: {
          value: yearsCoaching,
          type: typeof yearsCoaching
        },
        hourlyRate: {
          value: hourlyRate,
          type: typeof hourlyRate
        },
        coachSkills: formData.coachSkills || [],
        timestamp: new Date().toISOString()
      });

      // Update the coach profile with explicitly typed numeric values
      const { data: updateResult, error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          coachSkills: formData.coachSkills || [],
          yearsCoaching: yearsCoaching,
          hourlyRate: hourlyRate,
          defaultDuration: formData.defaultDuration,
          minimumDuration: formData.minimumDuration,
          maximumDuration: formData.maximumDuration,
          allowCustomDuration: formData.allowCustomDuration,
          eventTypeUrl: formData.eventTypeUrl,
          slogan: formData.slogan,
          profileSlug: profileSlug,
          coachRealEstateDomains: coachRealEstateDomains as any,
          coachPrimaryDomain: coachPrimaryDomain as any,
          lastSlugUpdateAt: profileSlug !== (coachProfileData as any)?.profileSlug ? lastSlugUpdateAt : undefined,
          completionPercentage: percentage
        })
        .eq('userUlid', userUlid)
        .select();

      if (updateError) {
        console.error('[UPDATE_COACH_PROFILE_ERROR]', {
          error: updateError,
          userUlid,
          timestamp: new Date().toISOString()
        });

        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: { error: updateError }
          }
        };
      }

      // Log successful update with the result returned from the database
      console.log('[UPDATE_COACH_PROFILE_SUCCESS]', {
        submittedYearsCoaching: {
          value: yearsCoaching,
          type: typeof yearsCoaching
        },
        submittedHourlyRate: {
          value: hourlyRate,
          type: typeof hourlyRate
        },
        updatedData: updateResult?.[0] ? {
          yearsCoaching: {
            value: updateResult[0].yearsCoaching,
            type: typeof updateResult[0].yearsCoaching
          },
          hourlyRate: {
            value: updateResult[0].hourlyRate,
            type: typeof updateResult[0].hourlyRate
          }
        } : 'No updated data returned',
        coachSkills: formData.coachSkills || [],
        timestamp: new Date().toISOString()
      });

      // Revalidate the coach profile page
      if (!formData.skipRevalidation) {
        revalidatePath('/dashboard/coach/profile');
      }

      return {
        data: {
          success: true,
          completionPercentage: percentage,
          profileStatus: coachProfileData?.profileStatus || 'DRAFT',
          canPublish,
          missingFields,
          slogan: formData.slogan,
          profileSlug: profileSlug,
          coachPrimaryDomain,
          coachSkills: formData.coachSkills,
          coachRealEstateDomains,
          yearsCoaching,
          hourlyRate
        },
        error: null
      };
    } catch (error) {
      console.error('[UPDATE_COACH_PROFILE_ERROR]', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });

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
);

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
  coachRealEstateDomains: string[]
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
          coachRealEstateDomains,
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
        // Add detailed logging for debugging
        console.log('[PUBLISH_PROFILE_DEBUG]', {
          profileData: {
            completionPercentage: profile.completionPercentage,
            coachRealEstateDomains: profile.coachRealEstateDomains,
            hourlyRate: profile.hourlyRate
          },
          minimumRequirements: {
            MINIMUM_COMPLETION: PROFILE_REQUIREMENTS.MINIMUM_COMPLETION,
            MINIMUM_DOMAINS: PROFILE_REQUIREMENTS.MINIMUM_DOMAINS,
            REQUIRES_HOURLY_RATE: PROFILE_REQUIREMENTS.REQUIRES_HOURLY_RATE
          },
          timestamp: new Date().toISOString()
        });

        const requirements = {
          completionMet: profile.completionPercentage >= PROFILE_REQUIREMENTS.MINIMUM_COMPLETION,
          domainsMet: (profile.coachRealEstateDomains?.length || 0) >= PROFILE_REQUIREMENTS.MINIMUM_DOMAINS,
          rateMet: PROFILE_REQUIREMENTS.REQUIRES_HOURLY_RATE ? (profile.hourlyRate || 0) > 0 : true
        }

        // Log the results of each requirement check
        console.log('[PUBLISH_REQUIREMENT_CHECKS]', {
          completionMet: {
            result: requirements.completionMet,
            value: profile.completionPercentage,
            required: PROFILE_REQUIREMENTS.MINIMUM_COMPLETION
          },
          domainsMet: {
            result: requirements.domainsMet,
            value: profile.coachRealEstateDomains?.length || 0,
            required: PROFILE_REQUIREMENTS.MINIMUM_DOMAINS
          },
          rateMet: {
            result: requirements.rateMet,
            value: profile.hourlyRate || 0,
            required: PROFILE_REQUIREMENTS.REQUIRES_HOURLY_RATE ? 'Must be > 0' : 'Not required'
          },
          timestamp: new Date().toISOString()
        });

        const missingRequirements = Object.entries(requirements)
          .filter(([_, met]) => !met)
          .map(([req]) => req.replace(/Met$/, ''))

        if (missingRequirements.length > 0) {
          console.log('[PUBLISH_FAILED_REQUIREMENTS]', {
            missingRequirements,
            timestamp: new Date().toISOString()
          });
          
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
      .select('isCoach, capabilities, firstName, lastName, displayName')
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

    // Generate a default slug based on the user's name
    let defaultSlug = null;
    if (userData) {
      // Use displayName if available, otherwise use firstName + lastName
      const nameToUse = userData.displayName || 
        (userData.firstName && userData.lastName ? 
          `${userData.firstName} ${userData.lastName}` : 
          (userData.firstName || userData.lastName || 'coach'));
      
      // Convert to slug format: lowercase, replace spaces with hyphens, remove special chars
      defaultSlug = nameToUse
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
        .substring(0, 50);        // Limit length
      
      // Ensure slug is at least 3 characters
      if (defaultSlug.length < 3) {
        defaultSlug = `${defaultSlug}-coach`.substring(0, 50);
      }
      
      console.log('[CREATE_COACH_PROFILE_SLUG]', {
        nameToUse,
        defaultSlug,
        timestamp: new Date().toISOString()
      });
    }

    const currentTime = new Date().toISOString();

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
        coachRealEstateDomains: [],
        coachPrimaryDomain: null,
        profileStatus: 'DRAFT',
        completionPercentage: 0,
        isActive: true,
        totalSessions: 0,
        profileSlug: defaultSlug,
        lastSlugUpdateAt: currentTime,
        createdAt: currentTime,
        updatedAt: currentTime
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