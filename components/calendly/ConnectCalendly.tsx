'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface CalendlyStatus {
  connected: boolean
  schedulingUrl?: string
  organizationUrl?: string
}

export function ConnectCalendly() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<CalendlyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    // Check for success message from OAuth callback
    const calendlyStatus = searchParams.get('calendly')
    if (calendlyStatus === 'success') {
      toast.success('Calendly connected successfully!')
      // Remove the query parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Refresh the status
      fetchStatus()
    }
  }, [searchParams])

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/calendly/oauth')
      if (!response.ok) {
        throw new Error('Failed to initialize Calendly connection')
      }
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error('[CALENDLY_CONNECT_ERROR]', error)
      toast.error('Failed to connect to Calendly')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Calendly Integration</h3>
        <p className="text-sm text-muted-foreground">
          {status?.connected
            ? 'Your Calendly account is connected. You can manage your coaching sessions and availability.'
            : 'Connect your Calendly account to manage your coaching sessions and availability.'}
        </p>
      </div>

      {status?.connected ? (
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <div className="text-sm">
              <div className="font-medium">Connected Account</div>
              <div className="text-muted-foreground mt-1">
                Scheduling URL: {status.schedulingUrl}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => window.open(status.schedulingUrl, '_blank')}
            >
              Open Calendly
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleConnect} variant="outline">
          Connect Calendly
        </Button>
      )}
    </div>
  )
} 