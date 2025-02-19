'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { generateUlid } from '@/utils/ulid'
import { z } from 'zod'

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

// Default subscription plans
const DEFAULT_PLANS = {
  FREE: {
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
  },
  PRO: {
    ulid: generateUlid(),
    planId: 'price_pro',
    name: 'Professional',
    description: 'Enhanced features with discounted coaching',
    type: 'INDIVIDUAL',
    billingModel: 'FIXED',
    amount: 49,
    currency: 'USD',
    interval: 'month',
    features: [
      SUBSCRIPTION_FEATURES.COACHING.DISCOUNTED,
      SUBSCRIPTION_FEATURES.AI_TOOLS.ADVANCED,
      SUBSCRIPTION_FEATURES.SUPPORT.PRIORITY
    ],
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  BUSINESS: {
    ulid: generateUlid(),
    planId: 'price_business',
    name: 'Business',
    description: 'Team access with per-seat pricing',
    type: 'ORGANIZATION',
    billingModel: 'PER_SEAT',
    amount: 29,
    currency: 'USD',
    interval: 'month',
    features: [
      SUBSCRIPTION_FEATURES.COACHING.DISCOUNTED,
      SUBSCRIPTION_FEATURES.AI_TOOLS.ADVANCED,
      SUBSCRIPTION_FEATURES.SUPPORT.PRIORITY,
      SUBSCRIPTION_FEATURES.ORGANIZATION.TEAM_MANAGEMENT,
      SUBSCRIPTION_FEATURES.ORGANIZATION.SSO
    ],
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  ENTERPRISE: {
    ulid: generateUlid(),
    planId: 'price_enterprise',
    name: 'Enterprise',
    description: 'Custom enterprise solution',
    type: 'ORGANIZATION',
    billingModel: 'CUSTOM',
    amount: 0, // Custom pricing
    currency: 'USD',
    interval: 'month',
    features: [
      SUBSCRIPTION_FEATURES.COACHING.UNLIMITED,
      SUBSCRIPTION_FEATURES.AI_TOOLS.ADVANCED,
      SUBSCRIPTION_FEATURES.SUPPORT.DEDICATED,
      SUBSCRIPTION_FEATURES.ORGANIZATION.TEAM_MANAGEMENT,
      SUBSCRIPTION_FEATURES.ORGANIZATION.SSO,
      SUBSCRIPTION_FEATURES.ORGANIZATION.CUSTOM_INTEGRATION
    ],
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
} as const;

// Helper function to check if a plan has a feature
export async function hasFeature(plan: SubscriptionPlan, feature: Feature): Promise<boolean> {
  return plan.features.includes(feature);
}

// Get or create default free tier plan
async function getOrCreateFreePlan(): Promise<SubscriptionPlan | null> {
  const supabase = await createAuthClient()
  
  // First try to get existing free plan
  const { data: existingPlan, error: fetchError } = await supabase
    .from('SubscriptionPlan')
    .select('*')
    .eq('planId', 'price_free')
    .single()
    
  if (existingPlan) {
    return existingPlan
  }
  
  // If no free plan exists, create it
  const { data: newPlan, error: createError } = await supabase
    .from('SubscriptionPlan')
    .insert(DEFAULT_PLANS.FREE)
    .select()
    .single()
    
  if (createError) {
    console.error('[SUBSCRIPTION_ERROR] Failed to create free plan:', createError)
    return null
  }
  
  return newPlan
}

// Get or create default subscription for user
export const getOrCreateSubscription = withServerAction<Subscription | null>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      // First check if user already has a subscription
      const { data: existingSub, error: fetchError } = await supabase
        .from('Subscription')
        .select(`
          *,
          organization:organizationUlid (
            ulid,
            name,
            subscription:subscriptions!inner (
              ulid,
              status,
              planUlid
            )
          )
        `)
        .eq('userUlid', userUlid)
        .single()
        
      if (existingSub) {
        return {
          data: existingSub,
          error: null
        }
      }
      
      // If no subscription exists, get/create free plan
      const freePlan = await getOrCreateFreePlan()
      if (!freePlan) {
        return {
          data: null,
          error: {
            code: 'SETUP_ERROR',
            message: 'Failed to setup free subscription plan'
          }
        }
      }

      // Check if user belongs to an organization with an active subscription
      const { data: orgMember } = await supabase
        .from('OrganizationMember')
        .select('organizationUlid')
        .eq('userUlid', userUlid)
        .eq('status', 'ACTIVE')
        .single()

      // Create new subscription with required fields
      const now = new Date()
      const newSubscription = {
        ulid: generateUlid(),
        subscriptionId: `sub_${userUlid}`,
        userUlid,
        organizationUlid: orgMember?.organizationUlid || null,
        stripeCustomerId: 'none', // No Stripe customer for free tier
        status: 'active' as const,
        startDate: now,
        endDate: null,
        planUlid: freePlan.ulid,
        defaultPaymentMethodId: null,
        quantity: 1,
        billingCycle: 'monthly' as const,
        metadata: {},
        createdAt: now,
        updatedAt: now
      }
      
      const { data: subscription, error: createError } = await supabase
        .from('Subscription')
        .insert(newSubscription)
        .select()
        .single()
        
      if (createError) {
        console.error('[SUBSCRIPTION_ERROR] Failed to create subscription:', { error: createError, subscription: newSubscription })
        
        // If the error is schema-related, try creating without optional fields
        if (createError.code === 'PGRST204') {
          const { data: fallbackSub, error: fallbackError } = await supabase
            .from('Subscription')
            .insert({
              ulid: generateUlid(),
              subscriptionId: `sub_${userUlid}`,
              userUlid,
              stripeCustomerId: 'none',
              status: 'active',
              startDate: now,
              planUlid: freePlan.ulid,
              quantity: 1,
              metadata: {},
              createdAt: now,
              updatedAt: now
            })
            .select()
            .single()
            
          if (fallbackError) {
            console.error('[SUBSCRIPTION_ERROR] Fallback creation failed:', fallbackError)
            return {
              data: null,
              error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create subscription'
              }
            }
          }
          
          return {
            data: fallbackSub,
            error: null
          }
        }
        
        return {
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create subscription'
          }
        }
      }
      
      return {
        data: subscription,
        error: null
      }
    } catch (error) {
      console.error('[SUBSCRIPTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Get subscription details with plan info
export const getSubscriptionDetails = withServerAction<{
  subscription: Subscription,
  plan: SubscriptionPlan
} | null>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      // Get subscription with plan details
      const { data, error } = await supabase
        .from('Subscription')
        .select(`
          *,
          plan:planUlid (*),
          organization:organizationUlid (
            ulid,
            name,
            Subscription (
              ulid,
              status,
              planUlid
            )
          )
        `)
        .eq('userUlid', userUlid)
        .single()
        
      if (error) {
        // If no subscription found, try to create one
        if (error.code === 'PGRST116') {
          const result = await getOrCreateSubscription(null)
          if (result.data) {
            // Get the newly created subscription with plan details
            const { data: newData, error: newError } = await supabase
              .from('Subscription')
              .select(`
                *,
                plan:planUlid (*),
                organization:organizationUlid (
                  ulid,
                  name,
                  subscription:subscriptions!inner (
                    ulid,
                    status,
                    planUlid
                  )
                )
              `)
              .eq('userUlid', userUlid)
              .single()
              
            if (!newError && newData) {
              return {
                data: {
                  subscription: newData,
                  plan: newData.plan
                },
                error: null
              }
            }
          }
        }
        
        console.error('[SUBSCRIPTION_ERROR] Failed to get subscription details:', error)
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to get subscription details'
          }
        }
      }
      
      return {
        data: {
          subscription: data,
          plan: data.plan
        },
        error: null
      }
    } catch (error) {
      console.error('[SUBSCRIPTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 