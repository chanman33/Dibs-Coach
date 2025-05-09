'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { RealEstateDomain, PROFILE_STATUS } from "@/utils/types/coach"
import { ProfessionalRecognition } from "@/utils/types/recognition"

// Define the structure for the public coach profile data
export interface PublicCoachProfile {
  ulid: string; // CoachProfile ULID
  userUlid: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  slogan: string | null;
  coachSkills: string[];
  coachRealEstateDomains: RealEstateDomain[];
  coachPrimaryDomain: RealEstateDomain | null;
  hourlyRate: number | null;
  averageRating: number | null;
  totalSessions: number;
  profileSlug: string | null;
  recognitions: ProfessionalRecognition[];
  yearsCoaching: number | null;
  sessionConfig?: {
    defaultDuration: number;
    minimumDuration: number;
    maximumDuration: number;
    allowCustomDuration: boolean;
  };
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  xUrl?: string | null;
}

// Define the server action to fetch public profile data by slug
export const fetchPublicCoachProfileBySlug = withServerAction<PublicCoachProfile, { slug: string }>(
  async ({ slug }, { userUlid: requestingUserUlid }) => { // Note: requestingUserUlid is the logged-in user, may be null
    try {
      console.log("[FETCH_PUBLIC_COACH_PROFILE_START]", {
        slug,
        requestingUserUlid: requestingUserUlid || 'anonymous',
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient(); // Use createAuthClient for potential RLS later

      // 1. Find the CoachProfile using the slug
      const { data: profileData, error: profileError } = await supabase
        .from('CoachProfile')
        .select(`
          ulid,
          userUlid,
          yearsCoaching,
          coachSkills,
          hourlyRate,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          isActive,
          coachPrimaryDomain,
          coachRealEstateDomains,
          slogan,
          profileSlug,
          averageRating,
          totalSessions,
          profileStatus,
          websiteUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          youtubeUrl,
          tiktokUrl,
          xUrl
        `)
        .eq('profileSlug', slug)
        .eq('profileStatus', PROFILE_STATUS.PUBLISHED) // Ensure only published profiles are fetched
        .maybeSingle(); // Use maybeSingle as slug might not exist

      if (profileError) {
        console.error('[FETCH_PUBLIC_COACH_PROFILE_ERROR] Error fetching profile by slug', {
          slug,
          error: profileError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error fetching coach profile data.'
          }
        };
      }

      if (!profileData) {
        console.warn('[FETCH_PUBLIC_COACH_PROFILE_WARN] Profile not found or not published for slug', {
          slug,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Coach profile not found or is not published.'
          }
        };
      }

      // Log profile data found
      console.log('[FETCH_PUBLIC_COACH_PROFILE_FOUND]', {
        slug,
        profileUlid: profileData.ulid,
        userUlid: profileData.userUlid,
        timestamp: new Date().toISOString()
      });

      // 2. Fetch the associated User data
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select(`
          ulid,
          firstName,
          lastName,
          displayName,
          profileImageUrl,
          bio
        `)
        .eq('ulid', profileData.userUlid)
        .single();

      if (userError || !userData) {
        console.error('[FETCH_PUBLIC_COACH_PROFILE_ERROR] Error fetching user data for profile', {
          slug,
          userUlid: profileData.userUlid,
          error: userError,
          timestamp: new Date().toISOString()
        });
        // Decide if we want to return partial data or fail completely
        // For now, let's fail if we can't get the basic user info
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error fetching associated user data.'
          }
        };
      }

      // 3. Fetch active and visible Professional Recognitions
      const { data: recognitionsData, error: recognitionsError } = await supabase
        .from('ProfessionalRecognition')
        .select('*')
        .eq('userUlid', profileData.userUlid)
        .eq('isVisible', true) // Only visible recognitions
        // .eq('status', 'ACTIVE') // Assuming status field exists and 'ACTIVE' is the value
        // If status field isn't consistently used, might need different logic

      if (recognitionsError) {
        console.error('[FETCH_PUBLIC_COACH_PROFILE_ERROR] Error fetching recognitions', {
          slug,
          userUlid: profileData.userUlid,
          error: recognitionsError,
          timestamp: new Date().toISOString()
        });
        // Continue without recognitions for now, maybe return partial data
      }
      
      const activeRecognitions = ((recognitionsData || []) as any[])
        .filter(rec => {
          const status = rec.status || 'ACTIVE'; // Default to ACTIVE if no status
          return status === 'ACTIVE'; // Further filter by status if needed
        })
        .map(rec => ({
          ulid: rec.ulid,
          userUlid: rec.userUlid,
          coachUlid: rec.coachUlid,
          title: rec.title || '',
          type: rec.type as any, // Cast as needed
          issuer: rec.issuer || '',
          issueDate: rec.issueDate ? new Date(rec.issueDate) : new Date(),
          expiryDate: rec.expiryDate ? new Date(rec.expiryDate) : null,
          description: rec.description || null,
          verificationUrl: rec.verificationUrl || null,
          isVisible: true, // Already filtered
          industryType: rec.industryType || null,
          metadata: rec.metadata || {}
        }) satisfies ProfessionalRecognition);

      // 4. Combine data into the response structure
      const responseData: PublicCoachProfile = {
        ulid: profileData.ulid,
        userUlid: userData.ulid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        bio: userData.bio,
        profileImageUrl: userData.profileImageUrl,
        slogan: profileData.slogan,
        coachSkills: profileData.coachSkills || [],
        coachRealEstateDomains: profileData.coachRealEstateDomains || [],
        coachPrimaryDomain: profileData.coachPrimaryDomain,
        hourlyRate: profileData.hourlyRate,
        averageRating: profileData.averageRating,
        totalSessions: profileData.totalSessions || 0,
        profileSlug: profileData.profileSlug,
        recognitions: activeRecognitions,
        yearsCoaching: profileData.yearsCoaching,
        sessionConfig: {
          defaultDuration: profileData.defaultDuration || 60,
          minimumDuration: profileData.minimumDuration || 30,
          maximumDuration: profileData.maximumDuration || 120,
          allowCustomDuration: profileData.allowCustomDuration || false
        },
        websiteUrl: profileData.websiteUrl,
        facebookUrl: profileData.facebookUrl,
        instagramUrl: profileData.instagramUrl,
        linkedinUrl: profileData.linkedinUrl,
        youtubeUrl: profileData.youtubeUrl,
        tiktokUrl: profileData.tiktokUrl,
        xUrl: profileData.xUrl,
      };

      console.log('[FETCH_PUBLIC_COACH_PROFILE_SUCCESS]', {
        slug,
        userUlid: responseData.userUlid,
        profileUlid: responseData.ulid,
        timestamp: new Date().toISOString()
      });

      return { data: responseData, error: null };

    } catch (error) {
      console.error('[FETCH_PUBLIC_COACH_PROFILE_ERROR] Unexpected error', {
        slug,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching the coach profile.'
        }
      };
    }
  }
); 