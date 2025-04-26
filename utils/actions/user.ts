/**
 * Basic User CRUD operations for fundamental user data
 * For profile-specific operations including domains, languages, etc.,
 * use functions from user-profile-actions.ts instead
 * 
 * This file should be used for simple, low-level database operations on the User table
 */
'use server'

import { createAuthClient } from "@/utils/auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { User, UserUpdate } from "@/utils/types/user"
import type { ApiResponse } from "@/utils/types/api"

// Empty params type for actions that don't need parameters
type EmptyParams = Record<string, never>

// Type to match database response format
interface UserDbResponse {
  ulid: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  systemRole: string;
  capabilities: string[] | null;
  isCoach: boolean;
  isMentee: boolean;
  status: string;
  profileImageUrl: string | null;
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  // Add any other fields that come back from database
}

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

export const fetchUserProfile = withServerAction<UserDbResponse, EmptyParams>(
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

// Use a more general type for update to avoid enum type conflicts
interface BasicUserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  displayName?: string;
  bio?: string | null;
  profileImageUrl?: string;
  status?: string;
  // Don't include capabilities to avoid type conflicts
}

export const updateBasicUserData = withServerAction<UserDbResponse, BasicUserUpdate>(
  async (params, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Add updatedAt timestamp and use type assertion to avoid type conflicts
      const updateData = {
        ...params,
        updatedAt: new Date().toISOString()
      } as any; // Use type assertion to bypass TypeScript checking

      const { data, error } = await supabase
        .from('User')
        .update(updateData)
        .eq('ulid', userUlid)
        .select()
        .single()

      if (error) {
        console.error('[UPDATE_BASIC_USER_DATA_ERROR]', { userUlid, params, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user data',
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_BASIC_USER_DATA_ERROR]', error)
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