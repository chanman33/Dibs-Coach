import { z } from "zod";

// Goal status enum
export const GOAL_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE'
} as const;

export type GoalStatus = typeof GOAL_STATUS[keyof typeof GOAL_STATUS];

// Goal types enum
export const GOAL_TYPE = {
  SALES_VOLUME: 'sales_volume',
  COMMISSION_INCOME: 'commission_income',
  GCI: 'gci',
  AVG_SALE_PRICE: 'avg_sale_price',
  LISTINGS: 'listings',
  BUYER_TRANSACTIONS: 'buyer_transactions',
  CLOSED_DEALS: 'closed_deals',
  DAYS_ON_MARKET: 'days_on_market',
  COACHING_SESSIONS: 'coaching_sessions',
  GROUP_SESSIONS: 'group_sessions',
  SESSION_REVENUE: 'session_revenue',
  ACTIVE_MENTEES: 'active_mentees',
  MENTEE_SATISFACTION: 'mentee_satisfaction',
  RESPONSE_TIME: 'response_time',
  SESSION_COMPLETION: 'session_completion',
  MENTEE_MILESTONES: 'mentee_milestones',
  NEW_CLIENTS: 'new_clients',
  REFERRALS: 'referrals',
  CLIENT_RETENTION: 'client_retention',
  REVIEWS: 'reviews',
  MARKET_SHARE: 'market_share',
  TERRITORY_EXPANSION: 'territory_expansion',
  SOCIAL_MEDIA: 'social_media',
  WEBSITE_TRAFFIC: 'website_traffic',
  CERTIFICATIONS: 'certifications',
  TRAINING_HOURS: 'training_hours',
  NETWORKING_EVENTS: 'networking_events',
  CUSTOM: 'custom'
} as const;

export type GoalType = typeof GOAL_TYPE[keyof typeof GOAL_TYPE];

// Target and Progress types
export type GoalTarget = {
  value: number;
  unit?: string;
};

export type GoalProgress = {
  value: number;
  unit?: string;
  lastUpdated?: string;
};

// Milestone type
export interface Milestone {
  title: string;
  completed: boolean;
}

// Basic goal schema
export const goalSchema = z.object({
  ulid: z.string().optional(),
  userUlid: z.string().optional(),
  organizationUlid: z.string().optional(),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).default(GOAL_STATUS.IN_PROGRESS),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  target: z.object({
    value: z.number(),
    unit: z.string().optional()
  }).optional(),
  progress: z.object({
    value: z.number(),
    unit: z.string().optional(),
    lastUpdated: z.string().optional()
  }).optional(),
  startDate: z.date(),
  dueDate: z.date(),
  completedAt: z.date().optional().nullable(),
  milestones: z.array(
    z.object({
      title: z.string().min(1, "Milestone title is required"),
      completed: z.boolean().default(false)
    })
  ).optional(),
  growthPlan: z.string().optional(),
});

// Create goal schema
export const createGoalSchema = goalSchema.omit({ 
  ulid: true,
  completedAt: true,
  status: true
});

// Update goal schema
export const updateGoalSchema = goalSchema.partial().omit({
  ulid: true,
});

// Get goals schema
export const getGoalsSchema = z.object({
  userUlid: z.string().optional(),
  organizationUlid: z.string().optional(),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).optional(),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]).optional(),
});

// Goal schema with relationships
export const goalWithRelationsSchema = goalSchema.extend({
  user: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string(),
    displayName: z.string().optional(),
    profileImageUrl: z.string().optional(),
  }).optional(),
  organization: z.object({
    name: z.string(),
  }).optional(),
});

// Types based on schemas
export type Goal = z.infer<typeof goalSchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type GetGoals = z.infer<typeof getGoalsSchema>;
export type GoalWithRelations = z.infer<typeof goalWithRelationsSchema>; 