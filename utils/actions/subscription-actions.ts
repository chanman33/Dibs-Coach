'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { generateUlid } from '@/utils/ulid'
import { z } from 'zod'

// Schema for subscription data
const SubscriptionSchema = z.object({
  ulid: z.string(),
  subscriptionId: z.string(),
  userUlid: z.string().nullable(),
  organizationUlid: z.string().nullable(),
  stripeCustomerId: z.string(),
  status: z.string(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  planUlid: z.string(),
  defaultPaymentMethodId: z.string().nullable(),
  quantity: z.number(),
  metadata: z.record(z.any()).default({}),
})

const SubscriptionPlanSchema = z.object({
  ulid: z.string(),
  planId: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  amount: z.number(),
  currency: z.string(),
  interval: z.string(),
  features: z.record(z.any()).default({}),
  limits: z.record(z.any()).default({}),
  isActive: z.boolean(),
  metadata: z.record(z.any()).default({}),
})

type Subscription = z.infer<typeof SubscriptionSchema>
type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>

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
  const freePlan = {
    ulid: generateUlid(),
    planId: 'price_free',
    name: 'Free Tier',
    description: 'Basic access with pay-as-you-go coaching',
    type: 'INDIVIDUAL',
    amount: 0,
    currency: 'USD',
    interval: 'month',
    features: {
      coachingSessions: 'pay-as-you-go',
      aiListingGenerator: 3,
      basicSupport: true
    },
    limits: {
      aiListingsPerMonth: 3,
      coachingRate: 149
    },
    isActive: true,
    metadata: {}
  } as const
  
  const { data: newPlan, error: createError } = await supabase
    .from('SubscriptionPlan')
    .insert(freePlan)
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
        .select('*')
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
      
      // Create new subscription with free plan
      const newSubscription = {
        ulid: generateUlid(),
        subscriptionId: `sub_free_${userUlid}`,
        userUlid,
        organizationUlid: null,
        stripeCustomerId: 'none', // No Stripe customer for free tier
        status: 'active',
        startDate: new Date(),
        endDate: null,
        planUlid: freePlan.ulid,
        defaultPaymentMethodId: null,
        quantity: 1,
        metadata: {}
      }
      
      const { data: subscription, error: createError } = await supabase
        .from('Subscription')
        .insert(newSubscription)
        .select()
        .single()
        
      if (createError) {
        console.error('[SUBSCRIPTION_ERROR] Failed to create subscription:', createError)
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
          plan:planUlid (*)
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
                plan:planUlid (*)
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