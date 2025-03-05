"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { COACH_APPLICATION_STATUS, REAL_ESTATE_DOMAINS, type CoachApplicationStatus, type RealEstateDomain } from '@/utils/types/coach'
import { generateUlid } from '@/utils/ulid'
import type { ApplicationResponse } from '@/utils/types/coach-application'
import { revalidatePath } from "next/cache";
import { addUserCapability } from "@/utils/permissions";
import type { ServerActionContext } from "@/utils/middleware/withServerAction";
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { CoachApplicationStatus as PrismaCoachApplicationStatus } from '@prisma/client';
import { coachApplicationFormSchema, type CoachApplicationFormData } from '@/utils/types/coach-application'

// Define the status type to match database
type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

// Validation schemas
const CoachApplicationSchema = z.object({
  ulid: z.string().length(26).optional(),
  applicantUlid: z.string().length(26),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  yearsOfExperience: z.number(),
  superPower: z.string(),
  aboutYou: z.string().nullable(),
  realEstateDomains: z.array(z.string()).default([]),
  primaryDomain: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  linkedIn: z.string().nullable(),
  primarySocialMedia: z.string().nullable(),
  reviewerUlid: z.string().length(26).nullable(),
  reviewDate: z.string().datetime().nullable(),
  reviewNotes: z.string().nullable(),
  isDraft: z.boolean().default(false),
  lastSavedAt: z.string().datetime().nullable(),
  draftData: z.any().nullable(),
  draftVersion: z.number().default(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

const ApplicationReviewSchema = z.object({
  applicationUlid: ulidSchema,
  status: z.enum(['pending', 'approved', 'rejected']),
  approvedSpecialties: z.array(z.string()).optional(),
  notes: z.string().optional()
})

// Response types
type CoachApplication = Database['public']['Tables']['CoachApplication']['Row'];

// Add type definition for raw application data
type RawApplicationData = {
  ulid: string;
  status: string;
  yearsOfExperience: number;
  superPower: string;
  realEstateDomains: string[];
  primaryDomain: string;
  notes: string | null;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  aboutYou: string | null;
  applicant: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
  };
  reviewer: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

// Database types
// interface ApplicationData { ... } // Remove this entire interface

async function validateCoachApplicationData(formData: FormData) {
  let resumeUrl: string | undefined;

  // Handle resume file upload if provided
  const resumeFile = formData.get('resume') as File;
  if (resumeFile && resumeFile.size > 0) {
    const supabase = await createAuthClient();
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const filename = `${timestamp}_${resumeFile.name}`;
    
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
    yearsOfExperience: parseInt(formData.get('yearsOfExperience') as string),
    superPower: formData.get('superPower') as string,
    realEstateDomains: JSON.parse(formData.get('realEstateDomains') as string),
    primaryDomain: formData.get('primaryDomain') as string,
    resume: resumeFile,
    linkedIn: formData.get('linkedIn') as string || null,
    primarySocialMedia: formData.get('primarySocialMedia') as string || null,
    aboutYou: formData.get('aboutYou') as string || null
  };

  // Validate input data using form schema
  const validatedFormData = coachApplicationFormSchema.parse(data);

  // Return both validated form data and resume URL
  return {
    ...validatedFormData,
    resumeUrl
  };
}

// Submit coach application
export const submitCoachApplication = withServerAction<ApplicationResponse>(
  async (formData: FormData, { userUlid }) => {
    try {
      const validatedData = await validateCoachApplicationData(formData);
      const supabase = await createAuthClient();

      const applicationData = {
        ulid: generateUlid(),
        applicantUlid: userUlid,
        status: 'PENDING' as const,
        yearsOfExperience: validatedData.yearsOfExperience,
        superPower: validatedData.superPower,
        realEstateDomains: validatedData.realEstateDomains,
        primaryDomain: validatedData.primaryDomain,
        resumeUrl: validatedData.resumeUrl || null,
        linkedIn: validatedData.linkedIn,
        primarySocialMedia: validatedData.primarySocialMedia,
        aboutYou: validatedData.aboutYou,
        isDraft: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: application, error } = await supabase
        .from('CoachApplication')
        .insert(applicationData)
        .select(`
          ulid,
          status,
          yearsOfExperience,
          superPower,
          realEstateDomains,
          primaryDomain,
          resumeUrl,
          linkedIn,
          primarySocialMedia,
          aboutYou,
          createdAt,
          updatedAt,
          applicant:User!CoachApplication_applicantUlid_fkey (
            firstName,
            lastName,
            email,
            phoneNumber
          )
        `)
        .single();

      if (error) {
        console.error('[COACH_APPLICATION_ERROR]', error);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR' as const,
            message: 'Failed to submit application'
          }
        };
      }

      return {
        data: {
          ulid: application.ulid,
          status: application.status as CoachApplicationStatus,
          firstName: application.applicant?.firstName ?? null,
          lastName: application.applicant?.lastName ?? null,
          phoneNumber: application.applicant?.phoneNumber ?? null,
          yearsOfExperience: application.yearsOfExperience,
          superPower: application.superPower,
          aboutYou: application.aboutYou ?? null,
          realEstateDomains: (application.realEstateDomains ?? []) as RealEstateDomain[],
          primaryDomain: application.primaryDomain as RealEstateDomain,
          resumeUrl: application.resumeUrl ?? null,
          linkedIn: application.linkedIn ?? null,
          primarySocialMedia: application.primarySocialMedia ?? null,
          isDraft: application.status === ('DRAFT' as CoachApplicationStatus),
          createdAt: application.createdAt,
          updatedAt: application.updatedAt
        },
        error: null
      };

    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error);
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR' as const,
            message: 'Invalid form data',
            details: error.flatten()
          }
        };
      }
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR' as const,
          message: 'An unexpected error occurred'
        }
      };
    }
  }
);

