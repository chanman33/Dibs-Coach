"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ensureValidCalToken } from '@/utils/cal/token-util'
import { createAuthClient } from '@/utils/auth'
import { useAuth } from '@clerk/nextjs'

// Define possible statuses
type CallbackStatus = 'loading' | 'finalizing' | 'refreshing' | 'success' | 'error';

export default function Office365CalendarCallback() {
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
        console.log('[OFFICE365_CALLBACK_UI] Auth not loaded yet, waiting...');
        return;
      }

      // Check if we have userId from Clerk
      if (!userId) {
        console.error('[OFFICE365_CALLBACK_UI] No userId from Clerk auth');
        if (retryCount < 3) {
          console.log(`[OFFICE365_CALLBACK_UI] Retrying (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          return;
        }
        setStatus('error');
        setMessage('Authentication error');
        setErrorDetails('Failed to authenticate user. Please try again.');
        return;
      }

      try {
        console.log('[OFFICE365_CALLBACK_UI] Fetching user ULID for userId:', userId);
        const supabase = createAuthClient();
        
        // Skip the Supabase auth session check and directly query by Clerk userId
        const { data: userData, error } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', userId)
          .single();
          
        if (error || !userData) {
          console.error('[OFFICE365_CALLBACK_UI] User data fetch error:', error);
          throw new Error('Failed to get user ULID');
        }
        
        console.log('[OFFICE365_CALLBACK_UI] User ULID found:', userData.ulid);
        setUserUlid(userData.ulid);
      } catch (error) {
        console.error('[OFFICE365_CALLBACK_UI] Error getting user ULID:', error);
        
        // Retry logic for transient errors
        if (retryCount < 3) {
          console.log(`[OFFICE365_CALLBACK_UI] Retrying (${retryCount + 1}/3)...`);
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
    console.log('[OFFICE365_CALLBACK_UI] Page loaded');
    
    // Check for explicit errors passed in URL from Cal.com
    const errorParam = searchParams.get('error'); 
    const errorDescriptionParam = searchParams.get('error_description');

    if (errorParam) {
      console.error('[OFFICE365_CALLBACK_UI] Error param detected in URL:', { error: errorParam, description: errorDescriptionParam });
      setStatus('error');
      setMessage('Failed to connect Office 365 Calendar.');
      setErrorDetails(`Error details: ${errorDescriptionParam || errorParam}. Please try connecting again.`);
      return; // Stop processing
    }
    
    // If no explicit error from Cal.com redirect, assume Cal.com part was okay.
    // Now, trigger our backend to finalize the connection (DB update, sync).
    setStatus('finalizing');
    setMessage('Finalizing Office 365 Calendar connection...');
    
    // Wait for userUlid to be set before proceeding
    if (userUlid) {
      finalizeConnection();
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userUlid]); // Depend on searchParams and userUlid
  
  // Function to call our backend API to complete the setup
  const finalizeConnection = async () => {
    if (!userUlid) {
      console.error('[OFFICE365_CALLBACK_UI] Missing user ULID');
      setStatus('error');
      setMessage('Authentication error');
      setErrorDetails('Failed to authenticate user. Please try again.');
      return;
    }
    
    console.log('[OFFICE365_CALLBACK_UI] Calling backend to finalize connection...');
    try {
      const response = await fetch('/api/cal/office365-calendar-finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed unless we pass specific params from URL (like code/state if Cal included them)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[OFFICE365_CALLBACK_UI] Finalize API call failed:', result);
        throw new Error(result.error || 'Backend finalization failed.');
      }

      // Success! The token was already validated in the finalize API
      console.log('[OFFICE365_CALLBACK_UI] Office 365 Calendar connected successfully');
      setStatus('success');
      setMessage('Office 365 Calendar connected successfully! Redirecting back to settings...');
      setErrorDetails(null);
      
      // Redirect to the settings page with tab and success parameters
      setTimeout(() => {
        // Add prefetch to ensure organization context is loaded before redirect
        // Adding timestamp to prevent caching issues
        try {
          // First try to prefetch the organization data to warm cache
          // fetch('/api/user/organizations').then(() => {
          //   console.log('[OFFICE365_CALLBACK_UI] Prefetched organization data before redirect');
            
          //   // Add specific settings tab and a timestamp to prevent caching
          //   router.replace(`/dashboard/settings?tab=integrations&success=office365_connected&t=${Date.now()}`);
          // }).catch((err) => {
          //   // If prefetch fails, still redirect but log the error
          //   console.error('[OFFICE365_CALLBACK_UI] Error prefetching organization data:', err);
          //   router.replace(`/dashboard/settings?tab=integrations&success=office365_connected&t=${Date.now()}`);
          // });
          console.log('[OFFICE365_CALLBACK_UI] Redirecting to settings after successful connection.');
          router.replace(`/dashboard/settings?tab=integrations&success=calendar_connected`);
        } catch (err) {
          // Fallback in case of any errors
          console.error('[OFFICE365_CALLBACK_UI] Error during redirect preparation:', err);
          router.replace(`/dashboard/settings?tab=integrations&success=calendar_connected`);
        }
      }, 5000); // Keeping the delay for user feedback
      
    } catch (error: any) {
      console.error('[OFFICE365_CALLBACK_UI] Error during finalization call:', error);
      setStatus('error');
      setMessage('Failed to finalize Office 365 Calendar connection.');
      setErrorDetails(error.message || 'An unexpected error occurred during finalization.');
    }
  };

  // Function to manually go back to settings
  const handleBackToSettings = () => {
    router.replace('/dashboard/settings');
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