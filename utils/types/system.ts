import { z } from 'zod'

// System Metrics Schema
export const SystemMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  activeCoaches: z.number(),
  pendingCoaches: z.number(),
  totalGMV: z.number(),
  totalRevenue: z.number(),
  metrics: z.object({
    userGrowth: z.number(),
    coachGrowth: z.number(),
    gmvGrowth: z.number(),
    sessionGrowth: z.number()
  }),
  lastUpdated: z.string().datetime()
})

// System Health Schema
export const SystemHealthSchema = z.object({
  ulid: z.string(),
  status: z.number(), // 1 = healthy, 2 = degraded, 3 = critical
  activeSessions: z.number(),
  pendingReviews: z.number(),
  securityAlerts: z.number(),
  uptime: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// System Activity Schema
export const SystemActivitySchema = z.object({
  ulid: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// System Alert Schema
export const SystemAlertSchema = z.object({
  ulid: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// User Analytics Schema
export const UserAnalyticsSchema = z.object({
  usersByRole: z.object({
    mentee: z.number(),
    coach: z.number(),
    admin: z.number(),
  }),
  usersByStatus: z.object({
    active: z.number(),
    inactive: z.number(),
    suspended: z.number(),
  }),
  revenueMetrics: z.object({
    totalRevenue: z.number(),
    monthlyRevenue: z.number(),
    averageSessionValue: z.number(),
  }),
  sessionMetrics: z.object({
    totalSessions: z.number(),
    completionRate: z.number(),
    cancelationRate: z.number(),
  }),
  totalLogins: z.number(),
  averageSessionDuration: z.number(),
  activeUsers: z.object({
    daily: z.number(),
    weekly: z.number(),
    monthly: z.number()
  }),
  retentionRate: z.number(),
  churnRate: z.number(),
  lastUpdated: z.string().datetime()
})

// Dashboard Data Schema
export const DashboardDataSchema = z.object({
  systemHealth: SystemHealthSchema,
  metrics: SystemMetricsSchema,
  recentActivity: z.array(SystemActivitySchema),
  systemAlerts: z.array(SystemAlertSchema)
})

// Update User Status Schema
export const UpdateUserStatusSchema = z.object({
  userUlid: z.string(),
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().optional()
})

// Inferred Types
export type SystemMetrics = z.infer<typeof SystemMetricsSchema>
export type SystemHealth = z.infer<typeof SystemHealthSchema>
export type SystemActivity = z.infer<typeof SystemActivitySchema>
export type SystemAlert = z.infer<typeof SystemAlertSchema>
export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>
export type DashboardData = z.infer<typeof DashboardDataSchema>
export type UpdateUserStatus = z.infer<typeof UpdateUserStatusSchema> 