// Get coach application
export const getCoachApplication = withServerAction<ApplicationResponse>(
  async (_, { userUlid }) => {
    console.log('[GET_COACH_APPLICATION_START]', {
      userUlid,
      timestamp: new Date().toISOString()
    });

    try {
      const supabase = await createAuthClient()
      console.log('[GET_COACH_APPLICATION_QUERY_START]', {
        timestamp: new Date().toISOString()
      });

      const { data: application, error: applicationError } = await supabase
        .from('CoachApplication')
        .select(`
          ulid,
          status,
          yearsOfExperience,
          superPower,
          realEstateDomains,
          primaryDomain,
          reviewDate,
          createdAt,
          updatedAt,
          resumeUrl,
          linkedIn,
          primarySocialMedia,
          aboutYou,
          isDraft,
          applicant:User!CoachApplication_applicantUlid_fkey (
            ulid,
            firstName,
            lastName,
            email,
            phoneNumber,
            profileImageUrl
          ),
          reviewer:User!CoachApplication_reviewerUlid_fkey (
            ulid,
            firstName,
            lastName
          )
        `)
        .eq('applicantUlid', userUlid)
        .single() as { data: ApplicationResponse | null, error: any }

      console.log('[GET_COACH_APPLICATION_QUERY_RESULT]', {
        hasData: !!application,
        status: application?.status,
        error: applicationError,
        timestamp: new Date().toISOString()
      });

      // If database error, check if it's a schema mismatch
      if (applicationError) {
        console.error('[GET_COACH_APPLICATION_ERROR]', { 
          userUlid, 
          error: applicationError,
          timestamp: new Date().toISOString()
        });

        // If it's a column does not exist error, log it but treat as no application found
        if (applicationError.code === '42703') {
          console.log('[GET_COACH_APPLICATION_SCHEMA_MISMATCH]', {
            message: 'Schema mismatch detected, treating as no application found',
            error: applicationError.message,
            timestamp: new Date().toISOString()
          });
          return {
            data: null,
            error: null
          };
        }

        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch application'
          }
        };
      }

      // If no application found, return null data without error
      if (!application) {
        console.log('[GET_COACH_APPLICATION_NOT_FOUND]', {
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: null
        };
      }

      console.log('[GET_COACH_APPLICATION_SUCCESS]', {
        applicationId: application.ulid,
        status: application.status,
        timestamp: new Date().toISOString()
      });

      // Transform the data to match ApplicationResponse type
      const transformedData: ApplicationResponse = {
        ulid: application.ulid,
        status: application.status as CoachApplicationStatus,
        firstName: application.applicant?.firstName ?? null,
        lastName: application.applicant?.lastName ?? null,
        phoneNumber: application.applicant?.phoneNumber ?? null,
        yearsOfExperience: application.yearsOfExperience,
        superPower: application.superPower,
        aboutYou: application.aboutYou ?? null,
        realEstateDomains: (application.realEstateDomains ?? []) as RealEstateDomain[],
        primaryDomain: application.primaryDomain as RealEstateDomain,
        resumeUrl: application.resumeUrl ?? null,
        linkedIn: application.linkedIn ?? null,
        primarySocialMedia: application.primarySocialMedia ?? null,
        isDraft: application.isDraft ?? false,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt
      };

      return {
        data: transformedData,
        error: null
      };
    } catch (error) {
      console.error('[GET_COACH_APPLICATION_ERROR]', {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
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

// Review coach application
export const reviewCoachApplication = withServerAction<ApplicationResponse>(
  async (data: z.infer<typeof ApplicationReviewSchema>, { userUlid, systemRole }) => {
    try {
      // Validate system role
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER && systemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        return {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "Not authorized to review applications",
          },
        };
      }

      const supabase = await createAuthClient();

      // Get the application
      const { data: application, error: fetchError } = await supabase
        .from('CoachApplication')
        .select('*, applicant:applicantUlid (*)')
        .eq('ulid', data.applicationUlid)
        .single();

      if (fetchError || !application) {
        console.error('[COACH_APPLICATION_REVIEW_ERROR]', fetchError);
        return {
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Application not found",
          },
        };
      }

      // If approving, validate that at least one specialty is approved
      if (data.status === 'approved' && (!data.approvedSpecialties || data.approvedSpecialties.length === 0)) {
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Must approve at least one specialty",
          },
        };
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('CoachApplication')
        .update({
          status: data.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED',
          reviewerUlid: userUlid,
          reviewDate: new Date().toISOString(),
          notes: data.notes,
          updatedAt: new Date().toISOString(),
          approvedSpecialties: data.approvedSpecialties || []
        })
        .eq('ulid', data.applicationUlid);

      if (updateError) {
        console.error('[COACH_APPLICATION_REVIEW_ERROR]', updateError);
        return {
          data: null,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update application",
          },
        };
      }

      // If approved, add coach capability and create coach profile
      if (data.status === 'approved') {
        // Add coach capability
        await addUserCapability(application.applicantUlid, USER_CAPABILITIES.COACH);

        // Create coach profile with approved specialties
        const { error: profileError } = await supabase
          .from('CoachProfile')
          .insert({
            ulid: generateUlid(),
            userUlid: application.applicantUlid,
            coachSkills: data.approvedSpecialties || [],
            profileStatus: 'DRAFT',
            completionPercentage: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

        if (profileError) {
          console.error('[COACH_PROFILE_CREATE_ERROR]', profileError);
          return {
            data: null,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to create coach profile",
            },
          };
        }
      }

      // Get updated application data
      const { data: updatedApplication, error: refetchError } = await supabase
        .from('CoachApplication')
        .select(`
          ulid,
          status,
          experience,
          specialties,
          industrySpecialties,
          approvedSpecialties,
          notes,
          applicationDate,
          reviewDate,
          createdAt,
          updatedAt,
          applicant:applicantUlid!CoachApplication_applicantUlid_fkey (
            ulid,
            firstName,
            lastName,
            email
          ),
          reviewer:reviewerUlid!CoachApplication_reviewerUlid_fkey (
            ulid,
            firstName,
            lastName
          )
        `)
        .eq('ulid', data.applicationUlid)
        .single() as unknown as { data: ApplicationResponse | null, error: any };

      if (refetchError) {
        console.error('[COACH_APPLICATION_REFETCH_ERROR]', refetchError);
        return {
          data: null,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to fetch updated application",
          },
        };
      }

      return {
        data: updatedApplication,
        error: null,
      };
    } catch (error) {
      console.error('[COACH_APPLICATION_REVIEW_ERROR]', error);
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to review application",
        },
      };
    }
  }
);

