"use server"

import { createAuthClient } from "@/utils/auth"
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { z } from 'zod'
import { 
  SystemMetrics, 
  SystemActivity, 
  SystemHealth, 
  SystemAlert, 
  UserAnalytics,
  DashboardData,
  SystemMetricsSchema,
  SystemActivitySchema,
  SystemHealthSchema,
  SystemAlertSchema,
  UserAnalyticsSchema,
  DashboardDataSchema,
  UpdateUserStatusSchema
} from '@/utils/types/system'
import { revalidatePath } from 'next/cache'
import { SYSTEM_ROLES } from '@/utils/roles/roles'

const DEFAULT_SYSTEM_METRICS: SystemMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  totalSessions: 0,
  completedSessions: 0,
  activeCoaches: 0,
  pendingCoaches: 0,
  totalGMV: 0,
  totalRevenue: 0,
  metrics: {
    userGrowth: 0,
    coachGrowth: 0,
    gmvGrowth: 0,
    sessionGrowth: 0,
  },
  lastUpdated: new Date().toISOString()
}

export interface SystemMetricsResponse {
  data: SystemMetrics | null
  error: Error | null
}

export async function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  try {
    const supabase = await createAuthClient()
    
    // Fetch total users
    const { count: totalUsersCount } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true })

    // Fetch active users (users who have logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count: activeUsersCount } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true })
      .gt("lastLoginAt", thirtyDaysAgo.toISOString())

    // Fetch coach metrics
    const { count: activeCoachesCount } = await supabase
      .from("CoachProfile")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")

    const { count: pendingCoachesCount } = await supabase
      .from("CoachApplication")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")

    // Fetch revenue metrics
    const { data: revenueData } = await supabase
      .from("Payment")
      .select("amount")
      .gte("createdAt", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())

    const monthlyRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    const { data: totalRevenueData } = await supabase
      .from("Payment")
      .select("amount")

    const totalRevenue = totalRevenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    // Fetch session metrics
    const { count: totalSessionsCount } = await supabase
      .from("Session")
      .select("*", { count: "exact", head: true })

    const { count: completedSessionsCount } = await supabase
      .from("Session")
      .select("*", { count: "exact", head: true })
      .eq("status", "COMPLETED")

    // Ensure all counts have default values
    const metrics: SystemMetrics = {
      totalUsers: totalUsersCount ?? 0,
      activeUsers: activeUsersCount ?? 0,
      activeCoaches: activeCoachesCount ?? 0,
      pendingCoaches: pendingCoachesCount ?? 0,
      totalGMV: monthlyRevenue,
      totalRevenue,
      totalSessions: totalSessionsCount ?? 0,
      completedSessions: completedSessionsCount ?? 0,
      metrics: {
        userGrowth: 0, // TODO: Calculate growth rates
        coachGrowth: 0,
        gmvGrowth: 0,
        sessionGrowth: 0,
      },
      lastUpdated: new Date().toISOString()
    }

    return { data: metrics, error: null }
  } catch (error) {
    console.error("[SYSTEM_METRICS_ERROR]", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch system metrics")
    }
  }
}

// Helper to ensure datetime is in ISO format
const formatDateTime = (date: string | Date) => {
  if (date instanceof Date) {
    return date.toISOString()
  }
  // Try to parse the date and format it
  try {
    return new Date(date).toISOString()
  } catch (e) {
    console.error('[DATE_FORMAT_ERROR]', e)
    return new Date().toISOString() // Fallback to current time
  }
}

// Helper to format data for validation
const formatDataForValidation = (data: any) => {
  if (!data) return data

  // Format dates in the data
  if (data.createdAt) {
    data.createdAt = formatDateTime(data.createdAt)
  }
  if (data.updatedAt) {
    data.updatedAt = formatDateTime(data.updatedAt)
  }
  if (data.lastUpdated) {
    data.lastUpdated = formatDateTime(data.lastUpdated)
  }

  return data
}

