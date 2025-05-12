"use client"

export const dynamic = 'force-dynamic';

import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle, CalendarDays, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCalIntegrationStatus } from '@/components/cal/CalConnectedStatus' // Re-added
import { SiGooglecalendar } from 'react-icons/si'
import { BsCalendar2Week } from 'react-icons/bs'
import { createAuthClient } from '@/utils/auth' // Re-added
import { refreshUserCalTokens } from '@/utils/actions/cal/cal-tokens' // Re-added
import { CalTokenService } from '@/lib/cal/cal-service' // Re-added
import { getAuthenticatedUserUlid } from '@/utils/auth/cal-auth-helpers' // Re-added
import { fetchUserCapabilities, type UserCapabilitiesResponse } from "@/utils/actions/user-profile-actions" // Re-added for capability check
import { USER_CAPABILITIES } from "@/utils/roles/roles" // Re-added for capability check
import { type ApiResponse } from "@/utils/types/api" // Re-added for capability check

// Function to check if user has connected a third-party calendar (Moved from settings page)
function useCalendarsConnected() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnectedCalendar, setHasConnectedCalendar] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [office365CalendarConnected, setOffice365CalendarConnected] = useState(false);

  async function checkCalendarConnections() {
    let integrationData: { data?: { googleCalendarConnected?: boolean, office365CalendarConnected?: boolean } } = {};

    try {
      setIsLoading(true);
      setApiError(null);
      console.log('[CALENDAR_CHECK_DEBUG] Starting calendar connection check');

      // Use the helper function to get authenticated user ULID
      const authResult = await getAuthenticatedUserUlid();

      if (authResult.error) {
        console.error('[CALENDAR_CHECK_DEBUG] Authentication error:', authResult.error);
        setApiError('Authentication error: ' + authResult.error.message);
        setIsLoading(false);
        return;
      }

      // First check the CalendarIntegration table for connection flags
      const integrationResponse = await fetch('/api/cal/integration/status');
      integrationData = await integrationResponse.json();

      // Extract the database flags for calendar connectivity
      const googleConnectedInDB = integrationData.data?.googleCalendarConnected || false;
      const office365ConnectedInDB = integrationData.data?.office365CalendarConnected || false;

      // Store the DB flags in state to make them available to the component
      setGoogleCalendarConnected(googleConnectedInDB);
      setOffice365CalendarConnected(office365ConnectedInDB);

      // Helper function to validate Google Calendar in response
      const validateGoogleCalendarInResponse = (data: any) => {
        // Debug: Log the structure of the data object
        console.log('[CALENDAR_STRUCTURE_DEBUG] Validating response structure:', {
          hasDestinationCalendar: !!data.destinationCalendar,
          destinationCalendarType: data.destinationCalendar?.integration,
          hasConnectedCalendars: Array.isArray(data.connectedCalendars),
          connectedCalendarsCount: Array.isArray(data.connectedCalendars) ? data.connectedCalendars.length : 0
        });

        if (data.connectedCalendars && data.connectedCalendars.length > 0) {
          // Log the first connected calendar for debugging
          const firstCalendarSet = data.connectedCalendars[0];
          console.log('[CALENDAR_STRUCTURE_DEBUG] First calendar set:', {
            hasIntegration: !!firstCalendarSet.integration,
            integrationType: firstCalendarSet.integration?.type,
            integrationSlug: firstCalendarSet.integration?.slug,
            calendarCount: Array.isArray(firstCalendarSet.calendars) ? firstCalendarSet.calendars.length : 0
          });

          // Check individual calendars
          if (firstCalendarSet.calendars && firstCalendarSet.calendars.length > 0) {
            const firstCalendar = firstCalendarSet.calendars[0];
            console.log('[CALENDAR_STRUCTURE_DEBUG] First calendar in set:', {
              integration: firstCalendar.integration,
              name: firstCalendar.name,
              externalId: firstCalendar.externalId
            });
          }
        }

        // Check for destination calendar (reliable indicator)
        if (data.destinationCalendar &&
          data.destinationCalendar.integration === "google_calendar") {
          console.log('[CALENDAR_STRUCTURE_DEBUG] Found Google Calendar in destinationCalendar');
          return true;
        }

        // Check connectedCalendars array
        if (data.connectedCalendars && data.connectedCalendars.length > 0) {
          // Look for any calendar with Google Calendar integration
          const found = data.connectedCalendars.some((calendarSet: any) =>
            calendarSet.integration?.type === "google_calendar" ||
            calendarSet.integration?.slug === "google-calendar"
          );

          console.log('[CALENDAR_STRUCTURE_DEBUG] Google Calendar found in connectedCalendars:', found);
          return found;
        }

        return false;
      };

      // If either calendar is connected, validate with Cal.com
      if (googleConnectedInDB || office365ConnectedInDB) {
        console.log('[CALENDAR_CHECK_DEBUG] Calendar flag detected, validating with Cal.com');

        // Call the get-all-calendars endpoint to validate
        console.log('[CALENDAR_CHECK_DEBUG] Calling API: /api/cal/calendars/get-all-calendars');
        const response = await fetch('/api/cal/calendars/get-all-calendars');
        const data = await response.json();

        console.log('[CALENDAR_CHECK_DEBUG] Cal.com calendars response:', {
          success: data.success,
          hasConnectedCalendars: data.data?.hasConnectedCalendars,
          calendarCount: data.data?.calendars?.length,
          apiError: data.data?.apiError,
          tokenError: data.data?.tokenError,
          timestamp: new Date().toISOString()
        });

        if (data.success && data.data) {
          if (data.data.apiError) {
            console.error('[CALENDAR_CHECK_DEBUG] API error when fetching calendars, but DB flags indicate calendar is connected');
            setApiError('Could not verify calendars with Cal.com API, but database indicates calendars are connected.');

            // Trust the database flags as source of truth
            setHasConnectedCalendar(googleConnectedInDB || office365ConnectedInDB);

            // Create placeholder calendar entries based on DB flags to ensure UI consistency
            const fallbackCalendars = [];
            if (googleConnectedInDB) {
              fallbackCalendars.push({
                integration: {
                  type: 'google_calendar',
                  slug: 'google-calendar',
                  name: 'Google Calendar'
                },
                source: 'database-fallback'
              });
            }
            if (office365ConnectedInDB) {
              fallbackCalendars.push({
                integration: {
                  type: 'office365_calendar',
                  slug: 'office-365-calendar',
                  name: 'Office 365 Calendar'
                },
                source: 'database-fallback'
              });
            }
            setConnectedCalendars(fallbackCalendars);

          } else if (data.data.tokenError) {
            console.error('[CALENDAR_CHECK_DEBUG] Token error when fetching calendars');
            setApiError('Authentication error with Cal.com. Please disconnect and reconnect your calendar.');

            // Trust the database flags as source of truth
            setHasConnectedCalendar(googleConnectedInDB || office365ConnectedInDB);

            // Create placeholder calendar entries based on DB flags to ensure UI consistency
            const fallbackCalendars = [];
            if (googleConnectedInDB) {
              fallbackCalendars.push({
                integration: {
                  type: 'google_calendar',
                  slug: 'google-calendar',
                  name: 'Google Calendar'
                },
                source: 'database-fallback'
              });
            }
            if (office365ConnectedInDB) {
              fallbackCalendars.push({
                integration: {
                  type: 'office365_calendar',
                  slug: 'office-365-calendar',
                  name: 'Office 365 Calendar'
                },
                source: 'database-fallback'
              });
            }
            setConnectedCalendars(fallbackCalendars);

          } else {
            // Check API response for calendars
            const hasCalendarData = data.data.calendars && data.data.calendars.length > 0;
            const googleValidatedInAPI = validateGoogleCalendarInResponse(data.data);

            // Log mismatch between DB and API for debugging
            if (googleConnectedInDB && !googleValidatedInAPI) {
              console.warn('[CALENDAR_CHECK_DEBUG] Database indicates Google Calendar is connected, but not found in API response');
            }

            // Set connected status based on DB flag OR API validation
            const isCalendarConnected = data.data.hasConnectedCalendars || googleConnectedInDB || office365ConnectedInDB;
            setHasConnectedCalendar(isCalendarConnected);

            // Store the calendar data from API if available
            if (hasCalendarData) {
              console.log('[CALENDAR_STRUCTURE_DEBUG] Calendar data details:', {
                firstCalendarIntegrationType: data.data.calendars[0]?.integration?.type || 'undefined',
                firstCalendarIntegrationSlug: data.data.calendars[0]?.integration?.slug || 'undefined',
                rawCalendars: JSON.stringify(data.data.calendars.slice(0, 2)) // Log first 2 calendars
              });
              setConnectedCalendars(data.data.calendars);
              console.log('[CALENDAR_CHECK_DEBUG] Using calendars from API response', {
                count: data.data.calendars.length
              });
            } else {
              // If API doesn't return calendars but DB shows connected, create fallbacks
              const fallbackCalendars = [];
              if (googleConnectedInDB) {
                fallbackCalendars.push({
                  integration: {
                    type: 'google_calendar',
                    slug: 'google-calendar',
                    name: 'Google Calendar'
                  },
                  source: 'database-fallback'
                });
              }
              if (office365ConnectedInDB) {
                fallbackCalendars.push({
                  integration: {
                    type: 'office365_calendar',
                    slug: 'office-365-calendar',
                    name: 'Office 365 Calendar'
                  },
                  source: 'database-fallback'
                });
              }

              if (fallbackCalendars.length > 0) {
                console.log('[CALENDAR_CHECK_DEBUG] Using fallback calendar entries based on DB flags', {
                  count: fallbackCalendars.length
                });
                setConnectedCalendars(fallbackCalendars);
              } else {
                setConnectedCalendars([]);
              }
            }
          }
        } else {
          console.error('[CALENDAR_CHECK_DEBUG] Failed to validate calendars with Cal.com:', data.error);
          // If Cal.com validation fails but we have the flag set, we should still show as connected
          // This prevents UI flicker if Cal.com is temporarily unavailable
          setHasConnectedCalendar(googleConnectedInDB || office365ConnectedInDB);

          // Create placeholder calendar entries based on DB flags
          const fallbackCalendars = [];
          if (googleConnectedInDB) {
            fallbackCalendars.push({
              integration: {
                type: 'google_calendar',
                slug: 'google-calendar',
                name: 'Google Calendar'
              },
              source: 'database-fallback'
            });
          }
          if (office365ConnectedInDB) {
            fallbackCalendars.push({
              integration: {
                type: 'office365_calendar',
                slug: 'office-365-calendar',
                name: 'Office 365 Calendar'
              },
              source: 'database-fallback'
            });
          }
          setConnectedCalendars(fallbackCalendars);

          setApiError(data.error || 'Failed to validate calendars with Cal.com');
        }
      } else {
        console.log('[CALENDAR_CHECK_DEBUG] No calendar connections found in database');
        setHasConnectedCalendar(false);
        setConnectedCalendars([]);
      }
    } catch (error) {
      console.error('[CALENDAR_CONNECTION_CHECK_ERROR]', error);
      // If the check fails but we know a calendar is connected, maintain the connected state
      // This prevents UI flicker if there are temporary API issues
      const isConnected = integrationData?.data?.googleCalendarConnected ||
        integrationData?.data?.office365CalendarConnected ||
        false;
      setHasConnectedCalendar(isConnected);
      setGoogleCalendarConnected(integrationData?.data?.googleCalendarConnected || false);
      setOffice365CalendarConnected(integrationData?.data?.office365CalendarConnected || false);

      // Create fallback calendar entries based on DB flags
      const fallbackCalendars = [];
      if (integrationData?.data?.googleCalendarConnected) {
        fallbackCalendars.push({
          integration: {
            type: 'google_calendar',
            slug: 'google-calendar',
            name: 'Google Calendar'
          },
          source: 'error-fallback'
        });
      }
      if (integrationData?.data?.office365CalendarConnected) {
        fallbackCalendars.push({
          integration: {
            type: 'office365_calendar',
            slug: 'office-365-calendar',
            name: 'Office 365 Calendar'
          },
          source: 'error-fallback'
        });
      }
      setConnectedCalendars(fallbackCalendars);

      setApiError('Error checking calendar connection');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkCalendarConnections();
  }, []);

  return {
    hasConnectedCalendar,
    connectedCalendars,
    isLoading,
    apiError,
    googleCalendarConnected,
    office365CalendarConnected,
    refresh: checkCalendarConnections
  };
}


