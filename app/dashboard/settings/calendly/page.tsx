'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ConnectCalendly } from '@/components/calendly/ConnectCalendly'
import { CalendlyEventTypes } from '@/components/calendly/CalendlyEventTypes'
import { CoachingAvailabilityEditor } from '@/components/calendly/CoachingAvailabilityEditor'
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

      <Tabs defaultValue="coaching-availability" className="w-full">
        <TabsList>
          <TabsTrigger value="coaching-availability">Coaching Availability</TabsTrigger>
          <TabsTrigger value="event-types">Event Types</TabsTrigger>
        </TabsList>

        <TabsContent value="coaching-availability" className="mt-6">
          <CoachingAvailabilityEditor 
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="event-types" className="mt-6">
          <CalendlyEventTypes />
        </TabsContent>
      </Tabs>
    </div>
  )
} 