import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ConnectCalendly } from '@/components/ConnectCalendly'
import { CalendlyEventTypes } from './_components/CalendlyEventTypes'
import { CalendlyAvailability } from './_components/CalendlyAvailability'

export default function CalendlySettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Calendly Settings</h1>
        <p className="text-muted-foreground">
          Manage your Calendly integration, availability, and event types.
        </p>
      </div>

      <Card className="p-6">
        <ConnectCalendly />
      </Card>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="event-types">Event Types</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-6">
          <CalendlyAvailability />
        </TabsContent>

        <TabsContent value="event-types" className="mt-6">
          <CalendlyEventTypes />
        </TabsContent>
      </Tabs>
    </div>
  )
} 