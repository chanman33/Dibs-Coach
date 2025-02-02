'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import type {
  CalendlyStatus,
  CalendlyEventType,
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlyAvailableTime,
  CalendlyAvailabilitySchedule,
  CalendlyBusyTime,
} from '@/utils/types/calendly'

// Connection & Auth Hook
export function useCalendlyConnection() {
    const [status, setStatus] = useState<CalendlyStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const searchParams = useSearchParams()

    const fetchStatus = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/calendly/status')
            if (!response.ok) {
                const errorData = await response.json()
                if (errorData.error?.code === 'USER_NOT_FOUND') {
                    toast.error('Please complete onboarding before connecting Calendly')
                    return
                }
                throw new Error('Failed to fetch Calendly status')
            }
            const { data } = await response.json()
            setStatus(data)
        } catch (error) {
            console.error('[CALENDLY_STATUS_ERROR]', error)
            toast.error('Failed to check Calendly connection status')
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnect = async () => {
        try {
            setIsConnecting(true)
            const currentUrl = window.location.href
            const response = await fetch(`/api/calendly/oauth?redirect=${encodeURIComponent(currentUrl)}`)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || 'Failed to initiate Calendly connection')
            }

            const data = await response.json()
            if (!data.authUrl) {
                throw new Error('No authorization URL received')
            }

            window.location.href = data.authUrl
        } catch (error) {
            console.error('[CALENDLY_CONNECT_ERROR]', error)
            toast.error('Failed to connect to Calendly')
        } finally {
            setIsConnecting(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    useEffect(() => {
        const calendlyStatus = searchParams.get('calendly')
        const error = searchParams.get('error')

        if (calendlyStatus === 'success') {
            toast.success('Calendly connected successfully!')
            fetchStatus()
        } else if (error) {
            toast.error(decodeURIComponent(error))
        }
    }, [searchParams])

    return {
        status,
        isLoading,
        isConnecting,
        handleConnect,
        refreshStatus: fetchStatus
    }
}

// Event Types Hook
interface UseEventTypesOptions {
  onSuccess?: (data: CalendlyEventType[]) => void
  onError?: (error: Error) => void
}

export function useEventTypes(options: UseEventTypesOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([])

  const fetchEventTypes = useCallback(async (count?: number, pageToken?: string) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (count) params.append('count', count.toString())
      if (pageToken) params.append('pageToken', pageToken)

      const response = await fetch(`/api/calendly/event-types?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event types')
      }

      const data = await response.json()
      setEventTypes(data.eventTypes)
      options.onSuccess?.(data.eventTypes)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
      toast.error('Failed to load event types')
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    eventTypes,
    fetchEventTypes,
  }
}

// Scheduled Events Hook
interface UseScheduledEventsOptions {
  onSuccess?: (data: CalendlyScheduledEvent[]) => void
  onError?: (error: Error) => void
}

interface FetchEventsParams {
  count?: number
  pageToken?: string
  status?: string
  minStartTime?: string
  maxStartTime?: string
}

export function useScheduledEvents(options: UseScheduledEventsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [events, setEvents] = useState<CalendlyScheduledEvent[]>([])

  const fetchEvents = useCallback(async (params: FetchEventsParams = {}) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.count) searchParams.append('count', params.count.toString())
      if (params.pageToken) searchParams.append('pageToken', params.pageToken)
      if (params.status) searchParams.append('status', params.status)
      if (params.minStartTime) searchParams.append('minStartTime', params.minStartTime)
      if (params.maxStartTime) searchParams.append('maxStartTime', params.maxStartTime)

      const response = await fetch(`/api/calendly/scheduled-events?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled events')
      }

      const data = await response.json()
      setEvents(data.events)
      options.onSuccess?.(data.events)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
      toast.error('Failed to load scheduled events')
    } finally {
      setLoading(false)
    }
  }, [options])

  const cancelEvent = useCallback(async (uuid: string, reason: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendly/scheduled-events/${uuid}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel event')
      }

      setEvents(prev => prev.filter(event => !event.uri.includes(uuid)))
      toast.success('Event cancelled successfully')
    } catch (err) {
      toast.error('Failed to cancel event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    events,
    fetchEvents,
    cancelEvent,
  }
}

// Availability Schedules Hook
interface UseAvailabilitySchedulesOptions {
  onSuccess?: (data: CalendlyAvailabilitySchedule[]) => void
  onError?: (error: Error) => void
}

export function useAvailabilitySchedules(options: UseAvailabilitySchedulesOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [schedules, setSchedules] = useState<CalendlyAvailabilitySchedule[]>([])

  const fetchSchedules = useCallback(async (userUri: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/calendly/availability-schedules?userUri=${userUri}`)
      if (!response.ok) {
        throw new Error('Failed to fetch availability schedules')
      }

      const data = await response.json()
      setSchedules(data.schedules)
      options.onSuccess?.(data.schedules)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
      toast.error('Failed to load availability schedules')
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    schedules,
    fetchSchedules,
  }
}

// Busy Times Hook
interface UseBusyTimesOptions {
  onSuccess?: (data: CalendlyBusyTime[]) => void
  onError?: (error: Error) => void
}

export function useBusyTimes(options: UseBusyTimesOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [busyTimes, setBusyTimes] = useState<CalendlyBusyTime[]>([])

  const fetchBusyTimes = useCallback(async (params: {
    userUri: string
    startTime: string
    endTime: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        userUri: params.userUri,
        startTime: params.startTime,
        endTime: params.endTime,
      })

      const response = await fetch(`/api/calendly/busy-times?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch busy times')
      }

      const data = await response.json()
      setBusyTimes(data.busyTimes)
      options.onSuccess?.(data.busyTimes)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
      toast.error('Failed to load busy times')
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    busyTimes,
    fetchBusyTimes,
  }
}

// Available Times Hook
interface UseAvailableTimesOptions {
  onSuccess?: (data: CalendlyAvailableTime[]) => void
  onError?: (error: Error) => void
}

export function useAvailableTimes(options: UseAvailableTimesOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [availableTimes, setAvailableTimes] = useState<CalendlyAvailableTime[]>([])

  const fetchAvailableTimes = useCallback(async (params: {
    eventUri: string
    startTime: string
    endTime: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        eventUri: params.eventUri,
        startTime: params.startTime,
        endTime: params.endTime,
      })

      const response = await fetch(`/api/calendly/available-times?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch available times')
      }

      const data = await response.json()
      setAvailableTimes(data.availableTimes)
      options.onSuccess?.(data.availableTimes)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
      toast.error('Failed to load available times')
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    availableTimes,
    fetchAvailableTimes,
  }
} 