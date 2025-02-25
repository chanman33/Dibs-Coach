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
import { revalidatePath } from "next/cache";
import { addUserCapability } from "@/utils/permissions";
import type { ServerActionContext } from "@/utils/middleware/withServerAction";

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
  resumeUrl: z.string().url().optional(),
  industrySpecialties: z.array(z.string()).optional()
})

const ApplicationReviewSchema = z.object({
  applicationUlid: ulidSchema,
  status: z.enum(['pending', 'approved', 'rejected']),
  approvedSpecialties: z.array(z.string()).optional(),
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
  industrySpecialties: string[];
  notes: string | null;
  applicationDate: string;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
};

// Add type definition for raw application data
type RawApplicationData = {
  ulid: string;
  status: string;
  experience: string;
  specialties: string[];
  industrySpecialties: string[];
  notes: string | null;
  applicationDate: string;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  additionalInfo: string | null;
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
    email: string;
  } | null;
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

      // Parse industry specialties from JSON string if provided
      let industrySpecialties: string[] = [];
      const industrySpecialtiesStr = formData.get('industrySpecialties');
      if (industrySpecialtiesStr) {
        try {
          industrySpecialties = JSON.parse(industrySpecialtiesStr as string);
        } catch (error) {
          console.error('[INDUSTRY_SPECIALTIES_PARSE_ERROR]', error);
          // Continue with empty array if parsing fails
        }
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
        resumeUrl: resumeUrl, // Use the uploaded file URL
        industrySpecialties: industrySpecialties.length > 0 ? industrySpecialties : undefined
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
          industrySpecialties: validatedData.industrySpecialties || [],
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
          industrySpecialties,
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
            code: "INTERNAL_ERROR",
            message: "Failed to submit application",
          },
        };
      }

      return {
        data: application,
        error: null
      };
    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error);
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to submit application",
        },
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
          status: data.status.toUpperCase(),
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
            userUlid: application.applicantUlid,
            approvedSpecialties: data.approvedSpecialties || [],
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
export const getAllCoachApplications = withServerAction<ApplicationData[]>(
  async (_, { systemRole }) => {
    try {
      console.log('[GET_ALL_APPLICATIONS_START]', {
        systemRole,
        timestamp: new Date().toISOString()
      });

      // Validate admin role
      if (systemRole !== SYSTEM_ROLES.SYSTEM_OWNER && systemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        console.error('[GET_ALL_APPLICATIONS_ERROR]', {
          error: 'Unauthorized access',
          systemRole,
          requiredRoles: [SYSTEM_ROLES.SYSTEM_OWNER, SYSTEM_ROLES.SYSTEM_MODERATOR]
        });
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only system owners and moderators can view all coach applications'
          }
        }
      }

      const supabase = await createAuthClient()

      console.log('[GET_ALL_APPLICATIONS_QUERY_START]', {
        timestamp: new Date().toISOString()
      });

      const { data: applications, error: applicationsError } = await supabase
        .from('CoachApplication')
        .select(`
          ulid,
          status,
          experience,
          specialties,
          industrySpecialties,
          notes,
          applicationDate,
          reviewDate,
          createdAt,
          updatedAt,
          resumeUrl,
          linkedIn,
          primarySocialMedia,
          additionalInfo,
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
            lastName,
            email
          )
        `)
        .order('createdAt', { ascending: false }) as { data: RawApplicationData[] | null, error: any };

      console.log('[GET_ALL_APPLICATIONS_QUERY_COMPLETE]', {
        success: !applicationsError,
        count: applications?.length || 0,
        hasError: !!applicationsError,
        timestamp: new Date().toISOString()
      });

      if (applicationsError) {
        console.error('[GET_ALL_APPLICATIONS_ERROR]', {
          error: applicationsError,
          message: 'Database query failed'
        });
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch applications'
          }
        }
      }

      if (!applications) {
        console.log('[GET_ALL_APPLICATIONS_NO_DATA]', {
          timestamp: new Date().toISOString()
        });
        return {
          data: [],
          error: null
        }
      }

      // Transform and validate the data
      const transformedApplications = applications
        .map((app: RawApplicationData) => {
          // Log raw application data for debugging
          console.log('[TRANSFORM_APPLICATION_START]', {
            applicationId: app.ulid,
            hasApplicant: !!app.applicant,
            rawData: {
              status: app.status,
              experience: app.experience,
              specialtiesLength: app.specialties?.length,
              hasNotes: !!app.notes,
              hasApplicantData: app.applicant ? {
                firstName: !!app.applicant.firstName,
                lastName: !!app.applicant.lastName,
                email: !!app.applicant.email,
                phoneNumber: !!app.applicant.phoneNumber
              } : null
            }
          });

          // Validate status
          const status = app.status?.toUpperCase()
          if (!(status in COACH_APPLICATION_STATUS)) {
            console.error(`[TRANSFORM_APPLICATION_ERROR] Invalid status: ${status} for application ${app.ulid}`);
            return null
          }

          // Validate required fields
          if (!app.applicant) {
            console.error(`[TRANSFORM_APPLICATION_ERROR] Missing applicant data for application ${app.ulid}`);
            return null;
          }

          // Ensure all required fields are present
          const applicationData: ApplicationData = {
            ulid: app.ulid,
            status: status as CoachApplicationStatus,
            experience: app.experience || '0',
            specialties: Array.isArray(app.specialties) ? app.specialties : [],
            industrySpecialties: Array.isArray(app.industrySpecialties) ? app.industrySpecialties : [],
            notes: app.notes,
            applicationDate: app.applicationDate || app.createdAt,
            reviewDate: app.reviewDate,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            resumeUrl: app.resumeUrl,
            linkedIn: app.linkedIn,
            primarySocialMedia: app.primarySocialMedia,
            additionalInfo: app.additionalInfo,
            applicant: {
              ulid: app.applicant.ulid,
              firstName: app.applicant.firstName || '',
              lastName: app.applicant.lastName || '',
              email: app.applicant.email,
              phoneNumber: app.applicant.phoneNumber,
              profileImageUrl: app.applicant.profileImageUrl
            },
            reviewer: app.reviewer ? {
              ulid: app.reviewer.ulid,
              firstName: app.reviewer.firstName || '',
              lastName: app.reviewer.lastName || '',
            } : null
          };

          // Log transformed data
          console.log('[TRANSFORM_APPLICATION_SUCCESS]', {
            applicationId: app.ulid,
            transformedData: {
              hasApplicantInfo: !!applicationData.applicant,
              applicantDetails: applicationData.applicant && {
                hasFirstName: !!applicationData.applicant.firstName,
                hasLastName: !!applicationData.applicant.lastName,
                hasEmail: !!applicationData.applicant.email,
                hasPhone: !!applicationData.applicant.phoneNumber
              },
              hasSpecialties: applicationData.specialties.length > 0,
              hasExperience: !!applicationData.experience
            }
          });

          return applicationData;
        })
        .filter((app): app is ApplicationData => app !== null);

      console.log('[GET_ALL_APPLICATIONS_SUCCESS]', {
        originalCount: applications.length,
        transformedCount: transformedApplications.length,
        sampleApplication: transformedApplications[0] ? {
          ulid: transformedApplications[0].ulid,
          hasApplicant: !!transformedApplications[0].applicant,
          applicantFields: transformedApplications[0].applicant ? {
            firstName: !!transformedApplications[0].applicant.firstName,
            lastName: !!transformedApplications[0].applicant.lastName,
            email: !!transformedApplications[0].applicant.email,
            phoneNumber: !!transformedApplications[0].applicant.phoneNumber
          } : null,
          hasSpecialties: transformedApplications[0].specialties.length > 0,
          hasExperience: !!transformedApplications[0].experience
        } : 'No applications',
        timestamp: new Date().toISOString()
      });

      return {
        data: transformedApplications,
        error: null
      }
    } catch (error) {
      console.error('[GET_ALL_APPLICATIONS_ERROR]', {
        error,
        message: 'Unexpected error occurred',
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
      }
    }
  },
  { requiredSystemRole: SYSTEM_ROLES.SYSTEM_OWNER }
) 