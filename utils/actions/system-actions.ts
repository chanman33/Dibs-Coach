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
  monthlyRevenue: 0,
  totalRevenue: 0,
  metrics: {
    userGrowth: 0,
    coachGrowth: 0,
    revenueGrowth: 0,
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
      monthlyRevenue,
      totalRevenue,
      totalSessions: totalSessionsCount ?? 0,
      completedSessions: completedSessionsCount ?? 0,
      metrics: {
        userGrowth: 0, // TODO: Calculate growth rates
        coachGrowth: 0,
        revenueGrowth: 0,
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

      // Fetch system health
      const { data: healthData, error: healthError } = await supabase
        .from('SystemHealth')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (healthError) {
        console.error('[DB_ERROR] SystemHealth:', healthError)
        throw healthError
      }

      // Fetch metrics from AdminMetrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('AdminMetrics')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (metricsError) {
        console.error('[DB_ERROR] AdminMetrics:', metricsError)
        throw metricsError
      }

      // Transform AdminMetrics to SystemMetrics format
      const transformedMetrics = {
        totalUsers: metricsData.totalUsers,
        activeUsers: metricsData.activeUsers,
        totalSessions: metricsData.totalSessions,
        completedSessions: metricsData.completedSessions,
        activeCoaches: metricsData.activeCoaches,
        pendingCoaches: metricsData.pendingCoaches,
        monthlyRevenue: metricsData.monthlyRevenue,
        totalRevenue: metricsData.totalRevenue,
        metrics: {
          userGrowth: 0, // Calculate these based on historical data if needed
          coachGrowth: 0,
          revenueGrowth: 0,
          sessionGrowth: 0
        },
        lastUpdated: formatDateTime(metricsData.updatedAt)
      }

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('SystemActivity')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(10)

      if (activityError) {
        console.error('[DB_ERROR] SystemActivity:', activityError)
        throw activityError
      }

      // Fetch system alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('SystemAlerts')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(10)

      if (alertsError) {
        console.error('[DB_ERROR] SystemAlerts:', alertsError)
        throw alertsError
      }

      // Format and validate data
      const validatedHealth = SystemHealthSchema.parse(formatDataForValidation(healthData))
      const validatedMetrics = SystemMetricsSchema.parse(transformedMetrics)
      const validatedActivity = z.array(SystemActivitySchema).parse(
        activityData?.map(activity => formatDataForValidation(activity)) || []
      )
      const validatedAlerts = z.array(SystemAlertSchema).parse(
        alertsData?.map(alert => formatDataForValidation(alert)) || []
      )

      const dashboardData: DashboardData = {
        systemHealth: validatedHealth,
        metrics: validatedMetrics,
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