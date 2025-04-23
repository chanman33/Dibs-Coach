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
      
      console.log('[CALENDAR_CHECK_DEBUG] Calendar integration status:', {
        googleCalendarConnected: integrationData.data?.googleCalendarConnected,
        office365CalendarConnected: integrationData.data?.office365CalendarConnected,
        timestamp: new Date().toISOString()
      });

      // If either calendar is connected, validate with Cal.com
      if (integrationData.data?.googleCalendarConnected || integrationData.data?.office365CalendarConnected) {
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
            setHasConnectedCalendar(true); // Trust the database flag
            setConnectedCalendars([]);
          } else if (data.data.tokenError) {
            console.error('[CALENDAR_CHECK_DEBUG] Token error when fetching calendars');
            setApiError('Authentication error with Cal.com. Please disconnect and reconnect your calendar.');
            setHasConnectedCalendar(true); // Trust the database flag
            setConnectedCalendars([]);
          } else {
            setHasConnectedCalendar(data.data.hasConnectedCalendars || false);
            // If there's calendar details info, store it
            if (data.data.calendars) {
              setConnectedCalendars(data.data.calendars || []);
            }
          }
        } else {
          console.error('[CALENDAR_CHECK_DEBUG] Failed to validate calendars with Cal.com:', data.error);
          // If Cal.com validation fails but we have the flag set, we should still show as connected
          // This prevents UI flicker if Cal.com is temporarily unavailable
          setHasConnectedCalendar(true);
          setConnectedCalendars([]);
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
      setConnectedCalendars([]);
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
  const isCoach = userCapabilities.includes('COACH')
  const [activeTab, setActiveTab] = useState("account")
  const orgContext = useOrganization();
  const searchParams = useSearchParams();
  const hasSuccessParam = searchParams.get('success') === 'true';
  const hasErrorParam = searchParams.get('error') === 'true';
  const calendarConnected = searchParams.get('success') === 'calendar_connected';
  const { isConnected, loading: isCalStatusLoading, refresh: refreshCalStatus } = useCalIntegrationStatus()
  const { hasConnectedCalendar, connectedCalendars, isLoading: isCalendarCheckLoading, apiError, refresh: refreshCalendarStatus } = useCalendarsConnected();

  // Check if user has met all requirements to manage availability
  const canManageAvailability = isConnected && hasConnectedCalendar;

  // Set the active tab based on the URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    console.log('[SETTINGS_PAGE_DEBUG] URL params change detected:', {
      tab,
      currentTab: activeTab,
      success: searchParams.get('success'),
      error: searchParams.get('error'),
      timestamp: new Date().toISOString()
    })

    if (tab && ['account', 'organizations', 'integrations', 'notifications', 'subscription'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // Check for success or error messages in URL
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      if (success === 'calendar_connected' || success === 'true') {
        // Set the active tab to integrations when there's a calendar success
        setActiveTab('integrations');
        
        // First validate the calendar connection with Cal.com
        const validateCalendarConnection = async () => {
          try {
            // Show loading toast
            const loadingToast = toast.loading('Validating calendar connection...');
            
            // Get the authenticated user's ULID to validate the connection is working
            const authResult = await getAuthenticatedUserUlid();
            
            if (authResult.error) {
              toast.dismiss(loadingToast);
              toast.error('Authentication error: ' + authResult.error.message);
              return;
            }
            
            // Wait a moment to ensure Cal.com has processed the connection
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Refresh both integration and calendar status
            await Promise.all([
              refreshCalStatus(),
              refreshCalendarStatus()
            ]);
            
            // Dismiss loading toast
            toast.dismiss(loadingToast);
            
            // Show success message
            toast.success('Calendar connected successfully!');
          } catch (error) {
            console.error('[CALENDAR_VALIDATION_ERROR]', error);
            toast.error('Failed to validate calendar connection. Please try again.');
          }
        };
        
        validateCalendarConnection();
      } else {
        toast.success('Operation completed successfully!');
      }
      
      // Create a new URLSearchParams without the success parameter
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('success');
      
      // If tab wasn't explicitly set but we're showing integrations, add it to the URL
      if (!tab && activeTab === 'integrations') {
        newParams.set('tab', 'integrations');
      }
      
      // Update the URL without the success parameter but preserve the tab
      // Use replace to avoid adding to navigation history
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    } else if (error) {
      console.error('[SETTINGS_PAGE_DEBUG] Processing error:', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error(`Error: ${error}`);
      
      // Create a new URLSearchParams without the error parameter
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('error');
      
      // Update the URL without the error parameter but preserve the tab
      // Use replace to avoid adding to navigation history
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router, activeTab, refreshCalendarStatus, refreshCalStatus]);

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
    const hasSuccessInURL = searchParams.get('success') === 'true';
    const hasTimestamp = searchParams.has('t');
    
    if (hasSuccessInURL && hasTimestamp) {
      console.log('[SETTINGS_PAGE_DEBUG] Integration tab with success parameter detected, scheduling status refresh');
      
      // Add delay before checking integration status to allow organization context to load
      const timer = setTimeout(() => {
        console.log('[SETTINGS_PAGE_DEBUG] Refreshing integration statuses after delay');
        refreshCalStatus();
        refreshCalendarStatus();
      }, 2000);
      
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
          
          const fetchPromise = fetchUserCapabilities();
          
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
            5 // Use 5 minutes buffer
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
    <div className="container mx-auto py-6 space-y-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
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
            Integrations
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

        <TabsContent value="account" className="space-y-4 mt-6">
          {config?.auth?.enabled && (
            <Card className="p-0 border-none">
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
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Organizations</CardTitle>
              <CardDescription>
                Manage your organization memberships and switch between organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderOrganizationsContent()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integrations</CardTitle>
              <CardDescription>
                Connect your calendar service to enable scheduling and availability management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex flex-col space-y-5">
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
                      <h3 className="text-lg font-medium">Dibs Scheduling</h3>
                      <p className="text-sm text-muted-foreground">
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
                    <div className="mt-2 border border-blue-100 bg-blue-50 rounded-lg p-4">
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Enabled {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {isConnected && (
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Connect Calendar</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Connect your primary calendar to sync events and manage availability. This helps prevent double-bookings.
                  </p>
                  
                  {apiError && (
                    <Alert className="mb-4 bg-amber-50 border-amber-200">
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
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-medium">Cal.com Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Refresh your Cal.com integration if you experience connection issues
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${calendarConnected || connectedCalendars.some(cal => cal.type === 'google') ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`h-10 w-10 rounded-full ${calendarConnected || connectedCalendars.some(cal => cal.type === 'google') ? 'bg-green-100' : 'bg-blue-50'} flex items-center justify-center`}>
                          <SiGooglecalendar className={`h-5 w-5 ${calendarConnected || connectedCalendars.some(cal => cal.type === 'google') ? 'text-green-600' : 'text-[#4285F4]'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">Google Calendar</h4>
                          {isCalendarCheckLoading ? (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking status...
                            </div>
                          ) : connectedCalendars.some(cal => cal.type === 'google') ? (
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" /> Connected
                            </div>
                          ) : null}
                        </div>
                        {calendarConnected && (
                          <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" /> Recently Connected
                          </Badge>
                        )}
                      </div>
                      
                      {connectedCalendars.some(cal => cal.type === 'google') ? (
                        <div className="space-y-3">
                          {calendarConnected && (
                            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2 mb-2">
                              <p className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> Google Calendar connected successfully! Your calendar events will now sync automatically.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleCalendarConnect('google')}
                          disabled={loading}
                        >
                          {loading ? <LoadingSpinner size="sm" /> : 'Connect Google Calendar'}
                        </Button>
                      )}
                    </div>
                    
                    <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${connectedCalendars.some(cal => cal.type === 'office365') ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`h-10 w-10 rounded-full ${connectedCalendars.some(cal => cal.type === 'office365') ? 'bg-green-100' : 'bg-blue-50'} flex items-center justify-center`}>
                          <BsCalendar2Week className={`h-5 w-5 ${connectedCalendars.some(cal => cal.type === 'office365') ? 'text-green-600' : 'text-[#00A4EF]'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">Office 365 Calendar</h4>
                          {isCalendarCheckLoading ? (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking status...
                            </div>
                          ) : connectedCalendars.some(cal => cal.type === 'office365') ? (
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" /> Connected
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      {connectedCalendars.some(cal => cal.type === 'office365') ? (
                        <div className="space-y-3">
                          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2 mb-2">
                            <p className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> Office 365 Calendar connected successfully! Your calendar events will now sync automatically.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCalendarConnect('office365')}
                          disabled={loading}
                        >
                          {loading ? <LoadingSpinner size="sm" /> : 'Connect Office 365'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Debug OAuth URL Display */}
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
                </div>
              )}
            </CardContent>
          </Card>
          
          {isConnected && (
            <div className="flex flex-col space-y-4">
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
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="email-notifications" className="font-medium">Email Notifications</label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                </div>
                <Switch id="email-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="marketing-emails" className="font-medium">Marketing Emails</label>
                  <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                </div>
                <Switch id="marketing-emails" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="reminder-notifications" className="font-medium">Session Reminders</label>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming sessions and events</p>
                </div>
                <Switch id="reminder-notifications" />
              </div>
              <Button disabled={loading} className="mt-4">
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">Free Tier</p>
                </div>
                <Button variant="outline">Upgrade Plan</Button>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Billing History</h3>
                <p className="text-sm text-muted-foreground">No billing history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 