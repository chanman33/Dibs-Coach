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
  coachName: string
}

export async function createBooking(data: BookingData) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the coach's user ID using a more flexible name search
    const { data: coachData, error: coachError } = await supabase
      .from('User')
      .select('id')
      .or(`firstName.ilike.%${data.coachName}%,lastName.ilike.%${data.coachName}%`)
      .eq('role', 'realtor_coach')
      .single()

    if (coachError || !coachData) {
      console.error('[BOOKING_ERROR]', coachError)
      throw new Error(`Coach "${data.coachName}" not found`)
    }

    // Store in Supabase Session table
    const { error } = await supabase
      .from('Session')
      .insert({
        coachId: coachData.id,
        menteeId: userId,
        calendlyEventId: data.eventUri,
        durationMinutes: 60, // Default to 1 hour, can be made dynamic if needed
        status: 'scheduled'
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