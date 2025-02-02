import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { feeCalculator } from './fees';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use latest stable version
  typescript: true,
});

// Custom error types
export interface StripeServiceError extends Error {
  code?: string;
  type?: string;
  status?: number;
}

// Database types
type Database = {
  Session: {
    id: number;
    coachDbId: number;
    menteeDbId: number;
    status: string;
    startTime: string;
    priceAmount: number;
    currency: string;
    platformFeeAmount: number;
    coachPayoutAmount: number;
    stripePaymentIntentId: string | null;
    paymentStatus: string;
  };
  User: {
    id: number;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    stripeConnectAccountId: string | null;
    stripeCustomerId: string | null;
  };
  Transaction: {
    id: number;
    type: string;
    status: string;
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    platformFee: number;
    coachPayout: number;
    sessionDbId: number | null;
    payerDbId: number;
    coachDbId: number;
    metadata: Record<string, any>;
    createdAt: string;
  };
  StripeConnectedAccount: {
    id: number;
    userDbId: number;
    stripeAccountId: string;
    country: string;
    defaultCurrency: string;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    requiresOnboarding: boolean;
    deauthorizedAt: string | null;
  };
  PaymentMethod: {
    id: number;
    userDbId: number;
    stripePaymentMethodId: string;
    isDefault: boolean;
    type: string;
    metadata: Record<string, any>;
    createdAt: string;
  };
  SetupIntent: {
    id: number;
    userDbId: number;
    stripeSetupIntentId: string;
    status: string;
    createdAt: string;
  };
};

interface SessionWithCoach {
  id: number;
  priceAmount: number;
  priceInCents?: number;
  currency: string;
  coachDbId: number;
  startTime: Date;
  coach: {
    stripeConnectAccountId?: string | null;
  };
  // ... other fields ...
}

interface UserData {
  id: number;
  userId: string;
  email: string;
  role: string;
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
}

interface SessionQueryResult {
  id: number;
  coachDbId: number;
  coach: {
    stripeConnectAccountId: string | null;
  };
}

interface PaymentMethodRequirements {
  allowedTypes: ('card' | 'us_bank_account')[];
  preferredType: 'card' | 'us_bank_account';
}

interface SessionPaymentConfig {
  amount: number;
  currency: string;
  sessionDbId: number;
  coachId: number;
  clientId: number;
  connectedAccountId: string;
  sessionStartTime: string;
}

interface CreateSessionPaymentIntentParams {
  amount: number;
  currency: string;
  sessionDbId: number;
  coachId: number;
  clientId: number;
  connectedAccountId?: string | null;
  sessionStartTime: string;
}

/**
 * Core Stripe service for handling marketplace payments
 */
export class StripeService {
  private stripe: Stripe;
  public supabase!: ReturnType<typeof createServerClient<Database>>;

  constructor() {
    this.stripe = stripe;
    this.initSupabase();
  }

