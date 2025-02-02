import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentMethodService {
  private supabase;

  constructor() {
    const cookieStore = cookies();
    this.supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
        },
      }
    );
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
            userDbId,
            stripeSetupIntentId: setupIntent.id,
            status: setupIntent.status,
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