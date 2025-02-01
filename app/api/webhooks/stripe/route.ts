import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { StripeService } from '@/lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripeService = new StripeService();

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[WEBHOOK_ERROR] Invalid signature:', err);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Handle the event
    try {
      await stripeService.handleWebhookEvent(event);
      return new NextResponse('Webhook processed', { status: 200 });
    } catch (error) {
      console.error('[WEBHOOK_ERROR] Processing failed:', error);
      return new NextResponse('Webhook processing failed', { status: 500 });
    }
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 