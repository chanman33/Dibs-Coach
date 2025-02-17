"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { ROLES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Validation schemas
const CoachApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  linkedIn: z.string().url().optional(),
  primarySocialMedia: z.string().url().optional(),
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  expertise: z.string().min(1, 'Expertise is required'),
  additionalInfo: z.string().optional(),
  resumeUrl: z.string().url().optional()
})

const ApplicationReviewSchema = z.object({
  applicationUlid: ulidSchema,
  status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().optional()
})

// Response types
type CoachApplication = z.infer<typeof CoachApplicationSchema>

interface ApplicationResponse {
  ulid: string
  status: 'pending' | 'approved' | 'rejected'
  applicant: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  reviewer: {
    ulid: string
    firstName: string | null
    lastName: string | null
  } | null
  experience: string
  specialties: string[]
  notes: string | null
  applicationDate: string
  reviewDate: string | null
  createdAt: string
  updatedAt: string
}

// Database types
interface ApplicationData {
  ulid: string
  status: 'pending' | 'approved' | 'rejected'
  experience: string
  specialties: string[]
  notes: string | null
  applicationDate: string
  reviewDate: string | null
  createdAt: string
  updatedAt: string
  applicant: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  reviewer: {
    ulid: string
    firstName: string | null
    lastName: string | null
  } | null
}

// Submit coach application
export const submitCoachApplication = withServerAction<ApplicationResponse, CoachApplication>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = CoachApplicationSchema.parse(data)

      const supabase = await createAuthClient()

      // Create application record
      const { data: application, error: applicationError } = await supabase
        .from('CoachApplication')
        .insert({
          applicantUlid: userUlid,
          status: 'pending',
          experience: validatedData.yearsOfExperience,
          specialties: [validatedData.expertise],
          resumeUrl: validatedData.resumeUrl,
          additionalInfo: validatedData.additionalInfo,
          applicationDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select(`
          ulid,
          status,
          experience,
          specialties,
          notes,
          applicationDate,
          reviewDate,
          createdAt,
          updatedAt,
          applicant:applicantUlid (
            ulid,
            firstName,
            lastName,
            email
          ),
          reviewer:reviewerUlid (
            ulid,
            firstName,
            lastName
          )
        `)
        .single() as { data: ApplicationData | null, error: any }

      if (applicationError) {
        console.error('[COACH_APPLICATION_ERROR]', { userUlid, error: applicationError })
        return {
          data: null,
          error: {
            code: 'APPLICATION_ERROR',
            message: 'Failed to submit application'
          }
        }
      }

      return {
        data: application,
        error: null
      }
    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error)
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid application data',
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

// Get coach application
export const getCoachApplication = withServerAction<ApplicationResponse>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      const { data: application, error: applicationError } = await supabase
        .from('CoachApplication')
        .select(`
          ulid,
          status,
          experience,
          specialties,
          notes,
          applicationDate,
          reviewDate,
          createdAt,
          updatedAt,
          applicant:applicantUlid (
            ulid,
            firstName,
            lastName,
            email
          ),
          reviewer:reviewerUlid (
            ulid,
            firstName,
            lastName
          )
        `)
        .eq('applicantUlid', userUlid)
        .single() as { data: ApplicationData | null, error: any }

      if (applicationError) {
        console.error('[GET_APPLICATION_ERROR]', { userUlid, error: applicationError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch application'
          }
        }
      }

      return {
        data: application,
        error: null
      }
    } catch (error) {
      console.error('[GET_APPLICATION_ERROR]', error)
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

// Review coach application
export const reviewCoachApplication = withServerAction<ApplicationResponse, z.infer<typeof ApplicationReviewSchema>>(
  async (data, { userUlid, role }) => {
    try {
      // Validate admin role
      if (role !== ROLES.ADMIN) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can review applications'
          }
        }
      }

      // Validate input data
      const validatedData = ApplicationReviewSchema.parse(data)

      const supabase = await createAuthClient()

      // Update application status
      const { data: application, error: updateError } = await supabase
        .from('CoachApplication')
        .update({
          status: validatedData.status,
          reviewerUlid: userUlid,
          notes: validatedData.notes,
          reviewDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', validatedData.applicationUlid)
        .select(`
          ulid,
          status,
          experience,
          specialties,
          notes,
          applicationDate,
          reviewDate,
          createdAt,
          updatedAt,
          applicant:applicantUlid (
            ulid,
            firstName,
            lastName,
            email
          ),
          reviewer:reviewerUlid (
            ulid,
            firstName,
            lastName
          )
        `)
        .single() as { data: ApplicationData | null, error: any }

      if (updateError) {
        console.error('[REVIEW_APPLICATION_ERROR]', { 
          reviewerUlid: userUlid, 
          applicationUlid: validatedData.applicationUlid,
          error: updateError 
        })
        return {
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update application'
          }
        }
      }

      // If approved, update user role to COACH
      if (validatedData.status === 'approved' && application) {
        const { error: roleError } = await supabase
          .from('User')
          .update({ 
            role: ROLES.COACH,
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', application.applicant.ulid)

        if (roleError) {
          console.error('[REVIEW_APPLICATION_ERROR] Failed to update user role:', {
            userUlid: application.applicant.ulid,
            error: roleError
          })
        }
      }

      return {
        data: application,
        error: null
      }
    } catch (error) {
      console.error('[REVIEW_APPLICATION_ERROR]', error)
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
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
  },
  { requiredRoles: [ROLES.ADMIN] }
) 