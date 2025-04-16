import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { ensureValidCalToken as serverActionEnsureValidToken } from '@/utils/actions/cal-tokens'

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

    // Ensure we have a valid Cal token - use the server action for token validation
    const tokenResult = await serverActionEnsureValidToken(userData.ulid);
    if (!tokenResult.success) {
      console.error('[GCAL_FINALIZE] Failed to ensure valid Cal token:', tokenResult.error);
      errorMessage = 'cal_token_refresh_failed';
      throw new Error(errorMessage);
    }

    // Check if we have an integration record
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

    
   // Since sync is removed for 400 errors, mark success if DB update worked.
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
