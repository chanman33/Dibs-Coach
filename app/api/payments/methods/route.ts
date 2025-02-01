import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StripeService } from '@/lib/stripe';

const stripeService = new StripeService();

// Get all payment methods
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's database ID
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get payment methods from database
    const { data: paymentMethods } = await stripeService.supabase
      .from('PaymentMethod')
      .select('*')
      .eq('userDbId', user.id)
      .order('isDefault', { ascending: false });

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error('[PAYMENT_METHODS_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Create setup intent for adding a new payment method
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's database ID
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Create setup intent
    const setupIntent = await stripeService.createSetupIntent(user.id);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('[SETUP_INTENT_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 