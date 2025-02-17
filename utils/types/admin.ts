import { z } from "zod"
import { ulidSchema } from './auth'

// System Health Types
export const SystemHealthSchema = z.object({
  ulid: ulidSchema,
  status: z.enum(['healthy', 'degraded', 'down']),
  uptime: z.number(),
  lastChecked: z.string().datetime(),
  services: z.record(z.string(), z.enum(['up', 'down', 'degraded'])),
  metrics: z.record(z.string(), z.number()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
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

// Admin Metrics Schema
export const AdminMetricsSchema = z.object({
  ulid: ulidSchema,
  totalUsers: z.number(),
  activeUsers: z.number(),
  newUsers: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  canceledSessions: z.number(),
  totalRevenue: z.number(),
  periodRevenue: z.number(),
  conversionRate: z.number(),
  retentionRate: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type AdminMetrics = z.infer<typeof AdminMetricsSchema>

// Admin Activity Schema
export const AdminActivitySchema = z.object({
  ulid: ulidSchema,
  adminUlid: ulidSchema,
  type: z.enum(['user_action', 'system_event', 'error', 'security']),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type AdminActivity = z.infer<typeof AdminActivitySchema>

// System Alert Schema
export const SystemAlertSchema = z.object({
  ulid: ulidSchema,
  type: z.enum(['security', 'performance', 'error', 'notification']),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string(),
  status: z.enum(['active', 'resolved', 'dismissed']),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type SystemAlert = z.infer<typeof SystemAlertSchema>

// Dashboard Data Schema
export const DashboardDataSchema = z.object({
  systemHealth: SystemHealthSchema,
  metrics: AdminMetricsSchema,
  recentActivity: z.array(AdminActivitySchema),
  systemAlerts: z.array(SystemAlertSchema)
})

export type DashboardData = z.infer<typeof DashboardDataSchema>

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

// User Analytics Schema
export const UserAnalyticsSchema = z.object({
  ulid: ulidSchema,
  userUlid: ulidSchema,
  sessionsCompleted: z.number(),
  sessionsScheduled: z.number(),
  totalSpent: z.number(),
  lastSessionDate: z.string().datetime().nullable(),
  averageRating: z.number().nullable(),
  engagementScore: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>

// Request/Response Schemas
export const UpdateUserStatusSchema = z.object({
  userUlid: ulidSchema,
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().optional()
})

export type UpdateUserStatus = z.infer<typeof UpdateUserStatusSchema>

// Revenue Types
export const RevenueOverviewSchema = z.object({
  totalRevenue: z.number(),
  netRevenue: z.number(),
  platformFees: z.number(),
  coachPayouts: z.number(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime()
})

export const RevenueTrendSchema = z.object({
  date: z.string().datetime(),
  revenue: z.number(),
  platformFees: z.number(),
  coachPayouts: z.number()
})

export const TransactionDistributionSchema = z.object({
  type: z.string(),
  value: z.number(),
  count: z.number()
})

export const CoachRevenueSchema = z.object({
  coachUlid: ulidSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  sessions: z.number(),
  revenue: z.number(),
  avgRating: z.number().nullable()
})

// Transaction types
export const TransactionTypeEnum = z.enum([
  'session_payment',
  'bundle_payment',
  'payout',
  'refund'
])

export const TransactionStatusEnum = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded'
])

export const PayoutStatusEnum = z.enum([
  'pending',
  'processing',
  'completed',
  'failed'
])

export type TransactionType = z.infer<typeof TransactionTypeEnum>
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>
export type PayoutStatus = z.infer<typeof PayoutStatusEnum>

export const TransactionHistorySchema = z.object({
  ulid: z.string(),
  type: TransactionTypeEnum,
  status: TransactionStatusEnum,
  amount: z.number(),
  platformFee: z.number(),
  coachPayout: z.number(),
  createdAt: z.string(),
  coach: z.object({
    ulid: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  }),
  payer: z.object({
    ulid: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  })
})

export type TransactionHistory = z.infer<typeof TransactionHistorySchema>

export const PayoutHistorySchema = z.object({
  ulid: z.string(),
  status: PayoutStatusEnum,
  amount: z.number(),
  currency: z.string(),
  processedAt: z.string().nullable(),
  scheduledDate: z.string(),
  coach: z.object({
    ulid: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  })
})

export type PayoutHistory = z.infer<typeof PayoutHistorySchema>

// Export types
export type RevenueOverview = z.infer<typeof RevenueOverviewSchema>
export type RevenueTrend = z.infer<typeof RevenueTrendSchema>
export type TransactionDistribution = z.infer<typeof TransactionDistributionSchema>
export type CoachRevenue = z.infer<typeof CoachRevenueSchema>

// Query parameter schemas
export const RevenueDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const RevenueTrendQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const PaginationQuerySchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10)
}) 