import { z } from 'zod'

// Business data visualization components
export interface StatsCard {
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
  description: string
}

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
  isBudgetSet: boolean
  coachingSessions: StatsCard
  activeCoaches: StatsCard
  employeeParticipation: StatsCard
  avgSessionRating: StatsCard
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
  totalSessions: number
  activeCoaches: number
  averageRating: number
  totalSpent: number
  currency: string
}

export const businessCoachingMetricsSchema = z.object({
  totalSessions: z.number().nonnegative(),
  activeCoaches: z.number().nonnegative(),
  averageRating: z.number().min(0).max(5),
  totalSpent: z.number().nonnegative(),
  currency: z.string()
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

// Team effectiveness metrics for business impact
export interface TopFocusArea {
  area: string
  count: number
}

export interface TeamEffectivenessMetrics {
  employeeParticipation: number // percentage of employees using coaching
  averageSessionsPerEmployee: number
  goalsAchievementRate: number // percentage of goals achieved
  employeeRetention: number // retention rate for employees in coaching
  skillGrowthRate: number // reported skill improvement
  employeeSatisfaction: number // satisfaction with coaching program
  topFocusAreas: TopFocusArea[] // top focus areas with counts
  scheduledSessionsNext30Days: number // total sessions scheduled in next 30 days
}

export const teamEffectivenessSchema = z.object({
  employeeParticipation: z.number().min(0).max(100),
  averageSessionsPerEmployee: z.number().nonnegative(),
  goalsAchievementRate: z.number().min(0).max(100),
  employeeRetention: z.number().min(0).max(100),
  skillGrowthRate: z.number().min(0).max(100),
  employeeSatisfaction: z.number().min(0).max(100),
  topFocusAreas: z.array(
    z.object({
      area: z.string(),
      count: z.number().nonnegative()
    })
  ),
  scheduledSessionsNext30Days: z.number().nonnegative()
})

// Recent coaching sessions for business dashboard
export interface RecentCoachingSession {
  id: string
  coachName: string
  coachAvatar: string
  sessionType: string
  sessionDate: string
  status: string
}

export const recentCoachingSessionSchema = z.object({
  id: z.string(),
  coachName: z.string(),
  coachAvatar: z.string().optional(),
  sessionType: z.string(),
  sessionDate: z.string(),
  status: z.string()
})

// Upcoming training programs for business dashboard
export interface UpcomingTraining {
  id: string
  title: string
  date: string
  timeWithTZ: string 
  attendees: number
  iconType: 'graduation' | 'calendar' | 'target'
}

export const upcomingTrainingSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  timeWithTZ: z.string(),
  attendees: z.number().int().nonnegative(),
  iconType: z.enum(['graduation', 'calendar', 'target'])
})

// Export type from schema
export type BusinessStatsData = z.infer<typeof businessStatsSchema>
export type BusinessCoachingMetricsData = z.infer<typeof businessCoachingMetricsSchema>
export type RecentCoachingSessionData = z.infer<typeof recentCoachingSessionSchema>
export type UpcomingTrainingData = z.infer<typeof upcomingTrainingSchema> 