"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ensureValidCalToken } from '@/utils/cal/token-util'
import { createAuthClient } from '@/utils/auth';

// Define possible statuses
type CallbackStatus = 'loading' | 'finalizing' | 'refreshing' | 'success' | 'error';

export default function GoogleCalendarCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState<string>('Processing calendar connection...')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [userUlid, setUserUlid] = useState<string | null>(null)

  // Get the user's ULID
  useEffect(() => {
    const fetchUserUlid = async () => {
      try {
        const supabase = createAuthClient();
        const { data } = await supabase.auth.getSession();
        
        if (!data.session?.user) {
          throw new Error('User not authenticated');
        }
        
        const { data: userData, error } = await supabase
          .from('User')
          .select('ulid')
          .single();
          
        if (error || !userData) {
          throw new Error('Failed to get user ULID');
        }
        
        setUserUlid(userData.ulid);
      } catch (error) {
        console.error('[GOOGLE_CALLBACK_UI] Error getting user ULID:', error);
        setStatus('error');
        setMessage('Authentication error');
        setErrorDetails('Failed to authenticate user. Please try again.');
      }
    };
    
    fetchUserUlid();
  }, []);

  useEffect(() => {
    console.log('[GOOGLE_CALLBACK_UI] Page loaded');
    
    // Check for explicit errors passed in URL from Cal.com (less likely but possible)
    const errorParam = searchParams.get('error'); 
    const errorDescriptionParam = searchParams.get('error_description');

    if (errorParam) {
      console.error('[GOOGLE_CALLBACK_UI] Error param detected in URL:', { error: errorParam, description: errorDescriptionParam });
      setStatus('error');
      setMessage('Failed to connect Google Calendar.');
      setErrorDetails(`Error details: ${errorDescriptionParam || errorParam}. Please try connecting again.`);
      return; // Stop processing
    }
    
    // If no explicit error from Cal.com redirect, assume Cal.com part was okay.
    // Now, trigger our backend to finalize the connection (DB update, sync).
    setStatus('finalizing');
    setMessage('Finalizing Google Calendar connection...');
    
    // Wait for userUlid to be set before proceeding
    if (userUlid) {
      finalizeConnection();
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userUlid]); // Depend on searchParams and userUlid
  
  // Function to call our backend API to complete the setup
  const finalizeConnection = async () => {
    if (!userUlid) {
      console.error('[GOOGLE_CALLBACK_UI] Missing user ULID');
      setStatus('error');
      setMessage('Authentication error');
      setErrorDetails('Failed to authenticate user. Please try again.');
      return;
    }
    
    console.log('[GOOGLE_CALLBACK_UI] Calling backend to finalize connection...');
    try {
      const response = await fetch('/api/cal/google-calendar-finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed unless we pass specific params from URL (like code/state if Cal included them)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[GOOGLE_CALLBACK_UI] Finalize API call failed:', result);
        throw new Error(result.error || 'Backend finalization failed.');
      }

      // Success! Now refresh the Cal.com token using our centralized utility
      console.log('[GOOGLE_CALLBACK_UI] Finalize API call successful, refreshing token...');
      setStatus('refreshing');
      setMessage('Refreshing Cal.com integration...');
      await refreshCalToken();
      
    } catch (error: any) {
      console.error('[GOOGLE_CALLBACK_UI] Error during finalization call:', error);
      setStatus('error');
      setMessage('Failed to finalize Google Calendar connection.');
      setErrorDetails(error.message || 'An unexpected error occurred during finalization.');
    }
  };
  
  // Function to refresh the Cal.com token using our centralized utility
  const refreshCalToken = async () => {
    if (!userUlid) {
      console.error('[GOOGLE_CALLBACK_UI] Missing user ULID for token refresh');
      setStatus('error');
      setMessage('Authentication error');
      setErrorDetails('Failed to authenticate user. Please try again.');
      return;
    }
    
    try {
      // Use our new centralized token utility with force refresh
      // Since ensureValidCalToken is a server action, it can be called directly
      const refreshResult = await ensureValidCalToken(userUlid, true);
      
      if (!refreshResult.success) {
        console.error('[GOOGLE_CALLBACK_UI] Token refresh failed:', refreshResult.error);
        throw new Error(refreshResult.error || 'Failed to refresh Cal.com token');
      }
      
      console.log('[GOOGLE_CALLBACK_UI] Token refresh successful');
      
      // Everything successful!
      setStatus('success');
      setMessage('Google Calendar connected successfully! Redirecting back to settings...');
      setErrorDetails(null);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/settings?tab=integrations&success=calendar_connected');
      }, 2500);
      
    } catch (error: any) {
      console.error('[GOOGLE_CALLBACK_UI] Error during token refresh:', error);
      setStatus('error');
      setMessage('Connected to Google Calendar but failed to refresh Cal.com integration.');
      setErrorDetails('Your calendar connection was saved, but there was an error refreshing the Cal.com token. Please try refreshing your integration from the settings page.');
    }
  };

  // Function to manually go back to settings
  const handleBackToSettings = () => {
    router.push('/dashboard/settings?tab=integrations');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {(status === 'loading' || status === 'finalizing' || status === 'refreshing') && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          )}
          
          <h2 className="text-xl font-semibold">
            {status === 'loading' ? 'Processing...' : 
             status === 'finalizing' ? 'Finalizing Connection...' : 
             status === 'refreshing' ? 'Refreshing Integration...' :
             status === 'success' ? 'Connection Successful' : 'Connection Failed'}
          </h2>
          
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <>
              {errorDetails && (
                <div className="mt-4 w-full rounded border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700">
                  <p className="font-medium">Error Details:</p>
                  <p>{errorDetails}</p>
                </div>
              )}
              <Button 
                onClick={handleBackToSettings}
                variant="outline"
                className="mt-4 w-full"
              >
                Back to Settings
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 