  private async initSupabase() {
    const cookieStore = await cookies();
    this.supabase = createServerClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set(name: string, value: string, options: any) {
            // Server components can't set cookies
            return;
          },
          remove(name: string, options: any) {
            // Server components can't remove cookies
            return;
          },
        },
      }
    );
  }

  /**
   * Get session data with coach info
   */
  async getSessionWithCoach(sessionId: number): Promise<SessionWithCoach | null> {
    try {
      const { data, error } = await this.supabase
        .from('Session')
        .select(`
          id,
          priceAmount,
          currency,
          startTime,
          coachDbId,
          coach:User!Session_coachDbId_fkey (
            stripeConnectAccountId
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw this.createError('Failed to fetch session', error);
      if (!data) return null;

      const result = data as unknown as {
        id: number;
        priceAmount: number;
        currency: string;
        startTime: string;
        coachDbId: number;
        coach: {
          stripeConnectAccountId?: string | null;
        };
      };

      // Transform the data to match the SessionWithCoach type
      return {
        id: result.id,
        priceAmount: result.priceAmount,
        currency: result.currency,
        startTime: new Date(result.startTime),
        coachDbId: result.coachDbId,
        coach: {
          stripeConnectAccountId: result.coach?.stripeConnectAccountId || '',
        },
      };
    } catch (error) {
      console.error('[STRIPE_ERROR] Get session failed:', error);
      throw this.createError('Failed to fetch session', error);
    }
  }

  /**
   * Get user data by Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<UserData | null> {
    try {
      const { data, error } = await this.supabase
        .from('User')
        .select('id, userId, email, role, stripeCustomerId, stripeConnectAccountId')
        .eq('userId', clerkId)
        .single();

      if (error) throw this.createError('Failed to fetch user', error);
      return data as UserData;
    } catch (error) {
      console.error('[STRIPE_ERROR] Get user failed:', error);
      throw this.createError('Failed to fetch user', error);
    }
  }

  /**
   * Create a Stripe Connect account for a coach
   */
  async createConnectedAccount(userDbId: number, country: string) {
    try {
      // Create the connected account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      // Store the account details in our database
      const { data, error } = await this.supabase
        .from('StripeConnectedAccount')
        .insert([
          {
            userDbId,
            stripeAccountId: account.id,
            country,
            defaultCurrency: 'USD',
            payoutsEnabled: false,
            detailsSubmitted: false,
            chargesEnabled: false,
            requiresOnboarding: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update the user record with the connect account ID
      await this.supabase
        .from('User')
        .update({ stripeConnectAccountId: account.id })
        .eq('id', userDbId);

      return { account, dbRecord: data };
    } catch (error) {
      console.error('[STRIPE_ERROR] Create connected account failed:', error);
      throw error;
    }
  }

  /**
   * Create an onboarding link for a coach's Stripe Connect account
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('[STRIPE_ERROR] Create account link failed:', error);
      throw error;
    }
  }

  private determinePaymentMethodRequirements(sessionStartTime: string): PaymentMethodRequirements {
    const now = new Date();
    const sessionStart = new Date(sessionStartTime);
    const daysUntilSession = Math.ceil((sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // If session is more than a week away, allow both methods but prefer ACH
    if (daysUntilSession >= 7) {
      return {
        allowedTypes: ['card', 'us_bank_account'],
        preferredType: 'us_bank_account'
      };
    }

    // If less than a week away, only allow card payments
    return {
      allowedTypes: ['card'],
      preferredType: 'card'
    };
  }

  async createSessionPaymentIntent(config: SessionPaymentConfig) {
    try {
      this.validateAmount(config.amount);
      
      // Calculate fees
      const fees = feeCalculator.calculateFees(config.amount);
      
      // Determine allowed payment methods
      const paymentMethods = this.determinePaymentMethodRequirements(config.sessionStartTime);

      // Create the payment intent with application fee
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(config.amount * 100),
        currency: config.currency,
        application_fee_amount: Math.round(fees.totalPlatformFee * 100),
        transfer_data: {
          destination: config.connectedAccountId,
        },
        payment_method_types: paymentMethods.allowedTypes,
        payment_method_options: {
          us_bank_account: {
            financial_connections: {
              permissions: ['payment_method']
            }
          }
        },
        metadata: {
          sessionDbId: config.sessionDbId.toString(),
          coachId: config.coachId.toString(),
          clientId: config.clientId.toString(),
          type: 'session_payment',
          coachFeeAmount: fees.coachFeeAmount.toString(),
          agentFeeAmount: fees.agentFeeAmount.toString(),
          stripeFee: fees.stripeFee.toString(),
        },
      });

      // Store the payment intent and fee details in our database
      const { data, error } = await this.supabase
        .from('Transaction')
        .insert([
          {
            type: 'session_payment',
            status: 'pending',
            amount: config.amount,
            currency: config.currency,
            stripePaymentIntentId: paymentIntent.id,
            platformFee: fees.totalPlatformFee,
            coachPayout: fees.coachPayout,
            sessionDbId: config.sessionDbId,
            payerDbId: config.clientId,
            coachDbId: config.coachId,
            metadata: {
              coachFeeAmount: fees.coachFeeAmount,
              agentFeeAmount: fees.agentFeeAmount,
              stripeFee: fees.stripeFee,
              feeBreakdown: feeCalculator.getFeeBreakdown(config.amount),
              paymentMethodTypes: paymentMethods.allowedTypes,
              preferredType: paymentMethods.preferredType
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update session with payment details
      await this.supabase
        .from('Session')
        .update({
          priceAmount: config.amount,
          currency: config.currency,
          platformFeeAmount: fees.totalPlatformFee,
          coachPayoutAmount: fees.coachPayout,
          stripePaymentIntentId: paymentIntent.id,
        })
        .eq('id', config.sessionDbId);

      return { paymentIntent, transaction: data };
    } catch (error) {
      console.error('[STRIPE_ERROR] Create payment intent failed:', error);
      throw this.createError('Failed to create payment intent', error);
    }
  }

  /**
   * Retrieve account balance for a connected account
   */
  async getConnectedAccountBalance(accountId: string) {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });

      return balance;
    } catch (error) {
      console.error('[STRIPE_ERROR] Get account balance failed:', error);
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      // Update the transaction status
      if (refund.status === 'succeeded') {
        await this.supabase
          .from('Transaction')
          .update({ status: 'refunded' })
          .eq('stripePaymentIntentId', paymentIntentId);
      }

      return refund;
    } catch (error) {
      console.error('[STRIPE_ERROR] Create refund failed:', error);
      throw error;
    }
  }

  /**
   * Handle various Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;
        // Add more event handlers as needed
      }
    } catch (error) {
      console.error(`[STRIPE_ERROR] Webhook ${event.type} handling failed:`, error);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Update transaction status
    await this.supabase
      .from('Transaction')
      .update({ status: 'completed' })
      .eq('stripePaymentIntentId', paymentIntent.id);

    // Update session payment status if this was a session payment
    if (paymentIntent.metadata.sessionDbId) {
      await this.supabase
        .from('Session')
        .update({ paymentStatus: 'completed' })
        .eq('id', parseInt(paymentIntent.metadata.sessionDbId));

      // Update coach's earnings and balance
      const coachId = parseInt(paymentIntent.metadata.coachId);
      const coachPayout = parseFloat(paymentIntent.metadata.coachPayout || '0');
      
      await this.supabase.rpc('update_coach_earnings', {
        p_coach_id: coachId,
        p_amount: coachPayout,
      });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    await this.supabase
      .from('Transaction')
      .update({ status: 'failed' })
      .eq('stripePaymentIntentId', paymentIntent.id);
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    // Update connected account status
    await this.supabase
      .from('StripeConnectedAccount')
      .update({
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        requiresOnboarding: !account.details_submitted,
      })
      .eq('stripeAccountId', account.id);
  }

  /**
   * Create a setup intent for adding a payment method
   */
  async createSetupIntent(userDbId: number) {
    try {
      // Create the setup intent
      const setupIntent = await this.stripe.setupIntents.create({
        usage: 'off_session', // Allow using the payment method for future payments
      });

      // Store the setup intent in our database
      await this.supabase
        .from('SetupIntent')
        .insert([
          {
            userDbId,
            stripeSetupIntentId: setupIntent.id,
            status: setupIntent.status,
            createdAt: new Date().toISOString(),
          },
        ]);

      return setupIntent;
    } catch (error) {
      console.error('[STRIPE_ERROR] Create setup intent failed:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userDbId: number) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (!user?.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('[STRIPE_ERROR] Get payment methods failed:', error);
      throw error;
    }
  }

  /**
   * Get default payment method for a user
   */
  async getDefaultPaymentMethod(userDbId: number) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (!user?.stripeCustomerId) {
        return null;
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const defaultMethod = paymentMethods.data.find(method => method.card);
      if (!defaultMethod?.card) return null;

      return {
        brand: defaultMethod.card.brand,
        last4: defaultMethod.card.last4,
      };
    } catch (error) {
      console.error('[STRIPE_ERROR] Get default payment method failed:', error);
      throw error;
    }
  }

  /**
   * Set default payment method for a user
   */
  async setDefaultPaymentMethod(userDbId: number, paymentMethodId: string) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (!user?.stripeCustomerId) {
        throw new Error('User has no Stripe customer ID');
      }

      await this.stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update our database
      await this.supabase
        .from('PaymentMethod')
        .update({ isDefault: false })
        .eq('userDbId', userDbId);

      await this.supabase
        .from('PaymentMethod')
        .update({ isDefault: true })
        .eq('stripePaymentMethodId', paymentMethodId);

      return true;
    } catch (error) {
      console.error('[STRIPE_ERROR] Set default payment method failed:', error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userDbId: number, paymentMethodId: string) {
    try {
      // Delete from Stripe
      await this.stripe.paymentMethods.detach(paymentMethodId);

      // Delete from our database
      await this.supabase
        .from('PaymentMethod')
        .delete()
        .eq('stripePaymentMethodId', paymentMethodId)
        .eq('userDbId', userDbId);

      return true;
    } catch (error) {
      console.error('[STRIPE_ERROR] Delete payment method failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to create consistent error objects
   */
  private createError(message: string, originalError: any): StripeServiceError {
    const error = new Error(message) as StripeServiceError;
    if (originalError instanceof Stripe.errors.StripeError) {
      error.code = originalError.code;
      error.type = originalError.type;
      error.status = originalError.statusCode;
    } else if (originalError?.code) {
      error.code = originalError.code;
      error.status = originalError?.status || 500;
    }
    return error;
  }

  /**
   * Helper method to validate amounts
   */
  private validateAmount(amount: number): void {
    if (isNaN(amount) || amount <= 0) {
      throw this.createError('Invalid amount', { code: 'invalid_amount', status: 400 });
    }
  }

  /**
   * Helper method to validate IDs
   */
  private validateId(id: number | string): void {
    if (!id) {
      throw this.createError('Invalid ID', { code: 'invalid_id', status: 400 });
    }
  }

  /**
   * Schedule a payout for a coach
   */
  async scheduleCoachPayout(coachDbId: number, amount: number, currency: string = 'usd') {
    try {
      const { data: coach } = await this.supabase
        .from('User')
        .select('stripeConnectAccountId')
        .eq('id', coachDbId)
        .single();

      if (!coach?.stripeConnectAccountId) {
        throw new Error('Coach has no connected Stripe account');
      }

      // Create a transfer to the connected account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency,
        destination: coach.stripeConnectAccountId,
        transfer_group: `payout_${new Date().toISOString()}`,
      });

      // Record the payout in our database
      const { data, error } = await this.supabase
        .from('Transaction')
        .insert([
          {
            type: 'payout',
            status: 'completed',
            amount,
            currency,
            stripeTransferId: transfer.id,
            coachDbId,
            metadata: {
              transferGroup: transfer.transfer_group,
              payoutType: 'scheduled'
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { transfer, transaction: data };
    } catch (error) {
      console.error('[STRIPE_ERROR] Schedule coach payout failed:', error);
      throw this.createError('Failed to schedule coach payout', error);
    }
  }

  /**
   * Request early payout for a coach (with fee)
   */
  async requestEarlyPayout(coachDbId: number, amount: number, currency: string = 'usd') {
    try {
      const earlyPayoutFeePercentage = 0.015; // 1.5% fee for early payouts
      const feeAmount = amount * earlyPayoutFeePercentage;
      const payoutAmount = amount - feeAmount;

      const { data: coach } = await this.supabase
        .from('User')
        .select('stripeConnectAccountId')
        .eq('id', coachDbId)
        .single();

      if (!coach?.stripeConnectAccountId) {
        throw new Error('Coach has no connected Stripe account');
      }

      // Create a transfer with the fee deducted
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(payoutAmount * 100),
        currency,
        destination: coach.stripeConnectAccountId,
        transfer_group: `early_payout_${new Date().toISOString()}`,
      });

      // Record the payout with fee details
      const { data, error } = await this.supabase
        .from('Transaction')
        .insert([
          {
            type: 'payout',
            status: 'completed',
            amount: payoutAmount,
            currency,
            stripeTransferId: transfer.id,
            coachDbId,
            metadata: {
              transferGroup: transfer.transfer_group,
              payoutType: 'early',
              originalAmount: amount,
              feeAmount,
              feePercentage: earlyPayoutFeePercentage
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { transfer, transaction: data };
    } catch (error) {
      console.error('[STRIPE_ERROR] Request early payout failed:', error);
      throw this.createError('Failed to process early payout', error);
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService(); 