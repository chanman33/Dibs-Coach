import { z } from "zod";

// Enum definitions
export const GOAL_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE'
} as const;

export const GOAL_TYPE = {
  SALES_VOLUME: 'sales_volume',
  COMMISSION_INCOME: 'commission_income',
  GCI: 'gci',
  AVG_SALE_PRICE: 'avg_sale_price',
  LISTINGS: 'listings',
  BUYER_TRANSACTIONS: 'buyer_transactions',
  CLOSED_DEALS: 'closed_deals',
  DAYS_ON_MARKET: 'days_on_market',
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
  COACHING_SESSIONS: 'coaching_sessions',
  MENTEE_SATISFACTION: 'mentee_satisfaction',
  SESSION_REVENUE: 'session_revenue',
  SESSION_COMPLETION: 'session_completion',
  RESPONSE_TIME: 'response_time',
  MENTEE_MILESTONES: 'mentee_milestones',
  GROUP_SESSIONS: 'group_sessions',
  ACTIVE_MENTEES: 'active_mentees',
  CUSTOM: 'custom'
} as const;

export const GOAL_FORMAT = {
  NUMBER: 'NUMBER',
  CURRENCY: 'CURRENCY',
  PERCENTAGE: 'PERCENTAGE',
  TIME: 'TIME'
} as const;

// Type definitions
export type GoalStatus = typeof GOAL_STATUS[keyof typeof GOAL_STATUS];
export type GoalType = typeof GOAL_TYPE[keyof typeof GOAL_TYPE];
export type GoalFormat = typeof GOAL_FORMAT[keyof typeof GOAL_FORMAT];

// Goal Schema for validation
export const GoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  // target will be stored as JSON { value: number } in the database
  target: z.number().min(0, "Target must be a positive number"),
  // current will be stored as progress JSON { value: number } in the database
  current: z.number().min(0, "Current value must be a positive number"),
  // deadline will be stored as dueDate in the database
  deadline: z.string().min(1, "Deadline is required"),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).default(GOAL_STATUS.IN_PROGRESS),
  milestones: z.array(
    z.object({
      title: z.string().min(1, "Milestone title is required"),
      completed: z.boolean().default(false)
    })
  ).optional().default([]),
  growthPlan: z.string().optional(),
});

// Update Goal Schema for validation
export const UpdateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  // target will be stored as JSON { value: number } in the database
  target: z.number().min(0, "Target must be a positive number").optional(),
  // current will be stored as progress JSON { value: number } in the database
  current: z.number().min(0, "Current value must be a positive number").optional(),
  // deadline will be stored as dueDate in the database
  deadline: z.string().min(1, "Deadline is required").optional(),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).optional(),
  milestones: z.array(
    z.object({
      title: z.string().min(1, "Milestone title is required"),
      completed: z.boolean().default(false)
    })
  ).optional(),
  growthPlan: z.string().optional(),
});

// Add to this file the additional properties needed for milestones and growth plan
export interface Milestone {
  title: string;
  completed: boolean;
}

// Form types
export interface GoalFormValues {
  title: string;
  description?: string;
  target: number;
  current: number;
  deadline: string;
  type: GoalType;
  status?: GoalStatus;
  milestones?: Milestone[];
  growthPlan?: string;
}

// Database types
export interface Goal {
  ulid: string;
  userUlid: string;
  title: string;
  description: string | null;
  target: string; // JSON string in DB
  progress: string; // JSON string in DB
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  type: GoalType;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

// Client-side Goal interface for backward compatibility
export interface ClientGoal {
  ulid: string;
  userUlid: string;
  organizationUlid?: string; // Added for organization goals
  title: string;
  description: string | null;
  target: number; // Parsed from JSON
  current: number; // Parsed from JSON
  deadline: string; // Renamed from dueDate
  type: GoalType;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  organization?: { // Added for organization details
    name: string;
    type?: string;
    industry?: string;
  };
  user?: { // Added for user details
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  milestones?: Milestone[];
  growthPlan?: string;
}

// Input types
export type GoalInput = z.infer<typeof GoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>; 