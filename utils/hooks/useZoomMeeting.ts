'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type {
  ZoomMeeting,
  ZoomMeetingResponse,
  ZoomMeetingUpdate,
  SessionMeetingConfig,
} from '@/utils/types/zoom'

interface UseZoomMeetingReturn {
  isLoading: boolean
  error: Error | null
  config: SessionMeetingConfig | null
  createMeeting: (data: ZoomMeeting & { sessionId?: number }) => Promise<ZoomMeetingResponse | null>
  updateMeeting: (data: ZoomMeetingUpdate & { sessionId?: number }) => Promise<ZoomMeetingResponse | null>
  getMeeting: (meetingId: number) => Promise<ZoomMeetingResponse | null>
  deleteMeeting: (meetingId: number) => Promise<boolean>
  getConfig: () => Promise<void>
  updateConfig: (config: SessionMeetingConfig) => Promise<void>
}

export function useZoomMeeting(): UseZoomMeetingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [config, setConfig] = useState<SessionMeetingConfig | null>(null)

  const createMeeting = async (
    data: ZoomMeeting & { sessionId?: number }
  ): Promise<ZoomMeetingResponse | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/zoom/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create Zoom meeting')
      }

      const { data: meeting } = await response.json()
      toast.success('Zoom meeting created successfully')
      return meeting
    } catch (err) {
      console.error('[CREATE_ZOOM_MEETING_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to create Zoom meeting')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateMeeting = async (
    data: ZoomMeetingUpdate & { sessionId?: number }
  ): Promise<ZoomMeetingResponse | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/zoom/meetings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update Zoom meeting')
      }

      const { data: meeting } = await response.json()
      toast.success('Zoom meeting updated successfully')
      return meeting
    } catch (err) {
      console.error('[UPDATE_ZOOM_MEETING_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to update Zoom meeting')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getMeeting = async (meetingId: number): Promise<ZoomMeetingResponse | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/zoom/meetings?meetingId=${meetingId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch Zoom meeting')
      }

      const { data: meeting } = await response.json()
      return meeting
    } catch (err) {
      console.error('[GET_ZOOM_MEETING_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to fetch Zoom meeting')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMeeting = async (meetingId: number): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/zoom/meetings?meetingId=${meetingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete Zoom meeting')
      }

      toast.success('Zoom meeting deleted successfully')
      return true
    } catch (err) {
      console.error('[DELETE_ZOOM_MEETING_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to delete Zoom meeting')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getConfig = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/zoom/meetings/config')

      if (!response.ok) {
        throw new Error('Failed to fetch Zoom meeting configuration')
      }

      const { data } = await response.json()
      setConfig(data)
    } catch (err) {
      console.error('[GET_ZOOM_CONFIG_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to fetch Zoom meeting configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = async (config: SessionMeetingConfig): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/zoom/meetings/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to update Zoom meeting configuration')
      }

      setConfig(config)
      toast.success('Zoom meeting configuration updated successfully')
    } catch (err) {
      console.error('[UPDATE_ZOOM_CONFIG_ERROR]', err)
      setError(err as Error)
      toast.error('Failed to update Zoom meeting configuration')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    config,
    createMeeting,
    updateMeeting,
    getMeeting,
    deleteMeeting,
    getConfig,
    updateConfig,
  }
} 