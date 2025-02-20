'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { z } from 'zod'
import { generateUlid } from '@/utils/ulid'
import type { User } from "@/utils/types/user"

// Validation schema
const updateRealtorProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  yearsExperience: z.number().min(0, "Years of experience must be a positive number"),
  primaryMarket: z.string().min(1, "Primary market is required"),
  bio: z.string().optional().nullable(),
})

type UpdateRealtorProfileInput = z.infer<typeof updateRealtorProfileSchema>

interface RealtorProfileData {
  yearsExperience?: number | null
  primaryMarket?: string | null
}

interface UserProfileData {
  displayName?: string | null
  bio?: string | null
}

interface UpdateProfileParams {
  user: UserProfileData
  realtorProfile: RealtorProfileData
}

export const fetchRealtorProfile = withServerAction<{
  user: UserProfileData & { firstName: string | null; lastName: string | null }
  realtorProfile: RealtorProfileData
}, void>(
  async (params, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Fetch both user and realtor profile data
      const [userResponse, realtorResponse] = await Promise.all([
        supabase
          .from('User')
          .select('firstName, lastName, displayName, bio')
          .eq('ulid', userUlid)
          .single(),
        supabase
          .from('RealtorProfile')
          .select('ulid, yearsExperience, primaryMarket')
          .eq('userUlid', userUlid)
          .single()
      ])

      if (userResponse.error) {
        console.error('[FETCH_USER_ERROR]', { userUlid, error: userResponse.error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user data'
          }
        }
      }

      // RealtorProfile might not exist yet, that's ok
      const data = {
        user: userResponse.data,
        realtorProfile: realtorResponse.data || {}
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_PROFILE_ERROR]', error)
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

export const updateRealtorProfile = withServerAction<void, UpdateProfileParams>(
  async (params, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // First, update the User table
      const userUpdate = await supabase
        .from('User')
        .update({
          displayName: params.user.displayName,
          bio: params.user.bio,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', userUlid)

      if (userUpdate.error) {
        console.error('[UPDATE_USER_ERROR]', { userUlid, error: userUpdate.error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user data'
          }
        }
      }

      // Check if RealtorProfile exists
      const { data: existingProfile } = await supabase
        .from('RealtorProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .single()

      let realtorUpdate
      if (existingProfile) {
        // Update existing profile
        realtorUpdate = await supabase
          .from('RealtorProfile')
          .update({
            ...params.realtorProfile,
            updatedAt: new Date().toISOString()
          })
          .eq('userUlid', userUlid)
      } else {
        // Create new profile
        realtorUpdate = await supabase
          .from('RealtorProfile')
          .insert({
            ulid: generateUlid(),
            userUlid,
            ...params.realtorProfile,
            updatedAt: new Date().toISOString()
          })
      }

      if (realtorUpdate.error) {
        console.error('[UPDATE_REALTOR_ERROR]', { userUlid, error: realtorUpdate.error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update realtor profile'
          }
        }
      }

      return {
        data: null,
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_PROFILE_ERROR]', error)
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