import { BaseWebhookHandler } from './base-webhook-handler';
import { WebhookHandler } from '@/lib/stripe/webhooks';
import { stripeService } from '@/lib/stripe';
import Stripe from 'stripe';

export class PaymentWebhookHandler extends BaseWebhookHandler {
  private webhookHandler: WebhookHandler;

  constructor() {
    const events = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
      'account.updated',
      'account.application.deauthorized',
      'payout.paid',
      'payout.failed',
      'setup_intent.succeeded',
      'setup_intent.canceled',
    ];
    super(events);
    this.webhookHandler = new WebhookHandler(stripeService);
  }

  protected async handleEvent(event: Stripe.Event) {
    return this.webhookHandler.handleEvent(event);
  }
} 