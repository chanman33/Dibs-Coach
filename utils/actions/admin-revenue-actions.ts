"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { SYSTEM_ROLES } from '@/utils/roles/roles'
import { z } from 'zod'

// Validation schemas
const RevenueOverviewSchema = z.object({
  totalRevenue: z.number(),
  netRevenue: z.number(),
  platformFees: z.number(),
  coachPayouts: z.number(),
  totalUsers: z.number(),
  activeUsers: z.number()
})

const RevenueTrendSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  platformFees: z.number(),
  coachPayouts: z.number()
})

const TransactionDistributionSchema = z.object({
  type: z.string(),
  value: z.number()
})

const CoachRevenueSchema = z.object({
  coach: z.string(),
  sessions: z.number(),
  revenue: z.number(),
  avgRating: z.number().nullable()
})

const TransactionSchema = z.object({
  createdAt: z.string(),
  type: z.string(),
  payer: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  }).nullable(),
  coach: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  }).nullable(),
  amount: z.number(),
  platformFee: z.number(),
  coachPayout: z.number(),
  status: z.string()
})

const PayoutSchema = z.object({
  scheduledDate: z.string(),
  coach: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  }).nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  processedAt: z.string().nullable()
})

// Types
export type RevenueOverview = z.infer<typeof RevenueOverviewSchema>
export type RevenueTrend = z.infer<typeof RevenueTrendSchema>
export type TransactionDistribution = z.infer<typeof TransactionDistributionSchema>
export type CoachRevenue = z.infer<typeof CoachRevenueSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Payout = z.infer<typeof PayoutSchema>

// Helper function to format date range for queries
const getDateRangeFilter = (from?: Date, to?: Date) => {
  if (!from && !to) return {}
  
  const filter: { gte?: string; lte?: string } = {}
  if (from) filter.gte = from.toISOString()
  if (to) filter.lte = to.toISOString()
  return filter
}

// Default values for empty/missing data
const DEFAULT_REVENUE_OVERVIEW: RevenueOverview = {
  totalRevenue: 0,
  netRevenue: 0,
  platformFees: 0,
  coachPayouts: 0,
  totalUsers: 0,
  activeUsers: 0
}

const DEFAULT_REVENUE_TREND: RevenueTrend[] = []
const DEFAULT_TRANSACTION_DISTRIBUTION: TransactionDistribution[] = []
const DEFAULT_COACH_REVENUE: CoachRevenue[] = []
const DEFAULT_TRANSACTION_HISTORY: { data: Transaction[]; total: number } = { data: [], total: 0 }
const DEFAULT_PAYOUT_HISTORY: { data: Payout[]; total: number } = { data: [], total: 0 }

// Revenue Overview
export const fetchRevenueOverview = withServerAction<RevenueOverview>(
  async (params: { from?: Date; to?: Date } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access revenue data'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)

      // Get user counts
      const { count: totalUsers, error: userError } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })

      if (userError) {
        console.error('[USER_COUNT_ERROR]', userError)
        throw userError
      }

      // Get active users (users who have had a session within last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: activeUsers, error: activeUserError } = await supabase
        .from('Session')
        .select('menteeUlid', { count: 'exact', head: true })
        .gt('startTime', thirtyDaysAgo.toISOString())
        .eq('status', 'COMPLETED')

      if (activeUserError) {
        console.error('[ACTIVE_USER_COUNT_ERROR]', activeUserError)
        throw activeUserError
      }

      // Get revenue data from Transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('Transaction')
        .select('amount, platformFee, coachPayout')
        .match(dateRange)
        .eq('status', 'completed')

      if (transactionError) {
        console.error('[TRANSACTION_ERROR]', transactionError)
        throw transactionError
      }

      // Calculate revenue metrics
      const revenueData = transactions?.reduce((acc, t) => ({
        totalRevenue: acc.totalRevenue + (t.amount || 0),
        platformFees: acc.platformFees + (t.platformFee || 0),
        coachPayouts: acc.coachPayouts + (t.coachPayout || 0)
      }), {
        totalRevenue: 0,
        platformFees: 0,
        coachPayouts: 0
      }) || {
        totalRevenue: 0,
        platformFees: 0,
        coachPayouts: 0
      }

      const validatedData = RevenueOverviewSchema.parse({
        ...revenueData,
        netRevenue: revenueData.platformFees,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0
      })
      
      return { data: validatedData, error: null }
    } catch (error) {
      console.error('[REVENUE_OVERVIEW_ERROR]', error)
      return { data: DEFAULT_REVENUE_OVERVIEW, error: null }
    }
  }
)

