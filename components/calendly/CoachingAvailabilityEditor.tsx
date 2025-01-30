'use client'

import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, Trash } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CalendlyAvailabilitySchedule } from '@/utils/types/calendly'

// Validation schemas (matching API)
const TimeIntervalSchema = z.object({
  from: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  to: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
})

const RuleSchema = z.object({
  type: z.enum(['wday', 'date']),
  wday: z.number().min(0).max(6).optional(),
  date: z.string().optional(),
  intervals: z.array(TimeIntervalSchema)
})

const ScheduleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
  rules: z.array(RuleSchema).min(1, 'At least one rule is required')
})

type ScheduleFormData = z.infer<typeof ScheduleSchema>

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const SUPPORTED_TIMEZONES = [
  // UK
  'Europe/London',
  // US
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Adak',
  'Pacific/Honolulu',
  // Canada
  'America/Vancouver',
  'America/Edmonton',
  'America/Regina',
  'America/Winnipeg',
  'America/Toronto',
  'America/Montreal',
  'America/Halifax',
  'America/St_Johns'
]

export interface CoachingAvailabilityEditorProps {
  onSave: () => void
  onCancel: () => void
  initialData?: CalendlyAvailabilitySchedule
}

export function CoachingAvailabilityEditor({
  onSave,
  onCancel,
  initialData
}: CoachingAvailabilityEditorProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ScheduleFormData>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: initialData || {
      name: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isDefault: false,
      active: true,
      rules: []
    }
  })

  const rules = watch('rules')

  const handleAddInterval = (wday: number) => {
    const currentRules = rules || []
    const dayRule = currentRules.find(r => r.wday === wday)
    
    if (dayRule) {
      dayRule.intervals.push({ from: '09:00', to: '17:00' })
      setValue('rules', [...currentRules])
    } else {
      setValue('rules', [
        ...currentRules,
        {
          type: 'wday',
          wday,
          intervals: [{ from: '09:00', to: '17:00' }]
        }
      ])
    }
  }

  const handleRemoveInterval = (wday: number, intervalIndex: number) => {
    const currentRules = rules || []
    const dayRule = currentRules.find(r => r.wday === wday)
    
    if (dayRule) {
      dayRule.intervals.splice(intervalIndex, 1)
      if (dayRule.intervals.length === 0) {
        setValue('rules', currentRules.filter(r => r.wday !== wday))
      } else {
        setValue('rules', [...currentRules])
      }
    }
  }

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/coaching/availability' + (initialData ? `?id=${initialData.id}` : ''), {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(initialData ? 'Failed to update schedule' : 'Failed to save schedule')
      }

      toast.success(initialData ? 'Schedule updated successfully' : 'Schedule saved successfully')
      onSave()
    } catch (error) {
      console.error('[COACHING_AVAILABILITY_ERROR]', error)
      toast.error(initialData ? 'Failed to update schedule' : 'Failed to save schedule')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Schedule' : 'New Schedule'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Regular Coaching Hours"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={watch('timezone')}
                onValueChange={(value) => setValue('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-red-500 mt-1">{errors.timezone.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={watch('isDefault')}
                onCheckedChange={(checked) => setValue('isDefault', checked)}
              />
              <Label htmlFor="isDefault">Set as default schedule</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(checked) => setValue('active', checked)}
              />
              <Label htmlFor="active">Schedule is active</Label>
            </div>

            <div className="space-y-4">
              <Label>Availability Rules</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Set your available time slots for each day of the week.
              </p>
              
              {DAYS_OF_WEEK.map((day, wday) => {
                const dayRule = rules?.find(r => r.wday === wday)
                return (
                  <div key={wday} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{day}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddInterval(wday)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Time Slot
                      </Button>
                    </div>
                    
                    {dayRule?.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={interval.from}
                          onChange={(e) => {
                            const newRules = [...(rules || [])]
                            const rule = newRules.find(r => r.wday === wday)
                            if (rule) {
                              rule.intervals[index].from = e.target.value
                              setValue('rules', newRules)
                            }
                          }}
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={interval.to}
                          onChange={(e) => {
                            const newRules = [...(rules || [])]
                            const rule = newRules.find(r => r.wday === wday)
                            if (rule) {
                              rule.intervals[index].to = e.target.value
                              setValue('rules', newRules)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveInterval(wday, index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {errors.rules && (
                <p className="text-sm text-red-500 mt-1">{errors.rules.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? 'Update Schedule' : 'Save Schedule'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 