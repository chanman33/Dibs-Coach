'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, EyeOff, ChevronRight, RefreshCw } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'
import Link from 'next/link'
import { updateProfileStatus } from '@/utils/actions/coach-profile-actions'
import type { ReactNode } from 'react'

interface ProfileCompletionProps {
  completionPercentage: number
  profileStatus: ProfileStatus
  canPublish: boolean
  missingFields: string[]
  missingRequiredFields: string[]
  optionalMissingFields: string[]
  validationMessages: Record<string, string>
  updateCompletionStatus: (data: any) => void;
}

interface Step {
  title: string;
  description: string;
  fields: string[];
  requiredFields: string[];
  optional?: boolean;
  isComplete: (fields: string[]) => boolean;
  getErrorMessage: (fields: string[]) => string | ReactNode | null;
  renderContent?: (isComplete: boolean) => ReactNode | null;
}

// Field name to user-friendly label mapping
const fieldLabels: Record<string, string> = {
  // Basic Information
  firstName: 'First Name',
  lastName: 'Last Name',
  bio: 'Biography',
  profileImageUrl: 'Profile Image',
  profileSlug: 'Custom Profile URL',
  
  // Coaching Details
  coachingSpecialties: 'Coaching Specialties',
  hourlyRate: 'Hourly Rate',
  yearsCoaching: 'Years of Coaching Experience',
  
  // Coach Domain Expertise
  coachRealEstateDomains: 'Real Estate Domains',
  coachPrimaryDomain: 'Primary Domain',
  
  // Scheduling
  hasAvailabilitySchedule: 'Availability Schedule',
  
  // Professional Background
  certifications: 'Certifications',
  languages: 'Languages',
}

// Helper function to get user-friendly field name
const getFieldLabel = (fieldName: string): string => {
  return fieldLabels[fieldName] || formatFieldName(fieldName);
}

// Helper function to format field names that might not be in the mapping
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any extra spaces
}

