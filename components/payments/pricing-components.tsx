"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { 
  PricingHeaderProps, 
  PricingCardProps
} from "@/utils/pricing"

export const PricingHeader = ({ title, subtitle }: PricingHeaderProps) => (
  <section className="text-center">
    <h1 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>{title}</h1>
    <p className="text-gray-600 dark:text-gray-400 pt-1">{subtitle}</p>
    <br />
  </section>
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
  title, 
  monthlyPrice, 
  description, 
  features, 
  actionLabel, 
  popular, 
  exclusive,
  priceIdMonthly,
  href,
  payAsYouGo,
  priceSubtext
}: PricingCardProps) => {
  return (
    <Card
      className={cn(`w-72 flex flex-col justify-between py-1 ${popular ? "border-rose-400" : "border-zinc-700"} mx-auto sm:mx-0`, {
        "animate-background-shine bg-white dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] transition-colors":
          exclusive,
      })}>
      <div>
        <CardHeader className="pb-8 pt-4 min-h-[140px]">
          <CardTitle className="text-zinc-700 dark:text-zinc-300 text-lg">{title}</CardTitle>
          <div className="flex gap-0.5">
            <h2 className="text-3xl font-bold">
              {monthlyPrice 
                ? "$" + monthlyPrice
                : payAsYouGo 
                  ? "Pay-As-You-Go"
                  : "Custom"}
            </h2>
            <span className="flex flex-col justify-end text-sm mb-1">
              {monthlyPrice ? "/month" : ""}
            </span>
          </div>
          {priceSubtext && (
            <p className="text-xs text-muted-foreground mt-1">{priceSubtext}</p>
          )}
          <div className="pt-1.5 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
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
            onClick={() => handleCheckout(priceIdMonthly, true)}
            className={cn(
              "relative inline-flex w-full items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-6 font-medium transition-all",
              actionLabel === "Coming Soon" && "opacity-60 cursor-not-allowed hover:opacity-60"
            )}
            type="button"
            disabled={actionLabel === "Coming Soon"}
          >
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 