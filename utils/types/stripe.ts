import { z } from 'zod';

/**
 * Payment status types
 */
export const PaymentStatusEnum = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

/**
 * Transaction types
 */
export const TransactionTypeEnum = z.enum([
  'subscription_payment',
  'session_payment',
]);

export type TransactionType = z.infer<typeof TransactionTypeEnum>;

/**
 * Payment method types
 */
export const PaymentMethodTypeEnum = z.enum([
  'card',
  'bank_debit',
  'bank_transfer',
]);

export type PaymentMethodType = z.infer<typeof PaymentMethodTypeEnum>;

/**
 * Payout schedule types
 */
export const PayoutScheduleEnum = z.enum([
  'instant',
  'daily',
  'weekly',
  'monthly',
]);

export type PayoutSchedule = z.infer<typeof PayoutScheduleEnum>;

/**
 * Payout status types
 */
export const PayoutStatusEnum = z.enum([
  'pending',
  'in_transit',
  'paid',
  'failed',
  'canceled',
]);

export type PayoutStatus = z.infer<typeof PayoutStatusEnum>;

/**
 * Business type options
 */
export const BusinessTypeEnum = z.enum([
  'individual',
  'company',
  'non_profit',
]);

export type BusinessType = z.infer<typeof BusinessTypeEnum>;

/**
 * Session payment schema
 */
export const SessionPaymentSchema = z.object({
  sessionDbId: z.number(),
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217 currency code
  coachId: z.number(),
  clientId: z.number(),
  platformFee: z.number().min(0),
  connectedAccountId: z.string(),
});

export type SessionPayment = z.infer<typeof SessionPaymentSchema>;

/**
 * Payment method schema
 */
export const PaymentMethodSchema = z.object({
  type: PaymentMethodTypeEnum,
  last4: z.string().length(4),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().optional(),
  brand: z.string(),
  isDefault: z.boolean().default(false),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Connected account schema
 */
export const ConnectedAccountSchema = z.object({
  country: z.string().length(2), // ISO 3166-1 alpha-2
  businessType: BusinessTypeEnum,
  defaultCurrency: z.string().length(3).default('USD'),
  payoutSchedule: PayoutScheduleEnum.default('instant'),
  businessProfile: z.record(z.any()).optional(),
});

export type ConnectedAccount = z.infer<typeof ConnectedAccountSchema>;

/**
 * Transaction schema
 */
export const TransactionSchema = z.object({
  type: TransactionTypeEnum,
  status: PaymentStatusEnum,
  amount: z.number().positive(),
  currency: z.string().length(3),
  platformFee: z.number().min(0),
  coachPayout: z.number().min(0),
  metadata: z.record(z.any()).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Payout schema
 */
export const PayoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: PayoutStatusEnum,
  arrivalDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Payout = z.infer<typeof PayoutSchema>;

/**
 * Error types
 */
export const PaymentErrorTypeEnum = z.enum([
  'card_error',
  'validation_error',
  'api_error',
  'authentication_error',
  'rate_limit_error',
  'idempotency_error',
  'invalid_request_error',
]);

export type PaymentErrorType = z.infer<typeof PaymentErrorTypeEnum>;

export const PaymentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  type: PaymentErrorTypeEnum,
  details: z.record(z.any()).optional(),
});

export type PaymentError = z.infer<typeof PaymentErrorSchema>;

/**
 * Webhook event types we handle
 */
export const WebhookEventTypeEnum = z.enum([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'account.updated',
  'payout.paid',
  'payout.failed',
  'charge.dispute.created',
  'charge.refunded',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeEnum>;

/**
 * @description Represents a dispute in our application,
 * consistent with the Dispute model in our Prisma schema.
 * 
 * @property {number} id - Database unique identifier.
 * @property {string} stripeDisputeId - Unique identifier from Stripe.
 * @property {number | undefined} sessionId - Optional associated session id.
 * @property {number} amount - The disputed amount.
 * @property {string} currency - Currency code.
 * @property {'open' | 'resolved' | 'rejected'} status - Current dispute status.
 * @property {string} reason - Reason for dispute.
 * @property {Date} evidenceDueBy - Deadline for submitting evidence.
 * @property {any} evidence - Evidence details (stored as JSON).
 * @property {string} stripePaymentIntentId - Payment intent id associated with the dispute.
 * @property {Date} createdAt - Timestamp when the dispute was created.
 * @property {Date} updatedAt - Timestamp when the dispute was last updated.
 * @property {number | undefined} paymentId - Optional associated payment record id.
 */
export type Dispute = {
  id: number;
  stripeDisputeId: string;
  sessionId?: number;
  amount: number;
  currency: string;
  status: 'open' | 'resolved' | 'rejected';
  reason: string;
  evidenceDueBy: Date;
  evidence: any;
  stripePaymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
  paymentId?: number;
}; 