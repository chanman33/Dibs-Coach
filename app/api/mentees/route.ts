import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ROLES } from '@/utils/roles/roles'

interface RealtorProfile {
  id: number
  companyName: string | null
  licenseNumber: string | null
  phoneNumber: string | null
}

interface Mentee {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  realtorProfile: RealtorProfile | null
}

interface Session {
  menteeDbId: number
  mentee: Mentee
}

export async function GET() {
  try {
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
      console.error('[MENTEES_GET_ERROR] User lookup:', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== ROLES.REALTOR_COACH) {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    // Get all sessions with mentee info and their realtor profiles
    const { data: sessions, error: sessionsError } = await supabase
      .from('Session')
      .select(`
        menteeDbId,
        mentee:User!Session_menteeDbId_fkey (
          id,
          firstName,
          lastName,
          email,
          profileImageUrl,
          realtorProfile:RealtorProfile!inner (
            id,
            companyName,
            licenseNumber,
            phoneNumber
          )
        )
      `)
      .eq('coachDbId', userData.id)
      .order('createdAt', { ascending: false }) as { data: Session[] | null, error: any }

    if (sessionsError) {
      console.error('[MENTEES_GET_ERROR] Sessions lookup:', sessionsError)
      return new NextResponse('Failed to fetch mentees', { status: 500 })
    }

    // Extract unique mentees from sessions
    const menteeMap = new Map<number, Mentee>()
    sessions?.forEach(session => {
      if (!menteeMap.has(session.menteeDbId)) {
        menteeMap.set(session.menteeDbId, session.mentee)
      }
    })

    const mentees = Array.from(menteeMap.values())

    return NextResponse.json(mentees)
  } catch (error) {
    console.error('[MENTEES_GET_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 