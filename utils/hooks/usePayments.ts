import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentError, SessionPayment, PaymentMethod } from '../types/stripe';

interface UsePaymentsProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: PaymentError) => void;
}

export function usePayments({ onPaymentSuccess, onPaymentError }: UsePaymentsProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);

  /**
   * Create a payment for a coaching session
   */
  const createSessionPayment = async (payment: SessionPayment) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const data = await response.json();
      
      if (onPaymentSuccess) {
        onPaymentSuccess(data);
      }

      toast.success('Payment processed successfully');
      return data;
    } catch (err) {
      const error = err as PaymentError;
      console.error('[PAYMENT_ERROR] Create session payment failed:', error);
      
      setError(error);
      if (onPaymentError) {
        onPaymentError(error);
      }

      toast.error(error.message || 'Payment processing failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save a payment method for future use
   */
  const savePaymentMethod = async (paymentMethod: PaymentMethod) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentMethod),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const data = await response.json();
      toast.success('Payment method saved successfully');
      return data;
    } catch (err) {
      const error = err as PaymentError;
      console.error('[PAYMENT_ERROR] Save payment method failed:', error);
      
      setError(error);
      toast.error(error.message || 'Failed to save payment method');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set a payment method as default
   */
  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/methods/${paymentMethodId}/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const data = await response.json();
      toast.success('Default payment method updated');
      return data;
    } catch (err) {
      const error = err as PaymentError;
      console.error('[PAYMENT_ERROR] Set default payment method failed:', error);
      
      setError(error);
      toast.error(error.message || 'Failed to update default payment method');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request a refund for a payment
   */
  const requestRefund = async (paymentIntentId: string, amount?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const data = await response.json();
      toast.success('Refund processed successfully');
      return data;
    } catch (err) {
      const error = err as PaymentError;
      console.error('[PAYMENT_ERROR] Request refund failed:', error);
      
      setError(error);
      toast.error(error.message || 'Failed to process refund');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createSessionPayment,
    savePaymentMethod,
    setDefaultPaymentMethod,
    requestRefund,
  };
} 