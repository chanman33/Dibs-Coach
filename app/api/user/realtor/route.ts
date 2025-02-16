import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { realtorProfileSchema } from '@/utils/types/realtor'
import { z } from 'zod'

// Response type for realtor profile
interface RealtorProfileResponse {
  ulid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  profileImageUrl: string | null;
  realtorProfile: {
    ulid: string;
    bio: string | null;
    yearsExperience: number | null;
    propertyTypes: string[];
    specializations: string[];
    certifications: string[];
    languages: string[];
    geographicFocus: {
      cities: string[];
      neighborhoods: string[];
      counties: string[];
    };
    primaryMarket: string | null;
    slogan: string | null;
    websiteUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    linkedinUrl: string | null;
    youtubeUrl: string | null;
    marketingAreas: string[];
    testimonials: any[];
    featuredListings: any[];
    achievements: any[];
    createdAt: string;
    updatedAt: string;
  } | null;
  coachProfile: {
    ulid: string;
    coachingSpecialties: string[];
    yearsCoaching: number;
    hourlyRate: number;
    calendlyUrl: string | null;
    eventTypeUrl: string | null;
    isActive: boolean;
    defaultDuration: number;
    allowCustomDuration: boolean;
    minimumDuration: number;
    maximumDuration: number;
    totalSessions: number;
    averageRating: number | null;
  } | null;
  menteeProfile: {
    ulid: string;
    focusAreas: string[];
    experienceLevel: string;
    learningStyle: string;
    goals: string[];
    sessionsCompleted: number;
    isActive: boolean;
    lastSessionDate: string | null;
  } | null;
}

// GET /api/user/realtor
export const GET = withApiAuth<RealtorProfileResponse>(async (req, { userId }) => {
  try {
    const supabase = await createAuthClient()

    const { data: user, error } = await supabase
      .from('User')
      .select(`
        ulid,
        email,
        firstName,
        lastName,
        role,
        status,
        profileImageUrl,
        realtorProfile:RealtorProfile!userUlid(
          ulid,
          bio,
          yearsExperience,
          propertyTypes,
          specializations,
          certifications,
          languages,
          geographicFocus,
          primaryMarket,
          slogan,
          websiteUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          youtubeUrl,
          marketingAreas,
          testimonials,
          featuredListings,
          achievements,
          createdAt,
          updatedAt
        ),
        coachProfile:CoachProfile!userUlid(
          ulid,
          coachingSpecialties,
          yearsCoaching,
          hourlyRate,
          calendlyUrl,
          eventTypeUrl,
          isActive,
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration,
          totalSessions,
          averageRating
        ),
        menteeProfile:MenteeProfile!userUlid(
          ulid,
          focusAreas,
          experienceLevel,
          learningStyle,
          goals,
          sessionsCompleted,
          isActive,
          lastSessionDate
        )
      `)
      .eq('userId', userId)
      .single()

    if (error) {
      console.error('[REALTOR_PROFILE_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch realtor profile',
            details: error
          }
        },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            details: null
          }
        },
        { status: 404 }
      )
    }

    // Transform the response to match our type
    const response: RealtorProfileResponse = {
      ulid: user.ulid as string,
      email: user.email as string,
      firstName: user.firstName as string,
      lastName: user.lastName as string,
      role: user.role as string,
      status: user.status as string,
      profileImageUrl: user.profileImageUrl as string | null,
      realtorProfile: user.realtorProfile?.[0] ? {
        ulid: user.realtorProfile[0].ulid as string,
        bio: user.realtorProfile[0].bio as string | null,
        yearsExperience: user.realtorProfile[0].yearsExperience as number | null,
        propertyTypes: (user.realtorProfile[0].propertyTypes || []) as string[],
        specializations: (user.realtorProfile[0].specializations || []) as string[],
        certifications: (user.realtorProfile[0].certifications || []) as string[],
        languages: (user.realtorProfile[0].languages || []) as string[],
        geographicFocus: (user.realtorProfile[0].geographicFocus || { cities: [], neighborhoods: [], counties: [] }) as { cities: string[]; neighborhoods: string[]; counties: string[] },
        primaryMarket: user.realtorProfile[0].primaryMarket as string | null,
        slogan: user.realtorProfile[0].slogan as string | null,
        websiteUrl: user.realtorProfile[0].websiteUrl as string | null,
        facebookUrl: user.realtorProfile[0].facebookUrl as string | null,
        instagramUrl: user.realtorProfile[0].instagramUrl as string | null,
        linkedinUrl: user.realtorProfile[0].linkedinUrl as string | null,
        youtubeUrl: user.realtorProfile[0].youtubeUrl as string | null,
        marketingAreas: (user.realtorProfile[0].marketingAreas || []) as string[],
        testimonials: (user.realtorProfile[0].testimonials || []) as any[],
        featuredListings: (user.realtorProfile[0].featuredListings || []) as any[],
        achievements: (user.realtorProfile[0].achievements || []) as any[],
        createdAt: user.realtorProfile[0].createdAt as string,
        updatedAt: user.realtorProfile[0].updatedAt as string
      } : null,
      coachProfile: user.coachProfile?.[0] ? {
        ulid: user.coachProfile[0].ulid as string,
        coachingSpecialties: (user.coachProfile[0].coachingSpecialties || []) as string[],
        yearsCoaching: user.coachProfile[0].yearsCoaching as number,
        hourlyRate: user.coachProfile[0].hourlyRate as number,
        calendlyUrl: user.coachProfile[0].calendlyUrl as string | null,
        eventTypeUrl: user.coachProfile[0].eventTypeUrl as string | null,
        isActive: user.coachProfile[0].isActive as boolean,
        defaultDuration: user.coachProfile[0].defaultDuration as number,
        allowCustomDuration: user.coachProfile[0].allowCustomDuration as boolean,
        minimumDuration: user.coachProfile[0].minimumDuration as number,
        maximumDuration: user.coachProfile[0].maximumDuration as number,
        totalSessions: user.coachProfile[0].totalSessions as number,
        averageRating: user.coachProfile[0].averageRating as number | null
      } : null,
      menteeProfile: user.menteeProfile?.[0] ? {
        ulid: user.menteeProfile[0].ulid as string,
        focusAreas: (user.menteeProfile[0].focusAreas || []) as string[],
        experienceLevel: user.menteeProfile[0].experienceLevel as string,
        learningStyle: user.menteeProfile[0].learningStyle as string,
        goals: (user.menteeProfile[0].goals || []) as string[],
        sessionsCompleted: user.menteeProfile[0].sessionsCompleted as number,
        isActive: user.menteeProfile[0].isActive as boolean,
        lastSessionDate: user.menteeProfile[0].lastSessionDate as string | null
      } : null
    }

    return NextResponse.json<ApiResponse<RealtorProfileResponse>>(
      {
        data: response,
        error: null
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[REALTOR_PROFILE_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      },
      { status: 500 }
    )
  }
})

