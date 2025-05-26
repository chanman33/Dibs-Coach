'use server'

import { z } from 'zod'
import { createServerAuthClient } from '@/utils/auth/auth-client'
import { generateUlid } from '@/utils/ulid'
import { RealEstateDomain } from '@prisma/client'
import { NextResponse } from 'next/server'

const CoachRequestSchema = z.object({
  requestDetails: z.string().min(1, "Request details are required."),
  preferredDomain: z.nativeEnum(RealEstateDomain).optional(),
  preferredSkills: z.array(z.string()).optional(),
})

export async function createCoachRequest(formData: FormData) {
  const supabase = createServerAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      data: null,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'User is not authenticated.',
      },
    }
  }

  const rawFormData = {
    requestDetails: formData.get('requestDetails'),
    preferredDomain: formData.get('preferredDomain'),
    preferredSkills: formData.getAll('preferredSkills').filter(skill => skill !== ''),
  }

  const validation = CoachRequestSchema.safeParse(rawFormData)

  if (!validation.success) {
    console.error('[VALIDATION_ERROR]', {
      error: validation.error,
      stack: validation.error.stack,
      timestamp: new Date().toISOString(),
    })
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid form data',
        details: validation.error.flatten(),
      },
    }
  }

  const { requestDetails, preferredDomain, preferredSkills } = validation.data
  const ulid = generateUlid()

  try {
    const { data, error } = await supabase
      .from('CoachRequest')
      .insert([
        {
          ulid,
          userUlid: user.id, // Assuming user.id is the ULID, adjust if it's Clerk ID and needs conversion
          requestDetails,
          preferredDomain: preferredDomain || null,
          preferredSkills: preferredSkills || [],
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[DB_INSERT_ERROR]', { error, timestamp: new Date().toISOString() })
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to create coach request.',
        },
      }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('[CREATE_COACH_REQUEST_ERROR]', {
      error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred.',
      },
    }
  }
} 