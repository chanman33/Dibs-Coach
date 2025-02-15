'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ConnectCalendly } from '@/components/calendly/ConnectCalendly'
import { CalendlyEventTypes } from '@/components/calendly/CalendlyEventTypes'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { useRouter } from 'next/navigation'

export default function CalendlySettingsPage() {
  const router = useRouter()

  const handleSave = () => {
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Calendly Settings</h1>
        <p className="text-muted-foreground">
          Connect your Calendly account and manage your coaching availability.
        </p>
      </div>

      <Card className="p-6">
        <ConnectCalendly />
      </Card>

    </div>
  )
} 