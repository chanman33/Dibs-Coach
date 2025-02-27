'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, EyeOff, ChevronRight } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'
import { updateProfileStatus } from '@/utils/actions/coach-actions'
import { getMissingFieldsMessage } from '@/utils/actions/calculateProfileCompletion'

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

  // Log initial props
  useEffect(() => {
    // console.log('[PROFILE_COMPLETION_PROPS]', {
    //   completionPercentage,
    //   profileStatus,
    //   canPublish,
    //   missingFields,
    //   missingRequiredFields,
    //   optionalMissingFields,
    //   validationMessages,
    //   timestamp: new Date().toISOString()
    // });
  }, [completionPercentage, profileStatus, canPublish, missingFields, missingRequiredFields, optionalMissingFields, validationMessages]);

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
    const steps = [
      {
        title: 'Basic Information',
        description: 'Personal details and bio',
        fields: ['firstName', 'lastName', 'bio', 'profileImageUrl'],
        requiredFields: ['firstName', 'lastName', 'bio', 'profileImageUrl'],
      },
      {
        title: 'Coaching Details',
        description: 'Expertise and pricing',
        fields: ['coachingSpecialties', 'hourlyRate', 'yearsCoaching'],
        completed: !missingRequiredFields.some(field => 
          ['coachingSpecialties', 'hourlyRate'].includes(field)
        ),
      },
      {
        title: 'Scheduling',
        description: 'Availability and booking',
        fields: ['calendlyUrl', 'eventTypeUrl'],
        requiredFields: ['calendlyUrl', 'eventTypeUrl'],
      },
      {
        title: 'Professional Background',
        description: 'Certifications and expertise',
        fields: ['certifications', 'languages'],
        completed: !optionalMissingFields.some(field => 
          ['certifications', 'languages'].includes(field)
        ),
        optional: true,
      }
    ]

    // Log completion status for each step
    steps.forEach(step => {
      // Get missing required fields for this step
      const incompleteRequired = missingRequiredFields.filter(field => step.fields.includes(field));
      const incompleteOptional = optionalMissingFields.filter(field => step.fields.includes(field));
      
      // Log detailed completion status
      // console.log('[STEP_COMPLETION_STATUS]', {
      //   step: step.title,
      //   completed: incompleteRequired.length === 0,
      //   fields: step.fields,
      //   incompleteRequired,
      //   incompleteOptional,
      //   missingRequiredFields, // Add this to see full list
      //   optional: step.optional,
      //   timestamp: new Date().toISOString()
      // });
    });

    return (
      <div className="space-y-3">
        {steps.map((step, index) => {
          // Get missing required fields for this step
          const incompleteRequired = missingRequiredFields.filter(field => step.fields.includes(field));
          const incompleteOptional = optionalMissingFields.filter(field => step.fields.includes(field));
          
          // A step is incomplete if it has any missing required fields OR if it's the Scheduling step with missing fields
          const hasIncomplete = incompleteRequired.length > 0 || 
            (step.title === 'Scheduling' && (incompleteRequired.length > 0 || incompleteOptional.length > 0));
          
          // Log step render details with more info
          // console.log('[STEP_RENDER_STATUS]', {
          //   step: step.title,
          //   hasIncomplete,
          //   incompleteRequired,
          //   incompleteOptional,
          //   isSchedulingStep: step.title === 'Scheduling',
          //   fields: step.fields,
          //   timestamp: new Date().toISOString()
          // });
          
          return (
            <div 
              key={step.title} 
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                !hasIncomplete
                  ? 'bg-green-50/50' 
                  : step.optional 
                    ? 'bg-blue-50/50 hover:bg-blue-100/80'
                    : 'bg-gray-50 hover:bg-gray-100/80'
              }`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                !hasIncomplete
                  ? 'bg-green-100 text-green-600' 
                  : step.optional
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {!hasIncomplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${
                    !hasIncomplete
                      ? 'text-green-700' 
                      : step.optional
                        ? 'text-blue-700'
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
                <p className="text-xs text-gray-500 mt-0.5">
                  {!hasIncomplete
                    ? step.description
                    : step.title === 'Scheduling'
                      ? [...incompleteRequired, ...incompleteOptional]
                          .map(field => validationMessages[field])
                          .filter(Boolean)
                          .join(' • ')
                      : incompleteRequired.length > 0
                        ? incompleteRequired
                            .map(field => validationMessages[field])
                            .filter(Boolean)
                            .join(' • ')
                        : step.description
                  }
                </p>
              </div>
              {hasIncomplete && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
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
          {/* Progress Bar */}
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

          {/* Completion Steps */}
          <div className="bg-white rounded-lg">
            {renderCompletionSteps()}
          </div>

          {/* Action Button */}
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