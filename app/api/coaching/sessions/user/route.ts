import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

// Validation schema for query parameters
const QuerySchema = z.object({
  role: z.enum(['coach', 'mentee']).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validatedParams = QuerySchema.parse({
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    // Build query
    let query = supabase
      .from('Session')
      .select(`
        id,
        startTime,
        endTime,
        status,
        durationMinutes,
        coach:coachDbId (
          id,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        mentee:menteeDbId (
          id,
          firstName,
          lastName,
          email,
          profileImageUrl
        )
      `)

    // Apply role filter
    if (validatedParams.role === 'coach') {
      query = query.eq('coachDbId', user.id)
    } else if (validatedParams.role === 'mentee') {
      query = query.eq('menteeDbId', user.id)
    } else {
      // If no role specified, show all sessions where user is either coach or mentee
      query = query.or(`coachDbId.eq.${user.id},menteeDbId.eq.${user.id}`)
    }

    // Apply status filter
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status)
    }

    // Apply date range filter
    if (validatedParams.startDate) {
      query = query.gte('startTime', validatedParams.startDate)
    }
    if (validatedParams.endDate) {
      query = query.lte('endTime', validatedParams.endDate)
    }

    // Execute query
    const { data: sessions, error: sessionsError } = await query
      .order('startTime', { ascending: true })

    if (sessionsError) {
      console.error('[FETCH_SESSIONS_ERROR]', sessionsError)
      return new NextResponse('Failed to fetch sessions', { status: 500 })
    }

    return NextResponse.json({ data: sessions })

  } catch (error) {
    console.error('[FETCH_SESSIONS_ERROR]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
} 