export function ProfileCompletion({
  completionPercentage,
  profileStatus,
  canPublish,
  missingFields,
  missingRequiredFields,
  optionalMissingFields,
  validationMessages,
  updateCompletionStatus,
}: ProfileCompletionProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const renderStatusBadge = () => {
    switch (profileStatus) {
      case PROFILE_STATUS.PUBLISHED:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <span>Published</span>
          </div>
        )
      case PROFILE_STATUS.DRAFT:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium dark:bg-blue-900/50 dark:text-blue-300">
            <EyeOff className="h-4 w-4" />
            <span>Draft</span>
          </div>
        )
      default:
        return null
    }
  }

  const renderCompletionSteps = () => {
    console.log("[PROFILE_COMPLETION_RENDER_START]", {
      completionPercentage,
      profileStatus,
      canPublish,
      missingFields,
      missingRequiredFields,
      optionalMissingFields,
      validationMessages,
      timestamp: new Date().toISOString()
    });

    const steps: Step[] = [
      {
        title: 'Basic Information',
        description: 'Personal details and bio',
        fields: ['firstName', 'lastName', 'bio', 'profileImageUrl', 'profileSlug'],
        requiredFields: ['firstName', 'lastName', 'bio', 'profileImageUrl', 'profileSlug'],
        isComplete: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          const isComplete = missing.length === 0 && invalid.length === 0;
          
          console.log(`[STEP_VALIDATION] Basic Information:`, {
            isComplete,
            missing,
            invalid,
            fields,
            missingFields,
            validationMessages,
            timestamp: new Date().toISOString()
          });
          
          return isComplete;
        },
        getErrorMessage: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          
          if (invalid.length > 0) {
            // Replace any field names in validation messages with user-friendly labels
            return invalid.map(field => {
              let message = validationMessages[field];
              // Check if the message contains the field name and replace it with the label
              Object.keys(fieldLabels).forEach(fieldName => {
                message = message.replace(
                  new RegExp(`\\b${fieldName}\\b`, 'gi'), 
                  fieldLabels[fieldName]
                );
              });
              return message;
            }).join(' • ');
          }
          if (missing.length > 0) {
            return `Missing required fields: ${missing.map(field => getFieldLabel(field)).join(', ')}`;
          }
          return null;
        }
      },
      {
        title: 'Coaching Details',
        description: 'Expertise and pricing',
        fields: ['coachingSpecialties', 'hourlyRate', 'yearsCoaching'],
        requiredFields: ['coachingSpecialties', 'hourlyRate', 'yearsCoaching'],
        isComplete: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          const isComplete = missing.length === 0 && invalid.length === 0;
          
          console.log(`[STEP_VALIDATION] Coaching Details:`, {
            isComplete,
            missing,
            invalid,
            fields,
            missingFields,
            validationMessages,
            timestamp: new Date().toISOString()
          });
          
          return isComplete;
        },
        getErrorMessage: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          
          if (invalid.length > 0) {
            // Replace any field names in validation messages with user-friendly labels
            return invalid.map(field => {
              let message = validationMessages[field];
              // Check if the message contains the field name and replace it with the label
              Object.keys(fieldLabels).forEach(fieldName => {
                message = message.replace(
                  new RegExp(`\\b${fieldName}\\b`, 'gi'), 
                  fieldLabels[fieldName]
                );
              });
              return message;
            }).join(' • ');
          }
          if (missing.length > 0) {
            return `Missing required fields: ${missing.map(field => getFieldLabel(field)).join(', ')}`;
          }
          return null;
        }
      },
      {
        title: 'Scheduling',
        description: 'Set up your availability to accept bookings.',
        fields: ['hasAvailabilitySchedule'],
        requiredFields: ['hasAvailabilitySchedule'],
        isComplete: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          const isComplete = missing.length === 0 && invalid.length === 0;
          
          console.log(`[STEP_VALIDATION] Scheduling:`, {
            isComplete,
            missing,
            invalid,
            fields,
            missingFields,
            validationMessages,
            timestamp: new Date().toISOString()
          });
          
          return isComplete;
        },
        getErrorMessage: (fields: string[]) => {
          const missing = fields.filter(field => missingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          
          if (invalid.length > 0) {
            // Replace any field names in validation messages with user-friendly labels
            return invalid.map(field => {
              let message = validationMessages[field];
              // Check if the message contains the field name and replace it with the label
              Object.keys(fieldLabels).forEach(fieldName => {
                message = message.replace(
                  new RegExp(`\\b${fieldName}\\b`, 'gi'), 
                  fieldLabels[fieldName]
                );
              });
              return message;
            }).join(' • ');
          }

          if (missing.length > 0) {
            const needsAvailability = missing.includes('hasAvailabilitySchedule');

            if (needsAvailability) {
              return (
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="text-red-500 dark:text-red-400">
                    You need to set up your availability schedule to accept bookings
                  </span>
                  <Link
                    href="/dashboard/coach/integrations/calendar"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 dark:text-blue-300 dark:hover:text-blue-200 ml-2"
                  >
                    Connect <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            }
          }
          return null;
        },
        renderContent: (isComplete: boolean) => {
          if (isComplete) {
            return (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs dark:text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Ready to accept bookings</span>
                </div>
                <Link 
                  href="/dashboard/coach/integrations/calendar"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline ml-auto dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Manage Settings
                </Link>
              </div>
            );
          }
          return null;
        }
      },
      {
        title: 'Professional Background',
        description: 'Certifications and expertise',
        fields: ['certifications', 'languages'],
        requiredFields: [],
        optional: true,
        isComplete: (fields: string[]) => {
          const missing = fields.filter(field => optionalMissingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          const isComplete = !invalid.length;
          
          console.log(`[STEP_VALIDATION] Professional Background:`, {
            isComplete,
            missing,
            invalid,
            fields,
            optionalMissingFields,
            validationMessages,
            timestamp: new Date().toISOString()
          });
          
          return isComplete;
        },
        getErrorMessage: (fields: string[]) => {
          const missing = fields.filter(field => optionalMissingFields.includes(field));
          const invalid = fields.filter(field => validationMessages[field]);
          
          if (invalid.length > 0) {
            // Replace any field names in validation messages with user-friendly labels
            return invalid.map(field => {
              let message = validationMessages[field];
              // Check if the message contains the field name and replace it with the label
              Object.keys(fieldLabels).forEach(fieldName => {
                message = message.replace(
                  new RegExp(`\\b${fieldName}\\b`, 'gi'), 
                  fieldLabels[fieldName]
                );
              });
              return message;
            }).join(' • ');
          }
          if (missing.length > 0) {
            return `Optional fields missing: ${missing.map(field => getFieldLabel(field)).join(', ')}`;
          }
          return null;
        }
      }
    ];

    return (
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepMissingRequired = step.requiredFields.filter(field => 
            missingRequiredFields.includes(field)
          );
          const stepMissingOptional = step.fields.filter(field => 
            optionalMissingFields.includes(field)
          );
          
          const isComplete = step.isComplete(step.fields);
          const errorMessage = step.getErrorMessage(step.fields);
          
          console.log(`[STEP_RENDER] ${step.title}:`, {
            isComplete,
            errorMessage,
            stepMissingRequired,
            stepMissingOptional,
            validationMessages: step.fields.reduce((acc, field) => {
              if (validationMessages[field]) {
                acc[field] = validationMessages[field];
              }
              return acc;
            }, {} as Record<string, string>),
            timestamp: new Date().toISOString()
          });
          
          return (
            <div 
              key={step.title} 
              className={`flex flex-col gap-2 p-3 rounded-lg transition-colors ${
                isComplete
                  ? 'bg-green-50/50 dark:bg-green-900/30 dark:hover:bg-green-900/40' 
                  : step.optional 
                    ? 'bg-blue-50/50 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/40'
                    : errorMessage
                      ? step.title === 'Scheduling'
                        ? 'bg-red-50/50 dark:bg-red-900/30'
                        : 'bg-red-50/50 hover:bg-red-100/80 dark:bg-red-900/30 dark:hover:bg-red-900/40'
                      : step.title === 'Scheduling'
                        ? 'bg-gray-50 dark:bg-gray-800/50'
                        : 'bg-gray-50 hover:bg-gray-100/80 dark:bg-gray-800/50 dark:hover:bg-gray-800/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isComplete
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/70 dark:text-green-300' 
                    : step.optional
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/70 dark:text-blue-300'
                      : errorMessage
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/70 dark:text-red-300'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : errorMessage ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${
                      isComplete
                        ? 'text-green-700 dark:text-green-300' 
                        : step.optional
                          ? 'text-blue-700 dark:text-blue-300'
                          : errorMessage
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {step.title}
                    </p>
                    {step.optional && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:text-blue-300 dark:bg-blue-900/50">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    errorMessage 
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {typeof errorMessage === 'string' ? errorMessage : step.description}
                  </p>
                  {typeof errorMessage !== 'string' && errorMessage}
                  {step.renderContent?.(isComplete)}
                </div>
                {!isComplete && step.title !== 'Scheduling' && (
                  <Link 
                    href={step.title === 'Scheduling' ? '/dashboard/coach/settings#availability' : '#'}
                    className={`shrink-0 ${step.title !== 'Scheduling' ? 'pointer-events-none' : ''}`}
                  >
                    <ChevronRight className={`h-4 w-4 ${
                      errorMessage ? 'text-red-400 dark:text-red-300' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )
  }

  const handlePublish = async () => {
    setIsUpdating(true);
    try {
      const result = await updateProfileStatus({
        status: PROFILE_STATUS.PUBLISHED,
        isSystemOwner: false
      });
      if (result.error) {
        toast.error(result.error.message || 'Failed to publish profile');
        return;
      }
      // Update client state immediately on success
      if (result.data) {
        updateCompletionStatus({ profileStatus: result.data.profileStatus });
        toast.success('Profile published successfully');
      }
    } catch (error) {
      console.error('[PUBLISH_PROFILE_ERROR]', error);
      toast.error('Failed to publish profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add a function to manually update the profile completion
  const handleRefreshCompletion = async () => {
    try {
      setIsRefreshing(true)
      
      // Call the API to update completion
      const response = await fetch('/api/profile/update-completion?force=true')
      
      if (!response.ok) {
        throw new Error('Failed to update profile completion')
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Profile completion updated: ${result.completionPercentage}%`)
        // Reload the page to reflect changes
        window.location.reload()
      } else {
        toast.error('Failed to update profile completion')
      }
    } catch (error) {
      console.error('[REFRESH_PROFILE_COMPLETION_ERROR]', error)
      toast.error('Failed to update profile completion')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className={`p-4 sm:p-6 ${profileStatus === PROFILE_STATUS.PUBLISHED ? 'pb-4 sm:pb-4' : ''} border shadow-sm`}>
      {/* Header section - Always visible */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            {profileStatus === PROFILE_STATUS.PUBLISHED ? 'Coach Profile Status' : 'Coach Profile Setup'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profileStatus === PROFILE_STATUS.PUBLISHED 
              ? "Your profile is visible to potential clients"
              : "Complete your profile to become visible to potential clients"}
          </p>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Conditional section: Only show if not published */}
      {profileStatus !== PROFILE_STATUS.PUBLISHED && (
        <>
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-semibold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} aria-label={`${completionPercentage}% complete`} />
          </div>

          {/* Completion Steps List */}
          <div className="space-y-4 mt-6">
            {renderCompletionSteps()}
          </div>

          {/* Buttons Section */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
            {/* Refresh Button */}            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshCompletion} 
              disabled={isRefreshing}
              aria-label="Refresh profile completion status"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-2">Refresh Progress</span>
            </Button>

            {/* Publish Button */}            
            {canPublish && (
              <Button 
                onClick={handlePublish} 
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? 'Publishing...' : 'Publish Profile'}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  )
} 