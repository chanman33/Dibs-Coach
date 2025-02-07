"use server"

import { createServerClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { DashboardData, AdminMetrics, AdminActivity } from "../types/admin"
import { revalidatePath } from "next/cache"

// Type for user analytics
export type UserAnalytics = {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    mentee: number;
    coach: number;
    admin: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageSessionValue: number;
  };
  sessionMetrics: {
    totalSessions: number;
    completionRate: number;
    cancelationRate: number;
  };
}

/**
 * Default metrics when no data exists
 */
const DEFAULT_ADMIN_METRICS: AdminMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  totalCoaches: 0,
  activeCoaches: 0,
  pendingCoaches: 0,
  totalSessions: 0,
  completedSessions: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  updatedAt: new Date().toISOString(),
}

/**
 * @description Fetches all dashboard data using Supabase
 * @returns Promise with dashboard data or error
 */
export async function fetchDashboardData(): Promise<{ data: DashboardData | null; error: Error | null }> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Following .cursorrules table naming convention (PascalCase)
    // Fetch system health
    const { data: healthData, error: healthError } = await supabase
      .from("SystemHealth")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(1)
      .single()

    if (healthError) {
      console.error("[DB_ERROR] SystemHealth:", healthError)
      throw healthError
    }

    // Fetch metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from("AdminMetrics")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(1)
      .single()

    if (metricsError) {
      console.error("[DB_ERROR] AdminMetrics:", metricsError)
      throw metricsError
    }

    // Fetch recent activity
    const { data: activityData, error: activityError } = await supabase
      .from("SystemActivity")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(10)

    if (activityError) {
      console.error("[DB_ERROR] SystemActivity:", activityError)
      throw activityError
    }

    // Fetch system alerts
    const { data: alertsData, error: alertsError } = await supabase
      .from("SystemAlerts")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(10)

    if (alertsError) {
      console.error("[DB_ERROR] SystemAlerts:", alertsError)
      throw alertsError
    }

    // Map data following .cursorrules naming conventions (camelCase for fields)
    const dashboardData: DashboardData = {
      systemHealth: {
        status: healthData.status,
        activeSessions: healthData.activeSessions,
        pendingReviews: healthData.pendingReviews,
        securityAlerts: healthData.securityAlerts,
        uptime: healthData.uptime,
        lastChecked: healthData.createdAt,
      },
      metrics: {
        totalUsers: metricsData.totalUsers,
        activeCoaches: metricsData.activeCoaches,
        monthlyRevenue: metricsData.monthlyRevenue,
        completedSessions: metricsData.completedSessions,
        metrics: {
          userGrowth: metricsData.userGrowth,
          coachGrowth: metricsData.coachGrowth,
          revenueGrowth: metricsData.revenueGrowth,
          sessionGrowth: metricsData.sessionGrowth,
        },
        lastUpdated: metricsData.createdAt,
      },
      recentActivity: activityData.map((activity) => ({
        id: activity.id.toString(),
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.createdAt,
        severity: activity.severity,
      })),
      systemAlerts: alertsData.map((alert) => ({
        id: alert.id.toString(),
        type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.createdAt,
      })),
    }

    return { data: dashboardData, error: null }
  } catch (error) {
    console.error("[ADMIN_DASHBOARD_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

/**
 * @description Fetches admin dashboard metrics
 * Following .cursorrules for database operations and error handling
 */
export async function fetchAdminMetrics(): Promise<{ data: AdminMetrics | null; error: Error | null }> {
  try {
    // Following .cursorrules: await auth() required
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    // Following .cursorrules: await cookies() required
    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Following .cursorrules: PascalCase table names
    const { data, error } = await supabase
      .from("AdminMetrics")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(1)

    // If no data exists, return default metrics
    if (error?.code === 'PGRST116' || !data || data.length === 0) {
      return { data: DEFAULT_ADMIN_METRICS, error: null }
    }

    if (error) {
      console.error("[DB_ERROR] AdminMetrics:", error)
      throw error
    }

    const metrics = data[0]
    return { 
      data: {
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        totalCoaches: metrics.totalCoaches,
        activeCoaches: metrics.activeCoaches,
        pendingCoaches: metrics.pendingCoaches,
        totalSessions: metrics.totalSessions,
        completedSessions: metrics.completedSessions,
        totalRevenue: metrics.totalRevenue,
        monthlyRevenue: metrics.monthlyRevenue,
        updatedAt: metrics.updatedAt,
      }, 
      error: null 
    }
  } catch (error) {
    console.error("[ADMIN_METRICS_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

/**
 * @description Fetches recent admin activity
 */
export async function fetchAdminActivity(limit = 10): Promise<{ data: AdminActivity[] | null; error: Error | null }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("AdminActivity")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[DB_ERROR] AdminActivity:", error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("[ADMIN_ACTIVITY_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

/**
 * @description Updates user status (active/inactive)
 */
export async function updateUserStatus(
  userDbId: number,
  status: "active" | "inactive"
) {
  try {
    // Get admin's Clerk ID for audit log
    const { userId: adminClerkId } = await auth()
    if (!adminClerkId) throw new Error("Unauthorized")

    const supabase = await createServerClient(cookies())
    
    // Get admin's database ID for audit log
    const { data: adminUser, error: adminError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", adminClerkId)
      .single()

    if (adminError || !adminUser) {
      console.error("[UPDATE_USER_STATUS_ERROR] Admin lookup:", adminError)
      throw new Error("Admin user not found")
    }

    // Update user status
    const { error: updateError } = await supabase
      .from("User")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userDbId)

    if (updateError) throw updateError

    // Log the action
    const { error: logError } = await supabase
      .from("AdminAuditLog")
      .insert({
        adminDbId: adminUser.id, // Use admin's database ID
        action: "USER_STATUS_UPDATE",
        targetType: "User",
        targetId: userDbId,
        details: { status },
      })

    if (logError) throw logError

    revalidatePath("/dashboard/admin/user-mgmt")
    return { success: true, error: null }
  } catch (error) {
    console.error("[UPDATE_USER_STATUS_ERROR]", error)
    return { success: false, error: error as Error }
  }
}

/**
 * @description Updates dashboard data cache
 */
export async function refreshDashboardData(): Promise<void> {
  try {
    revalidatePath("/dashboard/admin")
  } catch (error) {
    console.error("[REFRESH_DASHBOARD_ERROR]", error)
    throw error
  }
}

/**
 * @description Fetches user analytics data for the admin dashboard
 */
export async function fetchUserAnalytics(): Promise<{ data: UserAnalytics | null; error: Error | null }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Fetch total users and roles
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id, role, status, createdAt")

    if (userError) {
      console.error("[DB_ERROR] User:", userError)
      throw userError
    }

    // Get current date and first day of month for new users calculation
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Calculate user metrics
    const totalUsers = userData.length
    const activeUsers = userData.filter(user => user.status === "active").length
    const newUsersThisMonth = userData.filter(
      user => new Date(user.createdAt) >= firstDayOfMonth
    ).length

    // Calculate users by role
    const usersByRole = {
      mentee: userData.filter(user => user.role === "mentee").length,
      coach: userData.filter(user => user.role === "coach").length,
      admin: userData.filter(user => user.role === "admin").length,
    }

    // Fetch session data for metrics
    const { data: sessionData, error: sessionError } = await supabase
      .from("Session")
      .select("status, priceAmount, createdAt")

    if (sessionError) {
      console.error("[DB_ERROR] Session:", sessionError)
      throw sessionError
    }

    // Calculate session metrics
    const totalSessions = sessionData.length
    const completedSessions = sessionData.filter(session => session.status === "completed").length
    const canceledSessions = sessionData.filter(session => session.status === "cancelled").length

    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0
    const cancelationRate = totalSessions > 0
      ? Math.round((canceledSessions / totalSessions) * 100)
      : 0

    // Calculate revenue metrics
    const totalRevenue = sessionData.reduce((sum, session) => sum + (session.priceAmount || 0), 0)
    const monthlyRevenue = sessionData
      .filter(session => new Date(session.createdAt) >= firstDayOfMonth)
      .reduce((sum, session) => sum + (session.priceAmount || 0), 0)
    const averageSessionValue = completedSessions > 0
      ? Math.round(totalRevenue / completedSessions)
      : 0

    const analytics: UserAnalytics = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole,
      usersByStatus: {
        active: userData.filter(user => user.status === "active").length,
        inactive: userData.filter(user => user.status === "inactive").length,
        suspended: userData.filter(user => user.status === "suspended").length,
      },
      revenueMetrics: {
        totalRevenue,
        monthlyRevenue,
        averageSessionValue,
      },
      sessionMetrics: {
        totalSessions,
        completionRate,
        cancelationRate,
      }
    }

    return { data: analytics, error: null }
  } catch (error) {
    console.error("[USER_ANALYTICS_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

/**
 * @description Fetches users with pagination and filtering
 */
export async function fetchUsers(): Promise<{ 
  data: Array<{
    id: number;
    name: string;
    email: string;
    role: "admin" | "coach" | "mentee";
    status: "active" | "inactive" | "suspended";
    createdAt: string;
  }> | null; 
  error: Error | null 
}> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Following .cursorrules table naming convention (PascalCase)
    const { data: users, error } = await supabase
      .from("User")
      .select(`
        id,
        firstName,
        lastName,
        email,
        role,
        status,
        createdAt
      `)
      .order("createdAt", { ascending: false })

    if (error) {
      console.error("[DB_ERROR] User:", error)
      throw error
    }

    // Transform the response to match our expected types
    const typedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name',
      email: user.email,
      role: user.role.toLowerCase() as "admin" | "coach" | "mentee",
      status: user.status.toLowerCase() as "active" | "inactive" | "suspended",
      createdAt: user.createdAt
    }))

    return { data: typedUsers, error: null }
  } catch (error) {
    console.error("[FETCH_USERS_ERROR]", error)
    return { data: null, error: error as Error }
  }
} 