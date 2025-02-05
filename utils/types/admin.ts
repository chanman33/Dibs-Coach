import { z } from "zod"

// System Health Types
export const SystemHealthSchema = z.object({
  status: z.number(),
  activeSessions: z.number(),
  pendingReviews: z.number(),
  securityAlerts: z.number(),
  uptime: z.number(),
  lastChecked: z.string().datetime(),
})

export type SystemHealth = z.infer<typeof SystemHealthSchema>

// Key Metrics Types
export const MetricsSchema = z.object({
  totalUsers: z.number(),
  activeCoaches: z.number(),
  monthlyRevenue: z.number(),
  completedSessions: z.number(),
  metrics: z.object({
    userGrowth: z.number(),
    coachGrowth: z.number(),
    revenueGrowth: z.number(),
    sessionGrowth: z.number(),
  }),
  lastUpdated: z.string().datetime(),
})

export type Metrics = z.infer<typeof MetricsSchema>

// Activity Types
export const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum([
    'USER_REGISTRATION',
    'COACH_APPLICATION',
    'SESSION_COMPLETED',
    'USER_REPORT',
    'SYSTEM_EVENT',
  ]),
  title: z.string(),
  description: z.string(),
  timestamp: z.string().datetime(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
})

export type Activity = z.infer<typeof ActivitySchema>

// System Alert Types
export const AlertSchema = z.object({
  id: z.string(),
  type: z.enum([
    'SYSTEM_LOAD',
    'DATABASE',
    'API_PERFORMANCE',
    'SECURITY',
    'INTEGRATION',
  ]),
  title: z.string(),
  message: z.string(),
  severity: z.enum(['SUCCESS', 'WARNING', 'ERROR']),
  timestamp: z.string().datetime(),
})

export type Alert = z.infer<typeof AlertSchema>

// Dashboard Data Schema
export const DashboardDataSchema = z.object({
  systemHealth: SystemHealthSchema,
  metrics: MetricsSchema,
  recentActivity: z.array(ActivitySchema),
  systemAlerts: z.array(AlertSchema),
})

export type DashboardData = z.infer<typeof DashboardDataSchema>

// Admin Metrics Schema
export const AdminMetricsSchema = z.object({
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

export type AdminMetrics = z.infer<typeof AdminMetricsSchema>

// Admin Activity Schema
export const AdminActivitySchema = z.object({
  id: z.number(),
  type: z.enum(["USER", "COACH", "SYSTEM", "SECURITY"]),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["INFO", "WARNING", "ERROR"]),
  createdAt: z.string().datetime(),
})

export type AdminActivity = z.infer<typeof AdminActivitySchema>

// Coach Application Schema
export const CoachApplicationSchema = z.object({
  id: z.number(),
  userDbId: z.number(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  experience: z.string(),
  specialties: z.array(z.string()),
  notes: z.string().nullable(),
  reviewedBy: z.number().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  user: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
  }).optional(),
})

export type CoachApplication = z.infer<typeof CoachApplicationSchema>

// Admin Audit Log Schema
export const AdminAuditLogSchema = z.object({
  id: z.number(),
  adminDbId: z.number(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.number(),
  details: z.record(z.unknown()),
  createdAt: z.string().datetime(),
})

export type AdminAuditLog = z.infer<typeof AdminAuditLogSchema> 