// Get signed URL for resume file
export const getResumePresignedUrl = withServerAction<string>(
  async (resumePath: string, { systemRole }: ServerActionContext) => {
    try {
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER && systemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        return {
          data: null,
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to access this resource",
          },
        };
      }

      if (!resumePath) {
        return {
          data: null,
          error: {
            code: "MISSING_PARAMETERS",
            message: "Resume path is required",
          },
        };
      }

      // Validate the path is a resume file in the correct bucket/folder
      if (!resumePath.startsWith('resumes/') || !resumePath.endsWith('.pdf')) {
        return {
          data: null,
          error: {
            code: "MISSING_PARAMETERS",
            message: "Invalid resume path",
          },
        };
      }

      const supabase = await createAuthClient()

      // Extract just the filename from the full path
      const filename = resumePath.split('/').pop();
      
      if (!filename) {
        console.error('[GET_RESUME_URL_ERROR]', {
          error: 'Invalid resume path',
          resumePath
        });
        return {
          data: null,
          error: {
            code: "MISSING_PARAMETERS",
            message: 'Invalid resume file path'
          }
        };
      }

      // Get signed URL that expires in 1 hour
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .createSignedUrl(filename, 3600) // 1 hour expiry

      if (error) {
        console.error('[GET_RESUME_URL_ERROR]', {
          error,
          resumePath,
          filename
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: 'Failed to generate signed URL'
          }
        };
      }

      if (!data?.signedUrl) {
        console.error('[GET_RESUME_URL_ERROR]', {
          message: 'No signed URL generated',
          resumePath,
          filename
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: 'Failed to generate signed URL'
          }
        };
      }

      return {
        data: data.signedUrl,
        error: null
      }
    } catch (error) {
      console.error("[GET_RESUME_URL_ERROR]", { error, resumePath });
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate resume URL",
        },
      };
    }
  }
);

