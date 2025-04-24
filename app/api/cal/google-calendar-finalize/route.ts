import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { ensureValidCalToken as serverActionEnsureValidToken } from '@/utils/actions/cal/cal-tokens'

/**
 * API Route to finalize Google Calendar connection after the user
 * returns from the Cal.com OAuth flow to the UI callback page.
 * Includes a validation step to confirm the calendar exists on Cal.com's side.
 */
export async function POST(request: Request) {
  let success = false;
  let validated = false; // Flag for successful validation
  let errorMessage: string | null = null;

  try {
    console.log('[GCAL_FINALIZE] Request received');

    // --- Authentication & DB Check ---
    const { userId } = auth()
    if (!userId) {
      console.error('[GCAL_FINALIZE] User not authenticated');
      errorMessage = 'not_authenticated';
      throw new Error(errorMessage);
    }

    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !userData) {
      console.error('[GCAL_FINALIZE] User not found:', userError);
      errorMessage = 'user_not_found';
      throw new Error(errorMessage);
    }

    // Ensure we have a valid Cal token - use the server action for token validation
    const tokenCheckResult = await serverActionEnsureValidToken(userData.ulid);
    if (!tokenCheckResult.success) {
      console.error('[GCAL_FINALIZE] Failed to ensure valid Cal token:', tokenCheckResult.error);
      errorMessage = 'cal_token_refresh_failed';
      throw new Error(errorMessage);
    }

    // Re-fetch the integration record to get the potentially refreshed token
    const { data: integrationData, error: fetchAfterRefreshError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calManagedUserId')
      .eq('userUlid', userData.ulid)
      .single()

    if (fetchAfterRefreshError || !integrationData?.calAccessToken) {
      console.error('[GCAL_FINALIZE] Failed to fetch integration record or token after refresh check:', fetchAfterRefreshError);
      errorMessage = 'fetch_integration_after_refresh_failed';
      throw new Error(errorMessage);
    }
    const accessToken = integrationData.calAccessToken;

    // --- Update Database Record ---
    console.log('[GCAL_FINALIZE] Updating local DB record.');
    const { error: updateError } = await supabase
      .from('CalendarIntegration')
      .update({
        googleCalendarConnected: true,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', userData.ulid)
      .select('ulid')
      .maybeSingle();

    if (updateError) {
      console.error('[GCAL_FINALIZE] Failed to update database:', updateError);
      errorMessage = 'db_update_failed';
      throw new Error(errorMessage);
    }
    console.log('[GCAL_FINALIZE] Database updated successfully.');

    // --- Add Validation Step --- 
    console.log('[GCAL_FINALIZE_VALIDATION] Starting validation with Cal.com API.');
    try {
        const calApiUrl = 'https://api.cal.com/v2/calendars';
        const validationResponse = await fetch(calApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('[GCAL_FINALIZE_VALIDATION] Cal.com response status:', validationResponse.status);

        if (!validationResponse.ok) {
            let errorBody = 'Could not read error body';
            try { errorBody = await validationResponse.text(); } catch (_) {}
            console.error('[GCAL_FINALIZE_VALIDATION] Cal.com API call failed:', { status: validationResponse.status, body: errorBody });
            errorMessage = `calendar_validation_failed_api_${validationResponse.status}`;
            throw new Error(errorMessage);
        }

        const body = await validationResponse.json();
        let isGoogleCalendarFound = false;
        if (Array.isArray(body?.data?.connectedCalendars)) {
            isGoogleCalendarFound = body.data.connectedCalendars.some((entry: any) => 
                entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar'
            );
        }

        if (isGoogleCalendarFound) {
            console.log('[GCAL_FINALIZE_VALIDATION] Google Calendar connection confirmed via Cal.com API.');
            validated = true; // Mark validation success
        } else {
            console.warn('[GCAL_FINALIZE_VALIDATION] Cal.com API success, but Google Calendar not found in connected list.', body);
            errorMessage = 'calendar_validation_failed_not_found';
            throw new Error(errorMessage); // Treat as failure
        }

    } catch (validationError: any) {
        console.error('[GCAL_FINALIZE_VALIDATION] Error during validation step:', validationError);
        errorMessage = errorMessage || (validationError instanceof Error ? validationError.message : 'validation_request_failed');
        throw new Error(errorMessage); // Re-throw to be caught by the outer catch
    }
    // --- End Validation Step ---

    // If we reached here without errors, both DB update and validation succeeded
    success = true;

  } catch (error: any) {
    console.error('[GCAL_FINALIZE] Caught error during processing:', error);
    success = false; // Ensure success is false if any error occurred
    errorMessage = errorMessage || (error instanceof Error ? error.message : 'unhandled_error');
  }

  // --- Return Response ---
  if (success && validated) {
    console.log('[GCAL_FINALIZE] Finalization successful and validated.');
    return NextResponse.json({ success: true, validated: true });
  } else {
    console.error('[GCAL_FINALIZE] Finalization failed:', { error: errorMessage, validated }); // Include validated status in log
    let statusCode = 500;
    if (errorMessage === 'not_authenticated') statusCode = 401;
    else if (errorMessage === 'user_not_found' || errorMessage === 'cal_integration_record_not_found') statusCode = 404;
    else if (errorMessage === 'calendar_validation_failed_not_found') statusCode = 409; // Conflict - DB updated but validation failed
    else if (errorMessage?.startsWith('calendar_validation_failed_api_')) statusCode = 502; // Bad Gateway - Error from upstream Cal.com API

    return NextResponse.json(
        { success: false, error: errorMessage || 'unknown_error', validated }, // Include validated status in response
        { status: statusCode }
    );
  }
}
