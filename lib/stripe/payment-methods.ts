import { createAuthClient } from '@/utils/auth/auth-client';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentMethodService {
  private supabase;

  constructor() {
    // Use the cookie-free Supabase client - no need for cookies with Clerk auth
    this.supabase = createAuthClient();
  }

  async createSetupIntent(userDbId: number, paymentMethodTypes: string[]) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      const setupIntent = await stripe.setupIntents.create({
        customer: user?.stripeCustomerId!,
        payment_method_types: paymentMethodTypes,
        usage: 'off_session',
      });

      await this.supabase
        .from('SetupIntent')
        .insert([
          {
            userUlid: userDbId.toString(),
            stripeSetupIntentId: setupIntent.id,
            status: setupIntent.status,
            ulid: randomUUID(),
            updatedAt: new Date().toISOString(),
          },
        ]);

      return setupIntent;
    } catch (error) {
      console.error('[SETUP_INTENT_ERROR]', error);
      throw error;
    }
  }

  async listPaymentMethods(userDbId: number) {
    try {
      const { data: user } = await this.supabase
        .from('User')
        .select('stripeCustomerId')
        .eq('id', userDbId)
        .single();

      if (!user?.stripeCustomerId) return [];

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const achPaymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'us_bank_account',
      });

      return [...paymentMethods.data, ...achPaymentMethods.data];
    } catch (error) {
      console.error('[PAYMENT_METHODS_ERROR]', error);
      throw error;
    }
  }
}

export const paymentMethodService = new PaymentMethodService(); 