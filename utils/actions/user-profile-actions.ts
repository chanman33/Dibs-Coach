'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import type { MarketingInfo } from "@/utils/types/marketing"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ServerActionContext } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { calculateProfileCompletion } from '@/utils/actions/calculateProfileCompletion'
import { User } from "@/utils/types/user"

export interface GeneralFormData {
  displayName: string
  bio: string | null
  totalYearsRE: number
  primaryMarket: string
  languages?: string[]
  realEstateDomains: string[]
  primaryDomain: string | null
}

export interface UserProfileResponse {
  displayName: string | null;
  bio: string | null;
  totalYearsRE: number;
  primaryMarket: string | null;
  languages: string[];
  realEstateDomains: string[];
  primaryDomain: string | null;
  capabilities: string[];
  coachProfile: any | null;
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

export const fetchUserProfile = withServerAction<UserProfileResponse, void>(
  async (_, { userUlid }): Promise<ApiResponse<UserProfileResponse>> => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: {
            displayName: "",
            bio: null,
            totalYearsRE: 0,
            realEstateDomains: [],
            primaryDomain: null,
            primaryMarket: "",
            languages: [],
            capabilities: [],
            coachProfile: null
          },
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const supabase = await createAuthClient();

      const { data, error } = await supabase
        .from('User')
        .select(`
          displayName,
          bio,
          totalYearsRE,
          realEstateDomains,
          primaryDomain,
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
            primaryDomain: null,
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
          primaryDomain: data.primaryDomain || null,
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
          primaryDomain: null,
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
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      // Log the incoming update data
      console.log("[USER_PROFILE_UPDATE_START]", {
        userUlid,
        updateData: data,
        displayName: data.displayName,
        bio: data.bio,
        totalYearsRE: data.totalYearsRE,
        primaryMarket: data.primaryMarket,
        realEstateDomains: data.realEstateDomains,
        primaryDomain: data.primaryDomain,
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
      const updateData: {
        displayName: string | null;
        bio: string | null;
        totalYearsRE: number;
        primaryMarket: string | null;
        updatedAt: string;
        realEstateDomains: any;
        primaryDomain?: any;
        languages?: any;
      } = {
        displayName: data.displayName || null,
        bio: data.bio || null,
        totalYearsRE: typeof data.totalYearsRE === 'number' ? data.totalYearsRE : 0,
        primaryMarket: data.primaryMarket || null,
        updatedAt: new Date().toISOString(),
        realEstateDomains: data.realEstateDomains as any
      };

      // If languages is provided, update it
      if (data.languages !== undefined) {
        updateData.languages = data.languages as any;
      }

      // Handle primaryDomain logic:
      // 1. If realEstateDomains is empty, set primaryDomain to null
      // 2. If primaryDomain is provided and exists in realEstateDomains, use it
      // 3. Otherwise, use the first domain in realEstateDomains as the primary
      if (data.realEstateDomains.length === 0) {
        updateData.primaryDomain = null;
      } else if (data.primaryDomain && data.realEstateDomains.includes(data.primaryDomain)) {
        updateData.primaryDomain = data.primaryDomain as any;
      } else {
        updateData.primaryDomain = data.realEstateDomains[0] as any;
      }

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

      // Revalidate relevant paths
      revalidatePath('/dashboard/mentee/profile');
      revalidatePath('/dashboard/coach/profile');
      
      // Return the updated data
      return {
        data: {
          displayName: updatedUser.displayName || "",
          bio: updatedUser.bio,
          totalYearsRE: updatedUser.totalYearsRE || 0,
          primaryMarket: updatedUser.primaryMarket || "",
          languages: updatedUser.languages || [],
          realEstateDomains: updatedUser.realEstateDomains || [],
          primaryDomain: updatedUser.primaryDomain
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

// Cache for user capabilities to prevent frequent fetches
type CapabilitiesCache = {
  [userUlid: string]: {
    data: UserCapabilitiesResponse;
    timestamp: number;
  }
};

const capabilitiesCache: CapabilitiesCache = {};
const CAPABILITIES_CACHE_TTL = 10000; // 10 seconds

export const fetchUserCapabilities = withServerAction<UserCapabilitiesResponse, { skipProfileCheck?: boolean }>(
  async ({ skipProfileCheck = false } = {}, { userUlid }): Promise<ApiResponse<UserCapabilitiesResponse>> => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: {
            capabilities: [],
            realEstateDomains: [],
            primaryRealEstateDomain: null
          },
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const now = Date.now();
      
      // Check cache first
      if (userUlid in capabilitiesCache && 
          now - capabilitiesCache[userUlid].timestamp < CAPABILITIES_CACHE_TTL) {
        // Log cache hit in development
        if (process.env.NODE_ENV === 'development') {
          console.log("[FETCH_USER_CAPABILITIES_CACHED]", {
            userUlid,
            cacheAge: now - capabilitiesCache[userUlid].timestamp,
            cacheTTL: CAPABILITIES_CACHE_TTL,
            timestamp: new Date().toISOString()
          });
        }
        return {
          data: capabilitiesCache[userUlid].data,
          error: null
        };
      }
      
      // Start logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log("[FETCH_USER_CAPABILITIES_START]", {
          userUlid,
          skipProfileCheck,
          timestamp: new Date().toISOString(),
          source: 'server'
        });
      }

      const supabase = createAuthClient();
      const { data: userData, error } = await supabase
        .from('User')
        .select('capabilities, realEstateDomains, primaryDomain')
        .eq('ulid', userUlid)
        .single();

      if (error) {
        throw error;
      }

      const capabilities = (userData.capabilities || []).filter(Boolean);
      const realEstateDomains = (userData.realEstateDomains || []).filter(Boolean);
      const primaryRealEstateDomain = userData.primaryDomain 
        ? String(userData.primaryDomain) 
        : null;

      // Return a plain object with primitives
      const response: UserCapabilitiesResponse = {
        capabilities,
        realEstateDomains,
        primaryRealEstateDomain
      };

      // Cache the result
      capabilitiesCache[userUlid] = {
        data: response,
        timestamp: now
      };

      return {
        data: response,
        error: null
      };
    } catch (error) {
      // Always log errors
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
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
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

      // Ensure languages is an array, even if empty
      const languagesToUpdate = Array.isArray(data.languages) ? data.languages : [];

      const { data: updateData, error } = await supabase
        .from("User")
        .update({
          languages: languagesToUpdate as any,
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
          attempted_languages: languagesToUpdate,
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
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
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

      // Ensure languages is always an array, but can be empty
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
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
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
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "DELETED";
}

export const updateUserStatus = withServerAction<UserStatusData, UserStatusData>(
  async (data, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      console.log("[UPDATE_STATUS_START]", {
        userUlid,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient()

      // First, get current status
      const { data: currentData, error: fetchError } = await supabase
        .from("User")
        .select("status")
        .eq("ulid", userUlid)
        .single();

      console.log("[UPDATE_STATUS_CURRENT]", {
        userUlid,
        currentStatus: currentData?.status,
        fetchError,
        timestamp: new Date().toISOString()
      });

      if (fetchError) {
        console.error("[UPDATE_STATUS_FETCH_ERROR]", {
          userUlid,
          error: fetchError,
          timestamp: new Date().toISOString()
        });
      }

      const { data: updateData, error } = await supabase
        .from("User")
        .update({
          status: data.status as any, // Type assertion to bypass strict type checking
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)
        .select("status");

      console.log("[UPDATE_STATUS_RESULT]", {
        userUlid,
        updatedStatus: updateData?.[0]?.status,
        error,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error("[UPDATE_STATUS_ERROR]", {
          userUlid,
          error,
          attempted_status: data.status,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user status',
            details: error
          }
        }
      }

      return {
        data: { status: updateData?.[0]?.status as "ACTIVE" | "SUSPENDED" | "INACTIVE" | "DELETED" },
        error: null
      }
    } catch (error) {
      console.error("[UPDATE_STATUS_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update status',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
);

export interface DomainUpdateData {
  realEstateDomains: string[];
  primaryDomain?: string | null;
  targetUserUlid?: string;
}

export const updateUserDomains = withServerAction<DomainUpdateData, DomainUpdateData>(
  async (data, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const supabase = await createAuthClient();
      
      // Use targetUserUlid if provided, otherwise use the context userUlid
      const targetUlid = data.targetUserUlid || userUlid;
      
      // Validate that target ID is defined
      if (!targetUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'Target user ID is required'
          }
        };
      }

      // First check if the user is a coach
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('isCoach')
        .eq('ulid', targetUlid)
        .single();

      if (userError) {
        console.error("[USER_FETCH_ERROR]", { targetUlid, error: userError });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: userError
          }
        };
      }

      // Handle primaryDomain logic:
      // 1. If realEstateDomains is empty, set primaryDomain to null
      // 2. If primaryDomain is provided and exists in realEstateDomains, use it
      // 3. If primaryDomain is provided but not in realEstateDomains, use first domain
      // 4. If primaryDomain is not provided, keep first domain as primary
      let primaryDomainValue = null;
      if (data.realEstateDomains.length === 0) {
        // If no domains, set primaryDomain to null
        primaryDomainValue = null;
      } else if (data.primaryDomain !== undefined) {
        // If primaryDomain is explicitly provided
        if (data.primaryDomain && data.realEstateDomains.includes(data.primaryDomain)) {
          // Use provided primaryDomain if it's in the domains list
          primaryDomainValue = data.primaryDomain;
        } else {
          // Otherwise use the first domain as primary
          primaryDomainValue = data.realEstateDomains[0];
        }
      } else {
        // If primaryDomain not provided, use first domain
        primaryDomainValue = data.realEstateDomains[0];
      }

      if (userData.isCoach) {
        // If user is a coach, update the CoachProfile table
        const { error: coachError } = await supabase
          .from("CoachProfile")
          .update({
            coachRealEstateDomains: data.realEstateDomains as any,
            coachPrimaryDomain: primaryDomainValue as any,
            updatedAt: new Date().toISOString()
          })
          .eq("userUlid", targetUlid);

        if (coachError) {
          console.error("[COACH_DOMAINS_UPDATE_ERROR]", { targetUlid, error: coachError });
          return {
            data: null,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to update coach domains',
              details: coachError
            }
          };
        }
      } else {
        // If not a coach, update the User table
        const { error } = await supabase
          .from("User")
          .update({
            realEstateDomains: data.realEstateDomains as any,
            primaryDomain: primaryDomainValue as any,
            updatedAt: new Date().toISOString()
          })
          .eq("ulid", targetUlid);

        if (error) {
          console.error("[USER_DOMAINS_UPDATE_ERROR]", { targetUlid, error });
          return {
            data: null,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to update user domains',
              details: error
            }
          };
        }
      }

      // Revalidate relevant paths
      revalidatePath('/dashboard/coach/profile');
      revalidatePath('/dashboard/system/coach-mgmt');

      return {
        data: {
          realEstateDomains: data.realEstateDomains,
          primaryDomain: primaryDomainValue
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

