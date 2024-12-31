'use server'

import { auth } from '@clerk/nextjs/server'
import { createScheduledEvent } from '@/lib/calendly-api'
import { createClient } from '@supabase/supabase-js'

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
    // Create Calendly event
    const scheduledEvent = await createScheduledEvent(data.eventTypeUrl, {
      start_time: data.scheduledTime,
      email: data.inviteeEmail,
      event_memberships: [{ user: userId }],
    })

    // Store booking in database
    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        event_id: scheduledEvent.id,
        event_uri: data.eventUri,
        coach_name: data.coachName,
        start_time: data.scheduledTime,
        invitee_email: data.inviteeEmail,
        status: 'confirmed'
      })

    if (error) throw error

    return scheduledEvent
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}