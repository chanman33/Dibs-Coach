import { z } from "zod";

// Billing period types
export const BILLING_PERIOD = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  CUSTOM: 'custom'
} as const;

export type BillingPeriod = typeof BILLING_PERIOD[keyof typeof BILLING_PERIOD];

export const BillingPeriodSchema = z.enum([
  BILLING_PERIOD.MONTHLY,
  BILLING_PERIOD.ANNUAL,
  BILLING_PERIOD.CUSTOM
]);

// Plan types from Prisma schema
export const PLAN_TYPE = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
  PARTNER: 'PARTNER'
} as const;

export type PlanType = typeof PLAN_TYPE[keyof typeof PLAN_TYPE];

export const PlanTypeSchema = z.enum([
  PLAN_TYPE.FREE,
  PLAN_TYPE.STARTER,
  PLAN_TYPE.PROFESSIONAL,
  PLAN_TYPE.ENTERPRISE,
  PLAN_TYPE.PARTNER
]);

// Subscription status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  TRIAL: 'trial'
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

export const SubscriptionStatusSchema = z.enum([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE,
  SUBSCRIPTION_STATUS.CANCELED,
  SUBSCRIPTION_STATUS.UNPAID,
  SUBSCRIPTION_STATUS.TRIAL
]);

// License status
export const LICENSE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked'
} as const;

export type LicenseStatus = typeof LICENSE_STATUS[keyof typeof LICENSE_STATUS];

export const LicenseStatusSchema = z.enum([
  LICENSE_STATUS.ACTIVE,
  LICENSE_STATUS.REVOKED
]);

// Budget allocation type
export const BUDGET_TYPE = {
  DEPARTMENT: 'department',
  TEAM: 'team',
  USER: 'user'
} as const;

export type BudgetType = typeof BUDGET_TYPE[keyof typeof BUDGET_TYPE];

export const BudgetTypeSchema = z.enum([
  BUDGET_TYPE.DEPARTMENT,
  BUDGET_TYPE.TEAM,
  BUDGET_TYPE.USER
]);

// Payment method type
export const PAYMENT_METHOD_TYPE = {
  CARD: 'card',
  BANK_ACCOUNT: 'bank_account',
  ACH: 'ach',
  WIRE: 'wire'
} as const;

export type PaymentMethodType = typeof PAYMENT_METHOD_TYPE[keyof typeof PAYMENT_METHOD_TYPE];

export const PaymentMethodTypeSchema = z.enum([
  PAYMENT_METHOD_TYPE.CARD,
  PAYMENT_METHOD_TYPE.BANK_ACCOUNT,
  PAYMENT_METHOD_TYPE.ACH,
  PAYMENT_METHOD_TYPE.WIRE
]);

// Billing event types
export const BILLING_EVENT_TYPE = {
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  SEAT_ADDED: 'seat_added',
  SEAT_REMOVED: 'seat_removed',
  SEAT_ASSIGNED: 'seat_assigned',
  SEAT_REVOKED: 'seat_revoked',
  BUDGET_ALLOCATED: 'budget_allocated',
  BUDGET_UPDATED: 'budget_updated'
} as const;

export type BillingEventType = typeof BILLING_EVENT_TYPE[keyof typeof BILLING_EVENT_TYPE];

export const BillingEventTypeSchema = z.enum(Object.values(BILLING_EVENT_TYPE) as [string, ...string[]]);

// Input schemas for server actions
export const UpdateSubscriptionSchema = z.object({
  subscriptionUlid: z.string(),
  totalSeats: z.number().min(1).optional(),
  billingCycle: BillingPeriodSchema.optional(),
  autoRenew: z.boolean().optional()
});

export const AssignSeatSchema = z.object({
  userUlid: z.string(),
  departmentName: z.string().optional(),
  teamName: z.string().optional()
});

export const RevokeSeatSchema = z.object({
  licenseUlid: z.string()
});

export const CreateBudgetAllocationSchema = z.object({
  name: z.string(),
  type: BudgetTypeSchema,
  targetUlid: z.string().optional(),
  amount: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  autoRenew: z.boolean().default(true)
});

export const UpdateBudgetAllocationSchema = z.object({
  budgetUlid: z.string(),
  amount: z.number().positive().optional(),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional()
});

// Response types
export interface Subscription {
  ulid: string;
  status: string;
  planType: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  totalSeats: number;
  usedSeats: number;
  seatPrice: number | null;
  billingCycle: string;
  autoRenew: boolean;
  metadata: Record<string, any> | null;
}

export interface SeatLicense {
  ulid: string;
  status: string;
  departmentName: string | null;
  teamName: string | null;
  assignedAt: string;
  revokedAt: string | null;
  user: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  };
  assignedBy: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface BudgetAllocation {
  ulid: string;
  name: string;
  type: string;
  amount: number;
  spent: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  targetUser?: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  } | null;
}

export interface PaymentMethod {
  ulid: string;
  type: string;
  isDefault: boolean;
  last4: string;
  brand: string | null;
  expMonth: number | null;
  expYear: number | null;
  country: string | null;
}

export interface BillingEvent {
  ulid: string;
  type: string;
  amount: number | null;
  description: string;
  createdAt: string;
} 