'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useCalendly } from '@/utils/hooks/useCalendly'
import { EventTypeMappingSchema, type EventTypeMapping } from '@/utils/types/calendly'
import { SessionType } from '@/utils/types/session'

export function EventTypeMapping() {
  const { status, isLoading } = useCalendly()
  const [selectedEventType, setSelectedEventType] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<EventTypeMapping>({
    resolver: zodResolver(EventTypeMappingSchema),
    defaultValues: {
      eventTypeUri: '',
      sessionType: 'MENTORSHIP',
      durationConstraints: {
        minimum: 15,
        maximum: 60,
        default: 30,
      },
      bufferTime: {
        before: 5,
        after: 5,
      },
    },
  })

  const onSubmit = async (data: EventTypeMapping) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/calendly/events/types/mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save event type mapping')
      }

      toast.success('Event type mapping saved successfully')
      // Refresh the page to show updated mappings
      window.location.reload()
    } catch (error) {
      console.error('[SAVE_EVENT_TYPE_MAPPING_ERROR]', error)
      toast.error('Failed to save event type mapping')
    } finally {
      setIsSaving(false)
    }
  }

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
            You need to connect your Calendly account to manage event type mappings.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Event Type Mapping</h3>
          <p className="text-muted-foreground">
            Configure how your Calendly event types map to coaching sessions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Event Type</FormLabel>
            <Select
              value={selectedEventType}
              onValueChange={(value) => {
                setSelectedEventType(value)
                form.setValue('eventTypeUri', value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                {status.eventTypes?.map((eventType) => (
                  <SelectItem key={eventType.uri} value={eventType.uri}>
                    {eventType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEventType && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sessionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SessionType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="font-medium">Duration Constraints</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="durationConstraints.minimum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationConstraints.maximum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationConstraints.default"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Buffer Time</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bufferTime.before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Before (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bufferTime.after"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>After (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Mapping
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </Card>
  )
} 