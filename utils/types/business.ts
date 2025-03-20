import { z } from 'zod'

// Business Analytics Types
export interface BusinessStats {
  teamMemberCount: number
  teamMemberGrowth: number
  activeInCoaching: number
  participationRate: number
  coachingBudget: number
  budgetUtilized: number
  scheduledSessions: number
  upcomingPeriod: string
}

// Schema for business stats validation
export const businessStatsSchema = z.object({
  teamMemberCount: z.number().int().nonnegative(),
  teamMemberGrowth: z.number().int(),
  activeInCoaching: z.number().int().nonnegative(),
  participationRate: z.number().min(0).max(100),
  coachingBudget: z.number().nonnegative(),
  budgetUtilized: z.number().min(0).max(100),
  scheduledSessions: z.number().int().nonnegative(),
  upcomingPeriod: z.string()
})

// Business coaching performance metrics
export interface BusinessCoachingMetrics {
  participationRate: number
  completionRate: number
  satisfactionScore: number
}

export const businessCoachingMetricsSchema = z.object({
  participationRate: z.number().min(0).max(100),
  completionRate: z.number().min(0).max(100),
  satisfactionScore: z.number().min(0).max(100)
})

// Team performance metrics for coaches
export interface TeamPerformance {
  id: string
  name: string
  avatar: string
  sessions: number
  ratings: number
  clientGrowth: number
}

// Export type from schema
export type BusinessStatsData = z.infer<typeof businessStatsSchema>
export type BusinessCoachingMetricsData = z.infer<typeof businessCoachingMetricsSchema> 