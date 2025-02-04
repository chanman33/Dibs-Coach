import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { realtorProfileSchema } from '@/utils/types/realtor'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: user, error } = await supabase
      .from('User')
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
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
        coachProfile:CoachProfile (
          id,
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
        menteeProfile:MenteeProfile (
          id,
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
      return NextResponse.json({ message: 'Database error' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[REALTOR_PROFILE_ERROR]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      console.error('[REALTOR_PROFILE_ERROR] User lookup error:', userError)
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Validate the realtor profile data
    try {
      realtorProfileSchema.parse({
        ...body,
        userDbId: user.id,
      })
    } catch (validationError) {
      console.error('[REALTOR_PROFILE_ERROR] Validation error:', validationError)
      return NextResponse.json(
        { message: 'Invalid profile data', error: validationError },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('RealtorProfile')
      .select('id')
      .eq('userDbId', user.id)
      .single()

    const realtorData = {
      userDbId: user.id,
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
        .eq('userDbId', user.id)
        .select()
        .single()
      
      realtorProfile = data
      realtorError = error
    }

    if (realtorError) {
      console.error('[REALTOR_PROFILE_ERROR] Profile update error:', realtorError)
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(realtorProfile)
  } catch (error) {
    console.error('[REALTOR_PROFILE_ERROR]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
