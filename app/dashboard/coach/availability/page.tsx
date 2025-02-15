'use client'

import { useEffect, useState } from 'react'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { saveCoachAvailability, fetchCoachAvailability } from '@/utils/actions/availability'
import { WeekDay, TimeSlot } from '@/utils/types/coaching'
import { Loader2 } from 'lucide-react'

export default function CoachAvailabilityPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [initialSchedule, setInitialSchedule] = useState<Record<WeekDay, TimeSlot[]> | undefined>()

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const schedule = await fetchCoachAvailability()
        if (schedule) {
          setInitialSchedule(schedule)
        }
      } catch (error) {
        console.error('[FETCH_SCHEDULE_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Your Availability</h1>
      <AvailabilityManager
        onSave={saveCoachAvailability}
        initialSchedule={initialSchedule}
      />
    </div>
  )
} 