'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs'
import { createServerAuthClient } from '@/utils/auth'
import { generateUlid } from '@/utils/ulid'
import { ensureValidCalToken } from '@/utils/actions/cal/cal-tokens'
import { CalTokenService } from '@/lib/cal/cal-service' // For direct refresh and getting token from result
// import { env } from '@/lib/env' // No longer directly needed here if not using client_id/secret headers

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
    
    // Fetch the actual Cal.com Booking UID from our CalBooking table
    const { data: calBookingData, error: calBookingFetchError } = await supabase
      .from('CalBooking')
      .select('calBookingUid') 
      .eq('ulid', validatedInput.calBookingUid) 
      .single()

    if (calBookingFetchError || !calBookingData || !calBookingData.calBookingUid) {
      console.error('[RESCHEDULE_ERROR] Failed to get CalBooking record or its calBookingUid:', calBookingFetchError, calBookingData)
      return { data: null, error: { code: 'CAL_BOOKING_DATA_NOT_FOUND', message: 'Could not find Cal.com booking identifier in our records' } }
    }
    
    const actualCalComBookingUid = calBookingData.calBookingUid;
    
    // Get a valid Cal.com access token using the token management system
    let tokenResult = await ensureValidCalToken(sessionData.coachUlid);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      console.error('[RESCHEDULE_ERROR] Initial attempt to get valid Cal.com token failed:', tokenResult.error);
      return { 
        data: null, 
        error: { 
          code: 'CAL_TOKEN_ERROR', 
          message: `Failed to authenticate with Cal.com: ${tokenResult.error || 'No access token found'}` 
        } 
      };
    }
    
    let currentAccessToken = tokenResult.accessToken;

    // Function to make the API call
    const makeRescheduleRequest = async (token: string) => {
      console.log('[RESCHEDULE_INFO] Attempting Cal.com reschedule for booking UID:', actualCalComBookingUid);
      return fetch(`https://api.cal.com/v2/bookings/${actualCalComBookingUid}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          start: new Date(newStartTime).toISOString(),
          rescheduledBy: userData.email, // This remains a point of investigation
          reschedulingReason: reschedulingReason || 'User requested reschedule',
        })
      });
    };

    // Initial API Call
    let response = await makeRescheduleRequest(currentAccessToken);
    let calResponse;
    let rawResponseText = '';

    try {
      // Try to get raw text first if not ok, for better logging
      if (!response.ok) {
        rawResponseText = await response.text(); // Get raw text for logging
        // Attempt to parse it as JSON anyway, as Cal.com might send structured errors
        try {
          calResponse = JSON.parse(rawResponseText);
        } catch (jsonParseError) {
          // If JSON parsing fails, calResponse remains undefined, rawResponseText is logged
          console.warn('[RESCHEDULE_WARN] Failed to parse non-ok Cal.com response as JSON. Raw text will be primary error source.', jsonParseError);
        }
      } else {
        // If response.ok, parse as JSON directly
        calResponse = await response.json();
      }
    } catch (e) {
      // This catch is for network errors or if response.json()/response.text() itself throws unexpectedly
      console.error('[RESCHEDULE_ERROR] Error processing Cal.com response:', e);
      // Try to get response.text() if not already fetched and response object exists
      if (!rawResponseText && response && typeof response.text === 'function') {
        try {
            rawResponseText = await response.text();
        } catch (textError) {
            console.error('[RESCHEDULE_ERROR] Could not get raw text from errored response either.', textError);
        }
      }
      return { 
        data: null, 
        error: { 
          code: 'CAL_API_ERROR', 
          message: `Error processing Cal.com response (status: ${response?.status}). Raw: ${rawResponseText || 'N/A'}`
        } 
      };
    }
    
    // Handle token expiration or auth errors (401 for unauthorized, 498 for token expired by Cal.com)
    if (response.status === 401 || response.status === 498) {
      console.warn(`[RESCHEDULE_INFO] Cal.com API reported token error (${response.status}). Attempting refresh. Raw Response: ${rawResponseText}. Parsed Response:`, calResponse);
      
      const refreshApiResult = await CalTokenService.refreshTokens(sessionData.coachUlid, true);
      
      if (!refreshApiResult.success || !refreshApiResult.tokens?.access_token) {
        console.error('[RESCHEDULE_ERROR] Failed to refresh Cal.com token after API error:', refreshApiResult.error);
        return { 
          data: null, 
          error: { 
            code: 'CAL_TOKEN_REFRESH_ERROR', 
            message: `Failed to refresh Cal.com token: ${refreshApiResult.error || 'No new token received'}` 
          } 
        };
      }
      
      currentAccessToken = refreshApiResult.tokens.access_token;
      console.log('[RESCHEDULE_INFO] Token refreshed successfully. Retrying API call with new token.');

      // Retry API call with the new token from refreshResult
      response = await makeRescheduleRequest(currentAccessToken);
      rawResponseText = ''; // Reset for retry
      try {
        if (!response.ok) {
            rawResponseText = await response.text();
            try {
                calResponse = JSON.parse(rawResponseText);
            } catch (jsonParseError) {
                console.warn('[RESCHEDULE_WARN] Failed to parse non-ok Cal.com retry response as JSON.', jsonParseError);
            }
        } else {
            calResponse = await response.json();
        }
      } catch (e) {
        console.error('[RESCHEDULE_ERROR] Error processing Cal.com retry response:', e);
        if (!rawResponseText && response && typeof response.text === 'function') {
            try { rawResponseText = await response.text(); } catch (textError) { /* best effort */ }
        }
        return { 
          data: null, 
          error: { 
            code: 'CAL_API_RETRY_ERROR', 
            message: `Error processing Cal.com retry response (status: ${response?.status}). Raw: ${rawResponseText || 'N/A'}`
          } 
        };
      }
      
      if (!response.ok) {
        console.error('[RESCHEDULE_ERROR] Cal.com reschedule retry failed:', { status: response.status, rawResponse: rawResponseText, parsedResponse: calResponse });
        return { 
          data: null, 
          error: { 
            code: 'CAL_API_RETRY_ERROR', 
            message: calResponse?.error?.message || calResponse?.message || `Failed to reschedule in Cal.com after token refresh (status: ${response.status}). Raw: ${rawResponseText}` 
          } 
        };
      }
    } else if (!response.ok) {
      // Handle other non-401/498 errors from the initial call
      console.error('[RESCHEDULE_ERROR] Cal.com reschedule failed (initial attempt):', { status: response.status, rawResponse: rawResponseText, parsedResponse: calResponse });
      return { 
        data: null, 
        error: { 
          code: 'CAL_API_ERROR', 
          message: calResponse?.error?.message || calResponse?.message || `Failed to reschedule in Cal.com (status: ${response.status}). Raw: ${rawResponseText}` 
        } 
      };
    }
    
    // After initial call or successful retry, check final Cal.com status in parsed response
    // Ensure calResponse is defined and has a status property
    if (!calResponse || typeof calResponse.status === 'undefined') {
      console.error('[RESCHEDULE_ERROR] Cal.com response is undefined or missing status after processing. Initial response status:', response.status, 'Raw data:', rawResponseText, 'Parsed data:', calResponse);
      return { 
        data: null, 
        error: { 
          code: 'CAL_INVALID_RESPONSE_STRUCTURE', 
          message: 'Cal.com returned an unprocessable response structure.'
        } 
      };
    }

    if (calResponse.status !== 'success') {
      console.error('[RESCHEDULE_ERROR] Cal.com returned non-success status after processing:', {calApiResponse: calResponse, rawInitialResponse: rawResponseText });
      return { 
        data: null, 
        error: { 
          code: 'CAL_OPERATION_ERROR', 
          message: calResponse.error?.message || calResponse.message || `Cal.com operation was not successful. Raw: ${rawResponseText}` 
        } 
      };
    }
    
    const calData = calResponse.data;
    if (!calData || !calData.start || !calData.end) {
        console.error('[RESCHEDULE_ERROR] Cal.com response data is missing required fields (start, end):', {calApiResponse: calResponse, rawInitialResponse: rawResponseText });
        return { 
            data: null, 
            error: { 
                code: 'CAL_INVALID_RESPONSE', 
                message: 'Cal.com returned an invalid response after reschedule.'
            }
        };
    }
    const confirmedStartTime = calData.start;
    const confirmedEndTime = calData.end;
    
    // Update database - first update the CalBooking table
    const mainAttendee = calData.attendees && calData.attendees.length > 0 ? calData.attendees[0] : null;

    const { error: updateCalError } = await supabase
      .from('CalBooking')
      .update({
        startTime: confirmedStartTime,
        endTime: confirmedEndTime,
        status: calData.status === 'accepted' ? 'CONFIRMED' : calData.status?.toUpperCase() || 'CONFIRMED', // calResponse.status here is from the booking object, not the API wrapper
        title: calData.title,
        description: calData.description,
        meetingUrl: calData.meetingUrl,
        location: calData.location,
        calBookingUid: calData.uid, 
        hosts: calData.hosts,
        duration: calData.duration,
        eventTypeId: calData.eventTypeId,
        eventTypeSlug: calData.eventType?.slug,
        metadata: calData.metadata,
        icsUid: calData.icsUid,
        attendeeName: mainAttendee?.name,
        attendeeEmail: mainAttendee?.email,
        attendeeTimeZone: mainAttendee?.timeZone,
        allAttendees: JSON.stringify(calData.attendees),
        guests: calData.guests,
        bookingFieldsResponses: calData.bookingFieldsResponses,
        updatedAt: calData.updatedAt || new Date().toISOString(),
      })
      .eq('ulid', validatedInput.calBookingUid) 
    
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
      newStartTime: confirmedStartTime, 
      newEndTime: confirmedEndTime,     
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
      if (existingSession.reschedulingHistory) {
        const existingHistory = Array.isArray(existingSession.reschedulingHistory) 
          ? existingSession.reschedulingHistory 
          : JSON.parse(existingSession.reschedulingHistory as string)
        reschedulingHistory = [...existingHistory, reschedulingHistoryEvent]
      }
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
        startTime: confirmedStartTime, 
        endTime: confirmedEndTime,     
        status: 'SCHEDULED',
        sessionType: 'MANAGED', 
        originalSessionUlid: originalSessionUlid,
        rescheduledFromUlid: sessionUlid,
        reschedulingHistory: reschedulingHistory,
        reschedulingReason: reschedulingReason || 'User requested reschedule',
        rescheduledBy: userData.email,
        calBookingUlid: validatedInput.calBookingUid, 
        zoomJoinUrl: calData.meetingUrl, 
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
        startTime: confirmedStartTime, 
        endTime: confirmedEndTime,     
        coachUlid: sessionData.coachUlid
      }, 
      error: null 
    }
  } catch (error) {
    console.error('[RESCHEDULE_ERROR] Top-level error:', error)
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.flatten()
        }
      }
    }
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      } 
    }
  }
} 