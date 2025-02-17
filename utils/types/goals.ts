// Shared types for goals and achievements
export interface BaseGoal {
  id: number
  title: string
  target: number
  current: number
  deadline: string
  status: 'in_progress' | 'completed' | 'overdue'
}

export interface MenteeGoal extends BaseGoal {
  type: 'sales' | 'listings' | 'clients' | 'custom'
}

export interface CoachGoal extends BaseGoal {
  type: 'revenue' | 'clients' | 'sessions' | 'retention' | 'custom'
}

export interface BaseAchievement {
  id: number
  title: string
  description: string
  icon: string
}

export interface MenteeAchievement extends BaseAchievement {
  earnedAt: string
  type: 'milestone' | 'performance' | 'learning'
}

export interface CoachAchievement extends BaseAchievement {
  date: string
  type: 'milestone' | 'certification' | 'award'
}

export interface CoachMetrics {
  totalClients: number
  activeClients: number
  sessionCompletionRate: number
  averageRating: number
  clientRetentionRate: number
  revenueGoalProgress: number
  monthlySessionsCompleted: number
  monthlySessionsGoal: number
  positiveReviews: number
  totalReviews: number
}

// Helper function for date handling
export const getAchievementDate = (achievement: MenteeAchievement | CoachAchievement): string => {
  if ('earnedAt' in achievement) {
    return achievement.earnedAt;
  }
  return achievement.date;
}

import { z } from "zod";

export const goalsSchema = z.object({
  salesTarget: z.number().min(0).optional(),
  listingsTarget: z.number().min(0).optional(),
  clientsTarget: z.number().min(0).optional(),
  timeframe: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  customGoals: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type Goals = z.infer<typeof goalsSchema>; 