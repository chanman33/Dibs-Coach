import Stripe from 'stripe';
import { StripeService } from './index';
import { sendEmail } from '@/lib/email';

export type WebhookHandlerResponse = {
  success: boolean;
  message: string;
};

interface DatabaseUser {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface TransactionWithUsers {
  id: number;
  amount: number;
  currency: string;
  coachPayout: number;
  sessionDbId?: number;
  bundleDbId?: number;
  payer?: DatabaseUser;
  coach?: DatabaseUser;
}

type Database = {
  User: {
    id: number;
    email: string;
    userId: string;
    stripeConnectAccountId?: string;
  };
};

interface UserEmailResponse {
  email: string;
}

interface TransactionResponse {
  payer?: { email: string };
  coach?: { email: string };
}

interface UserResponse {
  email: string;
}

export class WebhookHandler {
  private stripeService: StripeService;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }

  async handleEvent(event: Stripe.Event): Promise<WebhookHandlerResponse> {
    try {
      console.log(`[WEBHOOK] Processing event: ${event.type}, id: ${event.id}`);

      // Validate event structure
      if (!this.validateEventStructure(event)) {
        throw new Error('Invalid event structure');
      }

      // Idempotency check
      const processed = await this.checkIdempotency(event.id);
      if (processed) {
        return { success: true, message: 'Event already processed' };
      }

      const result = await this.processEventWithRetry(event);
      
      // Mark event as processed
      await this.markEventProcessed(event.id);

      return result;
    } catch (error) {
      console.error('[WEBHOOK_ERROR]', {
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private validateEventStructure(event: Stripe.Event): boolean {
    return !!(
      event &&
      event.id &&
      event.type &&
      event.data?.object &&
      typeof event.data.object === 'object'
    );
  }

  private async checkIdempotency(eventId: string): Promise<boolean> {
    const { data } = await this.stripeService.supabase
      .from('ProcessedWebhooks')
      .select('id')
      .eq('eventId', eventId)
      .single();
    
    return !!data;
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    await this.stripeService.supabase
      .from('ProcessedWebhooks')
      .insert({
        eventId,
        processedAt: new Date().toISOString()
      });
  }

  private async processEventWithRetry(event: Stripe.Event): Promise<WebhookHandlerResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        switch (event.type) {
          // Payment Events
          case 'payment_intent.succeeded':
            await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.payment_failed':
            await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.canceled':
            await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
            break;

          // Account Events
          case 'account.updated':
            await this.handleAccountUpdated(event.data.object as Stripe.Account);
            break;
          case 'account.application.deauthorized':
            await this.handleAccountDeauthorized(event);
            break;

          // Payout Events
          case 'payout.paid':
            await this.handlePayoutPaid(event.data.object as Stripe.Payout);
            break;
          case 'payout.failed':
            await this.handlePayoutFailed(event.data.object as Stripe.Payout);
            break;

          // Dispute Events
          case 'charge.dispute.created':
            await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
            break;
          case 'charge.dispute.closed':
            await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
            break;

          // Refund Events
          case 'charge.refunded':
            await this.handleChargeRefunded(event.data.object as Stripe.Charge);
            break;
          case 'charge.refund.updated':
            await this.handleRefundUpdated(event.data.object as Stripe.Refund);
            break;

          default:
            console.warn(`[WEBHOOK] Unhandled event type: ${event.type}`);
        }
        
        return { success: true, message: 'Webhook processed successfully' };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[WEBHOOK_RETRY] Attempt ${attempt} failed:`, {
          eventId: event.id,
          eventType: event.type,
          error: lastError.message
        });
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Validate paymentIntent
    if (!this.validatePaymentIntent(paymentIntent)) {
      throw new Error('Invalid payment intent structure');
    }

    // Transaction update with error handling
    const { error: transactionError } = await this.stripeService.supabase
      .from('Transaction')
      .update({ status: 'completed' })
      .eq('stripePaymentIntentId', paymentIntent.id);

    if (transactionError) {
      console.error('[TRANSACTION_UPDATE_ERROR]', {
        paymentIntentId: paymentIntent.id,
        error: transactionError
      });
      throw transactionError;
    }

    // Get transaction with user details
    const transaction = await this.getTransactionWithUsers(paymentIntent.id);
    if (!transaction) return;

    // Update session payment status if this was a session payment
    if (paymentIntent.metadata.sessionDbId) {
      await this.stripeService.supabase
        .from('Session')
        .update({ paymentStatus: 'completed' })
        .eq('id', parseInt(paymentIntent.metadata.sessionDbId));

      // Update coach's earnings and balance
      const coachId = parseInt(paymentIntent.metadata.coachId);
      const coachPayout = parseFloat(paymentIntent.metadata.coachPayout || '0');
      
      await this.stripeService.supabase.rpc('update_coach_earnings', {
        p_coach_id: coachId,
        p_amount: coachPayout,
      });

      // Send confirmation emails
      await this.sendPaymentConfirmationEmails(transaction);
    }

    // Handle bundle payment if applicable
    if (paymentIntent.metadata.bundleDbId) {
      await this.stripeService.supabase
        .from('Bundle')
        .update({ 
          status: 'active',
          activatedAt: new Date().toISOString(),
        })
        .eq('id', parseInt(paymentIntent.metadata.bundleDbId));

      // Send bundle purchase confirmation emails
      await this.sendBundlePurchaseEmails(transaction);
    }
  }

  private validatePaymentIntent(paymentIntent: Stripe.PaymentIntent): boolean {
    return !!(
      paymentIntent &&
      paymentIntent.id &&
      paymentIntent.status &&
      paymentIntent.amount > 0
    );
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    await this.stripeService.supabase
      .from('Transaction')
      .update({ status: 'failed' })
      .eq('stripePaymentIntentId', paymentIntent.id);

    if (paymentIntent.metadata.sessionDbId) {
      await this.stripeService.supabase
        .from('Session')
        .update({ paymentStatus: 'failed' })
        .eq('id', parseInt(paymentIntent.metadata.sessionDbId));
    }

    if (paymentIntent.metadata.bundleDbId) {
      await this.stripeService.supabase
        .from('Bundle')
        .update({ status: 'payment_failed' })
        .eq('id', parseInt(paymentIntent.metadata.bundleDbId));
    }

    // Send payment failure notification
    const { data: transaction } = await this.stripeService.supabase
      .from('Transaction')
      .select('payer:payerDbId (email)')
      .eq('stripePaymentIntentId', paymentIntent.id)
      .single() as { data: TransactionResponse | null };

    if (transaction?.payer?.email) {
      await sendEmail({
        to: transaction.payer.email,
        subject: 'Payment Failed',
        template: 'payment-failed',
        data: {
          error: paymentIntent.last_payment_error?.message || 'Unknown error',
        },
      });
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    await this.stripeService.supabase
      .from('Transaction')
      .update({ status: 'canceled' })
      .eq('stripePaymentIntentId', paymentIntent.id);

    // Update related records
    if (paymentIntent.metadata.sessionDbId) {
      await this.stripeService.supabase
        .from('Session')
        .update({ paymentStatus: 'canceled' })
        .eq('id', parseInt(paymentIntent.metadata.sessionDbId));
    }
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    await this.stripeService.supabase
      .from('StripeConnectedAccount')
      .update({
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        requiresOnboarding: !account.details_submitted,
      })
      .eq('stripeAccountId', account.id);

    // Send notification if account becomes fully enabled
    if (account.payouts_enabled && account.charges_enabled) {
      const { data: user } = await this.stripeService.supabase
        .from('User')
        .select('email')
        .eq('stripeConnectAccountId', account.id)
        .single();

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: 'Your Coaching Account is Ready',
          template: 'account-enabled',
          data: {
            accountId: account.id,
          },
        });
      }
    }
  }

  private async handleAccountDeauthorized(event: Stripe.Event) {
    const application = event.data.object as Stripe.Application;
    
    await this.stripeService.supabase
      .from('StripeConnectedAccount')
      .update({
        payoutsEnabled: false,
        chargesEnabled: false,
        requiresOnboarding: true,
        deauthorizedAt: new Date().toISOString(),
      })
      .eq('stripeAccountId', application.id);

    // Send notification to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: 'Stripe Account Deauthorized',
      template: 'account-deauthorized',
      data: {
        accountId: application.id,
      },
    });
  }

  private async handlePayoutPaid(payout: Stripe.Payout) {
    await this.stripeService.supabase
      .from('Payout')
      .update({
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      .eq('stripePayoutId', payout.id);

    // Send payout notification
    const { data: user } = await this.stripeService.supabase
      .from('User')
      .select('email')
      .eq('stripeConnectAccountId', payout.destination as string)
      .single();

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Payout Completed',
        template: 'payout-completed',
        data: {
          amount: payout.amount / 100,
          currency: payout.currency.toUpperCase(),
          arrivalDate: new Date(payout.arrival_date * 1000).toLocaleDateString(),
        },
      });
    }
  }

  private async handlePayoutFailed(payout: Stripe.Payout) {
    await this.stripeService.supabase
      .from('Payout')
      .update({
        status: 'failed',
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
      })
      .eq('stripePayoutId', payout.id);

    // Send failure notification
    const { data: user } = await this.stripeService.supabase
      .from('User')
      .select('email')
      .eq('stripeConnectAccountId', payout.destination as string)
      .single();

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Payout Failed',
        template: 'payout-failed',
        data: {
          amount: payout.amount / 100,
          currency: payout.currency.toUpperCase(),
          reason: payout.failure_message,
        },
      });
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    const paymentIntent = dispute.payment_intent as string;
    
    await this.stripeService.supabase
      .from('Transaction')
      .update({ 
        status: 'disputed',
        metadata: {
          disputeId: dispute.id,
          disputeReason: dispute.reason,
          disputeAmount: dispute.amount,
          disputeStatus: dispute.status,
        }
      })
      .eq('stripePaymentIntentId', paymentIntent);

    // Send dispute notifications
    const { data: transaction } = await this.stripeService.supabase
      .from('Transaction')
      .select(`
        coach:coachDbId (email),
        payer:payerDbId (email)
      `)
      .eq('stripePaymentIntentId', paymentIntent)
      .single() as { data: TransactionResponse | null };

    if (transaction) {
      // Notify coach
      if (transaction.coach?.email) {
        await sendEmail({
          to: transaction.coach.email,
          subject: 'Payment Dispute Opened',
          template: 'dispute-opened-coach',
          data: {
            disputeId: dispute.id,
            amount: dispute.amount / 100,
            reason: dispute.reason,
          },
        });
      }

      // Notify admin
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: 'New Payment Dispute',
        template: 'dispute-opened-admin',
        data: {
          disputeId: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          paymentIntent,
        },
      });
    }
  }

  private async handleDisputeClosed(dispute: Stripe.Dispute) {
    const paymentIntent = dispute.payment_intent as string;
    
    await this.stripeService.supabase
      .from('Transaction')
      .update({ 
        status: dispute.status === 'won' ? 'completed' : 'refunded',
        metadata: {
          disputeId: dispute.id,
          disputeStatus: dispute.status,
          disputeClosedAt: new Date().toISOString(),
        }
      })
      .eq('stripePaymentIntentId', paymentIntent);

    // Send dispute resolution notifications
    const { data: transaction } = await this.stripeService.supabase
      .from('Transaction')
      .select(`
        coach:coachDbId (email),
        payer:payerDbId (email)
      `)
      .eq('stripePaymentIntentId', paymentIntent)
      .single() as { data: TransactionResponse | null };

    if (transaction) {
      const template = dispute.status === 'won' ? 'dispute-won' : 'dispute-lost';
      
      // Notify coach
      if (transaction.coach?.email) {
        await sendEmail({
          to: transaction.coach.email,
          subject: `Dispute ${dispute.status === 'won' ? 'Won' : 'Lost'}`,
          template: `${template}-coach`,
          data: {
            disputeId: dispute.id,
            amount: dispute.amount / 100,
          },
        });
      }

      // Notify client
      if (transaction.payer?.email) {
        await sendEmail({
          to: transaction.payer.email,
          subject: 'Dispute Resolution',
          template: `${template}-client`,
          data: {
            disputeId: dispute.id,
            amount: dispute.amount / 100,
          },
        });
      }
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntent = charge.payment_intent as string;
    
    await this.stripeService.supabase
      .from('Transaction')
      .update({ 
        status: 'refunded',
        metadata: {
          refundId: charge.refunds?.data[0]?.id,
          refundAmount: charge.amount_refunded,
          refundReason: charge.refunds?.data[0]?.reason,
        }
      })
      .eq('stripePaymentIntentId', paymentIntent);

    // Send refund notifications
    const { data: transaction } = await this.stripeService.supabase
      .from('Transaction')
      .select(`
        amount,
        currency,
        payer:payerDbId (email)
      `)
      .eq('stripePaymentIntentId', paymentIntent)
      .single() as { data: TransactionResponse & { amount: number; currency: string } | null };

    if (transaction?.payer?.email) {
      await sendEmail({
        to: transaction.payer.email,
        subject: 'Payment Refunded',
        template: 'refund-processed',
        data: {
          amount: charge.amount_refunded / 100,
          currency: transaction.currency,
          reason: charge.refunds?.data[0]?.reason || 'No reason provided',
        },
      });
    }
  }

  private async handleRefundUpdated(refund: Stripe.Refund) {
    if (refund.status === 'failed') {
      // Handle failed refund
      const { data: transaction } = await this.stripeService.supabase
        .from('Transaction')
        .select(`
          payer:payerDbId (email)
        `)
        .eq('stripePaymentIntentId', refund.payment_intent)
        .single() as { data: TransactionResponse | null };

      if (transaction?.payer?.email) {
        await sendEmail({
          to: transaction.payer.email,
          subject: 'Refund Failed',
          template: 'refund-failed',
          data: {
            amount: refund.amount / 100,
            reason: refund.failure_reason || 'Unknown error',
          },
        });
      }
    }
  }

  private async sendPaymentConfirmationEmails(transaction: TransactionWithUsers) {
    // Send confirmation to client
    if (transaction.payer?.email) {
      await sendEmail({
        to: transaction.payer.email,
        subject: 'Payment Confirmation',
        template: 'payment-confirmation-client',
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          coachName: transaction.coach 
            ? `${transaction.coach.firstName || ''} ${transaction.coach.lastName || ''}`.trim()
            : 'your coach',
          sessionId: transaction.sessionDbId,
        },
      });
    }

    // Send notification to coach
    if (transaction.coach?.email) {
      await sendEmail({
        to: transaction.coach.email,
        subject: 'New Session Payment Received',
        template: 'payment-confirmation-coach',
        data: {
          amount: transaction.coachPayout,
          currency: transaction.currency,
          clientName: transaction.payer
            ? `${transaction.payer.firstName || ''} ${transaction.payer.lastName || ''}`.trim()
            : 'a client',
          sessionId: transaction.sessionDbId,
        },
      });
    }
  }

  private async sendBundlePurchaseEmails(transaction: TransactionWithUsers) {
    // Send confirmation to client
    if (transaction.payer?.email) {
      await sendEmail({
        to: transaction.payer.email,
        subject: 'Bundle Purchase Confirmation',
        template: 'bundle-confirmation-client',
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          coachName: transaction.coach
            ? `${transaction.coach.firstName || ''} ${transaction.coach.lastName || ''}`.trim()
            : 'your coach',
          bundleId: transaction.bundleDbId,
        },
      });
    }

    // Send notification to coach
    if (transaction.coach?.email) {
      await sendEmail({
        to: transaction.coach.email,
        subject: 'New Bundle Purchase',
        template: 'bundle-confirmation-coach',
        data: {
          amount: transaction.coachPayout,
          currency: transaction.currency,
          clientName: transaction.payer
            ? `${transaction.payer.firstName || ''} ${transaction.payer.lastName || ''}`.trim()
            : 'a client',
          bundleId: transaction.bundleDbId,
        },
      });
    }
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    const { data } = await this.stripeService.supabase
      .from('User')
      .select('email')
      .eq('id', userId)
      .single() as { data: UserResponse | null };

    return data?.email || null;
  }

  private async getConnectedAccountEmail(accountId: string): Promise<string | null> {
    const { data } = await this.stripeService.supabase
      .from('User')
      .select('email')
      .eq('stripeConnectAccountId', accountId)
      .single() as { data: UserResponse | null };

    return data?.email || null;
  }

  private async getTransactionWithUsers(paymentIntentId: string): Promise<TransactionWithUsers | null> {
    const { data } = await this.stripeService.supabase
      .from('Transaction')
      .select(`
        id,
        amount,
        currency,
        coachPayout,
        sessionDbId,
        bundleDbId,
        payer:User!Transaction_payerDbId_fkey (
          email,
          firstName,
          lastName
        ),
        coach:User!Transaction_coachDbId_fkey (
          email,
          firstName,
          lastName
        )
      `)
      .eq('stripePaymentIntentId', paymentIntentId)
      .single();

    return data as TransactionWithUsers | null;
  }
} 