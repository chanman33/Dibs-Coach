"use client"

import config from '@/config'
import { UserProfile } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchUserCapabilities, type UserCapabilitiesResponse } from "@/utils/actions/user-profile-actions"
import { type ApiResponse } from "@/utils/types/api"
import { Loader2, Building, Building2, Users2, Network, ArrowRight, Check, CheckCircle, XCircle, CalendarDays, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { useOrganization } from '@/utils/auth/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalConnectedStatus, useCalIntegrationStatus } from '@/components/cal/CalConnectedStatus'
import { SiGooglecalendar } from 'react-icons/si'
import { BsCalendar2Week } from 'react-icons/bs'
import { createAuthClient } from '@/utils/auth'
import { OrganizationMember } from '@/utils/auth/OrganizationContext'
import { refreshUserCalTokens } from '@/utils/actions/cal/cal-tokens'
import { CalTokenService } from '@/lib/cal/cal-service'
import { getAuthenticatedUserUlid } from '@/utils/auth/cal-auth-helpers'

// Map organization types to icons and colors
const orgTypeConfig: Record<string, { icon: any, color: string }> = {
  INDIVIDUAL: { icon: Building, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  TEAM: { icon: Users2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  BUSINESS: { icon: Building2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ENTERPRISE: { icon: Building2, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  FRANCHISE: { icon: Network, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  NETWORK: { icon: Network, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

// Map org roles to display names and colors
const roleConfig: Record<string, { label: string, color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  MANAGER: { label: 'Manager', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  MEMBER: { label: 'Member', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  VIEWER: { label: 'Viewer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
};

// Map org status to colors
const statusConfig: Record<string, { color: string }> = {
  ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  INACTIVE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  SUSPENDED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  ARCHIVED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
};

// Format date
const formatDate = (dateString: string) => {
  try {
    // Check if the date is valid before formatting
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Recently added";
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("[DATE_FORMAT_ERROR]", error);
    return "Recently added";
  }
};

// Function to check if user has connected a third-party calendar
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

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [userCapabilities, setUserCapabilities] = useState<string[]>([])
  const [loadingCapabilities, setLoadingCapabilities] = useState(true)
  const [oauthDebugUrl, setOauthDebugUrl] = useState<string | null>(null)
  const [isCoach, setIsCoach] = useState(false)
  const [activeTab, setActiveTab] = useState("account")
  const orgContext = useOrganization();
  const searchParams = useSearchParams();
  const hasSuccessParam = searchParams.get('success') === 'true';
  const hasErrorParam = searchParams.get('error') === 'true';
  const calendarConnected = searchParams.get('success') === 'calendar_connected';
  const { isConnected, loading: isCalStatusLoading, refresh: refreshCalStatus } = useCalIntegrationStatus()
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

  // Set the active tab based on the URL parameter and handle success/error messages
  useEffect(() => {
    const tab = searchParams.get('tab');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    console.log('[SETTINGS_PAGE_DEBUG] URL params change detected:', {
      tab,
      currentTab: activeTab,
      success,
      error,
      timestamp: new Date().toISOString()
    })

    // Determine the target tab
    let targetTab = activeTab;
    if (tab && ['account', 'organizations', 'integrations', 'notifications', 'subscription'].includes(tab)) {
      targetTab = tab;
    } else if (success === 'calendar_connected' || success === 'true') {
      // Default to integrations tab on success if no tab is specified
      targetTab = 'integrations';
    }

    // Update active tab state if needed
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }

    // Process success/error messages
    if (success) {
      // Show a general success toast
      toast.success(success === 'calendar_connected' ? 'Calendar connected successfully!' : 'Operation completed successfully!');

      // Refresh statuses naturally when landing on integrations tab
      if (targetTab === 'integrations') {
        console.log('[SETTINGS_PAGE_DEBUG] Success param detected for integrations, triggering status refresh');
        // Add a slight delay to allow hooks to potentially pick up changes after redirect
        const timer = setTimeout(() => {
          refreshCalStatus();
          refreshCalendarStatus();
        }, 500); // Short delay before refresh
        // No cleanup needed here as it's a one-off action per success param
      }

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('success');
      newParams.delete('t'); // Remove timestamp if present
      if (!newParams.has('tab') && targetTab) {
        newParams.set('tab', targetTab); // Ensure tab is preserved/set in URL
      }
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });

    } else if (error) {
      console.error('[SETTINGS_PAGE_DEBUG] Processing error:', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error(`Error: ${error}`);

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('error');
      newParams.delete('t'); // Remove timestamp if present
      if (!newParams.has('tab') && targetTab) {
        newParams.set('tab', targetTab); // Ensure tab is preserved/set in URL
      }
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    }
    // Removed refreshCalendarStatus and refreshCalStatus from deps as the refresh is now conditional inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, activeTab]); // Depend only on params, router, and activeTab

  // When a tab is clicked, update the URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Create a new URLSearchParams
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', value);

    // Log the tab change
    console.log('[SETTINGS_PAGE_DEBUG] Tab changed manually:', {
      newTab: value,
      params: newParams.toString(),
      timestamp: new Date().toISOString()
    });

    // Replace the current URL with the new one
    router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
  };

  // Handle integration tab interactions with better delay handling
  useEffect(() => {
    // Only run this effect when the active tab is 'integrations'
    if (activeTab !== 'integrations') return;

    // If we're on the integrations tab and it has a success parameter, we need to
    // ensure that integration statuses are properly refreshed with delay
    // Note: This useEffect might be redundant now due to the main useEffect handling refreshes,
    // but keeping it for now as a safeguard. Can be potentially removed if testing confirms it's unnecessary.
    const hasSuccessInURL = searchParams.get('success') === 'true' || searchParams.get('success') === 'calendar_connected';
    const hasTimestamp = searchParams.has('t');

    if (hasSuccessInURL && hasTimestamp) {
      console.log('[SETTINGS_PAGE_DEBUG] Integration tab with legacy success/timestamp params, scheduling status refresh');

      // Add delay before checking integration status
      const timer = setTimeout(() => {
        console.log('[SETTINGS_PAGE_DEBUG] Refreshing integration statuses after delay (legacy path)');
        refreshCalStatus();
        refreshCalendarStatus();
      }, 1500); // Slightly shorter delay than before

      return () => clearTimeout(timer);
    }
  }, [activeTab, searchParams, refreshCalStatus, refreshCalendarStatus]);

  useEffect(() => {
    async function loadUserCapabilities() {
      if (user?.id) {
        console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities:', {
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        try {
          // Add timeout protection to prevent infinite waiting
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Capabilities fetch timeout')), 15000)
          );

          const fetchPromise = fetchUserCapabilities({});

          // Race between the fetch and the timeout
          const result = await Promise.race([fetchPromise, timeoutPromise]) as ApiResponse<UserCapabilitiesResponse>;

          if (result.error) {
            throw result.error;
          }

          if (result.data) {
            console.log('[SETTINGS_PAGE_DEBUG] Capabilities loaded:', {
              capabilities: result.data.capabilities,
              timestamp: new Date().toISOString()
            })
            setUserCapabilities(result.data.capabilities);
          }
        } catch (error) {
          console.error("[SETTINGS_PAGE_DEBUG] Capabilities fetch error:", {
            error,
            timestamp: new Date().toISOString()
          });
          // Set default capabilities to prevent UI from being stuck in loading
          setUserCapabilities([]);
        } finally {
          // Always mark loading as complete, even on error
          setLoadingCapabilities(false);
        }
      } else if (loadingCapabilities) {
        // If we don't have a user ID but we're still loading, stop the loading state
        console.log('[SETTINGS_PAGE_DEBUG] No user ID available, stopping capabilities loading');
        setLoadingCapabilities(false);
      }
    }

    loadUserCapabilities();
    // Removed loadingCapabilities from dependency array as it causes unnecessary reruns
  }, [user?.id]);

  // Debug render with more details
  console.log('[SETTINGS_PAGE_DEBUG] Rendering:', {
    isCoach,
    activeTab,
    loadingCapabilities,
    userCapabilitiesCount: userCapabilities.length,
    timestamp: new Date().toISOString()
  });

  // Check if Organization context is loading
  if (!orgContext) {
    console.log('[SETTINGS_PAGE_DEBUG] Waiting for organization context...');
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Initializing settings...</p>
        </div>
      </div>
    );
  }

  // Destructure after confirming context is available
  const { organizations, organizationUlid, setOrganizationUlid, isLoading: isLoadingOrgs } = orgContext;

  if (loadingCapabilities || isLoadingOrgs) { // Check both capability and org loading
    console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities or organizations');
    // Return a more informative loading state
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const renderOrganizationsContent = () => {
    if (isLoadingOrgs) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden flex flex-col">
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-7 w-48" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-3 mt-auto">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="max-h-[600px] overflow-y-auto pr-2">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No organizations found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              You don't belong to any organizations yet
            </p>
            <Button
              onClick={() => router.push('/dashboard/organizations/create')}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" /> Create Organization
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {organizations.map((org: OrganizationMember) => {
              const OrgIcon = orgTypeConfig[org.organization.type]?.icon || Building;
              const typeColor = orgTypeConfig[org.organization.type]?.color || '';
              const roleConfig_ = roleConfig[org.role] || { label: org.role, color: '' };
              const statusColor = statusConfig[org.organization.status]?.color || '';
              const isActive = org.organizationUlid === organizationUlid;

              return (
                <Card key={org.organizationUlid} className={`overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-primary' : ''} flex flex-col`}>
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${typeColor}`}>
                          <OrgIcon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl truncate max-w-[220px]">
                          {org.organization.name}
                        </CardTitle>
                      </div>
                      {isActive && (
                        <Badge variant="outline" className="gap-1 border-primary text-primary px-3 py-1">
                          <Check className="h-3.5 w-3.5" /> Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className={`${roleConfig_.color} px-3 py-1`}>
                        {roleConfig_.label}
                      </Badge>
                      {(!isActive || org.organization.status !== 'ACTIVE') && (
                        <Badge variant="secondary" className={`${statusColor} px-3 py-1`}>
                          {org.organization.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 flex-1">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Joined:</span>
                        <span>{formatDate(org.joinedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-3 flex justify-center mt-auto">
                    {isActive ? (
                      <Button variant="secondary" className="w-full text-sm h-10" disabled>
                        Current Organization
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full text-sm h-10"
                        onClick={() => setOrganizationUlid(org.organizationUlid)}
                      >
                        Switch to this Organization
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Function to handle calendar connection
  const handleCalendarConnect = async (calendarType: 'google' | 'office365') => {
    if (!isConnected) {
      toast.error("Please enable Dibs Scheduling first");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading(`Preparing ${calendarType === 'google' ? 'Google' : 'Office 365'} Calendar connection...`);
      setOauthDebugUrl(null);

      // Use the helper function to get authenticated user's ULID
      const authResult = await getAuthenticatedUserUlid();

      if (authResult.error || !authResult.data) {
        toast.dismiss(loadingToast);
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
          needsTokenRefresh = true;
        }
      } catch (e) {
        // If we can't check status, assume we need a refresh as fallback
        console.warn('[CAL_CONNECT_DEBUG] Failed to check token status, will refresh as precaution');
        needsTokenRefresh = true;
      }

      // Only refresh tokens if needed
      if (needsTokenRefresh) {
        console.log('[CAL_CONNECT_DEBUG] Refreshing tokens before OAuth flow');

        // We now have a properly typed userUlid string from the helper function
        const refreshResult = await refreshUserCalTokens(userUlid, true);

        if (!refreshResult.success) {
          toast.dismiss(loadingToast);
          toast.error('Failed to refresh Cal.com tokens. Please try again.');
          return;
        }
      }

      // Get the OAuth authorization URL from Cal.com
      console.log(`[CAL_CONNECT_DEBUG] Getting ${calendarType} OAuth URL`);
      const response = await fetch(`/api/cal/calendars/oauth-connect-url?type=${calendarType}`);
      const result = await response.json();

      // Dismiss the loading toast
      toast.dismiss(loadingToast);

      // Handle errors
      if (!response.ok) {
        const errorMessage = result.error || 'Failed to prepare calendar connection';
        console.error(`[CAL_CONNECT_DEBUG] ${calendarType} OAuth URL error:`, errorMessage);
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

      // For debugging, store the URL
      setOauthDebugUrl(authUrl);

      // Redirect to the Cal.com authorization URL
      // This starts the Cal.com > Google/Microsoft OAuth flow
      console.log(`[CAL_CONNECT_DEBUG] Redirecting to ${calendarType} authorization URL:`, authUrl);
      window.location.href = authUrl;

    } catch (error) {
      console.error(`[CAL_CONNECT_DEBUG] ${calendarType} connection error:`, error);
      toast.error('Failed to connect calendar');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-8">
          <TabsTrigger
            value="account"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Account
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Organizations
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Calendar Integrations
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-0">
          {config?.auth?.enabled && (
            <div className="bg-background rounded-lg">
              <UserProfile
                appearance={{
                  elements: {
                    card: "!border !border-solid !border-border bg-background text-foreground rounded-lg shadow-none",
                    navbar: "!border-b !border-solid !border-border",
                    rootBox: "[&_*]:!shadow-none [&>div]:bg-background [&>div]:!border [&>div]:!border-solid [&>div]:!border-border [&_.cl-card]:!border [&_.cl-card]:!border-solid [&_.cl-card]:!border-border",
                    pageScrollBox: "bg-background [&>div]:bg-background"
                  },
                  variables: {
                    borderRadius: "0.75rem"
                  }
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="mt-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">My Organizations</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your organization memberships and switch between organizations
                </p>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              {renderOrganizationsContent()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
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
                            .then(response => {
                              if (!response.ok) {
                                return response.json().then(data => {
                                  throw new Error(data.error || 'Failed to create Cal.com user');
                                });
                              }
                              return response.json();
                            })
                            .then(data => {
                              if (data.error) {
                                throw new Error(data.error);
                              }
                              // Refresh the Cal integration status
                              refreshCalStatus();
                              // Navigate to the success route
                              router.push('/dashboard/settings?tab=integrations&success=true');
                            })
                            .catch(error => {
                              console.error('Scheduling integration error:', error);
                              router.push('/dashboard/settings?tab=integrations&error=true');
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

                {/* Success/Error Alerts */}
                {hasSuccessParam && !isConnected && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Successfully enabled!</AlertTitle>
                    <AlertDescription>
                      Online scheduling has been successfully enabled for your account.
                    </AlertDescription>
                  </Alert>
                )}

                {hasErrorParam && !isConnected && (
                  <Alert className="bg-red-50 border-red-200" variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Setup failed</AlertTitle>
                    <AlertDescription>
                      There was an error enabling scheduling. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

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
                        Token: valid
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
                      <div className={`rounded-lg p-6 border hover:border-primary transition-colors ${connectedCalendars.some(entry => entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-full ${connectedCalendars.some(entry => entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ? 'bg-green-100' : 'bg-blue-50'} flex items-center justify-center`}>
                            <BsCalendar2Week className={`h-5 w-5 ${connectedCalendars.some(entry => entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ? 'text-green-600' : 'text-[#00A4EF]'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">Office 365 Calendar</h4>
                            {isCalendarCheckLoading ? (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking status...
                              </div>
                            ) : connectedCalendars.some(entry => entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ? (
                              <div className="text-xs text-green-600 mt-1">
                                Connected
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-1">Not Connected</div>
                            )}
                          </div>
                        </div>

                        {connectedCalendars.some(entry => entry?.integration?.type === 'office365_calendar' || entry?.integration?.slug === 'office-365-calendar') ? (
                          <div className="mt-4">
                            <div className="text-sm text-green-700 rounded-md">
                              <p className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> Office 365 Calendar connected successfully! Your calendar events will now sync automatically.
                              </p>
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
              </div>

              {/* OAuth Debug URL Display */}
              {oauthDebugUrl && (
                <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-blue-800">Authorization URL</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setOauthDebugUrl(null)}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    Your browser blocked the popup. Please use the URL below to authorize:
                  </p>
                  <div className="border border-blue-300 bg-white rounded-md p-2 overflow-x-auto mb-2">
                    <pre className="text-xs text-blue-800 whitespace-pre-wrap break-all">{oauthDebugUrl}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(oauthDebugUrl);
                        toast.success("URL copied to clipboard");
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(oauthDebugUrl, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Try Again
                    </Button>
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
                      onClick={() => router.push('/dashboard/coach/availability')}
                      disabled={!canManageAvailability || isCalendarCheckLoading}
                    >
                      {isCalendarCheckLoading ? (
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
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <div className="border rounded-lg p-6 bg-background">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Choose what notifications you want to receive
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="email-notifications" className="font-medium">Email Notifications</label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="marketing-emails" className="font-medium">Marketing Emails</label>
                    <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                  </div>
                  <Switch id="marketing-emails" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="reminder-notifications" className="font-medium">Session Reminders</label>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming sessions and events</p>
                  </div>
                  <Switch id="reminder-notifications" />
                </div>
                <Button disabled={loading} className="mt-6">
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-0">
          <div className="border rounded-lg p-6 bg-background">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Subscription Details</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">Free Tier</p>
                  </div>
                  <Button variant="outline">Upgrade Plan</Button>
                </div>
                <Separator />
                <div className="py-4">
                  <h3 className="font-medium mb-2">Billing History</h3>
                  <p className="text-sm text-muted-foreground">No billing history available</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 