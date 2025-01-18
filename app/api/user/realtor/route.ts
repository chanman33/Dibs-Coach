import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface RealtorProfile {
  id: number
  userDbId: number
  companyName: string | null
  licenseNumber: string | null
  phoneNumber: string | null
}

interface UserResponse {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  status: string
  brokerId: number | null
  teamId: number | null
  RealtorProfile: RealtorProfile | null
}

export async function GET() {
  try {
    // Auth check
    const { userId: clerkUserId } = await auth()
    const clerkUser = await currentUser()
    
    if (!clerkUserId || !clerkUser) {
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

    // Get user with realtor profile in a single query
    console.log('[REALTOR_PROFILE_GET] Looking up user:', clerkUserId)
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        email,
        firstName,
        lastName,
        role,
        status,
        brokerId,
        teamId,
        RealtorProfile!left (
          id,
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq('userId', clerkUserId)
      .single() as { data: UserResponse | null, error: any }

    if (error) {
      // Handle new user case
      if (error.code === 'PGRST116' && clerkUser) {
        console.log('[REALTOR_PROFILE_INFO] New user detected:', {
          clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress
        })
        return NextResponse.json({
          role: 'realtor',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          companyName: null,
          licenseNumber: null,
          phoneNumber: null,
          brokerId: null,
          teamId: null,
          status: 'active',
          isNewUser: true
        })
      }
      
      // Handle actual errors
      console.error('[REALTOR_PROFILE_ERROR] User lookup failed:', {
        error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
        clerkUserId
      })
      return NextResponse.json(
        { 
          message: `Database error: ${error.message}`,
          details: error
        },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[REALTOR_PROFILE_GET] Raw user data:', user)
    console.log('[REALTOR_PROFILE_GET] RealtorProfile data:', user.RealtorProfile)

    // Return the combined profile data
    const realtorProfile = Array.isArray(user.RealtorProfile) 
      ? user.RealtorProfile[0] 
      : user.RealtorProfile

    const response = {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: realtorProfile?.companyName ?? null,
      licenseNumber: realtorProfile?.licenseNumber ?? null,
      phoneNumber: realtorProfile?.phoneNumber ?? null,
      brokerId: user.brokerId,
      teamId: user.teamId,
      status: user.status,
      isNewUser: !realtorProfile
    }

    console.log('[REALTOR_PROFILE_GET] Formatted response:', response)
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

    // Get the existing user (should exist from auth webhook)
    console.log('[REALTOR_PROFILE_PUT] Looking up user with Clerk ID:', clerkUserId)
    let user;
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, email, userId')
      .eq('userId', clerkUserId)
      .single()

    if (userError) {
      console.error('[REALTOR_PROFILE_PUT_ERROR] User lookup failed:', {
        error: userError,
        code: userError.code,
        details: userError.details,
        clerkUserId,
        message: userError.message
      })
      return NextResponse.json(
        { 
          message: 'Failed to find user account',
          details: userError.message 
        },
        { status: 404 }
      )
    }

    if (!userData) {
      console.error('[REALTOR_PROFILE_PUT_ERROR] No user found for Clerk ID:', clerkUserId)
      return NextResponse.json(
        { 
          message: 'User not found',
          details: 'No user record exists for this Clerk ID'
        },
        { status: 404 }
      )
    }

    user = userData

    // Update the user's Clerk ID if it doesn't match
    if (!user.userId || user.userId !== clerkUserId) {
      console.log('[REALTOR_PROFILE_PUT] Updating user Clerk ID:', {
        oldId: user.userId,
        newId: clerkUserId
      })
      const { error: updateError } = await supabase
        .from('User')
        .update({ 
          userId: clerkUserId, 
          updatedAt: new Date().toISOString() 
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[REALTOR_PROFILE_PUT_ERROR] Failed to update user Clerk ID:', updateError)
        return NextResponse.json(
          { message: 'Failed to update user account' },
          { status: 500 }
        )
      }
    }

    console.log('[REALTOR_PROFILE_PUT] Found user:', user)

    // Check if realtor profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('RealtorProfile')
      .select('*')
      .eq('userDbId', user.id)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('[REALTOR_PROFILE_PUT_ERROR] Profile check error:', profileCheckError)
      return NextResponse.json(
        { message: 'Failed to check existing profile' },
        { status: 500 }
      )
    }

    const realtorData = {
      userDbId: user.id,
      companyName: body.companyName || null,
      licenseNumber: body.licenseNumber || null,
      phoneNumber: body.phoneNumber || null,
      updatedAt: new Date().toISOString()
    }

    let realtorProfile;
    let realtorError;

    if (!existingProfile) {
      // Insert new profile
      console.log('[REALTOR_PROFILE_PUT] Creating new realtor profile:', realtorData)
      const { data, error } = await supabase
        .from('RealtorProfile')
        .insert([realtorData])
        .select()
        .single()
      
      realtorProfile = data
      realtorError = error
    } else {
      // Update existing profile
      console.log('[REALTOR_PROFILE_PUT] Updating existing realtor profile:', realtorData)
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
      console.error('[REALTOR_PROFILE_PUT_ERROR] Realtor profile error:', {
        error: realtorError,
        code: realtorError.code,
        details: realtorError.details,
        hint: realtorError.hint,
        message: realtorError.message
      })
      return NextResponse.json(
        { 
          message: 'Failed to update realtor profile',
          error: realtorError.message,
          details: realtorError
        },
        { status: 500 }
      )
    }

    console.log('[REALTOR_PROFILE_PUT] Profile updated successfully:', realtorProfile)
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      data: realtorProfile
    })

  } catch (error) {
    console.error('[REALTOR_PROFILE_PUT_ERROR] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
