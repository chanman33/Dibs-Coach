import { z } from 'zod'

// System Metrics Schema
export const SystemMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  activeCoaches: z.number(),
  pendingCoaches: z.number(),
  monthlyRevenue: z.number(),
  totalRevenue: z.number(),
  metrics: z.object({
    userGrowth: z.number(),
    coachGrowth: z.number(),
    revenueGrowth: z.number(),
    sessionGrowth: z.number()
  }),
  lastUpdated: z.string().datetime()
})

// System Health Schema
export const SystemHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'critical']),
  uptime: z.number(),
  responseTime: z.number(),
  errorRate: z.number(),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  lastChecked: z.string().datetime(),
  issues: z.array(z.string())
})

// System Activity Schema
export const SystemActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'coach', 'session', 'payment', 'system']),
  action: z.string(),
  description: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional()
})

// System Alert Schema
export const SystemAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  status: z.enum(['active', 'resolved', 'dismissed']),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  category: z.enum(['performance', 'security', 'availability', 'other'])
})

// User Analytics Schema
export const UserAnalyticsSchema = z.object({
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