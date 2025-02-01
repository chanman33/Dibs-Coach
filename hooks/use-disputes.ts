import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { DisputeDetails } from '@/lib/stripe-disputes'

interface UseDisputesProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UseDisputesReturn {
  disputes: DisputeDetails[]
  isLoading: boolean
  error: string | null
  fetchDisputes: (sessionId: string) => Promise<void>
  submitEvidence: (
    disputeId: string,
    evidence: {
      customerName?: string
      customerEmailAddress?: string
      billingAddress?: string
      serviceDate?: string
      productDescription?: string
      customerSignature?: string
      customerPurchaseIp?: string
      customerCommunication?: string
      uncategorizedText?: string
    }
  ) => Promise<void>
  processRefund: (disputeId: string, amount?: number) => Promise<void>
}

export function useDisputes({
  onSuccess,
  onError,
}: UseDisputesProps = {}): UseDisputesReturn {
  const [disputes, setDisputes] = useState<DisputeDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDisputes = useCallback(
    async (sessionId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/disputes?sessionId=${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch disputes')
        }

        const data = await response.json()
        setDisputes(data)
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
    },
    [onSuccess, onError, toast]
  )

  const submitEvidence = useCallback(
    async (
      disputeId: string,
      evidence: {
        customerName?: string
        customerEmailAddress?: string
        billingAddress?: string
        serviceDate?: string
        productDescription?: string
        customerSignature?: string
        customerPurchaseIp?: string
        customerCommunication?: string
        uncategorizedText?: string
      }
    ) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/disputes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disputeId,
            evidence,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit evidence')
        }

        const data = await response.json()
        setDisputes((prev) =>
          prev.map((dispute) =>
            dispute.id === disputeId ? { ...dispute, ...data } : dispute
          )
        )
        onSuccess?.()
        toast({
          title: 'Success',
          description: 'Evidence submitted successfully',
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
    [onSuccess, onError, toast]
  )

  const processRefund = useCallback(
    async (disputeId: string, amount?: number) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/disputes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disputeId,
            amount,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to process refund')
        }

        const data = await response.json()
        setDisputes((prev) =>
          prev.map((dispute) =>
            dispute.id === disputeId
              ? { ...dispute, status: 'refunded' }
              : dispute
          )
        )
        onSuccess?.()
        toast({
          title: 'Success',
          description: 'Refund processed successfully',
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
    [onSuccess, onError, toast]
  )

  return {
    disputes,
    isLoading,
    error,
    fetchDisputes,
    submitEvidence,
    processRefund,
  }
} 