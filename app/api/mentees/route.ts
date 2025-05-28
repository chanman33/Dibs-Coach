import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { type AuthContext } from '@/utils/types/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

// Type definitions
interface Mentee {
  ulid: string
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  phoneNumber: string | null
  totalYearsRE: number
  realEstateDomains: string[] | null
}

export const GET = withApiAuth<Mentee[]>(async (req, ctx: AuthContext) => {
  const { userUlid } = ctx
  try {
    const supabase = await createAuthClient()

    // First get all mentee ULIDs from sessions
    const { data: sessionMentees, error: sessionError } = await supabase
      .from("Session")
      .select("menteeUlid")
      .eq("coachUlid", userUlid)
      .order("createdAt", { ascending: false })

    if (sessionError) {
      console.error("[MENTEES_ERROR] Failed to fetch session mentees:", { userUlid, error: sessionError })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch mentees'
        }
      }, { status: 500 })
    }

    // If no sessions found, return empty array
    if (!sessionMentees || sessionMentees.length === 0) {
      return NextResponse.json<ApiResponse<Mentee[]>>({ 
        data: [],
        error: null
      })
    }

    // Get unique mentee ULIDs
    const uniqueMenteeUlids = Array.from(new Set(sessionMentees.map(s => s.menteeUlid)))

    // Fetch mentee details
    const { data: mentees, error: menteesError } = await supabase
      .from("User")
      .select(`
        ulid,
        firstName,
        lastName,
        email,
        profileImageUrl,
        phoneNumber,
        totalYearsRE,
        realEstateDomains
      `)
      .in("ulid", uniqueMenteeUlids)

    if (menteesError) {
      console.error("[MENTEES_ERROR] Failed to fetch mentee details:", { userUlid, error: menteesError })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch mentee details'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Mentee[]>>({ 
      data: (mentees || []).map(mentee => ({
        ...mentee,
        realEstateDomains: mentee.realEstateDomains || []
      })) as Mentee[],
      error: null
    })
  } catch (error) {
    console.error("[MENTEES_ERROR] Unexpected error:", error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredCapabilities: [USER_CAPABILITIES.COACH] }) 