export default function CalendarIntegrationPage() {
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false); // State for generic loading (e.g., enabling scheduling)

  // State for user capabilities check
  const [userCapabilities, setUserCapabilities] = useState<string[]>([])
  const [loadingCapabilities, setLoadingCapabilities] = useState(true)
  const [hasCoachCapability, setHasCoachCapability] = useState(false);

  // Calendar specific state and hooks
  const { isConnected, loading: isCalStatusLoading, refresh: refreshCalStatus } = useCalIntegrationStatus();
  const {
    hasConnectedCalendar,
    connectedCalendars,
    isLoading: isCalendarCheckLoading,
    apiError,
    googleCalendarConnected: googleConnectedInDB,
    refresh: refreshCalendarStatus
  } = useCalendarsConnected();

  // Check if user has met all requirements to manage availability
  const canManageAvailability = isConnected && hasConnectedCalendar;

  // Check URL parameters for success/error messages from redirects
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const currentUrl = window.location.pathname + window.location.search;

    console.log('[CALENDAR_INTEGRATION_DEBUG] URL params check:', {
      success,
      error,
      currentUrl,
      timestamp: new Date().toISOString()
    });

    if (success) {
      const successMessage = success === 'calendar_connected' ? 'Calendar connected successfully!' : 'Operation completed successfully!';
      toast.success(successMessage);

      // Refresh statuses after success
      console.log('[CALENDAR_INTEGRATION_DEBUG] Success param detected, refreshing statuses...');
      const timer = setTimeout(() => {
        refreshCalStatus();
        refreshCalendarStatus();
      }, 500); // Short delay before refresh

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('success');
      newParams.delete('t'); // Remove timestamp if present
      router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });

      return () => clearTimeout(timer); // Cleanup timeout on unmount

    } else if (error) {
      const errorMessage = error === 'true' ? 'An error occurred.' : decodeURIComponent(error);
      console.error('[CALENDAR_INTEGRATION_DEBUG] Error param detected:', { errorMessage });
      toast.error(`Error: ${errorMessage}`);

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('error');
      newParams.delete('t'); // Remove timestamp if present
      router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]); // Dependencies: searchParams and router


   // Function to handle calendar connection (Moved from settings page)
  const handleCalendarConnect = async (calendarType: 'google' | 'office365') => {
    if (!isConnected) {
      toast.error("Please enable Dibs Scheduling first");
      return;
    }

    let loadingToast: string | undefined; // Declare toast ID variable

    try {
      // Show loading toast
      loadingToast = toast.loading(`Preparing ${calendarType === 'google' ? 'Google' : 'Office 365'} Calendar connection...`);

      // Use the helper function to get authenticated user's ULID
      const authResult = await getAuthenticatedUserUlid();

      if (authResult.error || !authResult.data) {
        toast.dismiss(loadingToast); // Dismiss loading toast on error
        toast.error('Authentication error: ' + (authResult.error?.message || 'Unknown error'));
        return;
      }

      const userUlid = authResult.data.userUlid;

      // Get calendar integration details
      const supabase = createAuthClient();
      const { data: integration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('calAccessTokenExpiresAt')
        .eq('userUlid', userUlid)
        .maybeSingle();

       if (integrationError) {
           console.error("[CAL_CONNECT_DEBUG] Error fetching integration details:", integrationError);
           // Optionally handle this error, e.g., assume refresh needed or show error
       }

      // Check if token is expired using CalTokenService directly
      let needsTokenRefresh = false;

      try {
        // Get current token expiration info from database
        if (integration?.calAccessTokenExpiresAt) {
          // Use the static method directly to check if token is expired or expiring soon
          needsTokenRefresh = CalTokenService.isTokenExpired(
            integration.calAccessTokenExpiresAt,
            5, // Use 5 minutes buffer
            true // Force the check to handle Cal.com's token validation
          );

          console.log('[CAL_CONNECT_DEBUG] Token status check:', {
            needsTokenRefresh,
            expiresAt: integration.calAccessTokenExpiresAt,
            timestamp: new Date().toISOString()
          });
        } else {
          // If we don't have expiration info, assume we need a refresh
          console.log('[CAL_CONNECT_DEBUG] No token expiration info found, assuming refresh needed.');
          needsTokenRefresh = true;
        }
      } catch (e) {
        // If we can't check status, assume we need a refresh as fallback
        console.warn('[CAL_CONNECT_DEBUG] Failed to check token status, will refresh as precaution', e);
        needsTokenRefresh = true;
      }

      // Only refresh tokens if needed
      if (needsTokenRefresh) {
        console.log('[CAL_CONNECT_DEBUG] Refreshing tokens before OAuth flow');

        // We now have a properly typed userUlid string from the helper function
        const refreshResult = await refreshUserCalTokens(userUlid, true); // Pass true to force Cal.com validation

        if (!refreshResult.success) {
           console.error("[CAL_CONNECT_DEBUG] Token refresh failed:", refreshResult.error);
          toast.dismiss(loadingToast); // Dismiss loading toast on error
          toast.error('Failed to refresh Cal.com tokens. Please try again.');
          return;
        }
         console.log('[CAL_CONNECT_DEBUG] Token refresh successful.');
      } else {
         console.log('[CAL_CONNECT_DEBUG] Token refresh not needed.');
      }

      // Get the OAuth authorization URL from Cal.com
      console.log(`[CAL_CONNECT_DEBUG] Getting ${calendarType} OAuth URL`);
      const response = await fetch(`/api/cal/calendars/oauth-connect-url?type=${calendarType}`);
      const result = await response.json();

      // Dismiss the loading toast *before* redirecting or showing error
      toast.dismiss(loadingToast);

      // Handle errors fetching OAuth URL
      if (!response.ok || result.error) {
        const errorMessage = result.error || 'Failed to prepare calendar connection';
        console.error(`[CAL_CONNECT_DEBUG] ${calendarType} OAuth URL error:`, errorMessage, { status: response.status });
        toast.error(errorMessage);
        return;
      }

      // Get the authorization URL
      const authUrl = result.url;
      if (!authUrl) {
        console.error(`[CAL_CONNECT_DEBUG] No ${calendarType} authUrl in response:`, result);
        toast.error('Failed to get authorization URL');
        return;
      }

      // Redirect to the Cal.com authorization URL
      console.log(`[CAL_CONNECT_DEBUG] Redirecting to ${calendarType} authorization URL:`, authUrl);
      window.location.href = authUrl;

    } catch (error) {
       console.error(`[CAL_CONNECT_DEBUG] ${calendarType} connection error (outer catch):`, error);
       // Ensure loading toast is dismissed in case of unexpected errors
       if (loadingToast) {
           toast.dismiss(loadingToast);
       }
      toast.error('Failed to connect calendar. Please try again.');
    }
  };

  // Fetch user capabilities on mount
  useEffect(() => {
    async function loadUserCapabilities() {
      if (user?.id) {
        console.log('[CALENDAR_INTEGRATION_DEBUG] Loading capabilities:', {
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        setLoadingCapabilities(true);
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Capabilities fetch timeout')), 15000)
          );
          const fetchPromise = fetchUserCapabilities({});
          const result = await Promise.race([fetchPromise, timeoutPromise]) as ApiResponse<UserCapabilitiesResponse>;

          if (result.error) {
            throw result.error;
          }
          if (result.data) {
            console.log('[CALENDAR_INTEGRATION_DEBUG] Capabilities loaded:', {
              capabilities: result.data.capabilities,
              timestamp: new Date().toISOString()
            })
            setUserCapabilities(result.data.capabilities);
            setHasCoachCapability(result.data.capabilities.includes(USER_CAPABILITIES.COACH));
          } else {
             setHasCoachCapability(false); // Default if data is missing
          }
        } catch (error) {
          console.error("[CALENDAR_INTEGRATION_DEBUG] Capabilities fetch error:", {
            error,
            timestamp: new Date().toISOString()
          });
          setUserCapabilities([]);
          setHasCoachCapability(false); // Default on error
        } finally {
          setLoadingCapabilities(false);
        }
      } else {
          // Handle case where user ID isn't available yet or user is logged out
          console.log('[CALENDAR_INTEGRATION_DEBUG] No user ID available, cannot load capabilities.');
          setLoadingCapabilities(false);
          setHasCoachCapability(false);
      }
    }
    loadUserCapabilities();
  }, [user?.id]); // Rerun when user ID changes


  // Loading state or unauthorized access handling
  if (loadingCapabilities) {
    return (
       <div className="container mx-auto py-10 flex items-center justify-center">
          <div className="text-center">
             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
             <p>Loading integrations...</p>
          </div>
       </div>
    );
  }

  if (!hasCoachCapability) {
     return (
         <div className="container mx-auto py-10">
             <Alert variant="destructive">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Access Denied</AlertTitle>
                 <AlertDescription>
                    You do not have the required permissions to access calendar integrations.
                 </AlertDescription>
             </Alert>
         </div>
     );
  }

  // Main component render
  return (
    <div className="container mx-auto py-8">
      <div className="border rounded-lg p-6 bg-background">
        <div className="space-y-8">
          {/* Dibs Scheduling Section */}
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V5" stroke="#3E63DD" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M16 2V5" stroke="#3E63DD" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 9H21" stroke="#3E63DD" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6C21 4.89543 20.1046 4 19 4Z" stroke="#3E63DD" strokeWidth="1.5" />
                  <path d="M12 12H9V15H12V12Z" fill="#3E63DD" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold tracking-tight">Dibs Scheduling</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable online booking for your coaching sessions
                </p>
              </div>
              <div>
                {!isConnected && !isCalStatusLoading && (
                  <Button
                    variant="default"
                    onClick={() => {
                      if (!user?.emailAddresses?.[0]?.emailAddress) {
                        toast.error("Email is required to enable scheduling");
                        return;
                      }

                      setLoading(true);
                      fetch('/api/cal/users/create-managed-user', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          email: user.emailAddresses[0].emailAddress,
                          name: user.fullName || 'Coach',
                          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        })
                      })
                        .then(async (response) => { // Make async to handle potential JSON error
                            if (!response.ok) {
                                let errorData;
                                try {
                                    errorData = await response.json();
                                } catch (e) {
                                    // Handle cases where the response isn't valid JSON
                                    throw new Error(`HTTP error ${response.status}: Failed to create Cal.com user`);
                                }
                                throw new Error(errorData.error || 'Failed to create Cal.com user');
                            }
                            return response.json();
                        })
                        .then(data => {
                          if (data.error) {
                            throw new Error(data.error);
                          }
                          // Refresh the Cal integration status AFTER success
                          refreshCalStatus();
                          // Navigate to the success route on THIS page
                          router.push('/dashboard/coach/integrations/calendar?success=true&t=' + Date.now());
                        })
                        .catch(error => {
                          console.error('Scheduling integration error:', error);
                          // Navigate to the error route on THIS page
                          router.push('/dashboard/coach/integrations/calendar?error=' + encodeURIComponent(error.message || 'true') + '&t=' + Date.now());
                        })
                        .finally(() => {
                          setLoading(false);
                        });
                    }}
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Enable Scheduling'}
                  </Button>
                )}

                {isCalStatusLoading && (
                  <Button variant="outline" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking status...
                  </Button>
                )}
              </div>
            </div>

             {/* Moved Success/Error Alerts are handled by the useEffect hook watching searchParams */}

            {isConnected && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Scheduling Enabled</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-muted-foreground">Account active</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-muted-foreground">
                    Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-muted-foreground">
                    Token: valid {/* Consider fetching/showing actual token status if needed */}
                  </span>
                  <button
                    className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-blue-100"
                    onClick={() => refreshCalStatus()}
                    aria-label="Refresh status"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Calendar Connection Section */}
            {isConnected && (
              <div className="space-y-6 mt-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Connect Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your primary calendar to sync events and manage availability. This helps prevent double-bookings.
                  </p>
                </div>

                {apiError && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Calendar Verification Issue</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      {apiError}
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs mt-1"
                          onClick={() => refreshCalendarStatus()}
                        >
                          Retry Verification
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Calendar Card */}
                  <div className={`rounded-lg p-6 border hover:border-primary transition-colors ${
                    (googleConnectedInDB || connectedCalendars.some(entry =>
                      (entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar') ||
                      entry?.integration === 'google_calendar')
                    ) ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full ${(googleConnectedInDB || connectedCalendars.some(entry =>
                        (entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar') ||
                        entry?.integration === 'google_calendar')
                        ) ? 'bg-green-100' : 'bg-blue-50'} flex items-center justify-center`}>
                        <SiGooglecalendar className={`h-5 w-5 ${(googleConnectedInDB || connectedCalendars.some(entry =>
                          (entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar') ||
                          entry?.integration === 'google_calendar')
                          ) ? 'text-green-600' : 'text-[#4285F4]'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        {isCalendarCheckLoading ? (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking status...
                          </div>
                        ) : (googleConnectedInDB || connectedCalendars.some(entry =>
                          (entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar') ||
                          entry?.integration === 'google_calendar')
                        ) ? (
                          <div className="text-xs text-green-600 mt-1">
                            Connected
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">Not Connected</div>
                        )}
                      </div>
                    </div>

                    {(googleConnectedInDB || connectedCalendars.some(entry =>
                      (entry?.integration?.type === 'google_calendar' || entry?.integration?.slug === 'google-calendar') ||
                      entry?.integration === 'google_calendar')
                    ) ? (
                      <div className="mt-4">
                        <div className="text-sm text-green-700 rounded-md">
                          <p className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> Google Calendar connected successfully! Your calendar events will now sync automatically.
                          </p>
                           {/* Add disconnect button or other management options here if needed */}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => handleCalendarConnect('google')}
                      >
                        Connect Google Calendar
                      </Button>
                    )}
                  </div>

                  {/* Office 365 Calendar Card */}
                   <div className={`rounded-lg p-6 border hover:border-primary transition-colors ${connectedCalendars.some(entry =>
                       (entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ||
                       entry?.integration === 'office365_calendar') // Adjusted check for Office 365
                   ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-center space-x-3">
                       <div className={`h-10 w-10 rounded-full ${connectedCalendars.some(entry =>
                           (entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ||
                           entry?.integration === 'office365_calendar')
                           ? 'bg-green-100' : 'bg-blue-50'} flex items-center justify-center`}>
                           <BsCalendar2Week className={`h-5 w-5 ${connectedCalendars.some(entry =>
                              (entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ||
                              entry?.integration === 'office365_calendar')
                           ? 'text-green-600' : 'text-[#00A4EF]'}`} />
                       </div>
                      <div>
                        <h4 className="font-medium">Office 365 Calendar</h4>
                        {isCalendarCheckLoading ? (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking status...
                          </div>
                        ) : connectedCalendars.some(entry =>
                          (entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ||
                          entry?.integration === 'office365_calendar') // Adjusted check
                        ? (
                          <div className="text-xs text-green-600 mt-1">
                            Connected
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">Not Connected</div>
                        )}
                      </div>
                    </div>

                     {connectedCalendars.some(entry =>
                         (entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ||
                         entry?.integration === 'office365_calendar') // Adjusted check
                     ? (
                      <div className="mt-4">
                        <div className="text-sm text-green-700 rounded-md">
                          <p className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> Office 365 Calendar connected successfully! Your calendar events will now sync automatically.
                          </p>
                          {/* Add disconnect button or other management options here if needed */}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => handleCalendarConnect('office365')}
                      >
                        Connect Office 365 Calendar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Availability Management Section */}
            {isConnected && (
              <div className="space-y-4 mt-8">
                {!canManageAvailability && !isCalendarCheckLoading && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Calendar Connection Required</AlertTitle>
                    <AlertDescription>
                      You need to connect a third-party calendar (like Google Calendar or Office 365) before you can manage your availability.
                    </AlertDescription>
                  </Alert>
                )}

                {canManageAvailability && !isCalendarCheckLoading && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Ready to Manage Availability</AlertTitle>
                    <AlertDescription>
                      Your scheduling is enabled and calendar is connected. You can now manage your availability.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="default"
                    className="gap-2"
                    // Updated link to point to the correct availability page
                    onClick={() => router.push('/dashboard/coach/availability')}
                    disabled={!canManageAvailability || isCalendarCheckLoading || isCalStatusLoading} // Also disable if main status is loading
                  >
                    {isCalendarCheckLoading || isCalStatusLoading ? ( // Check both loading states
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarDays className="h-4 w-4" />
                    )}
                    Manage Availability
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
