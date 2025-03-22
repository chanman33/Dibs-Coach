export type PricingPlan = {
  title: string;
  monthlyPrice?: number;
  description: string;
  features: string[];
  priceIdMonthly: string | null;
  actionLabel: string;
  popular?: boolean;
  exclusive?: boolean;
  href?: string;
}

export type PricingCardProps = PricingPlan & {
  user: any;
  handleCheckout: (priceId: string | null, subscription: boolean) => Promise<void>;
}

export type PricingHeaderProps = {
  title: string;
  subtitle: string;
}

// Shared constants
export const MONTHLY_SOFTWARE_PRICE = 50;
export const MONTHLY_COACHING_CREDITS = 150;
export const MONTHLY_PRICE = MONTHLY_SOFTWARE_PRICE + MONTHLY_COACHING_CREDITS;

export const ELITE_PLAN_FEATURES = [
  "**All Free plan benefits included for every team member**",
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
  }] : []),
  {
    title: "Team and Enterprise",
    description: "Complete enterprise solution with premium benefits for all team members",
    features: ELITE_PLAN_FEATURES,
    actionLabel: "Contact for Pricing",
    priceIdMonthly: null,
    exclusive: true,
    href: "/contact-sales"
  }
]; 