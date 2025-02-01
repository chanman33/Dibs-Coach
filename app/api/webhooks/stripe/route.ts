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

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_ERROR]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 400 }
    );
  }

  if (relevantEvents.has(event.type)) {
    try {
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

  return new NextResponse(null, { status: 200 });
} 