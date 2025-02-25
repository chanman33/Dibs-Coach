'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import type { MarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ServerActionContext } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"

export interface GeneralFormData {
  displayName: string
  bio: string | null
  yearsExperience: number
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

      // Get user data first
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          displayName,
          bio
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

      // Get realtor profile data
      const { data: profileData, error: profileError } = await supabase
        .from("RealtorProfile")
        .select(`
          yearsExperience,
          primaryMarket
        `)
        .eq("userUlid", userUlid)
        .maybeSingle()

      if (profileError) {
        console.error("[PROFILE_FETCH_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user profile',
            details: profileError
          }
        }
      }

      // Return default values if no data found
      return {
        data: {
          displayName: userData?.displayName || "",
          bio: userData?.bio || null,
          yearsExperience: profileData?.yearsExperience || 0,
          primaryMarket: profileData?.primaryMarket || ""
        },
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
      const supabase = await createAuthClient()

      // Update user data first
      const { error: userError } = await supabase
        .from("User")
        .update({
          displayName: data.displayName,
          bio: data.bio,
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

      // Update realtor profile
      const { error: profileError } = await supabase
        .from("RealtorProfile")
        .update({
          yearsExperience: data.yearsExperience,
          primaryMarket: data.primaryMarket,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)

      if (profileError) {
        console.error("[PROFILE_UPDATE_ERROR]", { userUlid, error: profileError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update realtor profile',
            details: profileError
          }
        }
      }

      return {
        data: {
          displayName: data.displayName,
          bio: data.bio,
          yearsExperience: data.yearsExperience,
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
      const supabase = await createAuthClient()
      
      // First fetch the user data to get industry specialties
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          industrySpecialties,
          confirmedSpecialties
        `)
        .eq("ulid", userUlid)
        .maybeSingle();
        
      if (userError) {
        console.error("[FETCH_USER_SPECIALTIES_ERROR]", { 
          userUlid, 
          error: userError,
          timestamp: new Date().toISOString()
        });
        
        // Return minimal data even if user fetch fails
        return {
          data: {
            domainSpecialties: [],
            confirmedSpecialties: [],
            specialties: []
          },
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: userError
          }
        };
      }
      
      // Then fetch the coach profile data
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          yearsCoaching,
          hourlyRate,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          calendlyUrl,
          eventTypeUrl
        `)
        .eq("userUlid", userUlid)
        .maybeSingle()

      if (coachError) {
        console.error("[COACH_PROFILE_ERROR]", { 
          userUlid, 
          error: coachError,
          timestamp: new Date().toISOString()
        });
        
        // Return user data even if coach profile fetch fails
        return {
          data: {
            domainSpecialties: userData?.industrySpecialties || [],
            confirmedSpecialties: userData?.confirmedSpecialties || [],
            specialties: [],
            yearsCoaching: 0,
            hourlyRate: 0,
            defaultDuration: 60,
            minimumDuration: 30,
            maximumDuration: 120,
            allowCustomDuration: false,
            calendlyUrl: "",
            eventTypeUrl: ""
          },
          error: null
        };
      }

      // Return combined data with defaults for missing values
      return {
        data: {
          domainSpecialties: userData?.industrySpecialties || [],
          confirmedSpecialties: userData?.confirmedSpecialties || [],
          specialties: [],
          yearsCoaching: coachProfile?.yearsCoaching || 0,
          hourlyRate: coachProfile?.hourlyRate || 0,
          defaultDuration: coachProfile?.defaultDuration || 60,
          minimumDuration: coachProfile?.minimumDuration || 30,
          maximumDuration: coachProfile?.maximumDuration || 120,
          allowCustomDuration: coachProfile?.allowCustomDuration || false,
          calendlyUrl: coachProfile?.calendlyUrl || "",
          eventTypeUrl: coachProfile?.eventTypeUrl || ""
        },
        error: null
      };
    } catch (error) {
      console.error("[COACH_PROFILE_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: {
          // Default values in case of error
          yearsCoaching: 0,
          hourlyRate: 0,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 120,
          allowCustomDuration: false,
          calendlyUrl: "",
          eventTypeUrl: "",
          professionalRecognitions: [],
          domainSpecialties: [],
          confirmedSpecialties: [],
          specialties: []
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
        .select("industrySpecialties, confirmedSpecialties")
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
        currentConfirmedSpecialties: userData.confirmedSpecialties,
        timestamp: new Date().toISOString()
      });
      
      // Ensure we're passing arrays, not null values
      const specialtiesToSave = Array.isArray(data.specialties) ? data.specialties : [];
      
      console.log("[SAVE_SPECIALTIES_PREPARING_UPDATE]", {
        userUlid,
        specialtiesToSave,
        timestamp: new Date().toISOString()
      });
      
      // Simple direct update approach
      const { data: updateResult, error: updateError } = await supabase
        .from("User")
        .update({
          industrySpecialties: specialtiesToSave,
          confirmedSpecialties: specialtiesToSave,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)
        .select("industrySpecialties, confirmedSpecialties");

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
        
        // Try a simpler approach with just one field
        console.log("[SAVE_SPECIALTIES_TRYING_SIMPLER_UPDATE]", {
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        const { data: simpleUpdateResult, error: simpleUpdateError } = await supabase
          .from("User")
          .update({
            industrySpecialties: specialtiesToSave
          })
          .eq("ulid", userUlid)
          .select("industrySpecialties");
          
        console.log("[SAVE_SPECIALTIES_SIMPLER_UPDATE_RESULT]", {
          userUlid,
          success: !simpleUpdateError,
          error: simpleUpdateError,
          updatedData: simpleUpdateResult,
          timestamp: new Date().toISOString()
        });
        
        if (simpleUpdateError) {
          return {
            data: null,
            error: {
              code: 'UPDATE_ERROR',
              message: 'Failed to update user specialties',
              details: updateError
            }
          };
        }
        
        // If the simpler update succeeded, use those values
        if (simpleUpdateResult && simpleUpdateResult.length > 0) {
          const updatedUser = simpleUpdateResult[0];
          
          // Revalidate the profile page
          revalidatePath('/dashboard/coach/profile');
          
          console.log("[SAVE_SPECIALTIES_PARTIAL_SUCCESS]", {
            userUlid,
            specialties: updatedUser.industrySpecialties,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: {
              activeDomains: updatedUser.industrySpecialties || []
            },
            error: null
          };
        }
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
          industrySpecialties,
          confirmedSpecialties
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

      // Use the industrySpecialties and confirmedSpecialties directly from the User model
      const domainSpecialties = userData.industrySpecialties || [];
      const activeDomains = userData.confirmedSpecialties || [];

      console.log("[USER_CAPABILITIES]", { 
        capabilities: userData.capabilities,
        domainSpecialties,
        activeDomains
      });

      return {
        data: {
          capabilities: userData.capabilities || [],
          domainSpecialties,
          activeDomains
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