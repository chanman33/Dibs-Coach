import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ROLES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Validation schemas
const CoachApplicationSchema = z.object({
  experience: z.string().min(1, 'Experience is required'),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required')
})

const UpdateApplicationSchema = z.object({
  applicationUlid: ulidSchema,
  status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().optional()
})

interface CoachApplication {
  ulid: string
  applicantUlid: string
  reviewerUlid: string | null
  status: 'pending' | 'approved' | 'rejected'
  experience: string
  specialties: string[]
  notes: string | null
  applicationDate: string
  reviewDate: string | null
  createdAt: string
  updatedAt: string
}

// POST /api/user/coach-application - Submit new application
export const POST = withApiAuth<CoachApplication>(async (req, { userUlid }) => {
  try {
    const body = await req.json()
    const validatedData = CoachApplicationSchema.parse(body)
    
    const supabase = await createAuthClient()

    // Create coach application
    const { data: application, error: applicationError } = await supabase
      .from('CoachApplication')
      .insert({
        applicantUlid: userUlid,
        status: 'pending',
        experience: validatedData.experience,
        specialties: validatedData.specialties,
        applicationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('[COACH_APPLICATION_ERROR] Application creation:', applicationError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create coach application',
          details: applicationError
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CoachApplication>>({
      data: application,
      error: null
    })
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid application data',
          details: error.flatten()
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process coach application',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
})

// GET /api/user/coach-application - Fetch applications (admin only)
export const GET = withApiAuth<CoachApplication[]>(async (req, { role }) => {
  try {
    if (role !== ROLES.ADMIN) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can view applications'
        }
      }, { status: 403 })
    }

    const supabase = await createAuthClient()

    const { data: applications, error: applicationsError } = await supabase
      .from('CoachApplication')
      .select(`
        *,
        applicant:User!CoachApplication_applicantUlid_fkey (
          ulid,
          email,
          firstName,
          lastName,
          role
        ),
        reviewer:User!CoachApplication_reviewerUlid_fkey (
          ulid,
          email,
          firstName,
          lastName
        )
      `)
      .order('applicationDate', { ascending: false })

    if (applicationsError) {
      console.error('[COACH_APPLICATION_ERROR] Fetch applications:', applicationsError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch coach applications',
          details: applicationsError
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CoachApplication[]>>({
      data: applications,
      error: null
    })
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch coach applications',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.ADMIN] })

// PATCH /api/user/coach-application - Update application status (admin only)
export const PATCH = withApiAuth<CoachApplication>(async (req, { userUlid, role }) => {
  try {
    if (role !== ROLES.ADMIN) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can update applications'
        }
      }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = UpdateApplicationSchema.parse(body)
    
    const supabase = await createAuthClient()

    // Start a transaction for all updates
    const { data: application, error: applicationError } = await supabase.rpc(
      'update_coach_application',
      {
        p_application_ulid: validatedData.applicationUlid,
        p_status: validatedData.status,
        p_notes: validatedData.notes,
        p_reviewer_ulid: userUlid,
        p_review_date: new Date().toISOString()
      }
    )

    if (applicationError) {
      console.error('[COACH_APPLICATION_ERROR] Update application:', applicationError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update coach application',
          details: applicationError
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CoachApplication>>({
      data: application,
      error: null
    })
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: error.flatten()
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update coach application',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.ADMIN] }) 