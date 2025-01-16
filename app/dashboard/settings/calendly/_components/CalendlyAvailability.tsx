'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCalendly } from '@/utils/hooks/useCalendly'

export function CalendlyAvailability() {
  const { status, isLoading } = useCalendly()

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