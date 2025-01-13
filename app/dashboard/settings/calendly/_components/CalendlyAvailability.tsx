'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AvailabilityStatus {
  connected: boolean
  schedulingUrl?: string
}

export function CalendlyAvailability() {
  const [status, setStatus] = useState<AvailabilityStatus | null>(null)
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
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
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
            Changes made in Calendly will automatically sync with your coaching schedule.
          </p>
        </div>
      </div>
    </Card>
  )
} 