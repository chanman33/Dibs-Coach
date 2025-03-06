"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import axios from "axios"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "sonner"
import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import Link from "next/link"

type PricingSwitchProps = {
  onSwitch: (value: string) => void
}

type PricingCardProps = {
  user: any
  handleCheckout: any
  priceIdMonthly: any
  priceIdYearly: any
  isYearly?: boolean
  title: string
  monthlyPrice?: number
  yearlyPrice?: number
  description: string
  features: string[]
  actionLabel: string
  popular?: boolean
  exclusive?: boolean
  href?: string
}

const UpgradeHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section className="text-center">
    <h1 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>{title}</h1>
    <p className="text-gray-600 dark:text-gray-400 pt-1">{subtitle}</p>
    <br />
  </section>
)

const PricingSwitch = ({ onSwitch }: PricingSwitchProps) => (
  <Tabs defaultValue="0" className="w-40 mx-auto" onValueChange={onSwitch}>
    <TabsList className="py-6 px-2">
      <TabsTrigger value="0" className="text-base">
        <p className="text-black dark:text-white">
          Monthly
        </p>
      </TabsTrigger>
      <TabsTrigger value="1" className="text-base">
        <p className="text-black dark:text-white">
          Yearly
        </p>
      </TabsTrigger>
    </TabsList>
  </Tabs>
)

const PricingCard = ({ user, handleCheckout, isYearly, title, priceIdMonthly, priceIdYearly, monthlyPrice, yearlyPrice, description, features, actionLabel, popular, exclusive, href }: PricingCardProps) => {
  const annualSavings = Math.round(49 * 12 * 0.2); // ≈ 118

  return (
    <Card
      className={cn(`w-72 flex flex-col justify-between py-1 ${popular ? "border-rose-400" : "border-zinc-700"} mx-auto sm:mx-0`, {
        "animate-background-shine bg-white dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] transition-colors":
          exclusive,
      })}>
      <div>
        <CardHeader className="pb-8 pt-4">
          {isYearly && yearlyPrice && monthlyPrice ? (
            <div className="flex justify-between items-start">
              <CardTitle className="text-zinc-700 dark:text-zinc-300 text-lg">{title}</CardTitle>
              <div
                className={cn("px-2.5 rounded-xl h-fit text-sm py-1 bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white", {
                  "bg-gradient-to-r from-orange-400 to-rose-400 dark:text-black": popular,
                })}>
                Save ${annualSavings}
              </div>
            </div>
          ) : (
            <CardTitle className="text-zinc-700 dark:text-zinc-300 text-lg">{title}</CardTitle>
          )}
          <div className="flex gap-0.5">
            <h2 className="text-3xl font-bold">
              {yearlyPrice && isYearly ? "$" + Math.round(yearlyPrice / 12) : monthlyPrice ? "$" + monthlyPrice : "Custom"}
            </h2>
            <span className="flex flex-col justify-end text-sm mb-1">
              /month
            </span>
          </div>
          {isYearly && yearlyPrice && (
            <div className="text-sm text-gray-500 mt-1">
              ${yearlyPrice?.toLocaleString()}/year (20% off, billed annually)
            </div>
          )}
          <CardDescription className="pt-1.5 h-12">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {features.map((feature: string) => (
            <CheckItem key={feature} text={feature} />
          ))}
        </CardContent>
      </div>
      <CardFooter className="mt-2">
        {href ? (
          <Link href={href} className="w-full">
            <Button
              className="relative inline-flex w-full items-center justify-center rounded-md bg-black text-white dark:bg-white px-6 font-medium dark:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              type="button"
            >
              <div className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-b from-[#c7d2fe] to-[#8678f9] opacity-75 blur" />
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={() => handleCheckout(isYearly ? priceIdYearly : priceIdMonthly, true)}
            className="relative inline-flex w-full items-center justify-center rounded-md bg-black text-white dark:bg-white px-6 font-medium dark:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
            type="button"
          >
            <div className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-b from-[#c7d2fe] to-[#8678f9] opacity-75 blur" />
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

const CheckItem = ({ text }: { text: string }) => {
  const isBold = text.startsWith('**') && text.endsWith('**');
  const displayText = isBold ? text.slice(2, -2) : text;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-[14px] h-[14px] mt-0.5">
        <CheckCircle2 className="text-green-400 w-full h-full" />
      </div>
      <p className={cn(
        "flex-1 text-zinc-700 dark:text-zinc-300 text-sm leading-5",
        isBold && "font-semibold"
      )}>
        {displayText}
      </p>
    </div>
  );
};

export default function UpgradePage() {
  const [isYearly, setIsYearly] = useState<boolean>(false)
  const togglePricingPeriod = (value: string) => setIsYearly(parseInt(value) === 1)
  const { user } = useUser();
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

  const handleCheckout = async (priceId: string, subscription: boolean) => {
    try {
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

  const plans = [
    {
      title: "Starter Agent",
      monthlyPrice: 199,
      yearlyPrice: 2270,
      description: "$150 monthly coaching credits + premium platform access",
      features: [
        "Drop 4.5% payment and platformfees",
        "Real Estate GPT Access",
        "AI listing copy generator",
        "Priority email support",
        "Access to resource library",
        "Rollover unused coaching credits"
      ],
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      actionLabel: "Upgrade Now",
      popular: true,
    },
    {
      title: "Elite Brokerage",
      description: "Complete enterprise solution with premium benefits for all team members",
      features: [
        "**All Starter Agent benefits included for every team member**",
        "Enterprise dashboard with team controls",
        "Team-wide goal setting and performance tracking",
        "Custom group coaching and session booking",
        "Learning management system with custom content",
        "Team retention and growth toolkit",
        "Dedicated enterprise support team"
      ],
      actionLabel: "Contact Sales",
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      exclusive: true,
      href: "/dashboard/mentee/upgrade/contact-sales"
    },
  ]

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <UpgradeHeader 
        title="Upgrade Your Plan" 
        subtitle="Take your real estate career to the next level with our premium features" 
      />
      <PricingSwitch onSwitch={togglePricingPeriod} />
      <section className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-8 mt-8">
        {plans.map((plan) => (
          <PricingCard user={user} handleCheckout={handleCheckout} key={plan.title} {...plan} isYearly={isYearly} />
        ))}
      </section>
    </div>
  )
} 