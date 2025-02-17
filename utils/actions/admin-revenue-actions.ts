"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { 
  RevenueOverview,
  RevenueTrend,
  TransactionDistribution,
  CoachRevenue,
  TransactionHistory,
  PayoutHistory,
  RevenueDateRangeSchema,
  RevenueTrendQuerySchema,
  PaginationQuerySchema,
  TransactionTypeEnum,
  TransactionStatusEnum,
  PayoutStatusEnum
} from '@/utils/types/admin'
import { ROLES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ApiResponse } from '@/utils/types/api'

type TransactionResponse = {
  ulid: string
  type: z.infer<typeof TransactionTypeEnum>
  status: z.infer<typeof TransactionStatusEnum>
  amount: number
  platformFee: number
  coachPayout: number
  createdAt: string
  coach: {
    ulid: string
    firstName: string | null
    lastName: string | null
  } | null
  payer: {
    ulid: string
    firstName: string | null
    lastName: string | null
  } | null
}

type PayoutResponse = {
  ulid: string
  status: z.infer<typeof PayoutStatusEnum>
  amount: number
  currency: string
  processedAt: string | null
  scheduledDate: string
  coach: {
    ulid: string
    firstName: string | null
    lastName: string | null
  } | null
}

export const fetchRevenueOverview = withServerAction<RevenueOverview>(
  async (params: { startDate?: string; endDate?: string }, { role }) => {
    try {
      if (role !== ROLES.ADMIN) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can access revenue data'
          }
        }
      }

      // Validate date range
      const validatedParams = RevenueDateRangeSchema.parse(params)
      
      const supabase = await createAuthClient()

      // Fetch revenue data for the period
      const { data: transactions, error: transactionsError } = await supabase
        .from('Transaction')
        .select(`
          amount,
          platformFee,
          coachPayout,
          createdAt
        `)
        .gte('createdAt', validatedParams.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('createdAt', validatedParams.endDate || new Date().toISOString())

      if (transactionsError) {
        console.error('[REVENUE_OVERVIEW_ERROR]', transactionsError)
        throw transactionsError
      }

      // Calculate totals
      const overview: RevenueOverview = transactions.reduce((acc, t) => ({
        totalRevenue: acc.totalRevenue + (t.amount || 0),
        netRevenue: acc.netRevenue + ((t.amount || 0) - (t.coachPayout || 0)),
        platformFees: acc.platformFees + (t.platformFee || 0),
        coachPayouts: acc.coachPayouts + (t.coachPayout || 0),
        periodStart: validatedParams.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: validatedParams.endDate || new Date().toISOString()
      }), {
        totalRevenue: 0,
        netRevenue: 0,
        platformFees: 0,
        coachPayouts: 0,
        periodStart: validatedParams.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: validatedParams.endDate || new Date().toISOString()
      })

      return { data: overview, error: null }
    } catch (error) {
      console.error('[REVENUE_OVERVIEW_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch revenue overview',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const fetchRevenueTrends = withServerAction<RevenueTrend[]>(
  async (params: { timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }, { role }) => {
    try {
      if (role !== ROLES.ADMIN) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can access revenue trends'
          }
        }
      }

      // Validate parameters
      const validatedParams = RevenueTrendQuerySchema.parse(params)
      
      const supabase = await createAuthClient()

      // Fetch transaction data
      const { data: transactions, error: transactionsError } = await supabase
        .from('Transaction')
        .select(`
          amount,
          platformFee,
          coachPayout,
          createdAt
        `)
        .gte('createdAt', validatedParams.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('createdAt', validatedParams.endDate || new Date().toISOString())
        .order('createdAt')

      if (transactionsError) {
        console.error('[REVENUE_TRENDS_ERROR]', transactionsError)
        throw transactionsError
      }

      // Group transactions by timeframe
      const trends = transactions.reduce((acc, t) => {
        const date = new Date(t.createdAt)
        let key: string

        switch (validatedParams.timeframe) {
          case 'daily':
            key = date.toISOString().split('T')[0]
            break
          case 'weekly':
            const week = new Date(date)
            week.setDate(date.getDate() - date.getDay())
            key = week.toISOString().split('T')[0]
            break
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            break
          case 'yearly':
            key = String(date.getFullYear())
            break
        }

        if (!acc[key]) {
          acc[key] = {
            date: key,
            revenue: 0,
            platformFees: 0,
            coachPayouts: 0
          }
        }

        acc[key].revenue += t.amount
        acc[key].platformFees += t.platformFee
        acc[key].coachPayouts += t.coachPayout

        return acc
      }, {} as Record<string, RevenueTrend>)

      return { 
        data: Object.values(trends),
        error: null
      }
    } catch (error) {
      console.error('[REVENUE_TRENDS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch revenue trends',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const fetchTransactionHistory = withServerAction<{ data: TransactionHistory[]; total: number }>(
  async (params: { startDate?: string; endDate?: string; page?: number; pageSize?: number }, { role }) => {
    try {
      if (role !== ROLES.ADMIN) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can access transaction history'
          }
        }
      }

      // Validate parameters
      const dateRange = RevenueDateRangeSchema.parse(params)
      const pagination = PaginationQuerySchema.parse(params)
      
      const supabase = await createAuthClient()

      // Calculate pagination
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1

      // Fetch transactions with pagination
      const { data: transactions, error: transactionsError, count } = await supabase
        .from('Transaction')
        .select(`
          ulid,
          type,
          status,
          amount,
          platformFee,
          coachPayout,
          createdAt,
          coach:coachUlid (
            ulid,
            firstName,
            lastName
          ),
          payer:payerUlid (
            ulid,
            firstName,
            lastName
          )
        `, { count: 'exact' })
        .gte('createdAt', dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('createdAt', dateRange.endDate || new Date().toISOString())
        .order('createdAt', { ascending: false })
        .range(from, to)

      if (transactionsError) {
        console.error('[TRANSACTION_HISTORY_ERROR]', transactionsError)
        throw transactionsError
      }

      const formattedTransactions: TransactionHistory[] = (transactions as unknown as TransactionResponse[]).map(t => ({
        ulid: t.ulid,
        type: t.type,
        status: t.status,
        amount: t.amount,
        platformFee: t.platformFee || 0,
        coachPayout: t.coachPayout || 0,
        createdAt: t.createdAt,
        coach: t.coach || { ulid: '', firstName: null, lastName: null },
        payer: t.payer || { ulid: '', firstName: null, lastName: null }
      }))

      return { 
        data: {
          data: formattedTransactions,
          total: count || 0
        },
        error: null
      }
    } catch (error) {
      console.error('[TRANSACTION_HISTORY_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch transaction history',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const fetchPayoutHistory = withServerAction<{ data: PayoutHistory[]; total: number }>(
  async (params: { startDate?: string; endDate?: string; page?: number; pageSize?: number }, { role }) => {
    try {
      if (role !== ROLES.ADMIN) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can access payout history'
          }
        }
      }

      // Validate parameters
      const dateRange = RevenueDateRangeSchema.parse(params)
      const pagination = PaginationQuerySchema.parse(params)
      
      const supabase = await createAuthClient()

      // Calculate pagination
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1

      // Fetch payouts with pagination
      const { data: payouts, error: payoutsError, count } = await supabase
        .from('Payout')
        .select(`
          ulid,
          status,
          amount,
          currency,
          processedAt,
          scheduledDate,
          coach:payeeUlid (
            ulid,
            firstName,
            lastName
          )
        `, { count: 'exact' })
        .gte('createdAt', dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('createdAt', dateRange.endDate || new Date().toISOString())
        .order('createdAt', { ascending: false })
        .range(from, to)

      if (payoutsError) {
        console.error('[PAYOUT_HISTORY_ERROR]', payoutsError)
        throw payoutsError
      }

      const formattedPayouts: PayoutHistory[] = (payouts as unknown as PayoutResponse[]).map(p => ({
        ulid: p.ulid,
        status: p.status,
        amount: p.amount,
        currency: p.currency,
        processedAt: p.processedAt,
        scheduledDate: p.scheduledDate,
        coach: p.coach || { ulid: '', firstName: null, lastName: null }
      }))

      return { 
        data: {
          data: formattedPayouts,
          total: count || 0
        },
        error: null
      }
    } catch (error) {
      console.error('[PAYOUT_HISTORY_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payout history',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 