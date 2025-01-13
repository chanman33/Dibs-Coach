'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface BookingData {
  eventTypeUrl: string
  scheduledTime: string
  inviteeEmail: string
  eventUri: string
  coachId: number
}

export async function createBooking(data: BookingData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

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

    // Get mentee's database ID
    const { data: menteeData, error: menteeError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (menteeError || !menteeData) {
      console.error('[BOOKING_ERROR]', menteeError)
      throw new Error('User not found')
    }

    // Get coach's database ID
    const { data: coachData, error: coachError } = await supabase
      .from('User')
      .select('id')
      .eq('id', data.coachId)
      .single()

    if (coachError || !coachData) {
      console.error('[BOOKING_ERROR]', coachError)
      throw new Error('Coach not found')
    }

    // Verify coach profile exists
    const { data: coachProfile, error: profileError } = await supabase
      .from('RealtorCoachProfile')
      .select('userDbId')
      .eq('userDbId', coachData.id)
      .single()

    if (profileError || !coachProfile) {
      console.error('[BOOKING_ERROR]', profileError)
      throw new Error('Coach profile not found')
    }

    // Get event details from Calendly
    const calendlyEvent = await fetch(data.eventUri, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`
      }
    }).then(res => res.json())

    const startTime = new Date(calendlyEvent.resource.start_time)
    const endTime = new Date(calendlyEvent.resource.end_time)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    // Store in Supabase Session table
    const { error } = await supabase
      .from('Session')
      .insert({
        coachDbId: coachData.id,
        menteeDbId: menteeData.id,
        calendlyEventId: data.eventUri,
        durationMinutes,
        status: 'scheduled',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error('[BOOKING_ERROR]', error)
      throw new Error(error.message || 'Failed to create session')
    }

    revalidatePath('/dashboard/realtor/coaches')
    return { success: true }
  } catch (error: any) {
    console.error('[BOOKING_ERROR]', error)
    throw new Error(error.message || 'Failed to create session')
  }
}