import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import type { Dispute } from '@/utils/types'

export function useDisputes() {
    const [isLoading, setIsLoading] = useState(false)
    const [disputes, setDisputes] = useState<Dispute[]>([])

    const fetchDisputes = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/disputes')
            if (!response.ok) {
                throw new Error('Failed to fetch disputes')
            }
            const { data } = await response.json()
            setDisputes(data)
        } catch (error) {
            console.error('[DISPUTES_ERROR]', error)
            toast.error('Failed to load disputes')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const acceptDispute = useCallback(async (disputeId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/disputes/${disputeId}/accept`, {
                method: 'POST'
            })
            if (!response.ok) {
                throw new Error('Failed to accept dispute')
            }
            toast.success('Dispute accepted successfully')
            await fetchDisputes() // Refresh disputes list
        } catch (error) {
            console.error('[ACCEPT_DISPUTE_ERROR]', error)
            toast.error('Failed to accept dispute')
        } finally {
            setIsLoading(false)
        }
    }, [fetchDisputes])

    const rejectDispute = useCallback(async (disputeId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/disputes/${disputeId}/reject`, {
                method: 'POST'
            })
            if (!response.ok) {
                throw new Error('Failed to reject dispute')
            }
            toast.success('Dispute rejected successfully')
            await fetchDisputes() // Refresh disputes list
        } catch (error) {
            console.error('[REJECT_DISPUTE_ERROR]', error)
            toast.error('Failed to reject dispute')
        } finally {
            setIsLoading(false)
        }
    }, [fetchDisputes])

    return {
        disputes,
        isLoading,
        fetchDisputes,
        acceptDispute,
        rejectDispute
    }
} 