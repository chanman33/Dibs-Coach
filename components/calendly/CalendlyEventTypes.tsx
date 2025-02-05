'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'
import { useCalendlyConnection, useEventTypes } from '@/utils/hooks/useCalendly'
import { useEffect } from 'react'

export function CalendlyEventTypes() {
  const { status } = useCalendlyConnection()
  const { loading, eventTypes, fetchEventTypes } = useEventTypes()

  useEffect(() => {
    if (status?.connected) {
      fetchEventTypes()
    }
  }, [status?.connected, fetchEventTypes])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
          <CardDescription>
            Connect your Calendly account to view and manage your event types.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Types</span>
          <Button
            variant="outline"
            onClick={() => window.open(`${status.schedulingUrl}/event_types`, '_blank')}
            className="flex items-center gap-2"
          >
            <span>Manage in Calendly</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage your Calendly event types
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eventTypes.length > 0 ? (
          <div className="space-y-4">
            {eventTypes.map((eventType) => (
              <div
                key={eventType.uri}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
              >
                <div className="space-y-1">
                  <p className="font-medium">{eventType.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {eventType.duration} minutes
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(eventType.scheduling_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No event types found
          </div>
        )}
      </CardContent>
    </Card>
  )
} 