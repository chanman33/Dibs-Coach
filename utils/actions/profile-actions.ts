'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import type { MarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ServerActionContext } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { calculateProfileCompletion } from '@/utils/actions/calculateProfileCompletion'

export interface GeneralFormData {
  displayName: string
  bio: string | null
  totalYearsRE: number
  primaryMarket: string
}

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

export const fetchUserProfile = withServerAction<GeneralFormData, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          displayName,
          bio,
          totalYearsRE,
          primaryMarket
        `)
        .eq("ulid", userUlid)
        .maybeSingle()

      if (userError) {
        console.error("[USER_FETCH_ERROR]", { userUlid, error: userError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: userError
          }
        }
      }

      // Return values with proper defaults
      const responseData = {
        displayName: userData?.displayName || "",
        bio: userData?.bio || null,
        totalYearsRE: userData?.totalYearsRE ?? 0,
        primaryMarket: userData?.primaryMarket || ""
      };

      return {
        data: responseData,
        error: null
      }
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const updateUserProfile = withServerAction<GeneralFormData, GeneralFormData>(
  async (data, { userUlid }) => {
    try {
      // Log the incoming update data
      console.log("[USER_PROFILE_UPDATE_START]", {
        userUlid,
        updateData: data,
        totalYearsRE: data.totalYearsRE,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()

      // Update user data
      const { error: userError } = await supabase
        .from("User")
        .update({
          displayName: data.displayName,
          bio: data.bio,
          totalYearsRE: data.totalYearsRE,
          primaryMarket: data.primaryMarket,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)

      if (userError) {
        console.error("[USER_UPDATE_ERROR]", { userUlid, error: userError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user data',
            details: userError
          }
        }
      }

      // Log successful update
      console.log("[USER_PROFILE_UPDATE_SUCCESS]", {
        userUlid,
        updatedData: data,
        totalYearsRE: data.totalYearsRE,
        timestamp: new Date().toISOString()
      });

      return {
        data: {
          displayName: data.displayName,
          bio: data.bio,
          totalYearsRE: data.totalYearsRE,
          primaryMarket: data.primaryMarket
        },
        error: null
      }
    } catch (error) {
      console.error("[PROFILE_UPDATE_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const fetchCoachProfile = withServerAction<any, void>(
  async (_, { userUlid }) => {
    try {
      console.log('[FETCH_COACH_PROFILE] Starting fetch for user:', {
        userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()
      
      // First fetch the user data to get industry specialties
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          firstName,
          lastName,
          bio,
          profileImageUrl,
          industrySpecialties,
          capabilities
        `)
        .eq("ulid", userUlid)
        .maybeSingle();
        
      if (userError) {
        console.error("[DB_ERROR] Failed to fetch user data:", { 
          error: userError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: userError
          }
        };
      }

      console.log('[USER_DATA_FETCHED]', {
        hasData: !!userData,
        capabilities: userData?.capabilities,
        hasSpecialties: !!userData?.industrySpecialties?.length,
        timestamp: new Date().toISOString()
      });

      // Check if user has COACH capability
      if (!userData?.capabilities?.includes('COACH')) {
        console.log('[UNAUTHORIZED_COACH] User lacks COACH capability:', {
          userUlid,
          capabilities: userData?.capabilities,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User is not authorized as a coach',
            details: null
          }
        };
      }
      
      // Then fetch the coach profile data - only select columns we know exist
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          ulid,
          yearsCoaching,
          hourlyRate,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          calendlyUrl,
          eventTypeUrl,
          profileStatus
        `)
        .eq("userUlid", userUlid)
        .maybeSingle();

      // Handle case where profile doesn't exist yet (not an error)
      if (coachError && coachError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("[DB_ERROR] Failed to fetch coach profile:", { 
          error: coachError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: coachError
          }
        };
      }

      console.log('[COACH_PROFILE_FETCHED]', {
        hasData: !!coachProfile,
        profileStatus: coachProfile?.profileStatus || 'DRAFT',
        timestamp: new Date().toISOString()
      });

      // Prepare profile data for completion calculation
      // Use empty/default values if profile doesn't exist yet
      const profileData = {
        firstName: userData?.firstName || null,
        lastName: userData?.lastName || null,
        bio: userData?.bio || null,
        profileImageUrl: userData?.profileImageUrl || null,
        coachingSpecialties: userData?.industrySpecialties || [], // Use industrySpecialties instead of specialties
        hourlyRate: coachProfile?.hourlyRate || null,
        yearsCoaching: coachProfile?.yearsCoaching || null,
        calendlyUrl: coachProfile?.calendlyUrl || null,
        eventTypeUrl: coachProfile?.eventTypeUrl || null,
      };

      console.log('[PROFILE_DATA_PREPARED]', {
        profileData,
        timestamp: new Date().toISOString()
      });
      
      const { percentage, missingFields, missingRequiredFields, optionalMissingFields, canPublish, validationMessages } = calculateProfileCompletion(profileData);

      const response = {
        data: {
          ...profileData,
          domainSpecialties: userData?.industrySpecialties || [],
          defaultDuration: coachProfile?.defaultDuration || 60,
          minimumDuration: coachProfile?.minimumDuration || 30,
          maximumDuration: coachProfile?.maximumDuration || 120,
          allowCustomDuration: coachProfile?.allowCustomDuration || false,
          profileStatus: coachProfile?.profileStatus || "DRAFT",
          completionPercentage: percentage,
          canPublish,
          missingFields,
          missingRequiredFields,
          optionalMissingFields,
          validationMessages
        },
        error: null
      };

      console.log('[PROFILE_RESPONSE_PREPARED]', {
        completionPercentage: percentage,
        canPublish,
        missingFieldsCount: missingFields.length,
        profileStatus: response.data.profileStatus,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error("[INTERNAL_ERROR] Unexpected error in fetchCoachProfile:", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      // Return a valid response structure for new users
      return {
        data: {
          firstName: null,
          lastName: null,
          bio: null,
          profileImageUrl: null,
          coachingSpecialties: [],
          yearsCoaching: null,
          hourlyRate: null,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 120,
          allowCustomDuration: false,
          calendlyUrl: null,
          eventTypeUrl: null,
          domainSpecialties: [],
          profileStatus: "DRAFT",
          completionPercentage: 0,
          canPublish: false,
          missingFields: [
            'firstName',
            'lastName',
            'bio',
            'profileImageUrl',
            'coachingSpecialties',
            'hourlyRate'
          ]
        },
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const updateCoachProfile = withServerAction<{ success: boolean }, any>(
  async (formData, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { error: updateError } = await supabase
        .from("CoachProfile")
        .update({
          ...formData,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)

      if (updateError) {
        console.error("[COACH_PROFILE_UPDATE_ERROR]", { userUlid, error: updateError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update coach profile',
            details: updateError
          }
        }
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error("[COACH_PROFILE_UPDATE_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

/**
 * Fetches marketing information for the current user's realtor profile
 */
export async function fetchMarketingInfo() {
  try {
    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get supabase client
    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", session.userId)
      .single()

    if (userError || !userData) {
      console.error("[MARKETING_FETCH_ERROR] User not found:", userError)
      return { success: false, error: "User not found" }
    }

    // Get marketing information from realtor profile
    const { data: marketingData, error: marketingError } = await supabase
      .from("RealtorProfile")
      .select(`
        slogan,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        marketingAreas,
        testimonials
      `)
      .eq("userDbId", userData.id)
      .single()

    if (marketingError) {
      console.error("[MARKETING_FETCH_ERROR]", marketingError)
      return { success: false, error: "Failed to fetch marketing information" }
    }

    return { 
      success: true, 
      data: {
        ...marketingData,
        marketingAreas: Array.isArray(marketingData.marketingAreas) 
          ? marketingData.marketingAreas.join(", ")
          : marketingData.marketingAreas || "",
        testimonials: marketingData.testimonials || []
      } as MarketingInfo
    }
  } catch (error) {
    console.error("[MARKETING_FETCH_ERROR]", error)
    return { success: false, error: "Failed to fetch marketing information" }
  }
}

// Fetch user's database ID
export async function fetchUserDbId() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const supabase = await createAuthClient()
    const { data: user, error } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (error) {
      console.error('[FETCH_USER_ID_ERROR]', error)
      throw error
    }

    return user?.ulid || null
  } catch (error) {
    console.error('[FETCH_USER_ID_ERROR]', error)
    throw error
  }
}

export interface SpecialtiesData {
  specialties: string[];
}

export interface SpecialtiesResponse {
  activeDomains: string[];
}

export const saveCoachSpecialties = withServerAction<SpecialtiesResponse, SpecialtiesData>(
  async (data, { userUlid }) => {
    try {
      // Log that the function was called
      console.log("[SAVE_SPECIALTIES_FUNCTION_CALLED]", {
        userUlid,
        specialties: data.specialties,
        timestamp: new Date().toISOString()
      });
      
      const supabase = await createAuthClient();
      
      // First, check if the user exists and get current values
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("industrySpecialties")
        .eq("ulid", userUlid)
        .single();
        
      if (userError) {
        console.error("[SPECIALTIES_ERROR] User not found:", { 
          userUlid, 
          error: userError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: userError
          }
        };
      }
      
      console.log("[SAVE_SPECIALTIES_CURRENT_VALUES]", {
        userUlid,
        currentIndustrySpecialties: userData.industrySpecialties,
        timestamp: new Date().toISOString()
      });
      
      // Ensure we're passing arrays, not null values
      const specialtiesToSave = Array.isArray(data.specialties) ? data.specialties : [];
      
      console.log("[SAVE_SPECIALTIES_PREPARING_UPDATE]", {
        userUlid,
        specialtiesToSave,
        timestamp: new Date().toISOString()
      });
      
      // Update only industrySpecialties
      const { data: updateResult, error: updateError } = await supabase
        .from("User")
        .update({
          industrySpecialties: specialtiesToSave,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)
        .select("industrySpecialties");

      // Log the update result
      console.log("[SAVE_SPECIALTIES_UPDATE_RESULT]", {
        userUlid,
        success: !updateError,
        error: updateError,
        updatedData: updateResult,
        timestamp: new Date().toISOString()
      });

      if (updateError) {
        console.error("[SPECIALTIES_ERROR] Failed to update user specialties:", { 
          userUlid, 
          error: updateError,
          specialties: specialtiesToSave,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update user specialties',
            details: updateError
          }
        };
      }

      // Revalidate the profile page
      revalidatePath('/dashboard/coach/profile');
      
      // Get the updated user data
      const updatedSpecialties = updateResult && updateResult.length > 0 
        ? updateResult[0].industrySpecialties 
        : specialtiesToSave;
      
      console.log("[SAVE_SPECIALTIES_SUCCESS]", {
        userUlid,
        specialties: updatedSpecialties,
        timestamp: new Date().toISOString()
      });

      return {
        data: {
          activeDomains: updatedSpecialties
        },
        error: null
      };
    } catch (error) {
      console.error("[SPECIALTIES_ERROR] Unexpected error:", { 
        userUlid, 
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

export interface UserCapabilitiesResponse {
  capabilities: string[];
  domainSpecialties?: string[];
  activeDomains?: string[];
}

export const fetchUserCapabilities = withServerAction<UserCapabilitiesResponse, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient();
      
      // Get user capabilities
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          capabilities,
          industrySpecialties
        `)
        .eq("ulid", userUlid)
        .single();

      if (userError) {
        console.error("[CAPABILITIES_FETCH_ERROR]", { userUlid, error: userError });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user capabilities',
            details: userError
          }
        };
      }

      // Use the industrySpecialties as both domain specialties and active domains
      const domainSpecialties = userData.industrySpecialties || [];

      return {
        data: {
          capabilities: userData.capabilities || [],
          domainSpecialties,
          activeDomains: domainSpecialties
        },
        error: null
      };
    } catch (error) {
      console.error("[CAPABILITIES_FETCH_ERROR]", error);
      return {
        data: {
          capabilities: [],
          domainSpecialties: [],
          activeDomains: []
        },
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

// Direct debug function that bypasses withServerAction
export async function debugDirectSpecialtiesUpdate(userUlid: string, specialties: string[]) {
  try {
    console.log("[DEBUG_DIRECT_UPDATE_START]", {
      userUlid,
      specialties,
      timestamp: new Date().toISOString()
    });
    
    const supabase = await createAuthClient();
    
    // First, check if the user exists
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("ulid", userUlid)
      .single();
      
    if (userError) {
      console.error("[DEBUG_DIRECT_UPDATE_USER_ERROR]", {
        userUlid,
        error: userError,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        error: userError
      };
    }
    
    console.log("[DEBUG_DIRECT_UPDATE_USER_FOUND]", {
      userUlid,
      userData,
      timestamp: new Date().toISOString()
    });
    
    // Try a direct update
    const { data: updateData, error: updateError } = await supabase
      .from("User")
      .update({
        industrySpecialties: specialties,
        confirmedSpecialties: specialties,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", userUlid);
      
    console.log("[DEBUG_DIRECT_UPDATE_RESULT]", {
      userUlid,
      success: !updateError,
      error: updateError,
      timestamp: new Date().toISOString()
    });
    
    if (updateError) {
      return {
        success: false,
        error: updateError
      };
    }
    
    return {
      success: true,
      data: specialties
    };
  } catch (error) {
    console.error("[DEBUG_DIRECT_UPDATE_ERROR]", {
      userUlid,
      error,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error
    };
  }
}

/**
 * Fetches an industry-specific profile with graceful error handling
 * @param profileType The type of profile to fetch (e.g., "RealtorProfile", "MortgageProfile")
 * @param userUlid The user's ULID
 * @returns The profile data or null if it doesn't exist yet
 */
export const fetchIndustryProfile = withServerAction<any, { profileType: string }>(
  async ({ profileType }, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      // Fetch the profile data
      const { data, error } = await supabase
        .from(profileType)
        .select("*")
        .eq("userUlid", userUlid)
        .maybeSingle() // Use maybeSingle instead of single to handle missing profiles gracefully
      
      if (error && error.code !== 'PGRST116') {
        // Log the error only if it's not the "no rows returned" error
        console.error(`[FETCH_${profileType.toUpperCase()}_ERROR]`, { 
          userUlid, 
          error,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: `Failed to fetch ${profileType}`,
            details: error
          }
        };
      }
      
      // Return the data (which may be null if the profile doesn't exist)
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`[FETCH_${profileType.toUpperCase()}_ERROR]`, {
        userUlid,
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

// Convenience functions for specific profile types
export const fetchMortgageProfile = withServerAction<any, void>(
  async (_, { userUlid }) => {
    const { fetchIndustryProfile } = await import('@/utils/actions/profile-actions');
    return fetchIndustryProfile({ profileType: "MortgageProfile" });
  }
);

export const fetchInsuranceProfile = withServerAction<any, void>(
  async (_, { userUlid }) => {
    const { fetchIndustryProfile } = await import('@/utils/actions/profile-actions');
    return fetchIndustryProfile({ profileType: "InsuranceProfile" });
  }
);

export const fetchPropertyManagerProfile = withServerAction<any, void>(
  async (_, { userUlid }) => {
    const { fetchIndustryProfile } = await import('@/utils/actions/profile-actions');
    return fetchIndustryProfile({ profileType: "PropertyManagerProfile" });
  }
);

/**
 * Updates an industry-specific profile with graceful error handling
 * @param profileType The type of profile to update (e.g., "RealtorProfile", "MortgageProfile")
 * @param profileData The profile data to update
 * @param userUlid The user's ULID
 * @returns Success status
 */
export const updateIndustryProfile = withServerAction<{ success: boolean }, { profileType: string, profileData: any }>(
  async ({ profileType, profileData }, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      // Check if the profile exists
      const { data: existingProfile } = await supabase
        .from(profileType)
        .select("ulid")
        .eq("userUlid", userUlid)
        .maybeSingle()
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from(profileType)
          .update({
            ...profileData,
            updatedAt: new Date().toISOString()
          })
          .eq("userUlid", userUlid)
      } else {
        // Create new profile
        result = await supabase
          .from(profileType)
          .insert({
            ...profileData,
            userUlid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
      }
      
      if (result.error) {
        console.error(`[UPDATE_${profileType.toUpperCase()}_ERROR]`, { 
          userUlid, 
          error: result.error,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: `Failed to update ${profileType}`,
            details: result.error
          }
        };
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error(`[UPDATE_${profileType.toUpperCase()}_ERROR]`, {
        userUlid,
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

// Convenience functions for specific profile types
export const updateMortgageProfile = withServerAction<{ success: boolean }, any>(
  async (profileData, { userUlid }) => {
    const { updateIndustryProfile } = await import('@/utils/actions/profile-actions');
    return updateIndustryProfile({ profileType: "MortgageProfile", profileData });
  }
);

export const updateInsuranceProfile = withServerAction<{ success: boolean }, any>(
  async (profileData, { userUlid }) => {
    const { updateIndustryProfile } = await import('@/utils/actions/profile-actions');
    return updateIndustryProfile({ profileType: "InsuranceProfile", profileData });
  }
);

export const updatePropertyManagerProfile = withServerAction<{ success: boolean }, any>(
  async (profileData, { userUlid }) => {
    const { updateIndustryProfile } = await import('@/utils/actions/profile-actions');
    return updateIndustryProfile({ profileType: "PropertyManagerProfile", profileData });
  }
);

export const updateCommercialProfile = withServerAction<{ success: boolean }, any>(
  async (profileData, { userUlid }) => {
    const { updateIndustryProfile } = await import('@/utils/actions/profile-actions');
    return updateIndustryProfile({ profileType: "CommercialProfile", profileData });
  }
);

export const updatePrivateCreditProfile = withServerAction<{ success: boolean }, any>(
  async (profileData, { userUlid }) => {
    const { updateIndustryProfile } = await import('@/utils/actions/profile-actions');
    return updateIndustryProfile({ profileType: "PrivateCreditProfile", profileData });
  }
);

export interface LanguageUpdateData {
  languages: string[]
}

export const updateUserLanguages = withServerAction<{ success: boolean }, LanguageUpdateData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { error } = await supabase
        .from("User")
        .update({
          languages: data.languages,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)

      if (error) {
        console.error("[UPDATE_LANGUAGES_ERROR]", { userUlid, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user languages',
            details: error
          }
        }
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error("[UPDATE_LANGUAGES_ERROR]", error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update languages',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 