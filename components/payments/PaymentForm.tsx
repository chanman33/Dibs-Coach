'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  returnUrl: string;
  amount: number;
  currency: string;
}

export function PaymentFormWrapper({ clientSecret, returnUrl, amount, currency }: PaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm returnUrl={returnUrl} amount={amount} currency={currency} />
    </Elements>
  );
}

function PaymentForm({ returnUrl, amount, currency }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('[PAYMENT_ERROR]', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-8">
      <div className="rounded-lg bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-900">Payment Amount</p>
        <p className="text-slate-700">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)}
        </p>
      </div>

      <div className="space-y-4">
        <PaymentElement />

        <Button
          type="submit"
          className="w-full"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-500">
          Secure payment powered by Stripe
        </p>
      </div>
    </form>
  );
} 