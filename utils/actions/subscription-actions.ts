'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { generateUlid } from '@/utils/ulid'
import { z } from 'zod'
import { ApiResponse } from '@/utils/types/api'

// Define available features
const SUBSCRIPTION_FEATURES = {
  COACHING: {
    PAY_AS_YOU_GO: 'pay_as_you_go_coaching',
    DISCOUNTED: 'discounted_coaching',
    UNLIMITED: 'unlimited_coaching'
  },
  AI_TOOLS: {
    BASIC: 'basic_ai_tools',
    ADVANCED: 'advanced_ai_tools'
  },
  SUPPORT: {
    BASIC: 'basic_support',
    PRIORITY: 'priority_support',
    DEDICATED: 'dedicated_support'
  },
  ORGANIZATION: {
    TEAM_MANAGEMENT: 'team_management',
    SSO: 'sso_auth',
    CUSTOM_INTEGRATION: 'custom_integration'
  }
} as const

type FeatureSet = typeof SUBSCRIPTION_FEATURES
type Feature = FeatureSet[keyof FeatureSet][keyof FeatureSet[keyof FeatureSet]]

// Schema for subscription data
const SubscriptionSchema = z.object({
  ulid: z.string(),
  subscriptionId: z.string(),
  userUlid: z.string().nullable(),
  organizationUlid: z.string().nullable(),
  stripeCustomerId: z.string(),
  status: z.enum(['active', 'inactive', 'past_due', 'canceled', 'trialing']),
  startDate: z.date(),
  endDate: z.date().nullable(),
  planUlid: z.string(),
  defaultPaymentMethodId: z.string().nullable(),
  quantity: z.number().default(1), // Number of seats for org plans
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
})

const SubscriptionPlanSchema = z.object({
  ulid: z.string(),
  planId: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  billingModel: z.enum(['FREE', 'FIXED', 'PER_SEAT', 'CUSTOM']),
  amount: z.number(),
  currency: z.string(),
  interval: z.enum(['month', 'year']),
  features: z.array(z.string()),
  isActive: z.boolean(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
})

type Subscription = z.infer<typeof SubscriptionSchema>
type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>

// Create a mutable version of the free plan
const FREE_PLAN: SubscriptionPlan = {
  ulid: generateUlid(),
  planId: 'price_free',
  name: 'Free Tier',
  description: 'Basic access with pay-as-you-go coaching',
  type: 'INDIVIDUAL',
  billingModel: 'FREE',
  amount: 0,
  currency: 'USD',
  interval: 'month',
  features: [
    SUBSCRIPTION_FEATURES.COACHING.PAY_AS_YOU_GO,
    SUBSCRIPTION_FEATURES.AI_TOOLS.BASIC,
    SUBSCRIPTION_FEATURES.SUPPORT.BASIC
  ],
  isActive: true,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper function to check if a plan has a feature
export async function hasFeature(plan: SubscriptionPlan, feature: Feature): Promise<boolean> {
  return plan.features.includes(feature);
}

// Get or create default subscription for user - Placeholder implementation
export const getOrCreateSubscription = withServerAction<Subscription | null>(
  async (_, { userUlid }): Promise<ApiResponse<Subscription | null>> => {
    try {
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }

      // Return default free plan data
      return {
        data: {
          ulid: generateUlid(),
          subscriptionId: `sub_${userUlid}`,
          userUlid,
          organizationUlid: null,
          stripeCustomerId: 'none',
          status: 'active',
          startDate: new Date(),
          endDate: null,
          planUlid: FREE_PLAN.ulid,
          defaultPaymentMethodId: null,
          quantity: 1,
          billingCycle: 'monthly',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        error: null
      };
    } catch (error) {
      console.error('[SUBSCRIPTION_ERROR]', error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'This feature is not fully implemented yet',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
);

// Get subscription details with plan info - Placeholder implementation
export const getSubscriptionDetails = withServerAction<{
  subscription: Subscription,
  plan: SubscriptionPlan
} | null>(
  async (_, { userUlid }): Promise<ApiResponse<{
    subscription: Subscription,
    plan: SubscriptionPlan
  } | null>> => {
    try {
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }

      // Return default free plan data
      return {
        data: {
          subscription: {
            ulid: generateUlid(),
            subscriptionId: `sub_${userUlid}`,
            userUlid,
            organizationUlid: null,
            stripeCustomerId: 'none',
            status: 'active',
            startDate: new Date(),
            endDate: null,
            planUlid: FREE_PLAN.ulid,
            defaultPaymentMethodId: null,
            quantity: 1,
            billingCycle: 'monthly',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          plan: FREE_PLAN
        },
        error: null
      };
    } catch (error) {
      console.error('[SUBSCRIPTION_ERROR]', error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'This feature is not fully implemented yet',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
); 