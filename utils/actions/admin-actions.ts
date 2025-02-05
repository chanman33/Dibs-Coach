"use server"

import { createServerClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { DashboardData } from "../types/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AdminMetrics, AdminActivity } from "@/utils/types/admin"

// Validation schemas
const AdminMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalCoaches: z.number(),
  activeCoaches: z.number(),
  pendingCoaches: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  totalRevenue: z.number(),
  monthlyRevenue: z.number(),
  updatedAt: z.string().datetime(),
})

const CoachApplicationSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  experience: z.string(),
  specialties: z.array(z.string()),
  notes: z.string().optional(),
})

type CoachApplication = z.infer<typeof CoachApplicationSchema>

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
 * @description Fetches pending coach applications
 */
export async function fetchPendingApplications() {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const supabase = await createServerClient(cookies())
    const { data, error } = await supabase
      .from("CoachApplication")
      .select(`
        *,
        user:userDbId (
          firstName,
          lastName,
          email
        )
      `)
      .eq("status", "pending")
      .order("createdAt", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("[COACH_APPLICATIONS_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

/**
 * @description Reviews a coach application
 */
export async function reviewCoachApplication(
  applicationId: number,
  { status, notes }: { status: "approved" | "rejected"; notes?: string }
) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const supabase = await createServerClient(cookies())
    
    // Update application
    const { error: updateError } = await supabase
      .from("CoachApplication")
      .update({
        status,
        notes,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) throw updateError

    // Log the action
    const { error: logError } = await supabase
      .from("AdminAuditLog")
      .insert({
        adminDbId: userId,
        action: `COACH_APPLICATION_${status.toUpperCase()}`,
        targetType: "CoachApplication",
        targetId: applicationId,
        details: { status, notes },
      })

    if (logError) throw logError

    revalidatePath("/dashboard/admin/coach-applications")
    return { success: true, error: null }
  } catch (error) {
    console.error("[REVIEW_APPLICATION_ERROR]", error)
    return { success: false, error: error as Error }
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