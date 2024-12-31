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
  brokerId: number | null
  teamId: number | null
  BaseProfile: BaseProfile | null
  RealtorProfile: RealtorProfile | null
}

export async function GET() {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      console.log('[REALTOR_PROFILE_GET] No userId found')
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    console.log('[REALTOR_PROFILE_GET] userId:', userId)

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

    // First get the User record to get the database id
    const { data: userRecord, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !userRecord) {
      console.error('[REALTOR_PROFILE_GET] User lookup error:', userError)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Then get the realtor profile using the database id
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        brokerId,
        teamId,
        BaseProfile (
          bio,
          careerStage,
          goals,
          availability
        ),
        RealtorProfile (
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq('id', userRecord.id)
      .single() as { data: UserWithProfiles | null, error: any }

    console.log('[REALTOR_PROFILE_GET] Query result:', { user, error })

    if (error) {
      console.error('[REALTOR_PROFILE_GET_ERROR]', error.message)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!user) {
      console.log('[REALTOR_PROFILE_GET] No user found')
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Return the profile data
    const response = {
      companyName: user?.RealtorProfile?.companyName ?? null,
      licenseNumber: user?.RealtorProfile?.licenseNumber ?? null,
      phoneNumber: user?.RealtorProfile?.phoneNumber ?? null,
      brokerId: user?.brokerId ?? null,
      teamId: user?.teamId ?? null,
      bio: user?.BaseProfile?.bio ?? null
    }

    console.log('[REALTOR_PROFILE_GET] Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[REALTOR_PROFILE_GET] Unexpected error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
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
      .eq('userId', userId)
      .single()

    if (userDataError || !userData) {
      console.error('[REALTOR_PROFILE_PUT_ERROR] User lookup:', userDataError)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[REALTOR_PROFILE_PUT] Found user:', userData)

    // Try to update the realtor profile
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

    // Try to update the base profile
    const { data: baseProfile, error: baseError } = await supabase
      .from('BaseProfile')
      .upsert({
        userId: userData.id,
        bio: body.bio,
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

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      data: realtorProfile 
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
