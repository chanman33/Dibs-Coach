import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import type { PaymentMethod } from '@/utils/types/stripe'

export default function usePaymentMethods() {
    const [isLoading, setIsLoading] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

    const fetchPaymentMethods = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/payment-methods')
            if (!response.ok) {
                throw new Error('Failed to fetch payment methods')
            }
            const { data } = await response.json()
            setPaymentMethods(data)
        } catch (error) {
            console.error('[PAYMENT_METHODS_ERROR]', error)
            toast.error('Failed to load payment methods')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const addPaymentMethod = useCallback(async (paymentMethodId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentMethodId })
            })
            if (!response.ok) {
                throw new Error('Failed to add payment method')
            }
            toast.success('Payment method added successfully')
            await fetchPaymentMethods() // Refresh list
        } catch (error) {
            console.error('[ADD_PAYMENT_METHOD_ERROR]', error)
            toast.error('Failed to add payment method')
        } finally {
            setIsLoading(false)
        }
    }, [fetchPaymentMethods])

    const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
                method: 'DELETE'
            })
            if (!response.ok) {
                throw new Error('Failed to remove payment method')
            }
            toast.success('Payment method removed successfully')
            await fetchPaymentMethods() // Refresh list
        } catch (error) {
            console.error('[REMOVE_PAYMENT_METHOD_ERROR]', error)
            toast.error('Failed to remove payment method')
        } finally {
            setIsLoading(false)
        }
    }, [fetchPaymentMethods])

    const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/payment-methods/${paymentMethodId}/default`, {
                method: 'POST'
            })
            if (!response.ok) {
                throw new Error('Failed to set default payment method')
            }
            toast.success('Default payment method updated')
            await fetchPaymentMethods() // Refresh list
        } catch (error) {
            console.error('[SET_DEFAULT_PAYMENT_METHOD_ERROR]', error)
            toast.error('Failed to set default payment method')
        } finally {
            setIsLoading(false)
        }
    }, [fetchPaymentMethods])

    return {
        paymentMethods,
        isLoading,
        fetchPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod
    }
}