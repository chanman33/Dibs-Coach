import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ROLES } from '@/utils/roles/roles'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const menteeId = Number(resolvedParams.id)
    if (!menteeId || isNaN(menteeId)) {
      return new NextResponse('Valid mentee ID is required', { status: 400 })
    }

    // Auth check
    const { userId } = await auth()
    if (!userId) {
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

    // Get coach's database ID and verify role
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single()

    if (userError || !userData) {
      console.error('[MENTEE_DETAILS_ERROR] User lookup:', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== ROLES.REALTOR_COACH) {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    // Verify this mentee has sessions with this coach
    const { data: sessionCheck, error: sessionError } = await supabase
      .from('Session')
      .select('id')
      .eq('coachDbId', userData.id)
      .eq('menteeDbId', menteeId)
      .limit(1)
      .single()

    if (sessionError || !sessionCheck) {
      return new NextResponse('Mentee not found or not authorized', { status: 404 })
    }

    // Get mentee details
    const { data: menteeData, error: menteeError } = await supabase
      .from('User')
      .select(`
        id,
        firstName,
        lastName,
        email,
        profileImageUrl,
        RealtorProfile (
          id,
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq('id', menteeId)
      .single()

    if (menteeError || !menteeData) {
      console.error('[MENTEE_DETAILS_ERROR] Mentee lookup:', menteeError)
      return new NextResponse('Failed to fetch mentee details', { status: 500 })
    }

    // Get mentee's goals (from notes marked as goals)
    const { data: goals } = await supabase
      .from('Note')
      .select('id, content, createdAt, updatedAt')
      .eq('relatedUserDbId', menteeId)
      .eq('visibility', 'goal')
      .order('createdAt', { ascending: false })

    // Get mentee's sessions
    const { data: sessions, error: sessionQueryError } = await supabase
      .from('Session')
      .select(`
        id,
        durationMinutes,
        status,
        createdAt,
        notes:Note (
          id,
          content,
          createdAt
        )
      `)
      .eq('menteeDbId', menteeId)
      .eq('coachDbId', userData.id)
      .order('createdAt', { ascending: false })

    if (sessionQueryError) {
      console.error('[MENTEE_DETAILS_ERROR] Session lookup:', sessionQueryError)
    }
    console.log('[MENTEE_DETAILS] Sessions found:', sessions)

    // Get mentee's notes
    const { data: notes, error: notesError } = await supabase
      .from('Note')
      .select('id, content, createdAt, updatedAt')
      .eq('relatedUserDbId', menteeId)
      .eq('authorDbId', userData.id)
      .neq('visibility', 'goal')
      .order('createdAt', { ascending: false })

    return NextResponse.json({
      ...menteeData,
      realtorProfile: menteeData.RealtorProfile,
      goals: goals || [],
      sessions: sessions || [],
      notes: notes || []
    })
  } catch (error) {
    console.error('[MENTEE_DETAILS_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 