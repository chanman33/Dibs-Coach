'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import type { MarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ServerActionContext } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { calculateProfileCompletion } from '@/utils/actions/calculateProfileCompletion'
import { getUserUlidAndRole } from "@/utils/auth"
import { User } from "@/utils/types/user"

export interface GeneralFormData {
  displayName: string
  bio: string | null
  totalYearsRE: number
  primaryMarket: string
  languages?: string[]
}

export interface CoachProfileFormData {
  realEstateDomains: string[];
  coachingSkills: string[];
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
      const supabase = await createAuthClient();

      const { data, error } = await supabase
        .from('User')
        .select(`
          displayName,
          bio,
          totalYearsRE,
          realEstateDomains,
          primaryMarket,
          languages,
          capabilities,
          coachProfile:CoachProfile (*)
        `)
        .eq('ulid', userUlid)
        .single();

      if (error) {
        console.error("[USER_FETCH_ERROR]", {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        });
        return {
          data: {
            displayName: "",
            bio: null,
            totalYearsRE: 0,
            realEstateDomains: [],
            primaryMarket: "",
            languages: [],
            capabilities: [],
            coachProfile: null
          },
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: error
          }
        };
      }

      return {
        data: {
          displayName: data.displayName || "",
          bio: data.bio || null,
          totalYearsRE: data.totalYearsRE || 0,
          realEstateDomains: data.realEstateDomains || [],
          primaryMarket: data.primaryMarket || "",
          languages: data.languages || [],
          capabilities: data.capabilities || [],
          coachProfile: data.coachProfile || null
        },
        error: null
      };
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: {
          displayName: "",
          bio: null,
          totalYearsRE: 0,
          realEstateDomains: [],
          primaryMarket: "",
          languages: [],
          capabilities: [],
          coachProfile: null
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

export const updateUserProfile = withServerAction<GeneralFormData, GeneralFormData>(
  async (data, { userUlid }) => {
    try {
      // Log the incoming update data
      console.log("[USER_PROFILE_UPDATE_START]", {
        userUlid,
        updateData: data,
        displayName: data.displayName,
        bio: data.bio,
        totalYearsRE: data.totalYearsRE,
        primaryMarket: data.primaryMarket,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()

      // First verify the user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("User")
        .select("ulid")
        .eq("ulid", userUlid)
        .single();

      if (fetchError || !existingUser) {
        console.error("[USER_FETCH_ERROR]", { userUlid, error: fetchError });
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: fetchError
          }
        };
      }

      // Update user data with explicit type checking
      const updateData = {
        displayName: data.displayName || null,
        bio: data.bio || null,
        totalYearsRE: typeof data.totalYearsRE === 'number' ? data.totalYearsRE : 0,
        primaryMarket: data.primaryMarket || null,
        updatedAt: new Date().toISOString()
      };

      const { data: updatedUser, error: userError } = await supabase
        .from("User")
        .update(updateData)
        .eq("ulid", userUlid)
        .select()
        .single();

      if (userError) {
        console.error("[USER_UPDATE_ERROR]", { 
          userUlid, 
          error: userError,
          updateData,
          timestamp: new Date().toISOString()
        });
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
        updatedUser,
        timestamp: new Date().toISOString()
      });

      // Return the updated data
      return {
        data: {
          displayName: updatedUser.displayName || "",
          bio: updatedUser.bio,
          totalYearsRE: updatedUser.totalYearsRE || 0,
          primaryMarket: updatedUser.primaryMarket || "",
          languages: updatedUser.languages || []
        },
        error: null
      }
    } catch (error) {
      console.error("[PROFILE_UPDATE_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
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

export interface UserCapabilitiesResponse {
  capabilities: string[];
  realEstateDomains?: string[];
  primaryRealEstateDomain: string | null;
}

export const fetchUserCapabilities = withServerAction<UserCapabilitiesResponse, void>(
  async (_, { userUlid }) => {
    try {
      console.log("[FETCH_USER_CAPABILITIES_START]", {
        userUlid,
        timestamp: new Date().toISOString(),
        source: 'server'
      });

      const supabase = await createAuthClient();

      // Get user capabilities
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          capabilities,
          realEstateDomains,
          primaryDomain
        `)
        .eq("ulid", userUlid)
        .single();

      if (userError) {
        console.error("[CAPABILITIES_FETCH_ERROR]", { 
          userUlid, 
          error: userError,
          timestamp: new Date().toISOString(),
          source: 'server'
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user capabilities',
            details: userError
          }
        };
      }

      // Log raw data from database
      console.log("[FETCH_USER_CAPABILITIES_RAW_DATA]", {
        userUlid,
        rawCapabilities: userData.capabilities,
        rawRealEstateDomains: userData.realEstateDomains,
        rawPrimaryDomain: userData.primaryDomain,
        timestamp: new Date().toISOString(),
        source: 'server'
      });

      // Use the realEstateDomains as both domain specialties and active domains
      const realEstateDomains = userData.realEstateDomains || [];

      // Log processed data before returning
      console.log("[FETCH_USER_CAPABILITIES_PROCESSED]", {
        userUlid,
        processedCapabilities: userData.capabilities || [],
        processedRealEstateDomains: realEstateDomains,
        processedPrimaryDomain: userData.primaryDomain,
        timestamp: new Date().toISOString(),
        source: 'server'
      });

      return {
        data: {
          capabilities: userData.capabilities || [],
          realEstateDomains,
          primaryRealEstateDomain: userData.primaryDomain
        },
        error: null
      };
    } catch (error) {
      console.error("[CAPABILITIES_FETCH_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        source: 'server'
      });
      return {
        data: {
          capabilities: [],
          realEstateDomains: [],
          primaryRealEstateDomain: null
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



export interface LanguageUpdateData {
  languages: string[]
}

export const updateUserLanguages = withServerAction<{ success: boolean }, LanguageUpdateData>(
  async (data, { userUlid }) => {
    try {
      console.log("[UPDATE_LANGUAGES_START]", {
        userUlid,
        languages: data.languages,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()

      // First, get current languages
      const { data: currentData, error: fetchError } = await supabase
        .from("User")
        .select("languages")
        .eq("ulid", userUlid)
        .single();

      console.log("[UPDATE_LANGUAGES_CURRENT]", {
        userUlid,
        currentLanguages: currentData?.languages,
        fetchError,
        timestamp: new Date().toISOString()
      });

      if (fetchError) {
        console.error("[UPDATE_LANGUAGES_FETCH_ERROR]", {
          userUlid,
          error: fetchError,
          timestamp: new Date().toISOString()
        });
      }

      const { data: updateData, error } = await supabase
        .from("User")
        .update({
          languages: data.languages,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)
        .select("languages");

      console.log("[UPDATE_LANGUAGES_RESULT]", {
        userUlid,
        updatedLanguages: updateData?.[0]?.languages,
        error,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error("[UPDATE_LANGUAGES_ERROR]", {
          userUlid,
          error,
          attempted_languages: data.languages,
          timestamp: new Date().toISOString()
        });
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
      console.error("[UPDATE_LANGUAGES_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
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

export interface UserLanguagesResponse {
  languages: string[];
}

export const fetchUserLanguages = withServerAction<UserLanguagesResponse, void>(
  async (_, { userUlid }) => {
    try {
      console.log("[FETCH_USER_LANGUAGES_START]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient();

      const { data: userData, error } = await supabase
        .from("User")
        .select("languages")
        .eq("ulid", userUlid)
        .single();

      console.log("[FETCH_USER_LANGUAGES_RESULT]", {
        userUlid,
        rawLanguages: userData?.languages,
        error,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error("[FETCH_USER_LANGUAGES_ERROR]", {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user languages',
            details: error
          }
        };
      }

      // Ensure languages is always an array
      const languages = Array.isArray(userData?.languages) ? userData.languages : ['en'];

      console.log("[FETCH_USER_LANGUAGES_PROCESSED]", {
        userUlid,
        languages,
        timestamp: new Date().toISOString()
      });

      return {
        data: { languages },
        error: null
      };
    } catch (error) {
      console.error("[FETCH_USER_LANGUAGES_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch languages',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
);

export interface ProfileImageData {
  profileImageUrl: string | null;
}

export const updateProfileImage = withServerAction<ProfileImageData, ProfileImageData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient();

      const { error } = await supabase
        .from("User")
        .update({
          profileImageUrl: data.profileImageUrl,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid);

      if (error) {
        console.error("[PROFILE_IMAGE_UPDATE_ERROR]", { userUlid, error });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update profile image',
            details: error
          }
        };
      }

      return {
        data: { profileImageUrl: data.profileImageUrl },
        error: null
      };
    } catch (error) {
      console.error("[PROFILE_IMAGE_UPDATE_ERROR]", error);
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

export interface UserStatusData {
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
}

export const updateUserStatus = withServerAction<UserStatusData, UserStatusData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient();

      const { error } = await supabase
        .from("User")
        .update({
          status: data.status,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid);

      if (error) {
        console.error("[USER_STATUS_UPDATE_ERROR]", { userUlid, error });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user status',
            details: error
          }
        };
      }

      return {
        data: { status: data.status },
        error: null
      };
    } catch (error) {
      console.error("[USER_STATUS_UPDATE_ERROR]", error);
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

export interface DomainUpdateData {
  realEstateDomains: string[];
  primaryDomain?: string | null;
}

export const updateUserDomains = withServerAction<DomainUpdateData, DomainUpdateData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient();

      const updateData: any = {
        realEstateDomains: data.realEstateDomains,
        updatedAt: new Date().toISOString()
      };

      // Only include primaryDomain if it's provided
      if (data.primaryDomain !== undefined) {
        updateData.primaryDomain = data.primaryDomain;
      }

      const { error } = await supabase
        .from("User")
        .update(updateData)
        .eq("ulid", userUlid);

      if (error) {
        console.error("[USER_DOMAINS_UPDATE_ERROR]", { userUlid, error });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user domains',
            details: error
          }
        };
      }

      return {
        data: {
          realEstateDomains: data.realEstateDomains,
          primaryDomain: data.primaryDomain
        },
        error: null
      };
    } catch (error) {
      console.error("[USER_DOMAINS_UPDATE_ERROR]", error);
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

