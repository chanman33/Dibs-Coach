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
  // Only calculate savings on the software portion ($50)
  return Math.round(50 * 12 * savingsPercentage);
}

// Shared constants
export const MONTHLY_SOFTWARE_PRICE = 50;
export const MONTHLY_COACHING_CREDITS = 150;
export const MONTHLY_PRICE = MONTHLY_SOFTWARE_PRICE + MONTHLY_COACHING_CREDITS;

// Calculate yearly price: Discounted software (20% off) + Full price coaching credits
export const YEARLY_PRICE = Math.round((MONTHLY_SOFTWARE_PRICE * 12 * 0.8) + (MONTHLY_COACHING_CREDITS * 12));

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
    title: "Starter",
    monthlyPrice: MONTHLY_PRICE,
    yearlyPrice: YEARLY_PRICE,
    description: "Perfect for career acceleration.<br>$150 monthly coaching credits + premium platform access.",
    features: STARTER_PLAN_FEATURES,
    priceIdMonthly: null,
    priceIdYearly: null,
    actionLabel: "Coming Soon",
    popular: true,
  },
  {
    title: "Team and Enterprise",
    description: "Complete enterprise solution with premium benefits for all team members",
    features: ELITE_PLAN_FEATURES,
    actionLabel: "Contact for Pricing",
    priceIdMonthly: null,
    priceIdYearly: null,
    exclusive: true,
    href: "/contact-sales"
  }
]; 