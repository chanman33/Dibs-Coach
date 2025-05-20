'use client'

import { useState, useEffect, useMemo } from 'react'
import { addDays, addHours, format } from 'date-fns'
import { createAuthClient } from '@/utils/auth'
import { TimeSlot, TimeSlotGroup } from '@/utils/types/booking'
import { getUserTimezone } from '@/utils/timezone-utils'

interface UseRescheduleOptions {
  coachId: string
  sessionDuration: number
}

export function useReschedule({ coachId, sessionDuration }: UseRescheduleOptions) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [timeSlotGroups, setTimeSlotGroups] = useState<TimeSlotGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachTimezone, setCoachTimezone] = useState("UTC")
  
  // Fetch the available dates on component mount
  useEffect(() => {
    if (!coachId) return
    
    const fetchAvailableDates = async () => {
      try {
        // Call your API to get available dates
        // For now, just generate dates for the next 14 days
        const dates: Date[] = []
        const now = new Date()
        for (let i = 1; i <= 14; i++) {
          const date = new Date()
          date.setDate(now.getDate() + i)
          dates.push(date)
        }
        setAvailableDates(dates)
        
        // Get coach timezone from database
        const supabase = createAuthClient()
        const { data } = await supabase
          .from('CoachingAvailabilitySchedule')
          .select('timeZone')
          .eq('userUlid', coachId)
          .eq('isDefault', true)
          .single()
          
        if (data?.timeZone) {
          setCoachTimezone(data.timeZone)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('[FETCH_AVAILABLE_DATES_ERROR]', error)
        setError('Failed to load available dates')
        setLoading(false)
      }
    }
    
    fetchAvailableDates()
  }, [coachId])
  
  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !coachId) return
    
    const fetchTimeSlots = async () => {
      try {
        setLoading(true)
        
        // For demo, create time slots from 9am to 5pm every 30 mins
        const slots: TimeSlot[] = []
        const date = new Date(selectedDate)
        date.setHours(9, 0, 0, 0) // Start at 9 AM
        
        // Create a slot every 30 minutes from 9 AM to 5 PM
        for (let i = 0; i < 16; i++) {
          const startTime = new Date(date)
          startTime.setMinutes(startTime.getMinutes() + (i * 30))
          
          // Don't create slots past 5 PM
          if (startTime.getHours() >= 17) break
          
          const endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + sessionDuration)
          
          slots.push({
            startTime,
            endTime
          })
        }
        
        // Group slots by AM/PM
        const morningSlots = slots.filter(slot => slot.startTime.getHours() < 12)
        const afternoonSlots = slots.filter(slot => slot.startTime.getHours() >= 12 && slot.startTime.getHours() < 17)
        
        const groups: TimeSlotGroup[] = []
        
        if (morningSlots.length > 0) {
          groups.push({
            title: 'Morning',
            slots: morningSlots
          })
        }
        
        if (afternoonSlots.length > 0) {
          groups.push({
            title: 'Afternoon',
            slots: afternoonSlots
          })
        }
        
        setTimeSlotGroups(groups)
      } catch (error) {
        console.error('[FETCH_TIME_SLOTS_ERROR]', error)
        setError('Failed to load time slots')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeSlots()
  }, [selectedDate, coachId, sessionDuration])
  
  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Check if date is in the past
    if (date < new Date()) return true
    
    // Check if date is too far in the future (more than 3 months)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    if (date > threeMonthsFromNow) return true
    
    // Check if date is in availableDates
    return !availableDates.some(d => d.toDateString() === date.toDateString())
  }
  
  // Format time helper function
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'h:mm a')
  }
  
  return {
    loading,
    error,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    availableDates,
    isDateDisabled,
    timeSlotGroups,
    coachTimezone,
    formatTime
  }
} 