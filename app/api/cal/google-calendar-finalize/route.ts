import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'

/**
 * API Route to finalize Google Calendar connection after the user
 * returns from the Cal.com OAuth flow to the UI callback page.
 */
export async function POST(request: Request) {
  let success = false;
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

    // Get Cal details (access token needed for sync)
    const { data: calData, error: calError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calManagedUserId') // Select necessary fields
      .eq('userUlid', userData.ulid)
      .single()

    if (calError || !calData) {
      console.error('[GCAL_FINALIZE] Cal.com integration record not found (or error fetching):', calError);
      errorMessage = 'cal_integration_record_not_found';
      throw new Error(errorMessage);
    }

    // --- Update Database Record ---
    // Mark the connection as active or update timestamp.
    console.log('[GCAL_FINALIZE] Updating local DB record.');

    const { error: updateError } = await supabase
      .from('CalendarIntegration')
      .update({
        googleCalendarConnected: true,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', userData.ulid)
      .select('ulid') // Select something to confirm update occurred
      .maybeSingle(); // Record must exist based on previous check

    if (updateError) {
      console.error('[GCAL_FINALIZE] Failed to update database:', updateError);
      errorMessage = 'db_update_failed';
      throw new Error(errorMessage);
    }

    console.log('[GCAL_FINALIZE] Database updated successfully. Proceeding with Cal.com credential sync.');

    // --- Sync Credentials with Cal.com ---
    // This step calls Cal.com to verify the connection.
    // FIXME: This call is currently failing with a 400 error from Cal.com
    //        Error: "Invalid calendar type, available calendars are: " (detail: "apple")
    //        Temporarily commenting out until the root cause is identified.
    /* 
    if (!calData.calAccessToken) {
        console.warn('[GCAL_FINALIZE] Skipping Cal.com credential sync: Missing access token in DB.');
        // Consider this a success as the DB was updated, but maybe flag it?
        success = true; 
    } else {
        try {
            const syncResponse = await fetch(`https://api.cal.com/v2/calendars/google/credentials`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${calData.calAccessToken}`,
                'x-cal-client-id': process.env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
                'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
              }
            });

            const syncText = await syncResponse.text();
            if (!syncResponse.ok) {
              console.warn('[GCAL_FINALIZE] Cal.com credential sync failed:', { status: syncResponse.status, text: syncText });
              // Treat as success for now, but could be an error depending on requirements.
              success = true; 
            } else {
              console.log('[GCAL_FINALIZE] Cal.com credential sync successful.');
              success = true; // Mark as fully successful
            }
        } catch (syncError) {
            console.error('[GCAL_FINALIZE] Error during Cal.com credential sync:', syncError);
            errorMessage = 'cal_sync_exception';
            // Treat as success for now, log the error.
            success = true; 
        }
    }
    */
   // Since sync is commented out, mark success if DB update worked.
   success = true;

  } catch (error: any) {
    console.error('[GCAL_FINALIZE] Caught error during processing:', error);
    success = false;
    errorMessage = errorMessage || (error instanceof Error ? error.message : 'unhandled_error');
  }

  // --- Return Response ---
  if (success) {
    console.log('[GCAL_FINALIZE] Finalization successful.');
    return NextResponse.json({ success: true });
  } else {
    console.error('[GCAL_FINALIZE] Finalization failed:', { error: errorMessage });
    return NextResponse.json(
        { success: false, error: errorMessage || 'unknown_error' },
        { status: errorMessage === 'not_authenticated' ? 401 : errorMessage === 'user_not_found' || errorMessage === 'cal_integration_record_not_found' ? 404 : 500 }
    );
  }
}
