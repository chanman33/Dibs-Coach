'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { generateUlid } from '@/utils/ulid'
import { 
  Goal, 
  GoalInput, 
  UpdateGoalInput,
  GoalSchema,
  UpdateGoalSchema,
} from '@/utils/types/goals'
import { z } from 'zod'

// Create goal
export const createGoal = withServerAction<Goal, GoalInput>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = GoalSchema.parse(data)
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // Create goal with ULID
      const { data: goal, error: goalError } = await supabase
        .from('Goal')
        .insert({
          ulid: generateUlid(),
          userUlid,
          title: validatedData.title,
          description: validatedData.description,
          target: validatedData.target,
          current: validatedData.current,
          deadline: new Date(validatedData.deadline).toISOString(),
          type: validatedData.type,
          status: validatedData.status,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single() as { data: Goal | null, error: any }

      if (goalError) {
        console.error('[CREATE_GOAL_ERROR]', { 
          userUlid, 
          error: goalError,
          timestamp: new Date().toISOString()
        })
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
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
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
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // Create update data with proper typing
      const updates = {
        ...validatedData,
        deadline: validatedData.deadline ? new Date(validatedData.deadline).toISOString() : undefined,
        updatedAt: now
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
        console.error('[UPDATE_GOAL_ERROR]', { 
          userUlid, 
          goalUlid, 
          error: goalError,
          timestamp: new Date().toISOString()
        })
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
      console.error('[UPDATE_GOAL_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
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
        console.error('[DELETE_GOAL_ERROR]', { 
          userUlid, 
          goalUlid: data.goalUlid, 
          error: goalError,
          timestamp: new Date().toISOString()
        })
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
      console.error('[DELETE_GOAL_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
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
        console.error('[FETCH_GOALS_ERROR]', { 
          userUlid, 
          error: goalsError,
          timestamp: new Date().toISOString()
        })
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
      console.error('[FETCH_GOALS_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
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