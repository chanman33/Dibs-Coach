import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import Stripe from 'stripe'
import { env } from '@/env.mjs'

// Types
export interface DisputeError {
  message: string
  code?: string
  type: 'validation' | 'stripe' | 'database'
}

export interface DisputeResponse<T> {
  data: T | null
  error: DisputeError | null
}

export interface DisputeEvidence {
  customerName?: string
  customerEmailAddress?: string
  billingAddress?: string
  serviceDate?: string
  productDescription?: string
  customerSignature?: string
  customerPurchaseIp?: string
  customerCommunication?: string
  uncategorizedText?: string
}

export interface DisputeDetails {
  id: string
  amount: number
  currency: string
  status: string
  reason: string
  evidence?: DisputeEvidence
  evidenceDueBy: string
  created: string
  sessionId: string
  paymentIntentId: string
}

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export class StripeDisputeService {
  private async getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value ?? ''
          },
          set(name: string, value: string) {
            cookieStore.set(name, value, {
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          remove(name: string) {
            cookieStore.set(name, '', {
              path: '/',
              maxAge: 0
            })
          },
        },
      }
    )
  }

  /**
   * Handle a new dispute webhook event
   */
  async handleDisputeWebhook(
    dispute: Stripe.Dispute
  ): Promise<DisputeResponse<{ success: boolean }>> {
    try {
      const supabase = await this.getSupabase()

      // Get session details from payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(
        dispute.payment_intent as string
      )
      const sessionId = paymentIntent.metadata?.sessionId

      if (!sessionId) {
        return {
          data: null,
          error: {
            message: 'Session ID not found in payment intent metadata',
            type: 'validation',
          },
        }
      }

      // Save dispute to database
      const { error: saveError } = await supabase.from('Dispute').insert({
        stripeDisputeId: dispute.id,
        sessionId: sessionId,
        amount: dispute.amount,
        currency: dispute.currency,
        status: dispute.status,
        reason: dispute.reason,
        evidenceDueBy: dispute.evidence_details?.due_by 
          ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
          : new Date().toISOString(),
        evidence: this.formatEvidence(dispute.evidence),
        stripePaymentIntentId: dispute.payment_intent as string,
        createdAt: new Date(dispute.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      })

      if (saveError) {
        return {
          data: null,
          error: {
            message: 'Failed to save dispute',
            type: 'database',
          },
        }
      }

      // Update session status
      const { error: updateError } = await supabase
        .from('Session')
        .update({
          status: 'DISPUTED',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update session status',
            type: 'database',
          },
        }
      }

      return {
        data: { success: true },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  private formatEvidence(evidence: Stripe.Dispute.Evidence | null): DisputeEvidence {
    if (!evidence) return {}
    return {
      customerName: typeof evidence.customer_name === 'string' ? evidence.customer_name : undefined,
      customerEmailAddress: typeof evidence.customer_email_address === 'string' ? evidence.customer_email_address : undefined,
      billingAddress: typeof evidence.billing_address === 'string' ? evidence.billing_address : undefined,
      serviceDate: typeof evidence.service_date === 'string' ? evidence.service_date : undefined,
      productDescription: typeof evidence.product_description === 'string' ? evidence.product_description : undefined,
      customerSignature: typeof evidence.customer_signature === 'string' ? evidence.customer_signature : undefined,
      customerPurchaseIp: typeof evidence.customer_purchase_ip === 'string' ? evidence.customer_purchase_ip : undefined,
      customerCommunication: typeof evidence.customer_communication === 'string' ? evidence.customer_communication : undefined,
      uncategorizedText: typeof evidence.uncategorized_text === 'string' ? evidence.uncategorized_text : undefined,
    }
  }

  private formatStripeEvidence(evidence: DisputeEvidence): Stripe.DisputeUpdateParams.Evidence {
    return {
      customer_name: evidence.customerName,
      customer_email_address: evidence.customerEmailAddress,
      billing_address: evidence.billingAddress,
      service_date: evidence.serviceDate,
      product_description: evidence.productDescription,
      customer_signature: evidence.customerSignature,
      customer_purchase_ip: evidence.customerPurchaseIp,
      customer_communication: evidence.customerCommunication,
      uncategorized_text: evidence.uncategorizedText,
    }
  }

  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(
    disputeId: string,
    evidence: DisputeEvidence
  ): Promise<DisputeResponse<DisputeDetails>> {
    try {
      const supabase = await this.getSupabase()

      // Submit evidence to Stripe
      const stripeEvidence = this.formatStripeEvidence(evidence)
      const updatedDispute = await stripe.disputes.update(disputeId, {
        evidence: stripeEvidence,
      })

      // Update dispute in database
      const { error: updateError } = await supabase
        .from('Dispute')
        .update({
          evidence: evidence,
          status: updatedDispute.status,
          updatedAt: new Date().toISOString(),
        })
        .eq('stripeDisputeId', disputeId)

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update dispute evidence',
            type: 'database',
          },
        }
      }

      return {
        data: {
          id: updatedDispute.id,
          amount: updatedDispute.amount,
          currency: updatedDispute.currency,
          status: updatedDispute.status,
          reason: updatedDispute.reason,
          evidence: evidence,
          evidenceDueBy: updatedDispute.evidence_details?.due_by 
            ? new Date(updatedDispute.evidence_details.due_by * 1000).toISOString()
            : new Date().toISOString(),
          created: new Date(updatedDispute.created * 1000).toISOString(),
          sessionId: updatedDispute.metadata?.sessionId || '',
          paymentIntentId: updatedDispute.payment_intent as string,
        },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string): Promise<DisputeResponse<DisputeDetails>> {
    try {
      const dispute = await stripe.disputes.retrieve(disputeId)

      return {
        data: {
          id: dispute.id,
          amount: dispute.amount,
          currency: dispute.currency,
          status: dispute.status,
          reason: dispute.reason,
          evidence: this.formatEvidence(dispute.evidence),
          evidenceDueBy: dispute.evidence_details?.due_by 
            ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
            : new Date().toISOString(),
          created: new Date(dispute.created * 1000).toISOString(),
          sessionId: dispute.metadata?.sessionId || '',
          paymentIntentId: dispute.payment_intent as string,
        },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Get all disputes for a session
   */
  async getDisputesBySession(
    sessionId: string
  ): Promise<DisputeResponse<DisputeDetails[]>> {
    try {
      const supabase = await this.getSupabase()

      const { data: disputes, error } = await supabase
        .from('Dispute')
        .select('*')
        .eq('sessionId', sessionId)

      if (error) {
        return {
          data: null,
          error: {
            message: 'Failed to fetch disputes',
            type: 'database',
          },
        }
      }

      const disputeDetails = await Promise.all(
        disputes.map(async (dispute) => {
          const stripeDispute = await stripe.disputes.retrieve(
            dispute.stripeDisputeId
          )
          return {
            id: stripeDispute.id,
            amount: stripeDispute.amount,
            currency: stripeDispute.currency,
            status: stripeDispute.status,
            reason: stripeDispute.reason,
            evidence: this.formatEvidence(stripeDispute.evidence),
            evidenceDueBy: stripeDispute.evidence_details?.due_by 
              ? new Date(stripeDispute.evidence_details.due_by * 1000).toISOString()
              : new Date().toISOString(),
            created: new Date(stripeDispute.created * 1000).toISOString(),
            sessionId: dispute.sessionId,
            paymentIntentId: stripeDispute.payment_intent as string,
          }
        })
      )

      return {
        data: disputeDetails,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }

  /**
   * Process a refund for a dispute
   */
  async processRefund(
    disputeId: string,
    amount?: number
  ): Promise<DisputeResponse<{ success: boolean }>> {
    try {
      const dispute = await stripe.disputes.retrieve(disputeId)
      const paymentIntent = await stripe.paymentIntents.retrieve(
        dispute.payment_intent as string
      )

      // Create refund
      await stripe.refunds.create({
        payment_intent: dispute.payment_intent as string,
        amount: amount || dispute.amount,
        reason: 'requested_by_customer',
      })

      const supabase = await this.getSupabase()

      // Update dispute status in database
      const { error: updateError } = await supabase
        .from('Dispute')
        .update({
          status: 'refunded',
          updatedAt: new Date().toISOString(),
        })
        .eq('stripeDisputeId', disputeId)

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update dispute status',
            type: 'database',
          },
        }
      }

      // Update session status
      const { error: sessionError } = await supabase
        .from('Session')
        .update({
          status: 'REFUNDED',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', paymentIntent.metadata?.sessionId)

      if (sessionError) {
        return {
          data: null,
          error: {
            message: 'Failed to update session status',
            type: 'database',
          },
        }
      }

      return {
        data: { success: true },
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'stripe',
        },
      }
    }
  }
} 