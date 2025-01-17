import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ROLES } from "@/utils/roles/roles";
import { userCreate } from "@/utils/data/user/userCreate";

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
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[REALTOR_PROFILE_GET] Looking up user:", clerkUserId);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Look up user in Supabase
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select(`
        id,
        email,
        firstName,
        lastName,
        role,
        status,
        realtorProfile (
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq("userId", clerkUserId)
      .single();

    // If user doesn't exist in Supabase, create them
    if (userError?.code === "PGRST116") {
      console.info("[REALTOR_PROFILE_INFO] New user detected:", {
        clerkUserId,
        email: user.emailAddresses[0]?.emailAddress
      });

      // Create user in Supabase
      const newUser = await userCreate({
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.imageUrl,
        userId: clerkUserId,
        role: ROLES.REALTOR,
      });

      return NextResponse.json({
        user: {
          ...newUser,
          realtorProfile: null
        }
      });
    }

    if (userError) {
      console.error("[REALTOR_PROFILE_ERROR] Error fetching user:", userError);
      return new NextResponse("Error fetching user profile", { status: 500 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("[REALTOR_PROFILE_ERROR] Unexpected error:", error);
    return new NextResponse("Internal server error", { status: 500 });
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
