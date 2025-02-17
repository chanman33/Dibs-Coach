'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Goal validation schemas
const GoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  target: z.number().min(0, 'Target must be a positive number').transform(val => Number(val.toFixed(2))),
  current: z.number().min(0, 'Current value must be a positive number').transform(val => Number(val.toFixed(2))),
  deadline: z.string().min(1, 'Deadline is required'),
  type: z.enum([
    // Coaching & Mentorship
    'coaching_sessions',
    'group_sessions',
    'session_revenue',
    'active_mentees',
    'mentee_satisfaction',
    'response_time',
    'session_completion',
    'mentee_milestones',
    
    // Financial Goals
    'sales_volume',
    'commission_income',
    'gci',
    'avg_sale_price',
    
    // Transaction Goals
    'listings',
    'buyer_transactions',
    'closed_deals',
    'days_on_market',
    
    // Client Goals
    'new_clients',
    'referrals',
    'client_retention',
    'reviews',
    
    // Market Presence
    'market_share',
    'territory_expansion',
    'social_media',
    'website_traffic',
    
    // Professional Development
    'certifications',
    'training_hours',
    'networking_events',
    
    'custom'
  ]),
  status: z.enum(['in_progress', 'completed', 'overdue']).default('in_progress'),
})

const UpdateGoalSchema = GoalSchema.partial()

// Types
type GoalInput = z.infer<typeof GoalSchema>
type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>

interface Goal {
  ulid: string
  userUlid: string
  title: string
  description: string | null
  target: number
  current: number
  deadline: string
  type: GoalInput['type']
  status: 'in_progress' | 'completed' | 'overdue'
  format: 'number' | 'currency' | 'percentage' | 'time'
  createdAt: string
  updatedAt: string
}

// Helper function to determine format based on goal type
function getFormatForGoalType(type: GoalInput['type']): Goal['format'] {
  switch (type) {
    // Currency format
    case 'sales_volume':
    case 'commission_income':
    case 'gci':
    case 'avg_sale_price':
    case 'session_revenue':
      return 'currency'
    
    // Percentage format
    case 'market_share':
    case 'client_retention':
    case 'mentee_satisfaction':
    case 'session_completion':
      return 'percentage'
    
    // Time format (hours)
    case 'response_time':
    case 'training_hours':
    case 'days_on_market':
      return 'time'
    
    // Number format (default)
    default:
      return 'number'
  }
}

// Create goal
export const createGoal = withServerAction<Goal, GoalInput>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = GoalSchema.parse(data)
      const format = getFormatForGoalType(validatedData.type)
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // Create goal
      const { data: goal, error: goalError } = await supabase
        .from('Goal')
        .insert({
          userUlid,
          title: validatedData.title,
          description: validatedData.description,
          target: validatedData.target,
          current: validatedData.current,
          deadline: new Date(validatedData.deadline).toISOString(),
          type: validatedData.type,
          status: validatedData.status,
          format,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single() as { data: Goal | null, error: any }

      if (goalError) {
        console.error('[CREATE_GOAL_ERROR]', { userUlid, error: goalError })
        return {
          data: null,
          error: {
            code: 'CREATION_ERROR',
            message: 'Failed to create goal'
          }
        }
      }

      return {
        data: goal,
        error: null
      }
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', error)
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid goal data',
            details: error.flatten()
          }
        }
      }
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Update goal
export const updateGoal = withServerAction<Goal, { goalUlid: string } & UpdateGoalInput>(
  async (data, { userUlid }) => {
    try {
      const { goalUlid, ...updateData } = data
      
      // Validate input data
      const validatedData = UpdateGoalSchema.parse(updateData)
      const format = validatedData.type ? getFormatForGoalType(validatedData.type) : undefined

      const supabase = await createAuthClient()

      // Create update data with proper typing
      const updates = {
        ...validatedData,
        format,
        deadline: validatedData.deadline ? new Date(validatedData.deadline).toISOString() : undefined,
        updatedAt: new Date().toISOString()
      }

      // Update goal
      const { data: goal, error: goalError } = await supabase
        .from('Goal')
        .update(updates)
        .eq('ulid', goalUlid)
        .eq('userUlid', userUlid)
        .select()
        .single() as { data: Goal | null, error: any }

      if (goalError) {
        console.error('[UPDATE_GOAL_ERROR]', { userUlid, goalUlid, error: goalError })
        return {
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update goal'
          }
        }
      }

      return {
        data: goal,
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_GOAL_ERROR]', error)
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid goal data',
            details: error.flatten()
          }
        }
      }
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Delete goal
export const deleteGoal = withServerAction<{ success: true }, { goalUlid: string }>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Delete goal
      const { error: goalError } = await supabase
        .from('Goal')
        .delete()
        .eq('ulid', data.goalUlid)
        .eq('userUlid', userUlid)

      if (goalError) {
        console.error('[DELETE_GOAL_ERROR]', { userUlid, goalUlid: data.goalUlid, error: goalError })
        return {
          data: null,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete goal'
          }
        }
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[DELETE_GOAL_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Fetch goals
export const fetchGoals = withServerAction<Goal[]>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Fetch goals
      const { data: goals, error: goalsError } = await supabase
        .from('Goal')
        .select('*')
        .eq('userUlid', userUlid)
        .order('createdAt', { ascending: false }) as { data: Goal[] | null, error: any }

      if (goalsError) {
        console.error('[FETCH_GOALS_ERROR]', { userUlid, error: goalsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch goals'
          }
        }
      }

      return {
        data: goals || [],
        error: null
      }
    } catch (error) {
      console.error('[FETCH_GOALS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 