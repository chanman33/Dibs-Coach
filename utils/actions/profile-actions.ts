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
        .single()

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
        .single()

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

      return {
        data: {
          displayName: userData.displayName || "",
          bio: userData.bio,
          yearsExperience: profileData.yearsExperience || 0,
          primaryMarket: profileData.primaryMarket || ""
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
      
      const { data: coachProfile, error: coachError } = await supabase
        .from("CoachProfile")
        .select(`
          specialties,
          yearsCoaching,
          hourlyRate,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          calendlyUrl,
          eventTypeUrl,
          professionalRecognitions
        `)
        .eq("userUlid", userUlid)
        .single()

      if (coachError) {
        console.error("[COACH_PROFILE_ERROR]", { userUlid, error: coachError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profile',
            details: coachError
          }
        }
      }

      return {
        data: {
          ...coachProfile,
          _rawRealtorProfile: []
        },
        error: null
      }
    } catch (error) {
      console.error("[COACH_PROFILE_ERROR]", error)
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
      const supabase = await createAuthClient();
      
      // First, get existing domain expertise records for this user
      const { data: existingDomains, error: fetchError } = await supabase
        .from("DomainExpertise")
        .select("domainType, status")
        .eq("userUlid", userUlid);

      if (fetchError) {
        console.error("[SPECIALTIES_ERROR] Failed to fetch existing domains:", { userUlid, error: fetchError });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch existing domain expertise',
            details: fetchError
          }
        };
      }

      // Create a map of existing domains for quick lookup
      const existingDomainMap = new Map();
      existingDomains?.forEach(domain => {
        existingDomainMap.set(domain.domainType, domain);
      });

      // Process each specialty in the input
      const updatePromises = [];
      const newDomains = [];
      const activeDomains = [];

      for (const specialty of data.specialties) {
        // If this domain already exists, update its status to ACTIVE
        if (existingDomainMap.has(specialty)) {
          updatePromises.push(
            supabase
              .from("DomainExpertise")
              .update({
                status: 'ACTIVE',
                updatedAt: new Date().toISOString()
              })
              .eq("userUlid", userUlid)
              .eq("domainType", specialty)
          );
          activeDomains.push(specialty);
        } else {
          // If this is a new domain, prepare to insert it
          newDomains.push({
            userUlid,
            domainType: specialty,
            status: 'ACTIVE',
            expertiseLevel: 'INTERMEDIATE', // Default level
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          activeDomains.push(specialty);
        }
      }

      // For domains that exist but are not in the input, set status to INACTIVE
      existingDomains?.forEach(domain => {
        if (!data.specialties.includes(domain.domainType) && domain.status === 'ACTIVE') {
          updatePromises.push(
            supabase
              .from("DomainExpertise")
              .update({
                status: 'INACTIVE',
                updatedAt: new Date().toISOString()
              })
              .eq("userUlid", userUlid)
              .eq("domainType", domain.domainType)
          );
        }
      });

      // Insert new domains if any
      if (newDomains.length > 0) {
        const { error: insertError } = await supabase
          .from("DomainExpertise")
          .insert(newDomains);

        if (insertError) {
          console.error("[SPECIALTIES_ERROR] Failed to insert new domains:", { userUlid, error: insertError });
          return {
            data: null,
            error: {
              code: 'CREATE_ERROR',
              message: 'Failed to insert new domain expertise',
              details: insertError
            }
          };
        }
      }

      // Execute all update promises
      if (updatePromises.length > 0) {
        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults.filter(result => result.error);
        
        if (updateErrors.length > 0) {
          console.error("[SPECIALTIES_ERROR] Failed to update domains:", { userUlid, errors: updateErrors });
          return {
            data: null,
            error: {
              code: 'UPDATE_ERROR',
              message: 'Failed to update domain expertise',
              details: updateErrors
            }
          };
        }
      }

      // Revalidate the profile page
      revalidatePath('/dashboard/coach/profile');

      return {
        data: {
          activeDomains
        },
        error: null
      };
    } catch (error) {
      console.error("[SPECIALTIES_ERROR] Unexpected error:", { userUlid, error });
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
          capabilities
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

      // Get domain expertise from DomainExpertise table
      const { data: domainData, error: domainError } = await supabase
        .from("DomainExpertise")
        .select(`
          domainType,
          status
        `)
        .eq("userUlid", userUlid);

      if (domainError) {
        console.error("[DOMAIN_EXPERTISE_FETCH_ERROR]", { userUlid, error: domainError });
      }

      // Extract domain types and active domains
      const domainSpecialties = domainData?.map(domain => domain.domainType) || [];
      const activeDomains = domainData
        ?.filter(domain => domain.status === 'ACTIVE')
        .map(domain => domain.domainType) || [];

      console.log("[DOMAIN_EXPERTISE]", { domainData, domainSpecialties, activeDomains });

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