// Actions
export const fetchDashboardData = withServerAction<DashboardData>(
  async (_, { userUlid, systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access this endpoint'
          }
        }
      }

      const supabase = await createAuthClient()

      // Calculate system health metrics
      const { count: activeSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

      const { count: pendingReviews } = await supabase
        .from('Review')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')

      const { count: securityAlerts } = await supabase
        .from('SecurityEvent')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN')

      // Calculate user metrics
      const { count: totalUsers } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: activeUsers } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .gt('lastLoginAt', thirtyDaysAgo.toISOString())

      const { count: totalCoaches } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('isCoach', true)

      const { count: activeCoaches } = await supabase
        .from('CoachProfile')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

      const { count: pendingCoaches } = await supabase
        .from('CoachApplication')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')

      // Calculate session metrics
      const { count: totalSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })

      const { count: completedSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')

      // Calculate revenue metrics
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: transactions } = await supabase
        .from('Transaction')
        .select('amount, platformFee, coachPayout')
        .eq('status', 'COMPLETED')

      const { data: monthlyTransactions } = await supabase
        .from('Transaction')
        .select('amount, platformFee, coachPayout')
        .eq('status', 'COMPLETED')
        .gte('createdAt', monthStart.toISOString())

      const totalGMV = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const monthlyGMV = monthlyTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      // Calculate GMV growth rate
      const previousMonthStart = new Date(monthStart)
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
      
      const { data: previousMonthTransactions } = await supabase
        .from('Transaction')
        .select('amount')
        .eq('status', 'COMPLETED')
        .gte('createdAt', previousMonthStart.toISOString())
        .lt('createdAt', monthStart.toISOString())

      const previousMonthGMV = previousMonthTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const gmvGrowth = previousMonthGMV === 0 ? 0 : ((monthlyGMV - previousMonthGMV) / previousMonthGMV) * 100

      // Get recent system activity
      const { data: recentActivity } = await supabase
        .from('AdminAuditLog')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(10)

      const formattedActivity = recentActivity?.map(log => ({
        ulid: log.ulid,
        type: log.action,
        title: `${log.action} - ${log.targetType}`,
        description: JSON.stringify(log.details),
        severity: 'info',
        createdAt: log.createdAt,
        updatedAt: log.createdAt
      })) || []

      // Get system alerts (from security events, errors, etc)
      const { data: securityEvents } = await supabase
        .from('SecurityEvent')
        .select('*')
        .eq('status', 'OPEN')
        .order('createdAt', { ascending: false })
        .limit(10)

      const formattedAlerts = securityEvents?.map(event => ({
        ulid: event.ulid,
        type: 'SECURITY',
        title: event.type,
        message: event.description,
        severity: event.severity,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      })) || []

      // Calculate system health status
      const status = (securityAlerts || 0) > 0 ? 3 : (activeSessions || 0) > 100 ? 2 : 1

      const healthData = {
        ulid: 'current',
        status,
        activeSessions: activeSessions || 0,
        pendingReviews: pendingReviews || 0,
        securityAlerts: securityAlerts || 0,
        uptime: 100, // TODO: Implement actual uptime tracking
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Format and validate data
      const validatedHealth = SystemHealthSchema.parse(formatDataForValidation(healthData))
      const validatedActivity = z.array(SystemActivitySchema).parse(
        formattedActivity.map(activity => formatDataForValidation(activity))
      )
      const validatedAlerts = z.array(SystemAlertSchema).parse(
        formattedAlerts.map(alert => formatDataForValidation(alert))
      )

      const metricsData = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        activeCoaches: activeCoaches || 0,
        pendingCoaches: pendingCoaches || 0,
        totalGMV,
        totalRevenue: totalGMV, // For backward compatibility
        metrics: {
          userGrowth: 0, // TODO: Calculate growth rates
          coachGrowth: 0,
          gmvGrowth,
          sessionGrowth: 0
        },
        lastUpdated: new Date().toISOString()
      }

      const dashboardData: DashboardData = {
        systemHealth: validatedHealth,
        metrics: SystemMetricsSchema.parse(metricsData),
        recentActivity: validatedActivity,
        systemAlerts: validatedAlerts
      }

      return { data: dashboardData, error: null }
    } catch (error) {
      console.error('[SYSTEM_DASHBOARD_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const refreshDashboardData = withServerAction<void>(
  async (_, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can refresh dashboard data'
          }
        }
      }

      // Update admin metrics first
      const updateResult = await updateAdminMetrics({})
      if (updateResult.error) {
        return updateResult
      }

      revalidatePath('/dashboard/system')
      return { data: undefined, error: null }
    } catch (error) {
      console.error('[REFRESH_DASHBOARD_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const updateAdminMetrics = withServerAction<void>(
  async (_, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can update admin metrics'
          }
        }
      }

      const supabase = await createAuthClient()
      
      // Fetch current counts from actual tables
      const { count: totalUsers } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: activeUsers } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .gt('lastLoginAt', thirtyDaysAgo.toISOString())

      const { count: totalCoaches } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('isCoach', true)

      const { count: activeCoaches } = await supabase
        .from('CoachProfile')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

      const { count: pendingCoaches } = await supabase
        .from('CoachApplication')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')

      const { count: totalSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })

      const { count: completedSessions } = await supabase
        .from('Session')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')

      // Calculate revenue metrics
      const { data: revenueData } = await supabase
        .from('Transaction')
        .select('amount')
        .eq('status', 'COMPLETED')

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: monthlyRevenueData } = await supabase
        .from('Transaction')
        .select('amount')
        .eq('status', 'COMPLETED')
        .gte('createdAt', monthStart.toISOString())

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      // Update AdminMetrics table
      const { error: updateError } = await supabase
        .from('AdminMetrics')
        .update({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalCoaches: totalCoaches || 0,
          activeCoaches: activeCoaches || 0,
          pendingCoaches: pendingCoaches || 0,
          totalSessions: totalSessions || 0,
          completedSessions: completedSessions || 0,
          totalRevenue,
          monthlyRevenue,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', (await supabase
          .from('AdminMetrics')
          .select('ulid')
          .order('createdAt', { ascending: false })
          .limit(1)
          .single()).data?.ulid)

      if (updateError) {
        console.error('[ADMIN_METRICS_UPDATE_ERROR]', updateError)
        throw updateError
      }

      revalidatePath('/dashboard/system')
      return { data: undefined, error: null }
    } catch (error) {
      console.error('[UPDATE_ADMIN_METRICS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update admin metrics',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 