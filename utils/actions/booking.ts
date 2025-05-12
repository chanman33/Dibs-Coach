"use server"

import { createServerAuthClient } from '@/utils/auth/server-client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { env } from '@/lib/env'
import { generateUlid } from '@/utils/ulid'

// Assuming SessionType enum values from your prisma schema
// enum SessionType { MANAGED, GROUP_SESSION, OFFICE_HOURS }
// enum SessionStatus { SCHEDULED, COMPLETED, RESCHEDULED, CANCELLED, ABSENT }

const bookingSchema = z.object({
  coachId: z.string().length(26, { message: "Invalid Coach ULID format" }),
  menteeUlid: z.string().length(26, { message: "Invalid Mentee ULID format" }),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionType: z.enum(['MANAGED', 'GROUP_SESSION', 'OFFICE_HOURS']), // Match SessionType enum
  notes: z.string().optional(),
})

export async function createBooking(formData: FormData) {
  try {
    const supabase = await createServerAuthClient()

    // Validate form data
    const validatedData = bookingSchema.parse({
      coachId: formData.get('coachId'),
      menteeUlid: formData.get('menteeUlid'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      sessionType: formData.get('sessionType'),
      notes: formData.get('notes'),
    })

    // Get coach's User ULID from CoachProfile
    const { data: coachProfileData, error: coachError } = await supabase
      .from('CoachProfile')
      .select('userUlid')
      .eq('ulid', validatedData.coachId as any)
      .single()

    if (coachError) {
      console.error('Error fetching coach profile:', coachError.message);
      throw new Error(`Failed to fetch coach profile: ${coachError.message}`);
    }
    if (!coachProfileData) {
      throw new Error('Coach profile not found.')
    }

    const coachUserUlid = (coachProfileData as any).userUlid;

    if (typeof coachUserUlid !== 'string' || !coachUserUlid || coachUserUlid.length !== 26) {
      throw new Error('Coach userUlid is missing, not a string, or not a valid ULID.');
    }

    const newSessionUlid = generateUlid()
    const now = new Date().toISOString();

    // Create Session
    const { data: booking, error: bookingError } = await supabase
      .from('Session')
      .insert({
        ulid: newSessionUlid,
        coachUlid: coachUserUlid,
        menteeUlid: validatedData.menteeUlid,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        status: 'SCHEDULED',
        sessionType: validatedData.sessionType,
        sessionNotes: validatedData.notes,
        createdAt: now,
        updatedAt: now,
      } as any)
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