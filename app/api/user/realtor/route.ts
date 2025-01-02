import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface BaseProfile {
  bio: string | null
  careerStage: string | null
  goals: string | null
  availability: string | null
}

interface RealtorProfile {
  companyName: string | null
  licenseNumber: string | null
  phoneNumber: string | null
}

interface UserWithProfiles {
  id: number
  role: string
  brokerId: number | null
  teamId: number | null
  baseProfile: BaseProfile
  realtorProfile: RealtorProfile
}

export async function GET() {
  try {
    // Auth check
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Initialize Supabase client
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

    // Get user with all related profiles in a single query
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        role,
        brokerId,
        teamId,
        baseProfile:BaseProfile!left (
          bio,
          careerStage,
          goals,
          availability
        ),
        realtorProfile:RealtorProfile!left (
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq('userId', clerkUserId)
      .single() as unknown as { data: UserWithProfiles, error: any };

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      console.error('[REALTOR_PROFILE_ERROR]', error.message);
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Return the profile data
    const response = {
      role: user.role,
      companyName: user.realtorProfile?.companyName ?? null,
      licenseNumber: user.realtorProfile?.licenseNumber ?? null,
      phoneNumber: user.realtorProfile?.phoneNumber ?? null,
      brokerId: user.brokerId ?? null,
      teamId: user.teamId ?? null,
      bio: user.baseProfile?.bio ?? null,
      careerStage: user.baseProfile?.careerStage ?? null,
      goals: user.baseProfile?.goals ?? null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[REALTOR_PROFILE_ERROR]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('[REALTOR_PROFILE_PUT] Received body:', body)

    // Initialize Supabase client
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

    // Get user id from database
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', clerkUserId)
      .single()

    if (userDataError || !userData) {
      console.error('[REALTOR_PROFILE_PUT_ERROR] User lookup:', userDataError)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[REALTOR_PROFILE_PUT] Found user:', userData)

    // First update the base profile
    const { data: baseProfile, error: baseError } = await supabase
      .from('BaseProfile')
      .upsert({
        userId: userData.id,
        bio: body.bio,
        careerStage: body.careerStage,
        goals: body.goals,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (baseError) {
      console.error('[BASE_PROFILE_PUT_ERROR] Base profile update:', baseError)
      return NextResponse.json(
        { 
          message: 'Failed to update base profile',
          error: baseError.message 
        },
        { status: 500 }
      )
    }

    // Then update the realtor profile
    const { data: realtorProfile, error: realtorError } = await supabase
      .from('RealtorProfile')
      .upsert({
        userId: userData.id,
        companyName: body.companyName,
        licenseNumber: body.licenseNumber,
        phoneNumber: body.phoneNumber,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    console.log('[REALTOR_PROFILE_PUT] Realtor profile update result:', { realtorProfile, realtorError })

    if (realtorError) {
      console.error('[REALTOR_PROFILE_PUT] Realtor profile error:', realtorError)
      return NextResponse.json(
        { 
          message: 'Failed to update realtor profile',
          error: realtorError.message,
          details: realtorError
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      data: {
        baseProfile,
        realtorProfile
      }
    })

  } catch (error) {
    console.error('[REALTOR_PROFILE_PUT] Unexpected error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
