"use client"

import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import axios from "axios"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PricingHeader, PricingSwitch, PricingCard } from "@/components/payments/pricing-components"
import { getDefaultPlans } from "@/utils/pricing"

export default function Pricing() {
  const [isYearly, setIsYearly] = useState<boolean>(false)
  const togglePricingPeriod = (value: string) => setIsYearly(parseInt(value) === 1)
  const { user } = useUser();
  const router = useRouter();
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
        if (!stripeKey) {
          console.error('Stripe public key is missing');
          toast.error('Payment system configuration error');
          return;
        }
        
        const stripe = await loadStripe(stripeKey).catch((error: Error) => {
          console.error('LoadStripe error details:', {
            message: error.message,
            stack: error.stack
          });
          throw error;
        });
        
        if (!stripe) {
          throw new Error('Failed to initialize Stripe - stripe object is null');
        }
        
        setStripePromise(Promise.resolve(stripe));
      } catch (err) {
        const error = err as Error;
        console.error('Error initializing Stripe:', {
          message: error.message,
          stack: error.stack
        });
        toast.error('Failed to initialize payment system. Please try refreshing the page.');
      }
    };

    initStripe();
  }, []);

  const handleCheckout = async (priceId: string | null, subscription: boolean) => {
    try {
      // For free plan, just redirect to sign up
      if (!priceId) {
        router.push('/sign-up');
        return;
      }

      if (!stripePromise) {
        toast.error('Payment system is not ready');
        return;
      }

      const { data } = await axios.post('/api/payments/create-checkout-session', {
        userId: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        priceId,
        subscription
      });

      if (!data?.sessionId) {
        throw new Error('Failed to create checkout session');
      }

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to start checkout process');
    }
  };

  const plans = getDefaultPlans(false);

  return (
    <div className="py-12">
      <PricingHeader 
        title="Invest in Your Real Estate Success" 
        subtitle="Choose the perfect coaching plan to elevate your real estate career." 
      />
      <PricingSwitch onSwitch={togglePricingPeriod} />
      <section className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-8 mt-8">
        {plans.map((plan) => (
          <PricingCard 
            key={plan.title} 
            {...plan} 
            user={user} 
            handleCheckout={handleCheckout} 
            isYearly={isYearly} 
          />
        ))}
      </section>
    </div>
  )
}