import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

// Validation schemas
const TimeIntervalSchema = z.object({
  from: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  to: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
})

const RuleSchema = z.object({
  type: z.literal('wday'),
  wday: z.number().min(0).max(6),
  intervals: z.array(TimeIntervalSchema)
})

const ScheduleSchema = z.object({
  name: z.string().min(1),
  timezone: z.string(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
  rules: z.array(RuleSchema)
})

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !dbUser) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    // Get user's coaching availability schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('*')
      .eq('userDbId', dbUser.id)
      .order('createdAt', { ascending: false })

    if (schedulesError) {
      console.error('[COACHING_AVAILABILITY_ERROR]', schedulesError)
      return new NextResponse('Failed to fetch schedules', { status: 500 })
    }

    return NextResponse.json({ data: schedules })

  } catch (error) {
    console.error('[COACHING_AVAILABILITY_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = ScheduleSchema.parse(body)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !dbUser) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    // If this is set as default, unset other default schedules
    if (validatedData.isDefault) {
      await supabase
        .from('CoachingAvailabilitySchedule')
        .update({ isDefault: false })
        .eq('userDbId', dbUser.id)
        .eq('isDefault', true)
    }

    // Create new schedule
    const { data: schedule, error: createError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .insert([
        {
          userDbId: dbUser.id,
          name: validatedData.name,
          timezone: validatedData.timezone,
          isDefault: validatedData.isDefault ?? false,
          active: validatedData.active ?? true,
          rules: validatedData.rules,
          updatedAt: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('[COACHING_AVAILABILITY_ERROR]', createError)
      return new NextResponse('Failed to create schedule', { status: 500 })
    }

    return NextResponse.json({ data: schedule })

  } catch (error) {
    console.error('[COACHING_AVAILABILITY_ERROR]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return new NextResponse('Schedule ID is required', { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !dbUser) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    // Delete schedule (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .delete()
      .eq('id', scheduleId)
      .eq('userDbId', dbUser.id)

    if (deleteError) {
      console.error('[COACHING_AVAILABILITY_ERROR]', deleteError)
      return new NextResponse('Failed to delete schedule', { status: 500 })
    }

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('[COACHING_AVAILABILITY_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 