'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction'
import type { Database } from '@/types/supabase'

type DbPayment = Database['public']['Tables']['Payment']['Row']
type DbSession = Database['public']['Tables']['Session']['Row']
type DbPayout = Database['public']['Tables']['Payout']['Row']
type UserCapability = Database['public']['Enums']['UserCapability']
type SessionStatus = Database['public']['Enums']['SessionStatus']
type PaymentStatus = Database['public']['Enums']['PaymentStatus']
type PayoutStatus = Database['public']['Enums']['PayoutStatus']

interface SessionWithPayment {
  Payment: {
    amount: number
  } | null
}

interface UpcomingSession {
  id: number
  startTime: string
  type: string
  Payment: {
    amount: number
  } | null
}

export type CoachAnalytics = {
  totalSessions: number
  recentSessions: number
  totalEarnings: number
  recentEarningsTotal: number
  uniqueMenteeCount: number
  recentPayments: {
    ulid: string
    amount: number
    status: string
    createdAt: string
    sessionType?: string
  }[]
  pendingPayments: {
    id: number
    amount: number
    status: string
    createdAt: string
    sessionType?: string
  }[]
  pendingBalance: number
  availableBalance: number
  nextPayoutAmount: number
  nextPayoutDate: string
}

export const fetchCoachAnalytics = withServerAction<CoachAnalytics>(
  async (_, context: ServerActionContext) => {
    try {
      // Check if user has COACH capability
      if (!context.roleContext.capabilities?.includes('COACH')) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'User is not a coach'
          }
        }
      }

      // Ensure we have a userUlid
      if (!context.userUlid) {
        return {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'User ID not found'
          }
        }
      }

      const supabase = await createAuthClient()

      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })
        .eq('coachUlid', context.userUlid)

      // Get completed sessions in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: recentSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })
        .eq('coachUlid', context.userUlid)
        .eq('status', 'COMPLETED' satisfies SessionStatus)
        .gte('startTime', thirtyDaysAgo.toISOString())

      // Get total earnings from completed sessions
      const { data: earnings } = await supabase
        .from('Payment')
        .select('amount')
        .eq('payeeUlid', context.userUlid)
        .eq('status', 'COMPLETED' satisfies PaymentStatus)

      const totalEarnings = (earnings || []).reduce((sum, payment) => sum + Number(payment.amount), 0)

      // Get recent earnings (last 30 days)
      const { data: recentEarnings } = await supabase
        .from('Payment')
        .select('amount, createdAt')
        .eq('payeeUlid', context.userUlid)
        .eq('status', 'COMPLETED' satisfies PaymentStatus)
        .gte('createdAt', thirtyDaysAgo.toISOString())

      const recentEarningsTotal = (recentEarnings || []).reduce((sum, payment) => sum + Number(payment.amount), 0)

      // Get unique mentees count
      const { data: uniqueMentees } = await supabase
        .from('Session')
        .select('menteeUlid')
        .eq('coachUlid', context.userUlid)
        .eq('status', 'COMPLETED' satisfies SessionStatus)

      const uniqueMenteeCount = new Set(uniqueMentees?.map(session => session.menteeUlid)).size

      // Get pending balance (booked but not completed sessions)
      const { data: pendingSessions } = await supabase
        .from('Session')
        .select('Payment(amount)')
        .eq('coachUlid', context.userUlid)
        .eq('status', 'SCHEDULED' satisfies SessionStatus)
        .gt('startTime', new Date().toISOString())

      const pendingBalance = ((pendingSessions || []) as unknown as SessionWithPayment[]).reduce((sum, session) => {
        return sum + Number(session.Payment?.amount || 0)
      }, 0)

      // Get available balance (completed sessions not yet paid out)
      const { data: completedUnpaidSessions } = await supabase
        .from('Session')
        .select('Payment(amount)')
        .eq('coachUlid', context.userUlid)
        .eq('status', 'COMPLETED' satisfies SessionStatus)
        .eq('Payment.payoutStatus', 'PENDING' satisfies PayoutStatus)

      const availableBalance = ((completedUnpaidSessions || []) as unknown as SessionWithPayment[]).reduce((sum, session) => {
        return sum + Number(session.Payment?.amount || 0)
      }, 0)

      // Calculate next payout date (every other Friday)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const friday = new Date(today)
      friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7))
      
      // If today is after this week's Friday, use next Friday
      const nextFriday = today > friday ? new Date(friday.setDate(friday.getDate() + 7)) : friday
      
      // If this Friday is not a payout Friday (odd week), add another week
      const isPayoutWeek = Math.floor(nextFriday.getTime() / (14 * 24 * 60 * 60 * 1000)) % 2 === 0
      const nextPayoutDate = isPayoutWeek ? nextFriday : new Date(nextFriday.setDate(nextFriday.getDate() + 7))

      // Get recent payouts (completed)
      const { data: recentPayouts } = await supabase
        .from('Payout')
        .select('ulid, amount, status, createdAt, stripeTransferId')
        .eq('payeeUlid', context.userUlid)
        .eq('status', 'PROCESSED' satisfies PayoutStatus)
        .order('createdAt', { ascending: false })
        .limit(10)

      // Transform payouts to the expected format
      const recentPayments = (recentPayouts || []).map(payout => ({
        ulid: payout.ulid,
        amount: Number(payout.amount),
        status: payout.status,
        createdAt: payout.createdAt
      }))

      // Get upcoming sessions
      const { data: upcomingSessions } = await supabase
        .from('Session')
        .select('id, startTime:createdAt, type, Payment(amount)')
        .eq('coachUlid', context.userUlid)
        .eq('status', 'SCHEDULED' satisfies SessionStatus)
        .gt('startTime', now.toISOString())
        .order('startTime', { ascending: true })
        .limit(10)

      // Transform sessions to payment format
      const pendingPayments = (upcomingSessions as unknown as UpcomingSession[] || []).map(session => ({
        id: session.id,
        amount: session.Payment?.amount || 0,
        status: 'SCHEDULED',
        createdAt: session.startTime,
        sessionType: session.type
      }))

      return {
        data: {
          totalSessions: totalSessions || 0,
          recentSessions: recentSessions || 0,
          totalEarnings,
          recentEarningsTotal,
          uniqueMenteeCount,
          pendingBalance,
          availableBalance,
          nextPayoutAmount: availableBalance,
          nextPayoutDate: nextPayoutDate.toISOString(),
          recentPayments,
          pendingPayments,
        },
        error: null
      }
    } catch (error) {
      console.error('[ANALYTICS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch analytics data'
        }
      }
    }
  },
  {
    requiredCapabilities: ['COACH']
  }
)

export interface EarlyPayoutParams {
  amount: number
}

/**
 * Request an early payout for a coach
 */
export const requestEarlyPayout = withServerAction<{ success: boolean }, EarlyPayoutParams>(
  async (params, { userUlid }) => {
    try {
      const { amount } = params
      
      // Ensure we have a userUlid
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'User ID not found'
          }
        }
      }
      
      console.log('[REQUEST_EARLY_PAYOUT]', { userUlid, amount, timestamp: new Date().toISOString() })
      
      // Here you would implement the actual payout request logic
      // typically calling a payment service or Stripe API
      
      // This is a placeholder success response
      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[REQUEST_EARLY_PAYOUT_ERROR]', {
        error,
        userUlid,
        params,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to request payout'
        }
      }
    }
  },
  {
    requiredCapabilities: ['COACH']
  }
) 