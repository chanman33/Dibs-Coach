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
export function useCalendlyConnection(customRedirectUrl?: string) {
    const [status, setStatus] = useState<CalendlyStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const searchParams = useSearchParams()

    const fetchStatus = async () => {
        try {
            console.log('[CALENDLY_HOOK_DEBUG] Fetching status...')
            setIsLoading(true)
            const response = await fetch('/api/calendly/status')
            
            // Handle 403 Forbidden (not connected) gracefully
            if (response.status === 403) {
                console.log('[CALENDLY_HOOK_DEBUG] Not connected (403 response)')
                setStatus({ connected: false })
                return
            }
            
            // First check if response is ok
            if (!response.ok) {
                // Try to parse error as JSON, but handle case where it's not JSON
                const errorText = await response.text()
                console.log('[CALENDLY_HOOK_DEBUG] Non-OK response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText
                })
                let errorData
                try {
                    errorData = JSON.parse(errorText)
                    if (errorData.error?.code === 'USER_NOT_FOUND') {
                        console.log('[CALENDLY_HOOK_DEBUG] User not found error')
                        toast.error('Please complete onboarding before connecting Calendly')
                        return
                    }
                } catch (parseError) {
                    // If not JSON, use the raw text
                    console.error('[CALENDLY_HOOK_DEBUG] Non-JSON response:', errorText)
                    throw new Error('Server error occurred')
                }
                throw new Error('Failed to fetch Calendly status')
            }

            // Try to parse successful response as JSON
            const responseData = await response.json()
            console.log('[CALENDLY_HOOK_DEBUG] Status response:', responseData)
            
            // Check if the response indicates a connected status
            // The API returns either the direct status object or a nested data structure
            const statusData = responseData.data || responseData
            
            if (statusData.connected === true) {
                console.log('[CALENDLY_HOOK_DEBUG] Setting connected status:', statusData)
                setStatus({
                    connected: true,
                    schedulingUrl: statusData.schedulingUrl,
                    userUri: statusData.userUri,
                    isExpired: statusData.isExpired || false,
                    expiresAt: statusData.expiresAt,
                    needsReconnect: statusData.needsReconnect || false
                })
            } else if (statusData.resourceExists) {
                // Alternative format where resourceExists indicates connection
                console.log('[CALENDLY_HOOK_DEBUG] Setting connected status from resourceExists:', statusData)
                setStatus({
                    connected: true,
                    schedulingUrl: statusData.schedulingUrl,
                    userUri: statusData.uri,
                    isExpired: false,
                    expiresAt: undefined,
                    needsReconnect: false
                })
            } else {
                console.log('[CALENDLY_HOOK_DEBUG] Not connected state from API')
                setStatus({ connected: false })
            }
        } catch (error) {
            console.error('[CALENDLY_HOOK_DEBUG] Status fetch error:', error)
            // Only show error toast for unexpected errors, not for "not connected" state
            if (error instanceof Error && 
                !error.message.includes('Failed to fetch Calendly status') && 
                !error.message.includes('Server error occurred')) {
                toast.error('Unable to check Calendly connection status')
            }
            // Set status to not connected on error
            setStatus({ connected: false })
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnect = async () => {
        try {
            console.log('[CALENDLY_HOOK_DEBUG] Starting connection process...')
            setIsConnecting(true)
            // Use the custom redirect URL if provided, otherwise use the current URL
            const currentUrl = customRedirectUrl || window.location.href
            console.log('[CALENDLY_HOOK_DEBUG] Using redirect URL:', currentUrl)
            
            const response = await fetch(`/api/calendly/oauth?redirect=${encodeURIComponent(currentUrl)}`)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[CALENDLY_HOOK_DEBUG] Connection initiation failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                })
                throw new Error(errorData.message || 'Failed to initiate Calendly connection')
            }

            const data = await response.json()
            console.log('[CALENDLY_HOOK_DEBUG] Received auth URL:', {
                hasAuthUrl: !!data.authUrl,
                urlPreview: data.authUrl ? `${data.authUrl.substring(0, 50)}...` : null
            })
            
            if (!data.authUrl) {
                throw new Error('No authorization URL received')
            }

            window.location.href = data.authUrl
        } catch (error) {
            console.error('[CALENDLY_HOOK_DEBUG] Connection error:', error)
            toast.error('Failed to connect to Calendly')
        } finally {
            setIsConnecting(false)
        }
    }

    useEffect(() => {
        console.log('[CALENDLY_HOOK_DEBUG] Initial status fetch')
        fetchStatus()
    }, [])

    useEffect(() => {
        const calendlyStatus = searchParams.get('calendly')
        const error = searchParams.get('error')

        console.log('[CALENDLY_HOOK_DEBUG] URL params changed:', {
            calendlyStatus,
            error,
            allParams: Object.fromEntries(searchParams.entries())
        })

        if (calendlyStatus === 'success') {
            console.log('[CALENDLY_HOOK_DEBUG] Processing success status')
            toast.success('Calendly connected successfully!')
            fetchStatus()
        } else if (error) {
            console.error('[CALENDLY_HOOK_DEBUG] Processing error status:', error)
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