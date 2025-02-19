'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { z } from 'zod'
import { generateUlid } from '@/utils/ulid'

// Validation schema
const updateRealtorProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  yearsExperience: z.number().min(0, "Years of experience must be a positive number"),
  primaryMarket: z.string().min(1, "Primary market is required"),
  bio: z.string().optional().nullable(),
})

type UpdateRealtorProfileInput = z.infer<typeof updateRealtorProfileSchema>

export const updateRealtorProfile = withServerAction<{ success: true }, UpdateRealtorProfileInput>(
  async (data, { userUlid }) => {
    try {
      console.log('[UPDATE_REALTOR_PROFILE_START]', {
        userUlid,
        data,
        timestamp: new Date().toISOString()
      })

      // Validate input data
      const validatedData = updateRealtorProfileSchema.parse(data)
      const now = new Date().toISOString()

      const supabase = await createAuthClient()

      // First, update the User table with displayName
      const { error: userError } = await supabase
        .from('User')
        .update({
          displayName: validatedData.displayName,
          updatedAt: now
        })
        .eq('ulid', userUlid)

      if (userError) {
        console.error('[UPDATE_USER_ERROR]', {
          userUlid,
          error: userError,
          timestamp: new Date().toISOString()
        })
        throw userError
      }

      // Check if RealtorProfile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('RealtorProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('[FETCH_PROFILE_ERROR]', {
          userUlid,
          error: fetchError,
          timestamp: new Date().toISOString()
        })
        throw fetchError
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('RealtorProfile')
          .update({
            bio: validatedData.bio,
            yearsExperience: validatedData.yearsExperience,
            primaryMarket: validatedData.primaryMarket,
            updatedAt: now
          })
          .eq('ulid', existingProfile.ulid)

        if (updateError) {
          console.error('[UPDATE_PROFILE_ERROR]', {
            userUlid,
            error: updateError,
            timestamp: new Date().toISOString()
          })
          throw updateError
        }
      } else {
        // Create new profile
        const { error: createError } = await supabase
          .from('RealtorProfile')
          .insert({
            ulid: generateUlid(),
            userUlid,
            bio: validatedData.bio,
            yearsExperience: validatedData.yearsExperience,
            primaryMarket: validatedData.primaryMarket,
            propertyTypes: [],
            specializations: [],
            certifications: [],
            languages: [],
            geographicFocus: {},
            marketingAreas: [],
            testimonials: {},
            createdAt: now,
            updatedAt: now
          })

        if (createError) {
          console.error('[CREATE_PROFILE_ERROR]', {
            userUlid,
            error: createError,
            timestamp: new Date().toISOString()
          })
          throw createError
        }
      }

      console.log('[UPDATE_REALTOR_PROFILE_SUCCESS]', {
        userUlid,
        timestamp: new Date().toISOString()
      })

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_REALTOR_PROFILE_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })

      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: error.flatten()
          }
        }
      }

      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 