import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      console.log('[REALTOR_PROFILE_GET] No userId found')
      return new NextResponse('Unauthorized', { status: 401 })
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

    if (!userRecord) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Then get the realtor profile using the database id
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        brokerId,
        teamId,
        RealtorProfile (
          companyName,
          licenseNumber,
          phoneNumber,
          bio,
          updatedAt
        )
      `)
      .eq('id', userRecord.id)
      .single()

    console.log('[REALTOR_PROFILE_GET] Query result:', { user, error })

    if (error) {
      console.error('[REALTOR_PROFILE_GET_ERROR]', error.message)
      // More specific error handling
      if (error.code === 'PGRST116') {
        return new NextResponse('User not found', { status: 404 })
      }
      return new NextResponse(`Database error: ${error.message}`, { status: 500 })
    }

    // Add explicit check for RealtorProfile
    if (!user) {
      console.log('[REALTOR_PROFILE_GET] No user found')
      return new NextResponse('User not found', { status: 404 })
    }

    // Return the profile data
    // ignore the type errors for now - 
    // TODO: fix this - problem with typescript and supabase nested objects
    const response = { // @ts-ignore
      companyName: user?.RealtorProfile?.companyName || null, // @ts-ignore
      licenseNumber: user?.RealtorProfile?.licenseNumber || null, // @ts-ignore
      phoneNumber: user?.RealtorProfile?.phoneNumber || null, // @ts-ignore
      bio: user?.RealtorProfile?.bio || null, // @ts-ignore
      brokerId: user?.brokerId || null,
      teamId: user?.teamId || null, // @ts-ignore
      updatedAt: user?.RealtorProfile?.updatedAt || null, 
    }

    console.log('[REALTOR_PROFILE_GET] Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[REALTOR_PROFILE_GET] Unexpected error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[REALTOR_PROFILE_PUT] Received body:', body)

    // Only validate license number
    if (!body.licenseNumber) {
      return NextResponse.json(
        { error: 'License number is required' }, 
        { status: 400 }
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

    // Get user id from database
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userDataError || !userData) {
      console.error('[REALTOR_PROFILE_GET_USER_ERROR]', userDataError)
      return new NextResponse('User not found', { status: 404 })
    }

    // Update or create realtor profile
    const { data: profile, error: profileError } = await supabase
      .from('RealtorProfile')
      .upsert({
        userId: userData.id,
        companyName: body.companyName,
        licenseNumber: body.licenseNumber,
        phoneNumber: body.phoneNumber,
        bio: body.bio,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('[REALTOR_PROFILE_UPSERT_ERROR]', profileError)
      return new NextResponse('Failed to update profile', { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[REALTOR_PROFILE_PUT]', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