// Validation schema for PUT request
const UpdateRealtorProfileSchema = realtorProfileSchema.omit({ userUlid: true })

// PUT /api/user/realtor
export const PUT = withApiAuth<RealtorProfileResponse>(async (req, { userId }) => {
  try {
    const body = await req.json()
    const supabase = await createAuthClient()

    // Get user's ULID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid, role')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      console.error('[REALTOR_PROFILE_ERROR] User lookup error:', userError)
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            details: userError
          }
        },
        { status: 404 }
      )
    }

    // Validate the realtor profile data
    try {
      UpdateRealtorProfileSchema.parse(body)
    } catch (validationError) {
      console.error('[REALTOR_PROFILE_ERROR] Validation error:', validationError)
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: validationError instanceof z.ZodError ? validationError.flatten() : validationError
          }
        },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('RealtorProfile')
      .select('ulid')
      .eq('userUlid', user.ulid)
      .single()

    const realtorData = {
      userUlid: user.ulid,
      bio: body.bio || null,
      yearsExperience: body.yearsExperience || null,
      propertyTypes: body.propertyTypes || [],
      specializations: body.specializations || [],
      certifications: body.certifications || [],
      languages: body.languages || [],
      geographicFocus: body.geographicFocus || { cities: [], neighborhoods: [], counties: [] },
      primaryMarket: body.primaryMarket || null,
      slogan: body.slogan || null,
      websiteUrl: body.websiteUrl || null,
      facebookUrl: body.facebookUrl || null,
      instagramUrl: body.instagramUrl || null,
      linkedinUrl: body.linkedinUrl || null,
      youtubeUrl: body.youtubeUrl || null,
      marketingAreas: body.marketingAreas || [],
      testimonials: body.testimonials || [],
      featuredListings: body.featuredListings || [],
      achievements: body.achievements || [],
      updatedAt: new Date().toISOString(),
    }

    let realtorProfile
    let realtorError

    if (!existingProfile) {
      const { data, error } = await supabase
        .from('RealtorProfile')
        .insert([realtorData])
        .select()
        .single()
      
      realtorProfile = data
      realtorError = error
    } else {
      const { data, error } = await supabase
        .from('RealtorProfile')
        .update(realtorData)
        .eq('userUlid', user.ulid)
        .select()
        .single()
      
      realtorProfile = data
      realtorError = error
    }

    if (realtorError) {
      console.error('[REALTOR_PROFILE_ERROR] Profile update error:', realtorError)
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update profile',
            details: realtorError
          }
        },
        { status: 500 }
      )
    }

    // Fetch the complete updated profile
    const { data: updatedUser, error: fetchError } = await supabase
      .from('User')
      .select(`
        ulid,
        email,
        firstName,
        lastName,
        role,
        status,
        profileImageUrl,
        realtorProfile:RealtorProfile!userUlid(
          ulid,
          bio,
          yearsExperience,
          propertyTypes,
          specializations,
          certifications,
          languages,
          geographicFocus,
          primaryMarket,
          slogan,
          websiteUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          youtubeUrl,
          marketingAreas,
          testimonials,
          featuredListings,
          achievements,
          createdAt,
          updatedAt
        ),
        coachProfile:CoachProfile!userUlid(
          ulid,
          coachingSpecialties,
          yearsCoaching,
          hourlyRate,
          calendlyUrl,
          eventTypeUrl,
          isActive,
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration,
          totalSessions,
          averageRating
        ),
        menteeProfile:MenteeProfile!userUlid(
          ulid,
          focusAreas,
          experienceLevel,
          learningStyle,
          goals,
          sessionsCompleted,
          isActive,
          lastSessionDate
        )
      `)
      .eq('ulid', user.ulid)
      .single()

    if (fetchError) {
      console.error('[REALTOR_PROFILE_ERROR] Failed to fetch updated profile:', fetchError)
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch updated profile',
            details: fetchError
          }
        },
        { status: 500 }
      )
    }

    const updatedUserResponse = {
      ...updatedUser,
      realtorProfile: updatedUser.realtorProfile?.[0] || null,
      coachProfile: updatedUser.coachProfile?.[0] || null,
      menteeProfile: updatedUser.menteeProfile?.[0] || null
    }

    return NextResponse.json<ApiResponse<RealtorProfileResponse>>(
      {
        data: updatedUserResponse,
        error: null
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[REALTOR_PROFILE_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      },
      { status: 500 }
    )
  }
})
