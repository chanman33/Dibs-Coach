'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { ApiResponse } from '@/utils/types'

export interface CoachDashboardStats {
  totalClients: number
  newClientsThisMonth: number
  revenue: number
  revenueGrowth: number
  menteeRetention: {
    percentage: number
    count: number
    total: number
  }
  rating: number
  reviewCount: number
}

/**
 * Fetches dashboard statistics for a coach
 */
export const fetchCoachDashboardStats = withServerAction<CoachDashboardStats>(
  async (_, { userUlid, roleContext }) => {
    try {
      // Check if user has COACH capability
      if (!roleContext.capabilities?.includes(USER_CAPABILITIES.COACH)) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only coaches can access this endpoint'
          }
        }
      }

      const supabase = await createAuthClient()

      // Initialize default stats for a coach with no mentees
      const defaultStats: CoachDashboardStats = {
        totalClients: 0,
        newClientsThisMonth: 0,
        revenue: 0,
        revenueGrowth: 0,
        menteeRetention: {
          percentage: 0,
          count: 0,
          total: 0
        },
        rating: 0,
        reviewCount: 0
      }

      // Get unique mentees from sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('menteeUlid')
        .eq('coachUlid', userUlid)

      if (sessionsError) {
        console.error('[FETCH_COACH_DASHBOARD_ERROR]', { userUlid, error: sessionsError })
        // Return default stats instead of error
        return { data: defaultStats, error: null }
      }

      // Get unique mentee ULIDs
      const uniqueMenteeUlids = Array.from(new Set(sessions?.map(s => s.menteeUlid) || []))
      const totalClients = uniqueMenteeUlids.length

      // If coach has no clients, return default stats
      if (totalClients === 0) {
        return { data: defaultStats, error: null }
      }

      // Get new clients this month
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { data: recentSessions, error: recentSessionsError } = await supabase
        .from('Session')
        .select('menteeUlid, createdAt')
        .eq('coachUlid', userUlid)
        .gte('createdAt', firstDayOfMonth.toISOString())

      if (recentSessionsError) {
        console.error('[FETCH_COACH_DASHBOARD_ERROR]', { userUlid, error: recentSessionsError })
        // Continue with partial data
        defaultStats.totalClients = totalClients
        return { data: defaultStats, error: null }
      }

      // Find mentees who had their first session this month
      const existingMenteeUlids = new Set<string>()
      const newMenteeUlids = new Set<string>()

      // Sort sessions by creation date (oldest first)
      const sortedSessions = [...(recentSessions || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      // For each session, check if it's the first time we've seen this mentee
      sortedSessions.forEach(session => {
        if (!existingMenteeUlids.has(session.menteeUlid)) {
          newMenteeUlids.add(session.menteeUlid)
          existingMenteeUlids.add(session.menteeUlid)
        }
      })

      const newClientsThisMonth = newMenteeUlids.size

      // Get revenue data
      const { data: payments, error: paymentsError } = await supabase
        .from('Payment')
        .select('amount, createdAt')
        .eq('payeeUlid', userUlid)
        .eq('status', 'COMPLETED')

      if (paymentsError) {
        console.error('[FETCH_COACH_DASHBOARD_ERROR]', { userUlid, error: paymentsError })
        // Continue with partial data
        defaultStats.totalClients = totalClients
        defaultStats.newClientsThisMonth = newClientsThisMonth
        return { data: defaultStats, error: null }
      }

      // Calculate total revenue
      const revenue = (payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0)

      // Calculate revenue growth (comparing current month to previous month)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      lastMonth.setDate(1)
      lastMonth.setHours(0, 0, 0, 0)

      const currentMonthRevenue = (payments || [])
        .filter(p => new Date(p.createdAt) >= firstDayOfMonth)
        .reduce((sum, payment) => sum + Number(payment.amount), 0)

      const previousMonthRevenue = (payments || [])
        .filter(p => new Date(p.createdAt) >= lastMonth && new Date(p.createdAt) < firstDayOfMonth)
        .reduce((sum, payment) => sum + Number(payment.amount), 0)

      const revenueGrowth = previousMonthRevenue === 0 
        ? (currentMonthRevenue > 0 ? 100 : 0)
        : Math.round((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100)

      // Calculate mentee retention (mentees who have booked 3+ sessions)
      const { data: sessionCounts, error: sessionCountsError } = await supabase
        .from('Session')
        .select('menteeUlid')
        .eq('coachUlid', userUlid)
        .eq('status', 'COMPLETED')

      if (sessionCountsError) {
        console.error('[FETCH_COACH_DASHBOARD_ERROR]', { userUlid, error: sessionCountsError })
        // Continue with partial data
        defaultStats.totalClients = totalClients
        defaultStats.newClientsThisMonth = newClientsThisMonth
        defaultStats.revenue = revenue
        defaultStats.revenueGrowth = revenueGrowth
        return { data: defaultStats, error: null }
      }

      // Count sessions per mentee
      const sessionsPerMentee: Record<string, number> = {}
      sessionCounts?.forEach(session => {
        sessionsPerMentee[session.menteeUlid] = (sessionsPerMentee[session.menteeUlid] || 0) + 1
      })

      // Count mentees with 3+ sessions
      const menteesWithThreePlusSessions = Object.values(sessionsPerMentee).filter(count => count >= 3).length
      const totalMenteesWithSessions = Object.keys(sessionsPerMentee).length

      const retentionPercentage = totalMenteesWithSessions === 0 
        ? 0 
        : Math.round((menteesWithThreePlusSessions / totalMenteesWithSessions) * 100)

      // Get coach rating - using revieweeUlid instead of coachUlid
      const { data: reviews, error: reviewsError } = await supabase
        .from('Review')
        .select('rating')
        .eq('revieweeUlid', userUlid)

      if (reviewsError) {
        console.error('[FETCH_COACH_DASHBOARD_ERROR]', { userUlid, error: reviewsError })
        // Continue with partial data
        return {
          data: {
            totalClients,
            newClientsThisMonth,
            revenue,
            revenueGrowth,
            menteeRetention: {
              percentage: retentionPercentage,
              count: menteesWithThreePlusSessions,
              total: totalMenteesWithSessions
            },
            rating: 0,
            reviewCount: 0
          },
          error: null
        }
      }

      const reviewCount = reviews?.length || 0
      const rating = reviewCount === 0 
        ? 0 
        : parseFloat((reviews?.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))

      return {
        data: {
          totalClients,
          newClientsThisMonth,
          revenue,
          revenueGrowth,
          menteeRetention: {
            percentage: retentionPercentage,
            count: menteesWithThreePlusSessions,
            total: totalMenteesWithSessions
          },
          rating,
          reviewCount
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_COACH_DASHBOARD_ERROR]', error)
      // Return default stats instead of error
      return {
        data: {
          totalClients: 0,
          newClientsThisMonth: 0,
          revenue: 0,
          revenueGrowth: 0,
          menteeRetention: {
            percentage: 0,
            count: 0,
            total: 0
          },
          rating: 0,
          reviewCount: 0
        },
        error: null
      }
    }
  },
  {
    requiredCapabilities: [USER_CAPABILITIES.COACH]
  }
) 