import { createAuthClient } from '@/utils/auth/auth-client';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { randomUUID } from 'crypto';

// Types
export interface PaymentMethodError {
  message: string;
  code?: string;
  type: 'validation' | 'stripe' | 'database';
}

export interface PaymentMethodResponse<T> {
  data: T | null;
  error: PaymentMethodError | null;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

// Initialize Stripe
if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Service for managing Stripe payment methods
 */
export class StripePaymentMethodsService {
  private supabase;

  constructor() {
    // Initialize Supabase client without cookies
    this.supabase = createAuthClient();
  }

  /**
   * Create a new StripePaymentMethodsService instance
   */
  static async init() {
    return new StripePaymentMethodsService();
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
      // Get user's customer ID
      const { data: userData, error: userError } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        };
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: userData.stripeCustomerId,
      });

      if (setAsDefault) {
        await stripe.customers.update(userData.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Save to database
      const { data: savedMethod, error: saveError } = await this.supabase
        .from('StripePaymentMethod')
        .insert({
          userUlid: userDbId.toString(),
          stripePaymentMethodId: paymentMethodId,
          type: 'card',
          ulid: randomUUID(),
          updatedAt: new Date().toISOString(),
          isDefault: setAsDefault,
        })
        .select()
        .single();

      if (saveError) {
        return {
          data: null,
          error: {
            message: 'Failed to save payment method',
            type: 'database',
          },
        };
      }

      // Get payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

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
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      };
    }
  }

  /**
   * Retrieve all payment methods for a user
   */
  async getPaymentMethods(
    userDbId: number
  ): Promise<PaymentMethodResponse<SavedPaymentMethod[]>> {
    try {
      const { data: userData, error: userError } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        };
      }

      // Get payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripeCustomerId,
        type: 'card',
      });

      // Get default payment method
      const customer = await stripe.customers.retrieve(userData.stripeCustomerId);
      const defaultPaymentMethodId =
        typeof customer === 'object' && !('deleted' in customer)
          ? customer.invoice_settings.default_payment_method
          : null;

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
      );

      return {
        data: formattedMethods,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      };
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
      // Get user's customer ID
      const { data: userData, error: userError } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        };
      }

      // Update default payment method
      await stripe.customers.update(userData.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update database
      const { error: updateError } = await this.supabase
        .from('StripePaymentMethod')
        .update({ isDefault: false })
        .eq('userUlid', userDbId.toString());

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update payment methods',
            type: 'database',
          },
        };
      }

      const { error: setDefaultError } = await this.supabase
        .from('StripePaymentMethod')
        .update({ isDefault: true })
        .eq('stripePaymentMethodId', paymentMethodId)
        .eq('userUlid', userDbId.toString());

      if (setDefaultError) {
        return {
          data: null,
          error: {
            message: 'Failed to set default payment method',
            type: 'database',
          },
        };
      }

      return {
        data: { success: true },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      };
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
      // Get user's customer ID
      const { data: userData, error: userError } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (userError || !userData?.stripeCustomerId) {
        return {
          data: null,
          error: {
            message: 'User not found or no Stripe customer ID',
            type: 'database',
          },
        };
      }

      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId);

      // Delete from database
      const { error: deleteError } = await this.supabase
        .from('StripePaymentMethod')
        .delete()
        .eq('stripePaymentMethodId', paymentMethodId)
        .eq('userUlid', userDbId.toString());

      if (deleteError) {
        return {
          data: null,
          error: {
            message: 'Failed to delete payment method',
            type: 'database',
          },
        };
      }

      return {
        data: { success: true },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      };
    }
  }

  /**
   * List all payment methods for a user
   */
  async listPaymentMethods(userDbId: number) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (!user?.stripeCustomerId) {
        console.log('[LIST_PAYMENT_METHODS] No customer ID for user', { userDbId });
        return [];
      }

      // Fetch from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('[LIST_PAYMENT_METHODS_ERROR]', error);
      throw error;
    }
  }
}

/**
 * Initialize payment methods service
 */
export const stripePaymentMethodsServicePromise = StripePaymentMethodsService.init(); 