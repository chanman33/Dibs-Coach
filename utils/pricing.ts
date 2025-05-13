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
  payAsYouGo?: boolean;
  priceSubtext?: string;
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
  "All Individual plan benefits",
  "Admin dashboard & team controls",
  "Company-wide goal tracking",
  "Group coaching and custom workshops",
  "Built-in LMS for custom content",
  "Retention and growth analytics",
  "Priority support"
];

export const getDefaultPlans = (isUpgradePage: boolean = false): PricingPlan[] => [
  ...(!isUpgradePage ? [{
    title: "Individual",
    description: "Only pay when you book 1-on-1 coaching sessions (custom price per session)",
    features: [
      "Book individual sessions",
      "Pay per session pricing",
      "Session scheduling system",
      "Post-session feedback",
    ],
    actionLabel: "Sign Up Free",
    priceIdMonthly: null,
    payAsYouGo: true,
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