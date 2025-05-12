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
import { generateUlid } from '@/utils/ulid'

const DEFAULT_SYSTEM_METRICS: SystemMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  totalSessions: 0,
  completedSessions: 0,
  activeCoaches: 0,
  pendingCoaches: 0,
  totalGMV: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  metrics: {
    userGrowth: 0,
    coachGrowth: 0,
    gmvGrowth: 0,
    sessionGrowth: 0,
    revenueGrowth: 0
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
      .eq("profileStatus", "PUBLISHED")

    const { count: pendingCoachesCount } = await supabase
      .from("CoachApplication")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")

    // Fetch revenue metrics
    const { data: revenueData } = await supabase
      .from("Payment")
      .select("amount")
      .gte("createdAt", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())

    const monthlyRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0

    const { data: totalRevenueData } = await supabase
      .from("Payment")
      .select("amount")

    const totalRevenue = totalRevenueData?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0

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
      monthlyRevenue,
      totalSessions: totalSessionsCount ?? 0,
      completedSessions: completedSessionsCount ?? 0,
      metrics: {
        userGrowth: 0, // TODO: Calculate growth rates
        coachGrowth: 0,
        gmvGrowth: 0,
        sessionGrowth: 0,
        revenueGrowth: 0
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

// Actions with mock implementations
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

      // Mock health data
      const healthData: SystemHealth = {
        ulid: generateUlid(),
        status: 1,
        activeSessions: 0,
        pendingReviews: 0,
        securityAlerts: 0,
        uptime: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Mock activity data
      const mockActivity: SystemActivity[] = [{
        ulid: generateUlid(),
        type: 'USER_LOGIN',
        title: 'User Login',
        description: 'User login successful',
        severity: 'info',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]

      // Mock alerts
      const mockAlerts: SystemAlert[] = [{
        ulid: generateUlid(),
        type: 'SYSTEM',
        title: 'System Notification',
        message: 'This is a test alert',
        severity: 'info',
        source: 'system',
        isResolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]

      // Mock metrics data
      const mockMetrics: SystemMetrics = {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        completedSessions: 0,
        activeCoaches: 0,
        pendingCoaches: 0,
        totalGMV: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        metrics: {
          userGrowth: 0,
          coachGrowth: 0,
          gmvGrowth: 0,
          sessionGrowth: 0,
          revenueGrowth: 0
        },
        lastUpdated: new Date().toISOString()
      }

      const dashboardData: DashboardData = {
        systemHealth: healthData,
        metrics: mockMetrics,
        recentActivity: mockActivity,
        systemAlerts: mockAlerts
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

      // Just a stub implementation to make TypeScript happy
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