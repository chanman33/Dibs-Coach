'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, EyeOff, ChevronRight } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'
import { updateProfileStatus } from '@/utils/actions/coach-profile-actions'

interface ProfileCompletionProps {
  completionPercentage: number
  profileStatus: ProfileStatus
  canPublish: boolean
  missingFields: string[]
  missingRequiredFields: string[]
  optionalMissingFields: string[]
  validationMessages: Record<string, string>
}

export function ProfileCompletion({
  completionPercentage,
  profileStatus,
  canPublish,
  missingFields,
  missingRequiredFields,
  optionalMissingFields,
  validationMessages,
}: ProfileCompletionProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const renderStatusBadge = () => {
    switch (profileStatus) {
      case PROFILE_STATUS.PUBLISHED:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Published</span>
          </div>
        )
      case PROFILE_STATUS.DRAFT:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
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

    const steps = [
      {
        title: 'Basic Information',
        description: 'Personal details and bio',
        fields: ['firstName', 'lastName', 'bio', 'profileImageUrl'],
        requiredFields: ['firstName', 'lastName', 'bio', 'profileImageUrl'],
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
            return invalid.map(field => validationMessages[field]).join(' • ');
          }
          if (missing.length > 0) {
            return `Missing required fields: ${missing.join(', ')}`;
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
            return invalid.map(field => validationMessages[field]).join(' • ');
          }
          if (missing.length > 0) {
            return `Missing required fields: ${missing.join(', ')}`;
          }
          return null;
        }
      },
      {
        title: 'Scheduling',
        description: 'Availability and booking',
        fields: ['calendlyUrl', 'eventTypeUrl'],
        requiredFields: ['calendlyUrl', 'eventTypeUrl'],
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
            return invalid.map(field => validationMessages[field]).join(' • ');
          }
          if (missing.length > 0) {
            return `Missing required fields: ${missing.join(', ')}`;
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
            return invalid.map(field => validationMessages[field]).join(' • ');
          }
          if (missing.length > 0) {
            return `Optional fields missing: ${missing.join(', ')}`;
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
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isComplete
                  ? 'bg-green-50/50' 
                  : step.optional 
                    ? 'bg-blue-50/50 hover:bg-blue-100/80'
                    : errorMessage
                      ? 'bg-red-50/50 hover:bg-red-100/80'
                      : 'bg-gray-50 hover:bg-gray-100/80'
              }`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                isComplete
                  ? 'bg-green-100 text-green-600' 
                  : step.optional
                    ? 'bg-blue-100 text-blue-600'
                    : errorMessage
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-200 text-gray-600'
              }`}>
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : errorMessage ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${
                    isComplete
                      ? 'text-green-700' 
                      : step.optional
                        ? 'text-blue-700'
                        : errorMessage
                          ? 'text-red-700'
                          : 'text-gray-700'
                  }`}>
                    {step.title}
                  </p>
                  {step.optional && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${
                  errorMessage 
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}>
                  {errorMessage || step.description}
                </p>
              </div>
              {!isComplete && (
                <ChevronRight className={`h-4 w-4 ${
                  errorMessage ? 'text-red-400' : 'text-gray-400'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    )
  }

  return (
    <Card className="w-full bg-white border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Coach Profile Setup</h3>
            <p className="text-sm text-gray-600">
              {profileStatus === PROFILE_STATUS.PUBLISHED
                ? 'Your profile is visible to potential clients'
                : 'Complete these steps to publish your profile'}
            </p>
          </div>
          {renderStatusBadge()}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="text-gray-900 font-medium">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-gray-100 [&>div]:bg-blue-500" 
            />
          </div>

          {renderCompletionSteps()}

          {canPublish && profileStatus !== PROFILE_STATUS.PUBLISHED && (
            <Button
              className="w-full"
              disabled={isUpdating}
              onClick={async () => {
                try {
                  setIsUpdating(true)
                  const { data, error } = await updateProfileStatus({ 
                    status: PROFILE_STATUS.PUBLISHED 
                  })
                  
                  if (error) {
                    toast.error(error.message || 'Failed to publish profile')
                    return
                  }
                  
                  if (data?.success) {
                    toast.success('Profile published successfully')
                  }
                } catch (error) {
                  console.error('Error publishing profile:', error)
                  toast.error('Failed to publish profile')
                } finally {
                  setIsUpdating(false)
                }
              }}
            >
              Publish Profile
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
} 