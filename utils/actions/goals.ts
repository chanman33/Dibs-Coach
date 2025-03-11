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
  ClientGoal,
} from '@/utils/types/goals'
import { z } from 'zod'

// Define a type that matches the database schema
interface DatabaseGoal {
  ulid: string;
  userUlid: string;
  title: string;
  description: string | null;
  target: string; // JSON string
  progress: string; // JSON string
  dueDate: string;
  startDate: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Create goal
export const createGoal = withServerAction<ClientGoal, GoalInput>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = GoalSchema.parse(data)
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // Create goal with ULID - use type casting to bypass type checking
      const goalData = {
        ulid: generateUlid(),
        userUlid,
        title: validatedData.title,
        description: validatedData.description,
        target: JSON.stringify({ value: validatedData.target }),
        progress: JSON.stringify({ value: validatedData.current }),
        dueDate: new Date(validatedData.deadline).toISOString(),
        startDate: now,
        type: validatedData.type,
        status: validatedData.status,
        createdAt: now,
        updatedAt: now
      } as any; // Use type assertion to bypass type checking
      
      const { data: goal, error: goalError } = await supabase
        .from('Goal')
        .insert(goalData)
        .select()
        .single() as any; // Use type assertion for the response

      if (goalError) {
        console.error('[CREATE_GOAL_ERROR]', { 
          userUlid, 
          error: goalError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create goal'
          }
        }
      }

      // Transform database goal to client goal
      const clientGoal: ClientGoal = {
        ulid: goal.ulid,
        userUlid: goal.userUlid,
        title: goal.title,
        description: goal.description,
        target: JSON.parse(goal.target)?.value || 0,
        current: JSON.parse(goal.progress)?.value || 0,
        deadline: goal.dueDate,
        type: goal.type,
        status: goal.status,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }

      return {
        data: clientGoal,
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
export const updateGoal = withServerAction<ClientGoal, { goalUlid: string } & UpdateGoalInput>(
  async (data, { userUlid }) => {
    try {
      const { goalUlid, ...updateData } = data
      
      // Validate input data
      const validatedData = UpdateGoalSchema.parse(updateData)
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // Create update data with proper typing
      const updates = {
        title: validatedData.title,
        description: validatedData.description,
        // Convert target from number to JSON if provided
        target: validatedData.target ? JSON.stringify({ value: validatedData.target }) : undefined,
        // Convert current to progress JSON if provided
        progress: validatedData.current ? JSON.stringify({ value: validatedData.current }) : undefined,
        // Use dueDate instead of deadline
        dueDate: validatedData.deadline ? new Date(validatedData.deadline).toISOString() : undefined,
        type: validatedData.type,
        status: validatedData.status,
        updatedAt: now
      } as any; // Use type assertion to bypass type checking

      // Update goal
      const { data: goal, error: goalError } = await supabase
        .from('Goal')
        .update(updates)
        .eq('ulid', goalUlid)
        .eq('userUlid', userUlid)
        .select()
        .single() as any; // Use type assertion for the response

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

      // Transform database goal to client goal
      const clientGoal: ClientGoal = {
        ulid: goal.ulid,
        userUlid: goal.userUlid,
        title: goal.title,
        description: goal.description,
        target: JSON.parse(goal.target)?.value || 0,
        current: JSON.parse(goal.progress)?.value || 0,
        deadline: goal.dueDate,
        type: goal.type,
        status: goal.status,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }

      return {
        data: clientGoal,
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
      const { error } = await supabase
        .from('Goal')
        .delete()
        .eq('ulid', data.goalUlid)
        .eq('userUlid', userUlid)

      if (error) {
        console.error('[DELETE_GOAL_ERROR]', { 
          userUlid, 
          goalUlid: data.goalUlid, 
          error,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
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
export const fetchGoals = withServerAction<ClientGoal[], {}>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Fetch goals
      const { data: goals, error } = await supabase
        .from('Goal')
        .select('*')
        .eq('userUlid', userUlid)
        .order('createdAt', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch goals: ${error.message}`)
      }

      // Transform database goals to client goals
      const clientGoals = goals.map(dbGoal => {
        // Parse JSON fields
        let targetValue = 0
        let currentValue = 0
        
        try {
          if ((dbGoal as any).target) {
            const targetObj = typeof (dbGoal as any).target === 'string' 
              ? JSON.parse((dbGoal as any).target) 
              : (dbGoal as any).target
            targetValue = targetObj.value || 0
          }
        } catch (e) {
          console.error('Error parsing target JSON:', e)
        }
        
        try {
          if ((dbGoal as any).progress) {
            const progressObj = typeof (dbGoal as any).progress === 'string' 
              ? JSON.parse((dbGoal as any).progress) 
              : (dbGoal as any).progress
            currentValue = progressObj.value || 0
          }
        } catch (e) {
          console.error('Error parsing progress JSON:', e)
        }

        // Transform to client format
        return {
          ulid: dbGoal.ulid,
          userUlid: dbGoal.userUlid,
          title: dbGoal.title,
          description: dbGoal.description,
          target: targetValue,
          current: currentValue,
          deadline: (dbGoal as any).dueDate,
          type: dbGoal.type,
          status: dbGoal.status,
          createdAt: dbGoal.createdAt,
          updatedAt: dbGoal.updatedAt
        } as ClientGoal;
      });

      return { data: clientGoals, error: null };
    } catch (error) {
      console.error('[FETCH_GOALS_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch goals',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 