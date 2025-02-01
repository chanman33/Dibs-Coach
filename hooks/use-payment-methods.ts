import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { SavedPaymentMethod } from '@/lib/stripe-payment-methods'

interface UsePaymentMethodsProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UsePaymentMethodsReturn {
  paymentMethods: SavedPaymentMethod[]
  isLoading: boolean
  error: string | null
  fetchPaymentMethods: () => Promise<void>
  savePaymentMethod: (paymentMethodId: string, setAsDefault?: boolean) => Promise<void>
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>
  deletePaymentMethod: (paymentMethodId: string) => Promise<void>
}

export function usePaymentMethods({
  onSuccess,
  onError,
}: UsePaymentMethodsProps = {}): UsePaymentMethodsReturn {
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/payment-methods')
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }

      const data = await response.json()
      setPaymentMethods(data)
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      onError?.(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess, onError, toast])

  const savePaymentMethod = useCallback(
    async (paymentMethodId: string, setAsDefault = false) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId,
            setAsDefault,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save payment method')
        }

        await fetchPaymentMethods()
        onSuccess?.()
        toast({
          title: 'Success',
          description: 'Payment method saved successfully',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        onError?.(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchPaymentMethods, onSuccess, onError, toast]
  )

  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/payment-methods', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to set default payment method')
        }

        await fetchPaymentMethods()
        onSuccess?.()
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        onError?.(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchPaymentMethods, onSuccess, onError, toast]
  )

  const deletePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/payment-methods?id=${paymentMethodId}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          throw new Error('Failed to delete payment method')
        }

        await fetchPaymentMethods()
        onSuccess?.()
        toast({
          title: 'Success',
          description: 'Payment method deleted successfully',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        onError?.(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchPaymentMethods, onSuccess, onError, toast]
  )

  return {
    paymentMethods,
    isLoading,
    error,
    fetchPaymentMethods,
    savePaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
  }
} 