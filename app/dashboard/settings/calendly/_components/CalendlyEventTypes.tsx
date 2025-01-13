'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EventType {
  uri: string
  name: string
  duration: number
  url: string
}

interface EventTypesStatus {
  connected: boolean
  schedulingUrl?: string
  eventTypes?: EventType[]
}

export function CalendlyEventTypes() {
  const [status, setStatus] = useState<EventTypesStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchEventTypes = async () => {
    try {
      const response = await fetch('/api/calendly/event-types')
      if (!response.ok) {
        throw new Error('Failed to fetch event types')
      }
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
      toast.error('Failed to fetch event types')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEventTypes()
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
            You need to connect your Calendly account to manage your event types.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Event Types</h3>
          <p className="text-muted-foreground">
            Manage your coaching session types and durations.
          </p>
        </div>

        <div className="space-y-4">
          {status.eventTypes?.map((eventType) => (
            <div
              key={eventType.uri}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{eventType.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {eventType.duration} minutes
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(eventType.url, '_blank')}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`${status.schedulingUrl}/event_types/${eventType.uri}/edit`, '_blank')}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Need to create a new event type?
          </p>
          <Button
            variant="outline"
            onClick={() => window.open(`${status.schedulingUrl}/event_types/new`, '_blank')}
          >
            Create Event Type
          </Button>
        </div>
      </div>
    </Card>
  )
} 