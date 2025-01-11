'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ZoomMeeting } from '@/components/zoom-video'
import { toast } from 'sonner'

interface ZoomConfig {
  sessionName: string
  userName: string
  sessionPasscode: string
  token: string
}

export default function CalendarPage() {
  const { userId, getToken } = useAuth()
  const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchZoomConfig = async () => {
      try {
        // Get the session token
        const token = await getToken()
        
        if (!token) {
          throw new Error('No authentication token available')
        }

        const response = await fetch('/api/zoom/config', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch Zoom configuration')
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch Zoom configuration')
        }
        
        setZoomConfig(data.config)
      } catch (err) {
        console.error('[ZOOM_CONFIG_ERROR]', err)
        toast.error('Failed to initialize Zoom session')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchZoomConfig()
    } else {
      setIsLoading(false)
    }
  }, [userId, getToken])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        Please sign in to access video conferencing
      </div>
    )
  }

  if (!zoomConfig) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        Failed to load Zoom configuration
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Video Conference</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <ZoomMeeting 
          sessionName={zoomConfig.sessionName}
          userName={zoomConfig.userName}
          sessionPasscode={zoomConfig.sessionPasscode}
          token={zoomConfig.token}
          onError={(error) => toast.error(error.message)}
        />
      </div>
    </div>
  )
}
