'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useCalendly } from '@/utils/hooks/useCalendly'

export function ConnectCalendly() {
  const { status, isLoading, isConnecting, handleConnect } = useCalendly()

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
          <Button
            variant="outline"
            onClick={() => window.open(status.schedulingUrl, '_blank')}
          >
            Open Calendly
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleConnect} 
          variant="outline"
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
      )}
    </div>
  )
} 