import Stripe from 'stripe';
import { BaseWebhookHandler } from './base-webhook-handler';
import { StripeDisputeService } from '@/lib/stripe/stripe-disputes';

export class DisputeWebhookHandler extends BaseWebhookHandler {
  private disputeService: StripeDisputeService;

  constructor() {
    const events = [
      'charge.dispute.created',
      'charge.dispute.updated',
      'charge.dispute.closed',
      'charge.refunded',
    ];
    super(events);
    this.disputeService = new StripeDisputeService();
  }

  protected async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'charge.dispute.created':
      case 'charge.dispute.updated': {
        const dispute = event.data.object as Stripe.Dispute;
        await this.disputeService.handleDisputeWebhook(dispute);
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        if (dispute.status === 'lost') {
          await this.disputeService.processRefund(dispute.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.handleRefundEvent(charge);
        break;
      }
    }

    return { success: true };
  }

  private async handleRefundEvent(charge: Stripe.Charge) {
    const refund = await this.stripe.refunds.retrieve(charge.refunds?.data[0]?.id || '');
    if (refund.payment_intent) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(refund.payment_intent as string);
      if (paymentIntent.metadata?.disputeId) {
        const dispute = await this.stripe.disputes.retrieve(paymentIntent.metadata.disputeId);
        await this.disputeService.handleDisputeWebhook(dispute);
      }
    }
  }
} 