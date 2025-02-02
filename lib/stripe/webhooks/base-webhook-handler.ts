import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { env } from '@/env.mjs';

export abstract class BaseWebhookHandler {
  protected stripe: Stripe;
  protected relevantEvents: Set<string>;

  constructor(events: string[]) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    this.relevantEvents = new Set(events);
  }

  protected abstract handleEvent(event: Stripe.Event): Promise<any>;

  async processWebhook(request: Request): Promise<NextResponse> {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE_WEBHOOK_ERROR] Missing signature');
      return new NextResponse('Missing signature', { status: 400 });
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      if (!this.relevantEvents.has(event.type)) {
        return new NextResponse(null, { status: 200 });
      }

      const result = await this.handleEvent(event);
      return NextResponse.json(result);

    } catch (error) {
      console.error('[STRIPE_WEBHOOK_ERROR]', error);
      return new NextResponse(
        error instanceof Error ? error.message : 'Unknown error',
        { status: 500 }
      );
    }
  }
} 