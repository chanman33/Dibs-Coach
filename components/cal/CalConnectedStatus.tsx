'use client'

import { useEffect, useState } from 'react'
import { fetchCalIntegrationStatus, type CalIntegrationDetails } from '@/utils/actions/cal-integration-actions'
import { CheckCircle, RefreshCw, CalendarDays, AlertTriangle, Unlink, RotateCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens'

interface CalConnectedStatusProps {
  className?: string
  onStatusChange?: (isConnected: boolean) => void
}

export function CalConnectedStatus({ className, onStatusChange }: CalConnectedStatusProps) {
  const router = useRouter()
  const { user } = useUser()
  const [integration, setIntegration] = useState<CalIntegrationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [refreshingToken, setRefreshingToken] = useState(false)

  const fetchIntegrationStatus = async () => {
    setLoading(true)
    try {
      console.log('[DIBS_DEBUG] Fetching scheduling integration status...')
      const result = await fetchCalIntegrationStatus()
      
      if (result.error) {
        console.error('[DIBS_DEBUG] Integration status error:', result.error)
        setError(result.error.message)
        setIntegration(null)
        onStatusChange?.(false)
      } else {
        console.log('[DIBS_DEBUG] Integration status data:', {
          isConnected: result.data?.isConnected,
          calManagedUserId: result.data?.calManagedUserId,
          verifiedWithCal: result.data?.verifiedWithCal,
          tokenStatus: result.data?.tokenStatus,
          verificationResponse: result.data?.['verificationResponse'] || 'Not available',
          timeZone: result.data?.timeZone,
          createdAt: result.data?.createdAt
        })
        
        // Token was auto-refreshed during fetch - show success toast
        if (result.data?.tokenStatus === 'refreshed' && integration?.tokenStatus !== 'refreshed') {
          toast.success('Calendar token was automatically refreshed');
        }
        
        setIntegration(result.data)
        setError(null)
        onStatusChange?.(result.data?.isConnected || false)
      }
    } catch (err) {
      console.error('[DIBS_DEBUG] Failed to fetch scheduling status:', err)
      setError('Failed to fetch scheduling status')
      setIntegration(null)
      onStatusChange?.(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTokenRefresh = async () => {
    if (!user) {
      toast.error("User authentication required");
      return;
    }
    
    try {
      setRefreshingToken(true)
      // Get the user ULID first
      const ulIdResponse = await fetch('/api/user/ulid', {
        method: 'GET'
      });
      
      const ulIdData = await ulIdResponse.json();
      if (ulIdData.error || !ulIdData.ulid) {
        throw new Error(ulIdData.error || 'Failed to get user ID');
      }
      
      // Refresh the tokens using the server action
      const refreshResult = await refreshUserCalTokens(ulIdData.ulid, true); // Force refresh
      
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || 'Token refresh failed');
      }
      
      toast.success('Calendar tokens refreshed successfully!');
      fetchIntegrationStatus(); // Refresh the status
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Failed to refresh calendar tokens');
    } finally {
      setRefreshingToken(false);
    }
  }

  const handleReconnect = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error("Email is required to enable scheduling");
      return;
    }
    
    try {
      setReconnecting(true)
      const response = await fetch('/api/cal/create-managed-user', {
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
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      toast.success('Scheduling reconnected successfully!')
      router.push('/dashboard/settings?tab=integrations&success=true')
      fetchIntegrationStatus() // Refresh the status
    } catch (error) {
      console.error('Scheduling reconnection error:', error)
      toast.error('Failed to reconnect scheduling')
    } finally {
      setReconnecting(false)
    }
  }

  useEffect(() => {
    console.log('[DIBS_DEBUG] CalConnectedStatus component mounted or onStatusChange changed')
    fetchIntegrationStatus()
  }, [onStatusChange])

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-4 mt-4 border rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    )
  }

  if (error || !integration || !integration.isConnected) {
    return null // Display nothing if not connected or error
  }

  return (
    <Card className={`${className || ''} border rounded-lg mt-4`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Scheduling Enabled</h3>
                {integration.verifiedWithCal === false ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Scheduling verification issue detected. Connection may need to be refreshed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
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
                {integration.verifiedWithCal === false && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800">
                    Verification needed
                  </Badge>
                )}
                {integration.tokenStatus === 'expired' && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-800">
                    Token expired
                  </Badge>
                )}
                {integration.tokenStatus === 'refreshed' && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">
                    Token refreshed
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2 mt-3">
                {integration.verifiedWithCal === false && (
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
                
                {integration.tokenStatus === 'expired' && (
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
  )
}

// Hook to use the integration status
export function useCalIntegrationStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    try {
      console.log('[DIBS_DEBUG] useCalIntegrationStatus hook checking status...')
      setLoading(true)
      const result = await fetchCalIntegrationStatus()
      console.log('[DIBS_DEBUG] Hook received status:', { 
        isConnected: result.data?.isConnected,
        hasError: !!result.error
      })
      setIsConnected(result.data?.isConnected || false)
    } catch (err) {
      console.error('[SCHEDULING_INTEGRATION_STATUS_ERROR]', err)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return { 
    isConnected, 
    loading,
    refresh: checkStatus 
  }
} 