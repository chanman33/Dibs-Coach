'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSearchParams } from 'next/navigation'

interface AvailabilityStatus {
  connected: boolean
  schedulingUrl?: string
  expiresAt?: string
  isExpired?: boolean
  isMockData?: boolean
}

export function CalendlyAvailability() {
  const [status, setStatus] = useState<AvailabilityStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const searchParams = useSearchParams()

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendly/status')
      if (!response.ok) {
        throw new Error('Failed to fetch Calendly status')
      }
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('[CALENDLY_STATUS_ERROR]', error)
      toast.error('Failed to check Calendly connection status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const response = await fetch('/api/calendly/oauth')
      if (!response.ok) {
        throw new Error('Failed to initiate Calendly connection')
      }
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error('[CALENDLY_CONNECT_ERROR]', error)
      toast.error('Failed to connect to Calendly')
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    // Check for success or error params
    const calendlyStatus = searchParams.get('calendly')
    const error = searchParams.get('error')

    if (calendlyStatus === 'success') {
      toast.success('Calendly connected successfully!')
    } else if (error) {
      toast.error(decodeURIComponent(error))
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Connect Your Calendly Account</h3>
          <p className="text-muted-foreground mb-4">
            You need to connect your Calendly account to manage your availability.
          </p>
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Calendly'
            )}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {status?.isMockData ? (
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Using mock Calendly data. Set USE_REAL_CALENDLY=true to use real Calendly integration.
            </AlertDescription>
          </Alert>
        ) : status?.isExpired ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Calendly connection expired. Please reconnect.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-200/30">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Calendly successfully connected
              {status?.expiresAt && (
                <span className="block text-xs mt-1">
                  Expires: {new Date(status.expiresAt).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Availability Settings</h3>
          <p className="text-muted-foreground">
            Manage your availability hours and scheduling preferences.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Calendly Schedule</h4>
              <p className="text-sm text-muted-foreground">
                Configure your availability hours and time slots
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(`${status.schedulingUrl}/availability`, '_blank')}
            >
              Edit Availability
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Scheduling Page</h4>
              <p className="text-sm text-muted-foreground">
                View and share your scheduling page
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(status.schedulingUrl, '_blank')}
            >
              View Page
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {status?.isMockData 
              ? 'Mock connection active - set USE_REAL_CALENDLY=true to use real Calendly integration'
              : 'Changes made in Calendly will automatically sync with your coaching schedule.'
            }
          </p>
        </div>
      </div>
    </Card>
  )
} 