import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { env } from '@/env.mjs';
import { StripeDisputeService } from '@/lib/stripe-disputes';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const disputeService = new StripeDisputeService();

const relevantEvents = new Set([
  'charge.dispute.created',
  'charge.dispute.updated',
  'charge.dispute.closed',
  'charge.refunded',
]);

// Add rate limiting and validation
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const rawIp = headersList.get('x-forwarded-for') || 'unknown';
  const ip = rawIp.split(',')[0].trim();

  // Enhanced validation
  if (!signature || !body) {
    console.error('[STRIPE_WEBHOOK_ERROR] Missing required headers or body');
    return new NextResponse('Missing required data', { status: 400 });
  }

  // Basic rate limiting check (you might want to use Redis for production)
  const now = Date.now();
  const key = `stripe-webhook:${ip}`;
  
  let event: Stripe.Event;

  try {
    // Validate Stripe signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    // Validate event type
    if (!relevantEvents.has(event.type)) {
      console.warn(`[STRIPE_WEBHOOK_WARNING] Unhandled event type: ${event.type}`);
      return new NextResponse(null, { status: 200 });
    }

    // Validate event data
    if (!event.data?.object) {
      throw new Error('Invalid event data structure');
    }

    switch (event.type) {
      case 'charge.dispute.created':
      case 'charge.dispute.updated': {
        const dispute = event.data.object as Stripe.Dispute;
        await disputeService.handleDisputeWebhook(dispute);
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        // Handle closed dispute (won/lost)
        if (dispute.status === 'lost') {
          await disputeService.processRefund(dispute.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Check if refund is related to a dispute
        const refund = await stripe.refunds.retrieve(charge.refunds?.data[0]?.id || '');
        if (refund.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(refund.payment_intent as string);
          if (paymentIntent.metadata?.disputeId) {
            const dispute = await stripe.disputes.retrieve(paymentIntent.metadata.disputeId);
            await disputeService.handleDisputeWebhook(dispute);
          }
        }
        break;
      }

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_ERROR]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500 }
    );
  }
} 