// Revenue Trends
export const fetchRevenueTrends = withServerAction<RevenueTrend[]>(
  async (params: { 
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    from?: Date
    to?: Date 
  } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access revenue trends'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)

      // Get transactions grouped by date
      const { data: transactions, error: transactionError } = await supabase
        .from('Transaction')
        .select('createdAt, amount, platformFee, coachPayout')
        .match(dateRange)
        .eq('status', 'completed')
        .order('createdAt', { ascending: true })

      if (transactionError) {
        console.error('[REVENUE_TRENDS_ERROR]', transactionError)
        throw transactionError
      }

      // Group transactions by date based on timeframe
      const groupedData = transactions?.reduce((acc, t) => {
        const date = new Date(t.createdAt)
        let key: string
        
        switch(params.timeframe) {
          case 'daily':
            key = date.toISOString().split('T')[0]
            break
          case 'weekly':
            const week = new Date(date)
            week.setDate(date.getDate() - date.getDay())
            key = week.toISOString().split('T')[0]
            break
          case 'yearly':
            key = date.getFullYear().toString()
            break
          case 'monthly':
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }

        if (!acc[key]) {
          acc[key] = {
            date: key,
            revenue: 0,
            platformFees: 0,
            coachPayouts: 0
          }
        }

        acc[key].revenue += t.amount || 0
        acc[key].platformFees += t.platformFee || 0
        acc[key].coachPayouts += t.coachPayout || 0

        return acc
      }, {} as Record<string, RevenueTrend>) || {}

      const trends = Object.values(groupedData)
      const validatedData = z.array(RevenueTrendSchema).parse(trends)
      
      return { data: validatedData, error: null }
    } catch (error) {
      console.error('[REVENUE_TRENDS_ERROR]', error)
      return { data: DEFAULT_REVENUE_TREND, error: null }
    }
  }
)

// Transaction Distribution
export const fetchTransactionDistribution = withServerAction<TransactionDistribution[]>(
  async (params: { from?: Date; to?: Date } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access transaction distribution'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)

      // Get transactions grouped by type
      const { data: transactions, error: transactionError } = await supabase
        .from('Transaction')
        .select('type, amount, platformFee, coachPayout')
        .match(dateRange)
        .eq('status', 'COMPLETED')

      if (transactionError) {
        console.error('[TRANSACTION_DISTRIBUTION_ERROR]', transactionError)
        throw transactionError
      }

      // Group transactions by type
      const distribution = transactions?.reduce((acc, t) => {
        if (!acc[t.type]) {
          acc[t.type] = {
            type: t.type,
            value: 0
          }
        }
        acc[t.type].value += t.amount || 0
        return acc
      }, {} as Record<string, TransactionDistribution>) || {}

      const validatedData = z.array(TransactionDistributionSchema).parse(Object.values(distribution))
      return { data: validatedData, error: null }
    } catch (error) {
      console.error('[TRANSACTION_DISTRIBUTION_ERROR]', error)
      return { data: DEFAULT_TRANSACTION_DISTRIBUTION, error: null }
    }
  }
)

