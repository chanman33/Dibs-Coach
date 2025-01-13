'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

interface RealtorCoachProfile {
  specialty: string | null
  bio: string | null
  experience: string | null
  certifications: string[] | null
  availability: string | null
  sessionLength: string | null
  specialties: string | null
  calendlyUrl: string | null
  eventTypeUrl: string | null
  hourlyRate: number | null
}

interface CoachData {
  id: number
  userId: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  RealtorCoachProfile: RealtorCoachProfile
}

export async function fetchCoaches() {
  console.log('[DEBUG] Starting fetchCoaches...')
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

  try {
    console.log('[DEBUG] Executing Supabase query...')
    const { data: coachesData, error } = await supabase
      .from('User')
      .select<string, CoachData>(`
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
      .eq('role', 'realtor_coach')
      .not('RealtorCoachProfile', 'is', null)

    if (error) {
      console.error('[FETCH_COACHES_ERROR] Database error:', error)
      throw error
    }

    console.log('[DEBUG] Raw coaches data from DB:', JSON.stringify(coachesData, null, 2))

    if (!coachesData?.length) {
      console.log('[FETCH_COACHES_INFO] No coaches found in database')
      return { data: [], error: null }
    }

    // For each coach, try to get their Clerk profile image
    const updatedCoachesData = await Promise.all(coachesData.map(async (coach) => {
      if (!coach.userId) return coach;

      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(coach.userId);
        return {
          ...coach,
          profileImageUrl: clerkUser.imageUrl || coach.profileImageUrl
        };
      } catch (error) {
        console.error(`[FETCH_COACHES_ERROR] Failed to get Clerk data for user ${coach.userId}:`, error);
        return coach;
      }
    }));

    // Log each coach's profile data and image URL
    updatedCoachesData.forEach(coach => {
      console.log(`[DEBUG] Coach ${coach.id} profile:`, {
        name: `${coach.firstName} ${coach.lastName}`,
        hasProfile: !!coach.RealtorCoachProfile,
        profileData: coach.RealtorCoachProfile,
        imageUrl: coach.profileImageUrl
      });
    });

    return { data: updatedCoachesData, error: null };
  } catch (error) {
    console.error('[FETCH_COACHES_ERROR] Unexpected error:', error)
    return { data: null, error }
  }
}

export async function fetchCoachByClerkId(clerkId: string): Promise<{ data: CoachData | null, error: any }> {
  if (!clerkId) {
    console.error('[FETCH_COACH_ERROR] No clerk ID provided')
    return { data: null, error: new Error('No clerk ID provided') }
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
  
  try {
    const { data, error } = await supabase
      .from('User')
      .select<string, CoachData>(`
        id,
        userId,
        firstName,
        lastName,
        profileImageUrl,
        RealtorCoachProfile (
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
      .eq('userId', clerkId)
      .eq('role', 'realtor_coach')
      .not('RealtorCoachProfile', 'is', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[FETCH_COACH_INFO] No coach found for clerk ID: ${clerkId}`)
        return { data: null, error: null }
      }
      console.error('[FETCH_COACH_ERROR]', error)
      throw error
    }

    if (!data) {
      console.log(`[FETCH_COACH_INFO] No coach found for clerk ID: ${clerkId}`)
      return { data: null, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('[FETCH_COACH_ERROR]', error)
    return { data: null, error }
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    // First get the user's database ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('[UPDATE_COACH_ERROR] User lookup:', userError);
      return new NextResponse('User not found', { status: 404 });
    }

    if (userData.role !== 'realtor_coach') {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 });
    }

    const body = await req.json();
    console.log('[DEBUG] Updating coach profile with data:', body);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('RealtorCoachProfile')
      .select('*')
      .eq('userDbId', userData.id)
      .single();

    const profileData = {
      userDbId: userData.id,
      specialty: body.specialty || null,
      bio: body.bio || null,
      experience: body.experience || null,
      specialties: body.specialties 
        ? (Array.isArray(body.specialties)
            ? body.specialties
            : body.specialties.split(',').map((s: string) => s.trim()).filter(Boolean))
        : [],
      certifications: body.skills
        ? (Array.isArray(body.skills)
            ? body.skills
            : body.skills.split(',').map((s: string) => s.trim()).filter(Boolean))
        : [],
      // Preserve existing values for fields not managed in profile
      availability: existingProfile?.availability || null,
      sessionLength: existingProfile?.sessionLength || null,
      calendlyUrl: existingProfile?.calendlyUrl || null,
      eventTypeUrl: existingProfile?.eventTypeUrl || null,
      hourlyRate: existingProfile?.hourlyRate || null,
      updatedAt: new Date().toISOString()
    };

    let result;
    if (!existingProfile) {
      // Create new profile
      const { data, error } = await supabase
        .from('RealtorCoachProfile')
        .insert([profileData])
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Update existing profile
      const { data, error } = await supabase
        .from('RealtorCoachProfile')
        .update(profileData)
        .eq('userDbId', userData.id)
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error('[UPDATE_COACH_ERROR]', result.error);
      return new NextResponse(
        'Failed to update coach profile', 
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Coach profile updated successfully',
      data: result.data
    });

  } catch (error) {
    console.error('[UPDATE_COACH_ERROR]', error);
    return new NextResponse(
      'Internal server error',
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    // First get the user's database ID and role
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('[GET_COACH_ERROR] User lookup:', userError);
      return new NextResponse('User not found', { status: 404 });
    }

    if (userData.role !== 'realtor_coach') {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 });
    }

    // Get coach profile data
    const { data: profileData, error: profileError } = await supabase
      .from('RealtorCoachProfile')
      .select(`
        id,
        userDbId,
        specialty,
        bio,
        experience,
        certifications,
        availability,
        sessionLength,
        specialties,
        calendlyUrl,
        eventTypeUrl,
        hourlyRate,
        createdAt,
        updatedAt
      `)
      .eq('userDbId', userData.id)
      .single();

    if (profileError) {
      console.error('[GET_COACH_ERROR] Profile lookup:', profileError);
      if (profileError.code === 'PGRST116') {
        // No profile found - return empty data
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
        });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch coach profile',
        details: profileError
      }, { status: 500 });
    }

    // Ensure arrays are properly formatted
    const formattedData = {
      ...profileData,
      specialties: profileData?.specialties 
        ? (typeof profileData.specialties === 'string' 
            ? JSON.parse(profileData.specialties) 
            : profileData.specialties)
        : [],
      certifications: profileData?.certifications
        ? (typeof profileData.certifications === 'string'
            ? JSON.parse(profileData.certifications)
            : profileData.certifications)
        : []
    };

    return NextResponse.json(formattedData || {
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
    });

  } catch (error) {
    console.error('[GET_COACH_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}