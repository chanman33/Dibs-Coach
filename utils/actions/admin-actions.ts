"use server"

import { createServerClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { DashboardData, AdminMetrics, AdminActivity } from "../types/admin"
import { revalidatePath } from "next/cache"

// Type for user analytics
type UserAnalytics = {
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
      .single()

    if (error) {
      console.error("[DB_ERROR] AdminMetrics:", error)
      throw error
    }

    return { 
      data: {
        totalUsers: data.totalUsers,
        activeUsers: data.activeUsers,
        totalCoaches: data.totalCoaches,
        activeCoaches: data.activeCoaches,
        pendingCoaches: data.pendingCoaches,
        totalSessions: data.totalSessions,
        completedSessions: data.completedSessions,
        totalRevenue: data.totalRevenue,
        monthlyRevenue: data.monthlyRevenue,
        updatedAt: data.updatedAt,
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
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const supabase = await createServerClient(cookies())
    
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
        adminDbId: userId,
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
 * @description Fetches user analytics for admin dashboard
 * Following .cursorrules for database operations and error handling
 */
export async function fetchUserAnalytics(): Promise<{ data: UserAnalytics | null; error: Error | null }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Following .cursorrules: PascalCase table names
    const { data: users, error: usersError } = await supabase
      .from("User")
      .select("role, status, createdAt")

    if (usersError) {
      console.error("[DB_ERROR] User Analytics:", usersError)
      throw usersError
    }

    // Fetch session and revenue data
    const { data: sessions, error: sessionsError } = await supabase
      .from("Session")
      .select("status, price, createdAt")

    if (sessionsError) {
      console.error("[DB_ERROR] Session Analytics:", sessionsError)
      throw sessionsError
    }

    // Calculate analytics
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const completedSessions = sessions?.filter(s => s.status === "completed") || []
    const canceledSessions = sessions?.filter(s => s.status === "canceled") || []
    const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.price || 0), 0)
    const monthlyRevenue = completedSessions
      .filter(s => new Date(s.createdAt) >= firstDayOfMonth)
      .reduce((sum, s) => sum + (s.price || 0), 0)

    const analytics: UserAnalytics = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === "active").length,
      newUsersThisMonth: users.filter(u => new Date(u.createdAt) >= firstDayOfMonth).length,
      usersByRole: {
        mentee: users.filter(u => u.role === "mentee").length,
        coach: users.filter(u => u.role === "coach").length,
        admin: users.filter(u => u.role === "admin").length,
      },
      usersByStatus: {
        active: users.filter(u => u.status === "active").length,
        inactive: users.filter(u => u.status === "inactive").length,
        suspended: users.filter(u => u.status === "suspended").length,
      },
      revenueMetrics: {
        totalRevenue,
        monthlyRevenue,
        averageSessionValue: completedSessions.length > 0 
          ? totalRevenue / completedSessions.length 
          : 0,
      },
      sessionMetrics: {
        totalSessions: sessions?.length || 0,
        completionRate: sessions?.length 
          ? (completedSessions.length / sessions.length) * 100 
          : 0,
        cancelationRate: sessions?.length 
          ? (canceledSessions.length / sessions.length) * 100 
          : 0,
      },
    }

    return { data: analytics, error: null }
  } catch (error) {
    console.error("[USER_ANALYTICS_ERROR]", error)
    return { data: null, error: error as Error }
  }
} 