// Coach Revenues
export const fetchCoachRevenues = withServerAction<CoachRevenue[]>(
  async (params: { from?: Date; to?: Date } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access coach revenues'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)

      // Get completed sessions with coach info and reviews
      const { data: sessions, error: sessionError } = await supabase
        .from('Session')
        .select(`
          coachUlid,
          coach:coachUlid(firstName, lastName),
          priceAmount,
          coachPayoutAmount,
          Review(rating)
        `)
        .match(dateRange)
        .eq('status', 'COMPLETED')

      if (sessionError) {
        console.error('[COACH_REVENUE_ERROR]', sessionError)
        throw sessionError
      }

      // Group and calculate metrics by coach
      const coachMetrics = (sessions || []).reduce((acc, s: any) => {
        const coachId = s.coachUlid
        const coach = Array.isArray(s.coach) ? s.coach[0] : s.coach
        const coachName = `${coach?.firstName || ''} ${coach?.lastName || ''}`.trim() || 'Unknown Coach'
        
        if (!acc[coachId]) {
          acc[coachId] = {
            coach: coachName,
            sessions: 0,
            revenue: 0,
            totalRating: 0,
            ratingCount: 0
          }
        }

        acc[coachId].sessions += 1
        acc[coachId].revenue += s.coachPayoutAmount || 0
        
        if (s.Review && Array.isArray(s.Review)) {
          s.Review.forEach((review: { rating: number }) => {
            acc[coachId].totalRating += review.rating
            acc[coachId].ratingCount += 1
          })
        }

        return acc
      }, {} as Record<string, {
        coach: string;
        sessions: number;
        revenue: number;
        totalRating: number;
        ratingCount: number;
      }>)

      // Convert to final format with average rating
      const coachRevenues = Object.values(coachMetrics).map(c => ({
        coach: c.coach,
        sessions: c.sessions,
        revenue: c.revenue,
        avgRating: c.ratingCount > 0 ? c.totalRating / c.ratingCount : null
      }))

      const validatedData = z.array(CoachRevenueSchema).parse(coachRevenues)
      return { data: validatedData, error: null }
    } catch (error) {
      console.error('[COACH_REVENUE_ERROR]', error)
      return { data: DEFAULT_COACH_REVENUE, error: null }
    }
  }
)

// Transaction History
export const fetchTransactionHistory = withServerAction<{ data: Transaction[]; total: number }>(
  async (params: {
    from?: Date
    to?: Date
    page?: number
    pageSize?: number
  } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access transaction history'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      const { data, error, count } = await supabase
        .from('Transaction')
        .select('*, payer:payerUlid(firstName, lastName), coach:coachUlid(firstName, lastName)', { count: 'exact' })
        .match(dateRange)
        .order('createdAt', { ascending: false })
        .range(start, end)

      if (error) {
        // If table doesn't exist, relationship not found, or is empty, return default values
        if (error.code === '42P01' || error.code === 'PGRST116' || error.code === 'PGRST200') {
          return { data: DEFAULT_TRANSACTION_HISTORY, error: null }
        }
        console.error('[TRANSACTION_HISTORY_ERROR]', error)
        throw error
      }

      const validatedData = z.array(TransactionSchema).parse(data || [])
      return { 
        data: { 
          data: validatedData, 
          total: count || 0 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('[TRANSACTION_HISTORY_ERROR]', error)
      // Return default values for any other errors
      return { data: DEFAULT_TRANSACTION_HISTORY, error: null }
    }
  }
)

// Payout History
export const fetchPayoutHistory = withServerAction<{ data: Payout[]; total: number }>(
  async (params: {
    from?: Date
    to?: Date
    page?: number
    pageSize?: number
  } = {}, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access payout history'
          }
        }
      }

      const supabase = await createAuthClient()
      const dateRange = getDateRangeFilter(params.from, params.to)
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      const { data, error, count } = await supabase
        .from('Payout')
        .select('*, coach:coachUlid(firstName, lastName)', { count: 'exact' })
        .match(dateRange)
        .order('scheduledDate', { ascending: false })
        .range(start, end)

      if (error) {
        // If table doesn't exist, relationship not found, or is empty, return default values
        if (error.code === '42P01' || error.code === 'PGRST116' || error.code === 'PGRST200') {
          return { data: DEFAULT_PAYOUT_HISTORY, error: null }
        }
        console.error('[PAYOUT_HISTORY_ERROR]', error)
        throw error
      }

      const validatedData = z.array(PayoutSchema).parse(data || [])
      return { 
        data: { 
          data: validatedData, 
          total: count || 0 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('[PAYOUT_HISTORY_ERROR]', error)
      // Return default values for any other errors
      return { data: DEFAULT_PAYOUT_HISTORY, error: null }
    }
  }
) 