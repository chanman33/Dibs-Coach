'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
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

    // Get user's coach profile
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select(`
        id,
        userId,
        firstName,
        lastName,
        profileImageUrl,
        RealtorCoachProfile!inner (
          specialty,
          bio,
          experience,
          certifications,
          availability,
          sessionLength,
          specialties,
          calendlyUrl,
          eventTypeUrl,
          hourlyRate
        )
      `)
      .eq('userId', clerkUserId)
      .eq('role', 'realtor_coach')
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          specialty: null,
          bio: null,
          experience: null,
          specialties: [],
          certifications: [],
          availability: null,
          sessionLength: null,
          calendlyUrl: null,
          eventTypeUrl: null,
          hourlyRate: null
        })
      }
      console.error('[COACH_PROFILE_ERROR]', userError)
      return new NextResponse('Failed to fetch coach profile', { status: 500 })
    }

    // Format the response
    const profile = Array.isArray(userData.RealtorCoachProfile) 
      ? userData.RealtorCoachProfile[0] 
      : userData.RealtorCoachProfile
    return NextResponse.json({
      ...profile,
      specialties: profile.specialties ? JSON.parse(profile.specialties) : [],
      certifications: profile.certifications || []
    })
  } catch (error) {
    console.error('[COACH_PROFILE_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
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

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single()

    if (userError || !userData) {
      console.error('[UPDATE_COACH_PROFILE_ERROR]', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== 'realtor_coach') {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    const body = await req.json()

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('RealtorCoachProfile')
      .select('*')
      .eq('userDbId', userData.id)
      .single()

    const profileData = {
      userDbId: userData.id,
      specialty: body.specialty || null,
      bio: body.bio || null,
      experience: body.experience || null,
      specialties: JSON.stringify(body.specialties || []),
      certifications: body.certifications || [],
      availability: body.availability || null,
      sessionLength: body.sessionLength || null,
      calendlyUrl: body.calendlyUrl || null,
      eventTypeUrl: body.eventTypeUrl || null,
      hourlyRate: body.hourlyRate || null,
      updatedAt: new Date().toISOString()
    }

    let result
    if (!existingProfile) {
      const { data, error } = await supabase
        .from('RealtorCoachProfile')
        .insert([profileData])
        .select()
        .single()
      
      result = { data, error }
    } else {
      const { data, error } = await supabase
        .from('RealtorCoachProfile')
        .update(profileData)
        .eq('userDbId', userData.id)
        .select()
        .single()
      
      result = { data, error }
    }

    if (result.error) {
      console.error('[UPDATE_COACH_PROFILE_ERROR]', result.error)
      return new NextResponse('Failed to update coach profile', { status: 500 })
    }

    return NextResponse.json({
      message: 'Coach profile updated successfully',
      data: result.data
    })
  } catch (error) {
    console.error('[UPDATE_COACH_PROFILE_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 