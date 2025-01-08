'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface BookingData {
  eventTypeUrl: string
  scheduledTime: string
  inviteeEmail: string
  eventUri: string
  coachId: number
}

export async function createBooking(data: BookingData) {
  console.log('[DEBUG] Booking data:', data)
  const { userId: clerkUserId } = await auth()
  
  if (!clerkUserId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the database user ID for the mentee (current user)
    const { data: menteeData, error: menteeError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single()

    if (menteeError || !menteeData) {
      console.error('[BOOKING_ERROR]', menteeError)
      throw new Error('Failed to find user')
    }

    console.log('[DEBUG] Found mentee:', menteeData)

    // Verify the mentee is a realtor
    if (menteeData.role !== 'realtor') {
      throw new Error('Only realtors can book coaching sessions')
    }

    // Get the coach data to verify they exist and are a coach
    const { data: coachData, error: coachError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', data.coachId)
      .single()

    console.log('[DEBUG] Coach lookup result:', { coachData, coachError })

    if (coachError || !coachData) {
      console.error('[BOOKING_ERROR]', coachError)
      throw new Error('Failed to find coach')
    }

    // Verify the user is actually a coach
    if (coachData.role !== 'realtor_coach') {
      throw new Error('Invalid coach selected')
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

    // Store in Supabase Session table
    const { error } = await supabase
      .from('Session')
      .insert({
        coachDbId: coachData.id,
        menteeDbId: menteeData.id,
        calendlyEventId: data.eventUri,
        durationMinutes: 60,
        status: 'scheduled',
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