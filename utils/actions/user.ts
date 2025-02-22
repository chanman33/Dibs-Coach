'use server'

import { createAuthClient } from "@/utils/auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { User, UserUpdate } from "@/utils/types/user"
import type { ApiResponse } from "@/utils/types/api"

// Empty params type for actions that don't need parameters
type EmptyParams = Record<string, never>

export const fetchBasicUserData = withServerAction<{ firstName: string | null; lastName: string | null; bio: string | null }, EmptyParams>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data, error } = await supabase
        .from('User')
        .select('firstName, lastName, bio')
        .eq('ulid', userUlid)
        .single()

      if (error) {
        console.error('[FETCH_USER_ERROR]', { userUlid, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data',
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_USER_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const fetchUserProfile = withServerAction<User, EmptyParams>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data, error } = await supabase
        .from('User')
        .select(`
          ulid,
          userId,
          email,
          firstName,
          lastName,
          phoneNumber,
          displayName,
          bio,
          systemRole,
          capabilities,
          isCoach,
          isMentee,
          status,
          profileImageUrl,
          stripeCustomerId,
          stripeConnectAccountId,
          createdAt,
          updatedAt
        `)
        .eq('ulid', userUlid)
        .single()

      if (error) {
        console.error('[FETCH_USER_PROFILE_ERROR]', { userUlid, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user profile',
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_USER_PROFILE_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
)

export const updateUserProfile = withServerAction<User, UserUpdate>(
  async (params, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data, error } = await supabase
        .from('User')
        .update(params)
        .eq('ulid', userUlid)
        .select()
        .single()

      if (error) {
        console.error('[UPDATE_USER_PROFILE_ERROR]', { userUlid, params, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user profile',
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_USER_PROFILE_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
) 