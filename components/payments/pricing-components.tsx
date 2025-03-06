"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { 
  PricingHeaderProps, 
  PricingSwitchProps, 
  PricingCardProps, 
  calculateAnnualSavings,
  MONTHLY_SOFTWARE_PRICE,
  MONTHLY_COACHING_CREDITS 
} from "@/utils/pricing"

export const PricingHeader = ({ title, subtitle }: PricingHeaderProps) => (
  <section className="text-center">
    <h1 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>{title}</h1>
    <p className="text-gray-600 dark:text-gray-400 pt-1">{subtitle}</p>
    <br />
  </section>
)

export const PricingSwitch = ({ onSwitch }: PricingSwitchProps) => (
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

export const PricingCard = ({ 
  user, 
  handleCheckout, 
  isYearly, 
  title, 
  monthlyPrice, 
  yearlyPrice, 
  description, 
  features, 
  actionLabel, 
  popular, 
  exclusive,
  priceIdMonthly,
  priceIdYearly,
  href 
}: PricingCardProps) => {
  const annualSavings = calculateAnnualSavings(monthlyPrice);

  return (
    <Card
      className={cn(`w-72 flex flex-col justify-between py-1 ${popular ? "border-rose-400" : "border-zinc-700"} mx-auto sm:mx-0`, {
        "animate-background-shine bg-white dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] transition-colors":
          exclusive,
      })}>
      <div>
        <CardHeader className={cn(
          "pb-8 pt-4",
          isYearly && monthlyPrice 
            ? "min-h-[180px]"
            : "min-h-[140px]"
        )}>
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
              {monthlyPrice 
                ? isYearly 
                  ? "$" + (Math.round((MONTHLY_SOFTWARE_PRICE * 0.8) + MONTHLY_COACHING_CREDITS))
                  : "$" + monthlyPrice
                : "Custom"}
            </h2>
            <span className="flex flex-col justify-end text-sm mb-1">
              {monthlyPrice ? "/month" : ""}
            </span>
          </div>
          {isYearly && yearlyPrice && monthlyPrice && (
            <div className="text-sm text-gray-500 mt-1">
              <div>
                Software: ${Math.round(MONTHLY_SOFTWARE_PRICE * 12 * 0.8)}/year (Save ${calculateAnnualSavings(monthlyPrice)}, billed annually)
              </div>
              <div className="mt-1">
                + $150/month in coaching credits (billed monthly)
              </div>
            </div>
          )}
          {(!isYearly || !monthlyPrice) && (
            <div className="pt-1.5 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
          )}
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