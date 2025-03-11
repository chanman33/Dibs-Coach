"use server"

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { env } from '@/lib/env'

const bookingSchema = z.object({
  coachId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  sessionType: z.string(),
  notes: z.string().optional(),
})

export async function createBooking(formData: FormData) {
  const supabase = createClient(cookies())

  try {
    // Validate form data
    const validatedData = bookingSchema.parse({
      coachId: formData.get('coachId'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      durationMinutes: parseInt(formData.get('durationMinutes') as string),
      sessionType: formData.get('sessionType'),
      notes: formData.get('notes'),
    })

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('CoachProfile')
      .select(`
        *,
        user:User (
          id,
          email,
          firstName,
          lastName
        )
      `)
      .eq('id', validatedData.coachId)
      .single()

    if (coachError) throw coachError

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .insert({
        coachId: validatedData.coachId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        durationMinutes: validatedData.durationMinutes,
        sessionType: validatedData.sessionType,
        notes: validatedData.notes,
        status: 'PENDING'
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Revalidate paths
    revalidatePath('/dashboard/mentee/sessions')
    revalidatePath('/dashboard/coach/sessions')

    return { data: booking, error: null }
  } catch (error) {
    console.error('[CREATE_BOOKING_ERROR]', error)
    return {
      data: null,
      error: {
        message: 'Failed to create booking'
      }
    }
  }
}