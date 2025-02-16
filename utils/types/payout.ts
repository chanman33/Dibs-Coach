import { z } from 'zod'
import { ulidSchema } from './auth'

export const PayoutStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])

export const PayoutRequestSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('USD')
})

export const PayoutSchema = z.object({
  ulid: ulidSchema,
  payeeUlid: ulidSchema,
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  stripeTransferId: z.string().nullable(),
  status: PayoutStatusEnum.default('pending'),
  scheduledDate: z.string().datetime(),
  processedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type PayoutRequest = z.infer<typeof PayoutRequestSchema>
export type Payout = z.infer<typeof PayoutSchema>

export interface PayoutResponse {
  payout: Payout
  availableBalance: number
  recentPayoutCount: number
} 