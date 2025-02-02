import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import type { Transaction } from '@/utils/types'

export function useTransactions() {
    const [isLoading, setIsLoading] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])

    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/transactions')
            if (!response.ok) {
                throw new Error('Failed to fetch transactions')
            }
            const { data } = await response.json()
            setTransactions(data)
        } catch (error) {
            console.error('[TRANSACTIONS_ERROR]', error)
            toast.error('Failed to load transactions')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const refundTransaction = useCallback(async (transactionId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/transactions/${transactionId}/refund`, {
                method: 'POST'
            })
            if (!response.ok) {
                throw new Error('Failed to refund transaction')
            }
            toast.success('Transaction refunded successfully')
            await fetchTransactions() // Refresh list
        } catch (error) {
            console.error('[REFUND_TRANSACTION_ERROR]', error)
            toast.error('Failed to refund transaction')
        } finally {
            setIsLoading(false)
        }
    }, [fetchTransactions])

    return {
        transactions,
        isLoading,
        fetchTransactions,
        refundTransaction
    }
} 