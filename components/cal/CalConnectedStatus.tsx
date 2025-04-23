'use client'

import { useEffect, useState } from 'react'
import { fetchCalIntegrationStatus, type CalIntegrationDetails } from '@/utils/actions/cal/cal-integration-actions'
import { CheckCircle, RefreshCw, CalendarDays, AlertTriangle, Unlink, RotateCw, Calendar, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import { refreshUserCalTokens } from '@/utils/actions/cal/cal-tokens'

interface CalConnectedStatusProps {
  className?: string
  onStatusChange?: (isConnected: boolean, isReady: boolean) => void
}

// Define integration status enum for consistent status handling
export type CalendarIntegrationStatus = 'disconnected' | 'connecting' | 'warning' | 'validating' | 'ready' | 'error';

// Define tokenStatus type including our custom 'invalid' status
type TokenStatus = 'valid' | 'refreshed' | 'expired' | 'invalid';

// Modified interface with extended properties
interface CalIntegrationWithApiState {
  // Base CalIntegrationDetails properties
  isConnected: boolean;
  calManagedUserId?: number;
  calUsername?: string;
  timeZone?: string | null;
  createdAt?: string;
  verifiedWithCal?: boolean;
  verificationResponse?: any;
  tokenStatus?: TokenStatus;
  
  // Additional API tracking properties
  lastSuccessfulApiCall?: string;
  apiCallAttempted?: boolean;
}

export function CalConnectedStatus({ className, onStatusChange }: CalConnectedStatusProps) {
  const router = useRouter()
  const { user } = useUser()
  const [integration, setIntegration] = useState<CalIntegrationWithApiState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [refreshingToken, setRefreshingToken] = useState(false)
  const [validatingApi, setValidatingApi] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Derive the true status from all conditions
  const determineStatus = (): CalendarIntegrationStatus => {
    if (!integration) return 'disconnected';
    if (!integration.isConnected) return 'disconnected';
    if (reconnecting) return 'connecting';
    if (validatingApi) return 'validating';
    
    // Critical checks for API functionality
    if (integration.apiCallAttempted && !integration.lastSuccessfulApiCall) {
      return 'warning'; // API call was attempted but failed
    }
    
    if (integration.verifiedWithCal === false || integration.tokenStatus === 'expired' || integration.tokenStatus === 'invalid') {
      return 'warning';
    }
    
    // Only mark as ready if we've confirmed API functionality
    if (integration.lastSuccessfulApiCall) {
      return 'ready';
    }
    
    // Connected but API status unknown
    return 'validating';
  };

  // Test the API functionality to confirm true readiness
  const testApiConnection = async () => {
    if (!user) return;
    setValidatingApi(true);
    
    try {
      // Get user ULID
      const ulIdResponse = await fetch('/api/user/ulid');
      const ulIdData = await ulIdResponse.json();
      if (ulIdData.error || !ulIdData.ulid) {
        throw new Error(ulIdData.error || 'Failed to get user ID');
      }
      
      // Make a simple API call to test Cal.com connectivity
      const testResponse = await fetch('/api/cal/calendars/test-connection');
      const testData = await testResponse.json();
      
      // Update integration state based on API result
      setIntegration((prev) => {
        if (!prev) return prev;
        
        const apiSuccess = testData.success === true;
        const newState = {
          ...prev,
          apiCallAttempted: true,
          lastSuccessfulApiCall: apiSuccess ? new Date().toISOString() : undefined
        };
        
        if (!apiSuccess && prev.tokenStatus === 'valid') {
          // API failed but token reported as valid - likely token issue
          newState.tokenStatus = 'invalid';
        }
        
        return newState;
      });
      
      if (!testData.success) {
        console.error('[CAL_API_TEST] Failed:', testData.error);
      }
    } catch (error) {
      console.error('[CAL_API_TEST] Error:', error);
      
      // Update integration with failed API status
      setIntegration((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          apiCallAttempted: true,
          lastSuccessfulApiCall: undefined
        };
      });
    } finally {
      setValidatingApi(false);
    }
  };

  const fetchIntegrationStatus = async () => {
    setLoading(true);
    try {
      console.log('[DIBS_DEBUG] Fetching scheduling integration status...');
      const result = await fetchCalIntegrationStatus();
      
      if (result.error) {
        console.error('[DIBS_DEBUG] Integration status error:', result.error);
        // Check specifically for organization errors to help the retry mechanism
        if ((result.error.code && result.error.code.toString().includes('ORGANIZATION')) || 
            result.error.message?.includes('organization') || 
            result.error.message?.includes('Organization')) {
          setError('Organization context not ready: ' + result.error.message);
        } else {
          setError(result.error.message);
        }
        setIntegration(null);
        onStatusChange?.(false, false);
      } else {
        console.log('[DIBS_DEBUG] Integration status data:', {
          isConnected: result.data?.isConnected,
          calManagedUserId: result.data?.calManagedUserId,
          verifiedWithCal: result.data?.verifiedWithCal,
          tokenStatus: result.data?.tokenStatus,
          verificationResponse: result.data?.['verificationResponse'] || 'Not available',
          timeZone: result.data?.timeZone,
          createdAt: result.data?.createdAt
        });
        
        // Token was auto-refreshed during fetch - show success toast
        if (result.data?.tokenStatus === 'refreshed' && integration?.tokenStatus !== 'refreshed') {
          toast.success('Calendar token was automatically refreshed');
        }
        
        // Set integration state with proper properties
        if (result.data) {
          setIntegration({
            isConnected: result.data.isConnected || false,
            calManagedUserId: result.data.calManagedUserId,
            calUsername: result.data.calUsername,
            timeZone: result.data.timeZone,
            createdAt: result.data.createdAt,
            verifiedWithCal: result.data.verifiedWithCal,
            verificationResponse: result.data.verificationResponse,
            tokenStatus: result.data.tokenStatus as TokenStatus,
            apiCallAttempted: false // Reset API call flag when fetching fresh status
          });
        }
        
        setError(null);
        
        // Test API connection if connected
        if (result.data?.isConnected) {
          testApiConnection();
        }
      }
    } catch (err) {
      console.error('[DIBS_DEBUG] Failed to fetch scheduling status:', err);
      setError('Failed to fetch scheduling status');
      setIntegration(null);
      onStatusChange?.(false, false);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenRefresh = async () => {
    if (!user) {
      toast.error("User authentication required");
      return;
    }
    
    try {
      setRefreshingToken(true);
      // Get the user ULID first
      const ulIdResponse = await fetch('/api/user/ulid', {
        method: 'GET'
      });
      
      const ulIdData = await ulIdResponse.json();
      if (ulIdData.error || !ulIdData.ulid) {
        throw new Error(ulIdData.error || 'Failed to get user ID');
      }
      
      // Refresh the tokens using the server action with force=true
      const refreshResult = await refreshUserCalTokens(ulIdData.ulid, true);
      
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || 'Token refresh failed');
      }
      
      toast.success('Calendar tokens refreshed successfully!');
      
      // Fetch updated status and test API connection
      await fetchIntegrationStatus();
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Failed to refresh calendar tokens');
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleReconnect = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error("Email is required to enable scheduling");
      return;
    }
    
    try {
      setReconnecting(true);
      const response = await fetch('/api/cal/users/create-managed-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          name: user.fullName || 'Coach',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Cal.com user');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success('Scheduling reconnected successfully!');
      router.push('/dashboard/settings?tab=integrations&success=true');
      
      // Fetch updated status and test API connection
      await fetchIntegrationStatus();
    } catch (error) {
      console.error('Scheduling reconnection error:', error);
      toast.error('Failed to reconnect scheduling');
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    console.log('[DIBS_DEBUG] CalConnectedStatus component mounted or onStatusChange changed');
    fetchIntegrationStatus();
  }, [onStatusChange]);

  // Add retry mechanism if loading fails
  useEffect(() => {
    // If there's an error due to missing organization context, retry after a delay
    if (error && error.includes('organization') && retryCount < 3) {
      console.log(`[DIBS_DEBUG] Retrying integration status fetch due to organization context error (${retryCount + 1}/3)`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchIntegrationStatus();
      }, 2000); // 2 second delay between retries
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  // Update parent component with status changes
  useEffect(() => {
    const status = determineStatus();
    const isConnected = integration?.isConnected || false;
    const isReady = status === 'ready';
    
    // Pass both connected state and ready state to parent
    onStatusChange?.(isConnected, isReady);
  }, [integration, reconnecting, validatingApi, onStatusChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-4 mt-4 border rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  // We now always show the component to reflect accurate status
  const status = determineStatus();

  // Render appropriate content based on status
  return (
    <div className={className}>
      {/* Calendar Integration Status Card */}
      {integration?.isConnected && (
        <Card className="border rounded-lg mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  status === 'ready' ? 'bg-green-50' : 
                  status === 'warning' ? 'bg-amber-50' : 
                  'bg-blue-50'
                }`}>
                  <CalendarDays className={`h-5 w-5 ${
                    status === 'ready' ? 'text-green-600' : 
                    status === 'warning' ? 'text-amber-600' : 
                    'text-blue-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Scheduling Enabled</h3>
                    {status === 'warning' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Calendar verification issue detected. The connection may need to be refreshed.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {status === 'ready' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {validatingApi && (
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Account active</span>
                    {integration.timeZone && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>Timezone: {integration.timeZone}</span>
                      </>
                    )}
                    {integration.tokenStatus && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>Token: {integration.tokenStatus}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {integration.createdAt && (
                      <Badge variant="outline" className="text-xs">
                        Enabled {format(new Date(integration.createdAt), 'MMM d, yyyy')}
                      </Badge>
                    )}
                    {integration.lastSuccessfulApiCall && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-800">
                        API verified {format(new Date(integration.lastSuccessfulApiCall), 'h:mm a')}
                      </Badge>
                    )}
                    {status === 'warning' && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800">
                        {!integration.verifiedWithCal 
                          ? "Verification needed" 
                          : integration.tokenStatus === 'expired' 
                            ? "Token expired" 
                            : "API access issue"}
                      </Badge>
                    )}
                    {integration.tokenStatus === 'refreshed' && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">
                        Token refreshed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {status === 'warning' && (
                      <>
                        {!integration.verifiedWithCal && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={handleReconnect}
                            disabled={reconnecting}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            {reconnecting ? 'Reconnecting...' : 'Refresh Connection'}
                          </Button>
                        )}
                        
                        {(integration.tokenStatus === 'expired' || integration.apiCallAttempted && !integration.lastSuccessfulApiCall) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={handleTokenRefresh}
                            disabled={refreshingToken}
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                            {refreshingToken ? 'Refreshing...' : 'Refresh Token'}
                          </Button>
                        )}
                      </>
                    )}
                    
                    {status === 'validating' && (
                      <Badge variant="outline" className="text-xs px-2 py-1 flex items-center gap-1 bg-blue-50 text-blue-800">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Validating API connection
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchIntegrationStatus}
                title="Refresh status"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consolidated Status Banner */}
      {integration?.isConnected && (
        <div className={`mt-4 p-4 rounded-lg flex items-center ${
          status === 'ready' ? 'bg-green-50 border border-green-200' :
          status === 'warning' ? 'bg-amber-50 border border-amber-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {status === 'ready' && (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-green-800">Ready to Manage Availability</h3>
                <p className="text-sm text-green-700">Your scheduling is enabled and calendar is connected. You can now manage your availability.</p>
              </div>
              <div className="ml-auto">
                <Button 
                  onClick={() => router.push('/dashboard/coach/availability')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Availability
                </Button>
              </div>
            </>
          )}
          
          {status === 'warning' && (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <h3 className="font-medium text-amber-800">Calendar Verification Issue</h3>
                <p className="text-sm text-amber-700">
                  {!integration.verifiedWithCal 
                    ? "Could not verify calendars with Cal.com API, but database indicates calendars are connected." 
                    : integration.tokenStatus === 'expired'
                      ? "Your calendar access token appears to be expired. Please refresh your token."
                      : "Calendar API access issue detected. Please refresh your connection."}
                </p>
              </div>
              <div className="ml-auto">
                <Button 
                  variant="outline"
                  onClick={handleTokenRefresh}
                  className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                  disabled={refreshingToken}
                >
                  <RotateCw className={`h-4 w-4 mr-2 ${refreshingToken ? 'animate-spin' : ''}`} />
                  {refreshingToken ? 'Refreshing...' : 'Retry Verification'}
                </Button>
              </div>
            </>
          )}
          
          {status === 'validating' && (
            <>
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin mr-3" />
              <div>
                <h3 className="font-medium text-blue-800">Verifying Calendar Connection</h3>
                <p className="text-sm text-blue-700">
                  We're verifying your calendar connection. This will only take a moment.
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {!integration?.isConnected && !loading && (
        <div className="mt-4 p-4 rounded-lg flex items-center bg-gray-50 border border-gray-200">
          <XCircle className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <h3 className="font-medium">Scheduling Not Enabled</h3>
            <p className="text-sm text-muted-foreground">Connect your calendar to enable scheduling and availability management.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use the integration status with ready state
export function useCalIntegrationStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      console.log('[DIBS_DEBUG] useCalIntegrationStatus hook checking status...');
      setLoading(true);
      const result = await fetchCalIntegrationStatus();
      console.log('[DIBS_DEBUG] Hook received status:', { 
        isConnected: result.data?.isConnected,
        hasError: !!result.error
      });
      setIsConnected(result.data?.isConnected || false);
      
      // Assume not ready until we verify API connectivity
      setIsReady(false);
      
      // We'd need to add API verification here to set isReady properly
      // For now, we're conservative and won't set isReady=true without API test
    } catch (err) {
      console.error('[SCHEDULING_INTEGRATION_STATUS_ERROR]', err);
      setIsConnected(false);
      setIsReady(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { 
    isConnected,
    isReady, 
    loading,
    refresh: checkStatus 
  };
} 