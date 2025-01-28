'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoachingAvailabilityEditor } from '@/components/calendly/CoachingAvailabilityEditor'
import { AvailabilityScheduleView } from '@/components/calendly/AvailabilityScheduleView'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TestCoachingAvailability() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/coaching/availability')
      if (!response.ok) {
        throw new Error('Failed to fetch schedules')
      }
      const { data } = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error('[FETCH_SCHEDULES_ERROR]', error)
      toast.error('Failed to fetch schedules')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/coaching/availability?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }
      toast.success('Schedule deleted successfully')
      fetchSchedules()
    } catch (error) {
      console.error('[DELETE_SCHEDULE_ERROR]', error)
      toast.error('Failed to delete schedule')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Coaching Availability</span>
            <Button onClick={() => setShowEditor(true)}>
              Add Schedule
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showEditor ? (
            <CoachingAvailabilityEditor
              onSave={() => {
                setShowEditor(false)
                fetchSchedules()
              }}
              onCancel={() => setShowEditor(false)}
            />
          ) : schedules.length > 0 ? (
            <div className="space-y-8">
              {schedules.map((schedule) => (
                <AvailabilityScheduleView
                  key={schedule.id}
                  schedule={schedule}
                  onDelete={() => handleDelete(schedule.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No coaching availability schedules found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 