'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useCentralizedAuth } from '@/app/provider';
import { SYSTEM_ROLES } from '@/utils/roles/roles';
import { ContainerLoading } from '@/components/loading/container';

export default function CalAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { authData, isLoading } = useCentralizedAuth();
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [tokens, setTokens] = useState<{ access_token?: string; refresh_token?: string } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Add helper function for Cal.com API calls
  const makeCalApiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const clientId = process.env.NEXT_PUBLIC_CAL_CLIENT_ID;
    if (!clientId) {
      throw new Error('Missing Cal.com client ID');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-cal-client-id': clientId,
      ...options.headers as Record<string, string>,
    };

    // Only include authorization if we have a token
    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer cal_${tokens.access_token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_CALCOM_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[CAL_API_ERROR] Request failed:', {
        endpoint,
        status: response.status,
        data
      });
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  useEffect(() => {
    // Debug logging for callback parameters
    const params = {
      success: searchParams.get('success'),
      error: searchParams.get('error'),
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      access_token: searchParams.get('access_token'),
      refresh_token: searchParams.get('refresh_token')
    };
    console.log('[CAL_AUTH_DEBUG] Current URL:', window.location.href);
    console.log('[CAL_AUTH_DEBUG] Callback parameters:', params);

    // Verify state if present
    const savedState = sessionStorage.getItem('cal_auth_state');
    if (params.state && savedState && params.state !== savedState) {
      console.error('[CAL_AUTH_ERROR] State mismatch:', {
        received: params.state,
        saved: savedState
      });
      toast({
        title: 'Security Error',
        description: 'Invalid state parameter received. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (params.error) {
      console.error('[CAL_AUTH_ERROR] Authorization failed:', params.error);
      toast({
        title: 'Error',
        description: `Failed to get authorization code: ${params.error}`,
        variant: 'destructive',
      });
    }

    if (params.code) {
      console.log('[CAL_AUTH_DEBUG] Received authorization code');
    }

    if (params.success && params.access_token && params.refresh_token) {
      console.log('[CAL_AUTH_DEBUG] Authorization successful');
      setTokens({ access_token: params.access_token, refresh_token: params.refresh_token });
      toast({
        title: 'Success',
        description: 'Successfully retrieved Cal.com authorization tokens.',
      });
      // Clear state after successful auth
      sessionStorage.removeItem('cal_auth_state');
    }
  }, [searchParams, toast]);

  // Redirect if not a system owner
  if (!isLoading && authData?.systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
    router.push('/dashboard');
    return null;
  }

  if (isLoading) {
    return <ContainerLoading />;
  }

  const getCalAuthCode = async () => {
    try {
      setIsLoadingCode(true);
      
      const clientId = process.env.NEXT_PUBLIC_CAL_CLIENT_ID;
      if (!clientId) {
        console.error('[CAL_AUTH_ERROR] Missing NEXT_PUBLIC_CAL_CLIENT_ID');
        toast({
          title: 'Configuration Error',
          description: 'Missing Cal.com client ID. Please check your environment variables.',
          variant: 'destructive',
        });
        return;
      }

      // Ensure we're using the correct redirect URI format
      const redirectUri = `${window.location.origin}/api/cal/auth-code/callback`;
      
      // Debug log the client ID
      console.log('[CAL_AUTH_DEBUG] Client ID check:', {
        clientId,
        redirectUri
      });

      // Set scopes based on the permissions shown in Cal.com dashboard
      // Note: Cal.com expects spaces between scopes, not encoded spaces
      const scope = 'read_events read_bookings read_schedules read_users';
      const state = Math.random().toString(36).substring(7);
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem('cal_auth_state', state);
      
      // Debug logging
      console.log('[CAL_AUTH_DEBUG] Initiating OAuth flow:', {
        clientId,
        redirectUri,
        scope,
        state,
        origin: window.location.origin,
        currentUrl: window.location.href,
        env: {
          NEXT_PUBLIC_CAL_CLIENT_ID: process.env.NEXT_PUBLIC_CAL_CLIENT_ID,
          FRONTEND_URL: process.env.FRONTEND_URL
        }
      });
      
      // Direct to Cal.com OAuth authorization endpoint
      const authUrl = `https://app.cal.com/auth/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
      
      console.log('[CAL_AUTH_DEBUG] Redirecting to Cal.com authorization:', {
        authUrl,
        clientId,
        redirectUri,
        scope,
        state,
        currentUrl: window.location.href
      });
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('[CAL_AUTH_ERROR] Error initiating Cal.com auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate Cal.com authorization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCode(false);
    }
  };

  const testMeProfile = async () => {
    if (!tokens?.access_token) {
      toast({
        title: 'Error',
        description: 'No access token available. Please get an access token first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingProfile(true);
    try {
      const data = await makeCalApiRequest('/me');
      console.log('[CAL_API_DEBUG] Me profile response:', data);
      setProfileData(data);

      toast({
        title: 'Success',
        description: 'Successfully fetched Cal.com profile.',
      });
    } catch (error) {
      console.error('[CAL_API_ERROR] Error fetching profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Cal.com profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cal.com Authorization for Postman</CardTitle>
          <CardDescription>
            Get an access token to use in Postman for Cal.com API testing. 
            Note: The token must be prefixed with "cal_" when using it in the Authorization header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-semibold mb-2">How to use:</h3>
              <ol className="list-decimal ml-5 text-sm space-y-2">
                <li>Click the button below to start the authorization flow</li>
                <li>Log in to your Cal.com account if prompted</li>
                <li>Approve the requested permissions</li>
                <li>You'll be redirected back here with your access token</li>
                <li>Copy the access token and use it in Postman as "Bearer cal_YOUR_TOKEN"</li>
              </ol>
            </div>

            <Button 
              onClick={getCalAuthCode} 
              disabled={isLoadingCode}
              className="w-full"
            >
              {isLoadingCode ? 'Redirecting...' : 'Get Cal.com Access Token for Postman'}
            </Button>

            {tokens && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Authorization Successful!
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Access Token:</p>
                    <div className="relative">
                      <code className="block p-3 bg-background rounded text-sm break-all border">
                        {tokens.access_token}
                      </code>
                      <button 
                        className="absolute top-2 right-2 p-1 text-xs bg-primary text-white rounded"
                        onClick={() => {
                          // Copy with cal_ prefix
                          navigator.clipboard.writeText(`cal_${tokens.access_token || ''}`);
                          toast({
                            title: 'Copied!',
                            description: 'Access token copied to clipboard with cal_ prefix',
                          });
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Refresh Token:</p>
                    <div className="relative">
                      <code className="block p-3 bg-background rounded text-sm break-all border">
                        {tokens.refresh_token}
                      </code>
                      <button 
                        className="absolute top-2 right-2 p-1 text-xs bg-primary text-white rounded"
                        onClick={() => {
                          navigator.clipboard.writeText(tokens.refresh_token || '');
                          toast({
                            title: 'Copied!',
                            description: 'Refresh token copied to clipboard',
                          });
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-background rounded border">
                  <h4 className="font-medium text-sm mb-2">How to use in Postman:</h4>
                  <ol className="list-decimal ml-5 text-sm space-y-1">
                    <li>In Postman, go to the Authorization tab</li>
                    <li>Select "Bearer Token" from the Type dropdown</li>
                    <li>Paste the access token with "cal_" prefix in the Token field</li>
                    <li>Your requests will now include the Authorization header</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Cal.com API</CardTitle>
          <CardDescription>
            Test your access token by fetching your Cal.com profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button 
              onClick={testMeProfile} 
              disabled={isLoadingProfile || !tokens?.access_token}
              className="w-full"
            >
              {isLoadingProfile ? 'Loading...' : 'Test Get My Profile'}
            </Button>

            {profileData && (
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Profile Response:</h4>
                <pre className="text-sm overflow-auto p-2 bg-background rounded border">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 