// Get all coach applications for system review
export const getAllCoachApplications = withServerAction<ApplicationResponse[]>(
  async (_, { systemRole }) => {
    try {
      console.log('[GET_ALL_APPLICATIONS_START]', {
        systemRole,
        timestamp: new Date().toISOString()
      });

      // Validate admin role
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER && systemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners and moderators can view all coach applications'
          }
        };
      }

      const supabase = await createAuthClient();

      console.log('[GET_ALL_APPLICATIONS_QUERY_START]', {
        timestamp: new Date().toISOString()
      });

      const { data: applications, error: applicationsError } = await supabase
        .from('CoachApplication')
        .select(`
          ulid,
          status,
          yearsOfExperience,
          superPower,
          realEstateDomains,
          primaryDomain,
          resumeUrl,
          linkedIn,
          primarySocialMedia,
          aboutYou,
          createdAt,
          updatedAt,
          applicant:User!CoachApplication_applicantUlid_fkey (
            firstName,
            lastName,
            phoneNumber
          )
        `)

      if (applicationsError) {
        console.error('[GET_ALL_APPLICATIONS_ERROR]', applicationsError);
        return {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch applications'
          }
        };
      }

      return {
        data: applications?.map(app => ({
          ulid: app.ulid,
          status: app.status as CoachApplicationStatus,
          firstName: app.applicant?.firstName ?? null,
          lastName: app.applicant?.lastName ?? null,
          phoneNumber: app.applicant?.phoneNumber ?? null,
          yearsOfExperience: app.yearsOfExperience,
          superPower: app.superPower,
          aboutYou: app.aboutYou ?? null,
          realEstateDomains: (app.realEstateDomains ?? []) as RealEstateDomain[],
          primaryDomain: app.primaryDomain as RealEstateDomain,
          resumeUrl: app.resumeUrl ?? null,
          linkedIn: app.linkedIn ?? null,
          primarySocialMedia: app.primarySocialMedia ?? null,
          isDraft: app.status === ('DRAFT' as CoachApplicationStatus),
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        })) ?? null,
        error: null
      };
    } catch (error) {
      console.error('[GET_ALL_APPLICATIONS_ERROR]', error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch applications'
        }
      };
    }
  }
);