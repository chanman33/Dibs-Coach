'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, Trash2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

interface PaymentMethodManagerProps {
  clientSecret: string;
  paymentMethods: PaymentMethod[];
  onPaymentMethodAdded: () => void;
  onPaymentMethodRemoved: (id: string) => void;
  onDefaultChanged: (id: string) => void;
}

export function PaymentMethodManagerWrapper({
  clientSecret,
  ...props
}: PaymentMethodManagerProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
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
      <PaymentMethodManager {...props} />
    </Elements>
  );
}

function PaymentMethodManager({
  paymentMethods,
  onPaymentMethodAdded,
  onPaymentMethodRemoved,
  onDefaultChanged,
}: Omit<PaymentMethodManagerProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/payment-methods`,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to add payment method');
      } else {
        toast.success('Payment method added successfully');
        onPaymentMethodAdded();
        setIsAddingCard(false);
      }
    } catch (error) {
      console.error('[PAYMENT_METHOD_ERROR]', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove payment method');

      toast.success('Payment method removed');
      onPaymentMethodRemoved(id);
    } catch (error) {
      console.error('[REMOVE_PAYMENT_METHOD_ERROR]', error);
      toast.error('Failed to remove payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${id}/default`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to set default payment method');

      toast.success('Default payment method updated');
      onDefaultChanged(id);
    } catch (error) {
      console.error('[SET_DEFAULT_PAYMENT_METHOD_ERROR]', error);
      toast.error('Failed to update default payment method');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <CreditCard className="w-6 h-6 text-slate-600" />
                  <div>
                    <p className="font-medium">
                      {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                    </p>
                    <p className="text-sm text-slate-500">
                      Expires {method.card?.expMonth}/{method.card?.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Make Default
                    </Button>
                  )}
                  {method.isDefault && (
                    <span className="text-sm font-medium text-green-600">
                      Default
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(method.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {isAddingCard ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <PaymentElement />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingCard(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing || !stripe || !elements}
                  >
                    {isProcessing ? 'Saving...' : 'Save Card'}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingCard(true)}
              >
                Add New Card
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 