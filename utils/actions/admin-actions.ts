"use server"

import { createAuthClient } from '@/utils/auth'
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

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('SystemMetrics')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (metricsError) {
        console.error('[DB_ERROR] SystemMetrics:', metricsError)
        throw metricsError
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

      // Validate data
      const validatedHealth = SystemHealthSchema.parse(healthData)
      const validatedMetrics = SystemMetricsSchema.parse(metricsData)
      const validatedActivity = z.array(SystemActivitySchema).parse(activityData)
      const validatedAlerts = z.array(SystemAlertSchema).parse(alertsData)

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

export const fetchSystemMetrics = withServerAction<SystemMetrics>(
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

      const { data, error } = await supabase
        .from('SystemMetrics')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)

      if (error?.code === 'PGRST116' || !data || data.length === 0) {
        return { data: DEFAULT_SYSTEM_METRICS, error: null }
      }

      if (error) {
        console.error('[DB_ERROR] SystemMetrics:', error)
        throw error
      }

      const validatedMetrics = SystemMetricsSchema.parse(data[0])
      return { data: validatedMetrics, error: null }
    } catch (error) {
      console.error('[SYSTEM_METRICS_ERROR]', error)
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

export const updateUserStatus = withServerAction<{ success: boolean }>(
  async (input: { userUlid: string; status: 'active' | 'inactive' | 'suspended'; reason?: string }, { userUlid: systemUserUlid, systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can update user status'
          }
        }
      }

      // Validate input
      const validatedInput = UpdateUserStatusSchema.parse(input)

      const supabase = await createAuthClient()

      // Update user status
      const { error: updateError } = await supabase
        .from('User')
        .update({
          status: validatedInput.status,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', validatedInput.userUlid)

      if (updateError) throw updateError

      // Log the action
      const { error: logError } = await supabase
        .from('SystemActivity')
        .insert({
          ulid: '', // Will be generated by the database
          systemUserUlid,
          type: 'USER_ACTION',
          severity: 'info',
          description: `User status updated to ${validatedInput.status}${validatedInput.reason ? `: ${validatedInput.reason}` : ''}`,
          metadata: {
            userUlid: validatedInput.userUlid,
            status: validatedInput.status,
            reason: validatedInput.reason
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (logError) throw logError

      revalidatePath('/dashboard/system/user-mgmt')
      return { data: { success: true }, error: null }
    } catch (error) {
      console.error('[UPDATE_USER_STATUS_ERROR]', error)
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

export const fetchUserAnalytics = withServerAction<UserAnalytics>(
  async (_, { userUlid, systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access analytics'
          }
        }
      }

      const supabase = await createAuthClient()

      // Fetch user analytics
      const { data, error } = await supabase
        .from('UserAnalytics')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[DB_ERROR] UserAnalytics:', error)
        throw error
      }

      const validatedAnalytics = UserAnalyticsSchema.parse(data)
      return { data: validatedAnalytics, error: null }
    } catch (error) {
      console.error('[USER_ANALYTICS_ERROR]', error)
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

export const fetchSystemActivity = withServerAction<SystemActivity[]>(
  async (_, { userUlid, systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access activity logs'
          }
        }
      }

      const supabase = await createAuthClient()

      const { data, error } = await supabase
        .from('SystemActivity')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(10)

      if (error) {
        console.error('[DB_ERROR] SystemActivity:', error)
        throw error
      }

      const validatedActivity = z.array(SystemActivitySchema).parse(data)
      return { data: validatedActivity, error: null }
    } catch (error) {
      console.error('[SYSTEM_ACTIVITY_ERROR]', error)
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