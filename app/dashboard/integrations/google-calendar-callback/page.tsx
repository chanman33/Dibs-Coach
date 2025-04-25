"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAuthClient } from '@/utils/auth'
import { useAuth } from '@clerk/nextjs'

// Define possible statuses
type CallbackStatus = 'loading' | 'finalizing' | 'refreshing' | 'success' | 'error';

export default function GoogleCalendarCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState<string>('Processing calendar connection...')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [userUlid, setUserUlid] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { isLoaded, userId } = useAuth()

  // Get the user's ULID
  useEffect(() => {
    const fetchUserUlid = async () => {
      // Wait for Clerk auth to be loaded
      if (!isLoaded) {
        console.log('[GOOGLE_CALLBACK_UI] Auth not loaded yet, waiting...');
        return;
      }

      // Check if we have userId from Clerk
      if (!userId) {
        console.error('[GOOGLE_CALLBACK_UI] No userId from Clerk auth');
        if (retryCount < 3) {
          console.log(`[GOOGLE_CALLBACK_UI] Retrying (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          return;
        }
        setStatus('error');
        setMessage('Authentication error');
        setErrorDetails('Failed to authenticate user. Please try again.');
        return;
      }

      try {
        console.log('[GOOGLE_CALLBACK_UI] Fetching user ULID for userId:', userId);
        const supabase = createAuthClient();
        
        // Skip the Supabase auth session check and directly query by Clerk userId
        const { data: userData, error } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', userId)
          .single();
          
        if (error || !userData) {
          console.error('[GOOGLE_CALLBACK_UI] User data fetch error:', error);
          throw new Error('Failed to get user ULID');
        }
        
        console.log('[GOOGLE_CALLBACK_UI] User ULID found:', userData.ulid);
        setUserUlid(userData.ulid);
      } catch (error) {
        console.error('[GOOGLE_CALLBACK_UI] Error getting user ULID:', error);
        
        // Retry logic for transient errors
        if (retryCount < 3) {
          console.log(`[GOOGLE_CALLBACK_UI] Retrying (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        setStatus('error');
        setMessage('Authentication error');
        setErrorDetails('Failed to authenticate user. Please try again.');
      }
    };
    
    // Don't run if we already have the ULID
    if (!userUlid) {
      const delay = retryCount > 0 ? 1000 : 0; // Add delay for retries
      const timer = setTimeout(fetchUserUlid, delay);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, userId, userUlid, retryCount]);

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

      // Success! The token was already validated in the finalize API
      console.log('[GOOGLE_CALLBACK_UI] Google Calendar connected successfully');
      setStatus('success');
      setMessage('Google Calendar connected successfully! Redirecting back to settings...');
      setErrorDetails(null);
      
      // Redirect to the settings page with tab and success parameters
      setTimeout(() => {
        // Add prefetch to ensure organization context is loaded before redirect
        // Adding timestamp to prevent caching issues
        try {
          // First try to prefetch the organization data to warm cache
          // fetch('/api/user/organizations').then(() => {
          //   console.log('[GOOGLE_CALLBACK_UI] Prefetched organization data before redirect');
            
          //   // Add specific settings tab and a timestamp to prevent caching
          //   router.replace(`/dashboard/settings?tab=integrations&success=true&t=${Date.now()}`);
          // }).catch((err) => {
          //   // If prefetch fails, still redirect but log the error
          //   console.error('[GOOGLE_CALLBACK_UI] Error prefetching organization data:', err);
          //   router.replace(`/dashboard/settings?tab=integrations&success=true&t=${Date.now()}`);
          // });
          console.log('[GOOGLE_CALLBACK_UI] Redirecting to new calendar integration page after successful connection.');
          // Redirect with a specific success parameter for calendar connection
          // router.replace(`/dashboard/settings?tab=integrations&success=calendar_connected`);
          router.replace(`/dashboard/coach/integrations/calendar?success=calendar_connected&t=${Date.now()}`); // Update route and add timestamp
        } catch (err) {
          // Fallback in case of any errors
          console.error('[GOOGLE_CALLBACK_UI] Error during redirect preparation:', err);
          // router.replace(`/dashboard/settings?tab=integrations&success=calendar_connected`);
          router.replace(`/dashboard/coach/integrations/calendar?success=calendar_connected&t=${Date.now()}`); // Update route and add timestamp
        }
      }, 2500); // Shortened delay for user feedback before redirect
      
    } catch (error: any) {
      console.error('[GOOGLE_CALLBACK_UI] Error during finalization call:', error);
      setStatus('error');
      setMessage('Failed to finalize Google Calendar connection.');
      setErrorDetails(error.message || 'An unexpected error occurred during finalization.');
    }
  };

  // Function to manually go back to settings
  const handleBackToSettings = () => {
    // router.replace('/dashboard/settings');
    router.replace('/dashboard/coach/integrations/calendar'); // Update route
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