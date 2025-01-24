import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import type { CalendlyStatus } from '@/utils/types/calendly'

export function useCalendly() {
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
            const response = await fetch('/api/calendly/oauth')
            if (!response.ok) {
                throw new Error('Failed to initiate Calendly connection')
            }
            const { authUrl } = await response.json()
            window.location.href = authUrl
        } catch (error) {
            console.error('[CALENDLY_CONNECT_ERROR]', error)
            toast.error('Failed to connect to Calendly')
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
            fetchStatus() // Refresh status after successful connection
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