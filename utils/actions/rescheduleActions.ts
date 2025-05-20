'use server'

import { z } from 'zod'
import { createCalClient } from '@/utils/cal'
import { auth } from '@clerk/nextjs'
import { createServerAuthClient } from '@/utils/auth'
import { generateUlid } from '@/utils/ulid'

// Schema for reschedule request validation
const rescheduleSchema = z.object({
  sessionUlid: z.string(),
  calBookingUid: z.string(),
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  reschedulingReason: z.string().optional(),
})

type RescheduleInput = z.infer<typeof rescheduleSchema>

export async function rescheduleSession(input: RescheduleInput) {
  try {
    // Validate input
    const validatedInput = rescheduleSchema.parse(input)
    const { sessionUlid, calBookingUid, newStartTime, newEndTime, reschedulingReason } = validatedInput
    
    // Get current user
    const { userId } = auth()
    if (!userId) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }
    }
    
    // Create Supabase client
    const supabase = createServerAuthClient()
    
    // Get user email for rescheduledBy field
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('email, ulid')
      .eq('userId', userId)
      .single()
      
    if (userError || !userData) {
      console.error('[RESCHEDULE_ERROR] Failed to get user data:', userError)
      return { data: null, error: { code: 'USER_NOT_FOUND', message: 'Could not find user data' } }
    }
    
    // Get session data to check permissions
    const { data: sessionData, error: sessionError } = await supabase
      .from('Session')
      .select('menteeUlid, coachUlid, status, startTime, endTime')
      .eq('ulid', sessionUlid)
      .single()
      
    if (sessionError || !sessionData) {
      console.error('[RESCHEDULE_ERROR] Failed to get session data:', sessionError)
      return { data: null, error: { code: 'SESSION_NOT_FOUND', message: 'Could not find session data' } }
    }
    
    // Check if user is a participant in the session
    if (sessionData.menteeUlid !== userData.ulid && sessionData.coachUlid !== userData.ulid) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User is not a participant in this session' } }
    }
    
    // Check if session can be rescheduled (not cancelled or completed)
    if (sessionData.status !== 'SCHEDULED' && sessionData.status !== 'RESCHEDULED') {
      return { 
        data: null, 
        error: { 
          code: 'INVALID_STATUS', 
          message: `Cannot reschedule a session with status: ${sessionData.status}` 
        } 
      }
    }
    
    // Get Cal.com integration to make API call
    const { data: calIntegration, error: calIntegrationError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calRefreshToken')
      .eq('userUlid', sessionData.coachUlid)
      .single()
      
    if (calIntegrationError || !calIntegration) {
      console.error('[RESCHEDULE_ERROR] Failed to get Cal integration:', calIntegrationError)
      return { data: null, error: { code: 'CAL_INTEGRATION_ERROR', message: 'Could not find Cal.com integration' } }
    }
    
    // Create Cal client 
    const calClient = createCalClient(calIntegration.calAccessToken)
    
    // Call Cal.com API to reschedule
    // According to docs, endpoint is POST /v2/bookings/{bookingUid}/reschedule
    const response = await fetch(`https://api.cal.com/v2/bookings/${calBookingUid}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${calIntegration.calAccessToken}`
      },
      body: JSON.stringify({
        start: new Date(newStartTime).toISOString(),
        rescheduledBy: userData.email,
        reschedulingReason: reschedulingReason || 'User requested reschedule',
      })
    })
    
    const calResponse = await response.json()
    
    if (!response.ok || calResponse.status !== 'success') {
      console.error('[RESCHEDULE_ERROR] Cal.com reschedule failed:', calResponse)
      return { 
        data: null, 
        error: { 
          code: 'CAL_API_ERROR', 
          message: 'Failed to reschedule in Cal.com' 
        } 
      }
    }
    
    // Update database - first update the CalBooking table
    const { error: updateCalError } = await supabase
      .from('CalBooking')
      .update({
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'CONFIRMED', // Reset status to confirmed if it was previously changed
        updatedAt: new Date().toISOString(),
      })
      .eq('calBookingUid', calBookingUid)
    
    if (updateCalError) {
      console.error('[RESCHEDULE_ERROR] Failed to update CalBooking:', updateCalError)
      return { data: null, error: { code: 'DB_ERROR', message: 'Failed to update booking in database' } }
    }
    
    // Create a new Session entry for the rescheduled session
    const newSessionUlid = generateUlid()
    const reschedulingHistoryEvent = {
      timestamp: new Date().toISOString(),
      oldStartTime: sessionData.startTime,
      oldEndTime: sessionData.endTime,
      newStartTime,
      newEndTime,
      rescheduledBy: userData.email,
      reason: reschedulingReason || 'User requested reschedule'
    }
    
    // Get any existing rescheduling history
    const { data: existingSession, error: existingSessionError } = await supabase
      .from('Session')
      .select('reschedulingHistory, originalSessionUlid')
      .eq('ulid', sessionUlid)
      .single()
      
    let reschedulingHistory = [reschedulingHistoryEvent]
    let originalSessionUlid = sessionUlid
    
    if (!existingSessionError && existingSession) {
      // If there's existing history, append to it
      if (existingSession.reschedulingHistory) {
        const existingHistory = Array.isArray(existingSession.reschedulingHistory) 
          ? existingSession.reschedulingHistory 
          : JSON.parse(existingSession.reschedulingHistory as string)
        reschedulingHistory = [...existingHistory, reschedulingHistoryEvent]
      }
      
      // If this session already has an original, use that instead
      if (existingSession.originalSessionUlid) {
        originalSessionUlid = existingSession.originalSessionUlid
      }
    }
    
    // Update the original session with rescheduledToUlid
    const { error: updateOriginalError } = await supabase
      .from('Session')
      .update({
        status: 'RESCHEDULED',
        rescheduledToUlid: newSessionUlid,
        updatedAt: new Date().toISOString(),
      })
      .eq('ulid', sessionUlid)
    
    if (updateOriginalError) {
      console.error('[RESCHEDULE_ERROR] Failed to update original session:', updateOriginalError)
      return { data: null, error: { code: 'DB_ERROR', message: 'Failed to update original session' } }
    }
    
    // Insert new session
    const { error: insertError } = await supabase
      .from('Session')
      .insert({
        ulid: newSessionUlid,
        menteeUlid: sessionData.menteeUlid,
        coachUlid: sessionData.coachUlid,
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'SCHEDULED',
        sessionType: 'MANAGED', // Default to managed type
        originalSessionUlid: originalSessionUlid,
        rescheduledFromUlid: sessionUlid,
        reschedulingHistory: reschedulingHistory,
        reschedulingReason: reschedulingReason || 'User requested reschedule',
        rescheduledBy: userData.email,
        calBookingUlid: calBookingUid, // Link to the same Cal booking which was updated
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    
    if (insertError) {
      console.error('[RESCHEDULE_ERROR] Failed to create new session:', insertError)
      return { data: null, error: { code: 'DB_ERROR', message: 'Failed to create new session record' } }
    }
    
    return { 
      data: {
        sessionUlid: newSessionUlid,
        startTime: newStartTime,
        endTime: newEndTime,
        coachUlid: sessionData.coachUlid
      }, 
      error: null 
    }
  } catch (error) {
    console.error('[RESCHEDULE_ERROR]', error)
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      } 
    }
  }
} 