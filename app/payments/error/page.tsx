'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      switch (error) {
        case 'payment_intent_authentication_failure':
          setErrorMessage('Your payment was not authenticated. Please try again.');
          break;
        case 'payment_intent_payment_failure':
          setErrorMessage('Your payment failed. Please check your payment details and try again.');
          break;
        case 'payment_intent_invalid':
          setErrorMessage('The payment session has expired. Please start over.');
          break;
        default:
          setErrorMessage(message || 'Something went wrong with your payment. Please try again.');
      }
    } else {
      setErrorMessage('An unknown error occurred. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Payment Failed</h2>
          <p className="text-slate-500">{errorMessage}</p>
          <div className="space-y-2">
            <Button
              onClick={() => router.back()}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/support')}
              variant="outline"
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 