'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'
import { useCalendlyConnection, useAvailabilitySchedules } from '@/utils/hooks/useCalendly'
import { useEffect } from 'react'

interface CoachingAvailabilityEditorProps {
  onSave: () => void
  onCancel: () => void
}

export function CoachingAvailabilityEditor({ onSave, onCancel }: CoachingAvailabilityEditorProps) {
  const { status } = useCalendlyConnection()
  const { loading, schedules, fetchSchedules } = useAvailabilitySchedules()

  useEffect(() => {
    if (status?.connected && status.userUri) {
      fetchSchedules(status.userUri)
    }
  }, [status?.connected, status?.userUri, fetchSchedules])

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
          <CardTitle>Coaching Availability</CardTitle>
          <CardDescription>
            Connect your Calendly account to manage your coaching availability.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Coaching Availability</span>
          <Button
            variant="outline"
            onClick={() => window.open(`${status.schedulingUrl}/availability`, '_blank')}
            className="flex items-center gap-2"
          >
            <span>Manage in Calendly</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Manage your coaching availability schedules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.uri}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
              >
                <div className="space-y-1">
                  <p className="font-medium">{schedule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.default ? 'Default Schedule' : 'Custom Schedule'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`${status.schedulingUrl}/availability/${schedule.uri.split('/').pop()}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No availability schedules found
          </div>
        )}
      </CardContent>
    </Card>
  )
} 