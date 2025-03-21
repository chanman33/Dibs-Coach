import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { env } from '@/env.mjs'

// Types
export interface PaymentMethodError {
  message: string
  code?: string
  type: 'validation' | 'stripe' | 'database'
}

export interface PaymentMethodResponse<T> {
  data: T | null
  error: PaymentMethodError | null
}

export interface SavedPaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
  createdAt: string
}

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export class StripePaymentMethodService {
  private async getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    )
  }

  /**
   * Save a new payment method for a user
   */
  async savePaymentMethod(
    userDbId: number,
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<PaymentMethodResponse<SavedPaymentMethod>> {
    try {
      const supabase = await this.getSupabase()

      // Get user's customer ID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single()

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        }
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: userData.stripeCustomerId,
      })

      if (setAsDefault) {
        await stripe.customers.update(userData.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      }

      // Save to database
      const { data: savedMethod, error: saveError } = await supabase
        .from('StripePaymentMethod')
        .insert({
          userDbId,
          stripePaymentMethodId: paymentMethodId,
          isDefault: setAsDefault,
        })
        .select()
        .single()

      if (saveError) {
        return {
          data: null,
          error: {
            message: 'Failed to save payment method',
            type: 'database',
          },
        }
      }

      // Get payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

      return {
        data: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card
            ? {
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
              }
            : undefined,
          isDefault: setAsDefault,
          createdAt: new Date().toISOString(),
        },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Retrieve all payment methods for a user
   */
  async getPaymentMethods(
    userDbId: number
  ): Promise<PaymentMethodResponse<SavedPaymentMethod[]>> {
    try {
      const supabase = await this.getSupabase()

      // Get user's customer ID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single()

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        }
      }

      // Get payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripeCustomerId,
        type: 'card',
      })

      // Get default payment method
      const customer = await stripe.customers.retrieve(userData.stripeCustomerId)
      const defaultPaymentMethodId = 
        typeof customer === 'object' && !('deleted' in customer) 
          ? customer.invoice_settings.default_payment_method
          : null

      const formattedMethods: SavedPaymentMethod[] = paymentMethods.data.map(
        (method) => ({
          id: method.id,
          type: method.type,
          card: method.card
            ? {
                brand: method.card.brand,
                last4: method.card.last4,
                expMonth: method.card.exp_month,
                expYear: method.card.exp_year,
              }
            : undefined,
          isDefault: method.id === defaultPaymentMethodId,
          createdAt: new Date(method.created * 1000).toISOString(),
        })
      )

      return {
        data: formattedMethods,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(
    userDbId: number,
    paymentMethodId: string
  ): Promise<PaymentMethodResponse<{ success: boolean }>> {
    try {
      const supabase = await this.getSupabase()

      // Get user's customer ID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single()

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        }
      }

      // Update default payment method
      await stripe.customers.update(userData.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Update database
      const { error: updateError } = await supabase
        .from('StripePaymentMethod')
        .update({ isDefault: false })
        .eq('userDbId', userDbId)

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update payment methods',
            type: 'database',
          },
        }
      }

      const { error: setDefaultError } = await supabase
        .from('StripePaymentMethod')
        .update({ isDefault: true })
        .eq('stripePaymentMethodId', paymentMethodId)
        .eq('userDbId', userDbId)

      if (setDefaultError) {
        return {
          data: null,
          error: {
            message: 'Failed to set default payment method',
            type: 'database',
          },
        }
      }

      return {
        data: { success: true },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(
    userDbId: number,
    paymentMethodId: string
  ): Promise<PaymentMethodResponse<{ success: boolean }>> {
    try {
      const supabase = await this.getSupabase()

      // Get user's customer ID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single()

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        }
      }

      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId)

      // Delete from database
      const { error: deleteError } = await supabase
        .from('StripePaymentMethod')
        .delete()
        .eq('stripePaymentMethodId', paymentMethodId)
        .eq('userDbId', userDbId)

      if (deleteError) {
        return {
          data: null,
          error: {
            message: 'Failed to delete payment method',
            type: 'database',
          },
        }
      }

      return {
        data: { success: true },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }
} 