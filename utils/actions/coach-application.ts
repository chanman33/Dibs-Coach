"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { COACH_APPLICATION_STATUS, CoachApplicationStatus } from '@/utils/types/coach'
import { generateUlid } from '@/utils/ulid'
import type { ApplicationData } from '@/utils/types/coach-application'

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

type ApplicationResponse = {
  ulid: string;
  status: CoachApplicationStatus;
  applicant: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  reviewer: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  experience: string;
  specialties: string[];
  notes: string | null;
  applicationDate: string;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
};

// Database types
// interface ApplicationData { ... } // Remove this entire interface

// Submit coach application
export const submitCoachApplication = withServerAction<ApplicationResponse>(
  async (formData: FormData, { userUlid }) => {
    try {
      const supabase = await createAuthClient();
      let resumeUrl: string | undefined;

      // Handle resume file upload if provided
      const resumeFile = formData.get('resume') as File;
      if (resumeFile && resumeFile.size > 0) {
        // Generate a unique filename
        const timestamp = new Date().getTime();
        const filename = `${userUlid}_${timestamp}_${resumeFile.name}`;
        
        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('resumes')
          .upload(filename, resumeFile, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('[RESUME_UPLOAD_ERROR]', uploadError);
          throw new Error('Failed to upload resume');
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = await supabase
          .storage
          .from('resumes')
          .getPublicUrl(filename);

        resumeUrl = urlData.publicUrl;
      }

      // Convert FormData to object, handling optional fields
      const data = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        yearsOfExperience: formData.get('yearsOfExperience') as string,
        expertise: formData.get('expertise') as string,
        // Handle optional fields - convert null to undefined
        linkedIn: formData.get('linkedIn') || undefined,
        primarySocialMedia: formData.get('primarySocialMedia') || undefined,
        additionalInfo: formData.get('additionalInfo') || undefined,
        resumeUrl: resumeUrl // Use the uploaded file URL
      };

      // Validate input data
      const validatedData = CoachApplicationSchema.parse(data);

      // Create application record
      const { data: application, error: applicationError } = await supabase
        .from('CoachApplication')
        .insert({
          ulid: generateUlid(),
          applicantUlid: userUlid,
          status: 'PENDING',
          experience: validatedData.yearsOfExperience,
          specialties: [validatedData.expertise],
          resumeUrl: validatedData.resumeUrl,
          linkedIn: validatedData.linkedIn,
          primarySocialMedia: validatedData.primarySocialMedia,
          notes: validatedData.additionalInfo,
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
        .single() as { data: ApplicationData | null, error: any };

      if (applicationError) {
        console.error('[COACH_APPLICATION_ERROR]', { userUlid, error: applicationError });
        return {
          data: null,
          error: {
            code: 'APPLICATION_ERROR',
            message: 'Failed to submit application'
          }
        };
      }

      return {
        data: application,
        error: null
      };
    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error);
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid application data',
            details: error.flatten()
          }
        };
      }
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
);

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
        .maybeSingle() as { data: ApplicationData | null, error: any }

      // If no application found, return null data without error
      if (!application) {
        return {
          data: null,
          error: null
        }
      }

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
export const reviewCoachApplication = withServerAction<boolean>(
  async ({ applicationId, status, notes }, { systemRole, userUlid }) => {
    try {
      // Validate admin role
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can review coach applications'
          }
        }
      }

      const supabase = await createAuthClient()

      // Update application status
      const { data: application, error: updateError } = await supabase
        .from('CoachApplication')
        .update({
          status,
          notes,
          reviewerDbId: userUlid,
          reviewDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select('applicantDbId')
        .single()

      if (updateError) {
        console.error('[UPDATE_APPLICATION_ERROR]', updateError)
        throw updateError
      }

      if (!application) {
        throw new Error('Application not found')
      }

      // Update user role if approved
      if (status === COACH_APPLICATION_STATUS.APPROVED) {
        // Add coach capability to user
        const { error: userUpdateError } = await supabase
          .from('User')
          .update({ 
            capabilities: [USER_CAPABILITIES.COACH],
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', application.applicantDbId)

        if (userUpdateError) {
          console.error('[UPDATE_USER_ERROR]', userUpdateError)
          throw userUpdateError
        }
      }

      return {
        data: true,
        error: null
      }
    } catch (error) {
      console.error('[REVIEW_APPLICATION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to review application',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  },
  { requiredSystemRole: SYSTEM_ROLES.SYSTEM_OWNER }
)

// Get signed URL for resume file
export const getSignedResumeUrl = withServerAction<string>(
  async (resumePath: string, { systemRole }) => {
    try {
      // Only system owners can access resume files
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners can access resume files'
          }
        }
      }

      const supabase = await createAuthClient()

      // Get signed URL that expires in 1 hour
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .createSignedUrl(resumePath, 3600) // 1 hour expiry

      if (error) {
        console.error('[GET_RESUME_URL_ERROR]', error)
        throw error
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL')
      }

      return {
        data: data.signedUrl,
        error: null
      }
    } catch (error) {
      console.error('[GET_RESUME_URL_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get resume URL',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  },
  { requiredSystemRole: SYSTEM_ROLES.SYSTEM_OWNER }
)

// Get all coach applications for system review
export const getAllCoachApplications = withServerAction<ApplicationData[]>(
  async (_, { systemRole }) => {
    try {
      // Validate admin role
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER && systemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners and moderators can view all coach applications'
          }
        }
      }

      const supabase = await createAuthClient()

      const { data: applications, error: applicationsError } = await supabase
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
          resumeUrl,
          linkedIn,
          primarySocialMedia,
          additionalInfo,
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
        .order('createdAt', { ascending: false })

      if (applicationsError) {
        console.error('[GET_ALL_APPLICATIONS_ERROR]', applicationsError)
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch applications'
          }
        }
      }

      if (!applications) {
        return {
          data: [],
          error: null
        }
      }

      // Transform the data to match ApplicationData type
      const transformedApplications = applications
        .map(app => {
          const status = app.status.toUpperCase()
          if (!(status in COACH_APPLICATION_STATUS)) {
            console.error(`Invalid status: ${status} for application ${app.ulid}`)
            return null
          }

          const applicationData: ApplicationData = {
            ulid: app.ulid,
            status: status as CoachApplicationStatus,
            experience: app.experience,
            specialties: app.specialties,
            notes: app.notes,
            applicationDate: app.applicationDate,
            reviewDate: app.reviewDate,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            resumeUrl: app.resumeUrl,
            linkedIn: app.linkedIn,
            primarySocialMedia: app.primarySocialMedia,
            additionalInfo: app.additionalInfo,
            applicant: app.applicant?.[0] || null,
            reviewer: app.reviewer?.[0] || null
          }

          return applicationData
        })
        .filter((app): app is ApplicationData => app !== null)

      return {
        data: transformedApplications,
        error: null
      }
    } catch (error) {
      console.error('[GET_ALL_APPLICATIONS_ERROR]', error)
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
  { requiredSystemRole: SYSTEM_ROLES.SYSTEM_OWNER }
) 