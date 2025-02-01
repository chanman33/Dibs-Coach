'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntentId = searchParams.get('payment_intent');

    if (!clientSecret || !paymentIntentId) {
      setStatus('failed');
      setMessage('Invalid payment session');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to initialize');

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent?.status) {
          case 'succeeded':
            setStatus('success');
            setMessage('Payment successful! You will receive a confirmation email shortly.');
            break;
          case 'processing':
            setStatus('processing');
            setMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            setStatus('failed');
            setMessage('Your payment was not successful, please try again.');
            break;
          default:
            setStatus('failed');
            setMessage('Something went wrong.');
            break;
        }
      } catch (error) {
        console.error('[PAYMENT_STATUS_ERROR]', error);
        setStatus('failed');
        setMessage('Failed to check payment status.');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-4">
          {status === 'processing' ? (
            <div className="animate-pulse">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100" />
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Processing Payment</h2>
              <p className="text-slate-500">Please wait while we confirm your payment...</p>
            </div>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold text-slate-900">Payment Successful!</h2>
              <p className="text-slate-500">{message}</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-slate-900">Payment Failed</h2>
              <p className="text-slate-500">{message}</p>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 