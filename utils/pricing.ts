export type PricingPlan = {
  title: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  actionLabel: string;
  popular?: boolean;
  exclusive?: boolean;
  href?: string;
}

export type PricingSwitchProps = {
  onSwitch: (value: string) => void;
}

export type PricingCardProps = PricingPlan & {
  user: any;
  handleCheckout: (priceId: string | null, subscription: boolean) => Promise<void>;
  isYearly?: boolean;
}

export type PricingHeaderProps = {
  title: string;
  subtitle: string;
}

// Shared utility functions
export const calculateAnnualSavings = (monthlyPrice: number | undefined, savingsPercentage: number = 0.2) => {
  if (!monthlyPrice) return 0;
  return Math.round(monthlyPrice * 12 * savingsPercentage);
}

// Shared constants
export const MONTHLY_PRICE = 199;
export const YEARLY_PRICE = 2270; // 20% off monthly price

export const STARTER_PLAN_FEATURES = [
  "Waive the standard 4.5% payment and platform fees",
  "Real Estate GPT Access",
  "AI listing copy generator",
  "Priority email support",
  "Access to resource library and career support tools",
  "Rollover unused coaching credits"
];

export const ELITE_PLAN_FEATURES = [
  "**All Starter Agent benefits included for every team member**",
  "Enterprise dashboard with team controls",
  "Team-wide goal setting and performance tracking",
  "Custom group coaching and session booking",
  "Learning management system with custom content",
  "Team retention and growth toolkit",
  "Dedicated enterprise support team"
];

export const getDefaultPlans = (isUpgradePage: boolean = false): PricingPlan[] => [
  ...(!isUpgradePage ? [{
    title: "Free",
    description: "Get started with pay-as-you-go coaching sessions",
    features: [
      "Book individual sessions",
      "Pay per session pricing",
      "Session scheduling system",
      "Post-session feedback",
    ],
    actionLabel: "Sign Up Free",
    priceIdMonthly: null,
    priceIdYearly: null,
  }] : []),
  {
    title: "Starter Agent",
    monthlyPrice: MONTHLY_PRICE,
    yearlyPrice: YEARLY_PRICE,
    description: "Perfect for career acceleration.<br>$150 monthly coaching credits + premium platform access.",
    features: STARTER_PLAN_FEATURES,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || null,
    actionLabel: isUpgradePage ? "Upgrade Now" : "Start Your Journey",
    popular: true,
  },
  {
    title: "Elite Brokerage",
    description: "Complete enterprise solution with premium benefits for all team members",
    features: ELITE_PLAN_FEATURES,
    actionLabel: isUpgradePage ? "Contact Sales" : "Contact for Team Pricing",
    priceIdMonthly: null,
    priceIdYearly: null,
    exclusive: true,
    href: "/contact-sales"
  }
]; 