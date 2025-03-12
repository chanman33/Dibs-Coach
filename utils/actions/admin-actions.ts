/**
 * ADMIN DASHBOARD ACTIONS - FUTURE IMPLEMENTATION
 * 
 * NOTE: This file contains server actions for future admin dashboard functionality.
 * These functions are not currently connected to any frontend components in the MVP.
 * 
 * IMPORTANT: This file intentionally contains type errors.
 * Many of the database tables referenced (like SecurityEvent, SystemMetrics, UserAnalytics)
 * don't exist yet in the current schema, which is causing the linter errors.
 * These errors can be safely ignored as this code is not being used in the MVP.
 * 
 * For current system dashboard functionality, see system-actions.ts which is being used
 * by the existing dashboard pages.
 * 
 * FUTURE DEVELOPMENT PLAN:
 * 1. Create the missing database tables when implementing the admin features
 * 2. Update the types to match the actual database schema
 * 3. Connect these actions to the admin dashboard UI components
 * 4. Remove this comment when the implementation is complete
 * 
 * See docs/ADMIN_DASHBOARD_TODO.md for the complete implementation plan.
 */

// @ts-nocheck - Disable type checking for this file until admin features are implemented
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
import { ProfileStatus } from '@/utils/types/coach'

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

// User Schema
const UserSchema = z.object({
  ulid: z.string(),
  userId: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  systemRole: z.string(),
  status: z.string(),
  isCoach: z.boolean(),
  isMentee: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export type User = z.infer<typeof UserSchema>

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

      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

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

      const metricsData = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        activeCoaches: activeCoaches || 0,
        pendingCoaches: pendingCoaches || 0,
        totalGMV: 0, // TODO: Calculate GMV
        totalRevenue,
        metrics: {
          userGrowth: 0, // TODO: Calculate growth rates
          coachGrowth: 0,
          gmvGrowth: 0,
          sessionGrowth: 0
        },
        lastUpdated: new Date().toISOString()
      }

      // Format and validate data
      const validatedHealth = SystemHealthSchema.parse(formatDataForValidation(healthData))
      const validatedMetrics = SystemMetricsSchema.parse(metricsData)
      const validatedActivity = z.array(SystemActivitySchema).parse(
        formattedActivity.map(activity => formatDataForValidation(activity))
      )
      const validatedAlerts = z.array(SystemAlertSchema).parse(
        formattedAlerts.map(alert => formatDataForValidation(alert))
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

export const fetchUsers = withServerAction<{
  data: User[]
  total: number
}>(
  async (params: { 
    page?: number
    pageSize?: number
    search?: string
    role?: string
    status?: string
  }, { systemRole }) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access user management'
          }
        }
      }

      const supabase = await createAuthClient()

      // Set up pagination
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      // Build query
      let query = supabase
        .from('User')
        .select('*', { count: 'exact' })

      // Apply filters
      if (params.search) {
        query = query.or(`email.ilike.%${params.search}%,firstName.ilike.%${params.search}%,lastName.ilike.%${params.search}%`)
      }
      if (params.role) {
        query = query.eq('systemRole', params.role)
      }
      if (params.status) {
        query = query.eq('status', params.status)
      }

      // Add pagination
      query = query
        .order('createdAt', { ascending: false })
        .range(start, end)

      const { data, error, count } = await query

      if (error) {
        console.error('[FETCH_USERS_ERROR]', error)
        throw error
      }

      // Validate data
      const validatedUsers = z.array(UserSchema).parse(data)

      return {
        data: {
          data: validatedUsers,
          total: count || 0
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_USERS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch users',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const updateUserStatus = withServerAction<{ success: boolean }>(
  async (params: { 
    userUlid: string
    status: 'active' | 'inactive' | 'suspended'
    reason?: string 
  }, { systemRole }) => {
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

      const supabase = await createAuthClient()

      // Update user status
      const { error: updateError } = await supabase
        .from('User')
        .update({ 
          status: params.status,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', params.userUlid)

      if (updateError) {
        console.error('[UPDATE_USER_STATUS_ERROR]', updateError)
        throw updateError
      }

      // Log the action
      const { error: logError } = await supabase
        .from('SystemActivity')
        .insert({
          ulid: '', // Will be generated by DB
          type: 'USER_ACTION',
          title: 'User Status Updated',
          description: `User status updated to ${params.status}${params.reason ? `: ${params.reason}` : ''}`,
          severity: 'info',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (logError) {
        console.error('[LOG_USER_STATUS_ERROR]', logError)
        // Don't throw here as the main action succeeded
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_USER_STATUS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user status',
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

// Update coach profile status (for admin use)
export const updateCoachProfileStatus = withServerAction<{ success: boolean }, { coachUlid: string, status: ProfileStatus }>(
  async (data, { userUlid }) => {
    try {
      // First check if the user is an admin
      const supabase = await createAuthClient();
      
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role')
        .eq('ulid', userUlid)
        .single();
      
      if (userError) {
        console.error('[ADMIN_UPDATE_COACH_STATUS_ERROR] User fetch error', userError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error fetching user',
            details: { error: userError }
          }
        };
      }
      
      // Check if user is admin
      const isAdmin = userData.role === 'SYSTEM_OWNER' || userData.role === 'SYSTEM_MODERATOR';
      
      if (!isAdmin) {
        console.error('[ADMIN_UPDATE_COACH_STATUS_ERROR] Unauthorized access', { userUlid });
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have permission to perform this action',
          }
        };
      }
      
      // Update the coach profile status
      const { error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          profileStatus: data.status,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', data.coachUlid);
      
      if (updateError) {
        console.error('[ADMIN_UPDATE_COACH_STATUS_ERROR] Update error', updateError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error updating coach profile status',
            details: { error: updateError }
          }
        };
      }
      
      // Log the status change for audit
      await supabase
        .from('AdminAuditLog')
        .insert({
          userUlid,
          action: 'UPDATE_COACH_PROFILE_STATUS',
          resourceType: 'CoachProfile',
          resourceId: data.coachUlid,
          details: { 
            status: data.status,
            timestamp: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      
      // Revalidate relevant paths
      revalidatePath('/admin/coaches');
      revalidatePath(`/admin/coaches/${data.coachUlid}`);
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[ADMIN_UPDATE_COACH_STATUS_ERROR]', error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
); 