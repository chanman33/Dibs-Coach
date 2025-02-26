'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, EyeOff, ChevronRight } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'
import { updateProfileStatus } from '@/utils/actions/coach-actions'
import { getMissingFieldsMessage } from '@/utils/profile/calculateProfileCompletion'

interface ProfileCompletionProps {
  completionPercentage: number
  profileStatus: ProfileStatus
  canPublish: boolean
  missingFields: string[]
}

export function ProfileCompletion({
  completionPercentage,
  profileStatus,
  canPublish,
  missingFields,
}: ProfileCompletionProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (status: ProfileStatus) => {
    try {
      setIsUpdating(true)
      const { data, error } = await updateProfileStatus({ status })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      if (data?.success) {
        toast.success(`Profile status updated to ${status === PROFILE_STATUS.PUBLISHED ? 'published' : status.toLowerCase()}`)
      }
    } catch (err) {
      toast.error('Failed to update profile status')
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStatusBadge = () => {
    switch (profileStatus) {
      case PROFILE_STATUS.PUBLISHED:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Published</span>
          </div>
        )
      case PROFILE_STATUS.DRAFT:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <EyeOff className="h-5 w-5" />
            <span className="font-medium">Draft</span>
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
        completed: !missingFields.some(field => ['displayName', 'bio', 'primaryMarket'].includes(field)),
      },
      {
        title: 'Coaching Details',
        completed: !missingFields.some(field => ['specialties', 'yearsCoaching', 'hourlyRate'].includes(field)),
      },
      {
        title: 'Scheduling',
        completed: !missingFields.some(field => ['calendlyUrl', 'eventTypeUrl'].includes(field)),
      },
      {
        title: 'Professional Background',
        completed: !missingFields.some(field => ['certifications', 'languages', 'marketExpertise'].includes(field)),
      }
    ]

    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
              step.completed 
                ? 'bg-green-100 border-green-500 text-green-600' 
                : 'bg-blue-50 border-blue-200 text-blue-500'
            }`}>
              {step.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${step.completed ? 'text-green-600' : 'text-blue-900'}`}>
                {step.title}
              </p>
              {!step.completed && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Complete this section to improve your profile
                </p>
              )}
            </div>
            {!step.completed && (
              <ChevronRight className="h-5 w-5 text-blue-400" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="w-full bg-blue-50 border-blue-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Profile Setup</h3>
            <p className="text-sm text-blue-700">
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
              <span className="text-blue-800">Overall Progress</span>
              <span className="text-blue-800 font-medium">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-blue-100 [&>div]:bg-blue-500" 
            />
          </div>

          {/* Completion Steps */}
          <div className="bg-white rounded-lg p-4">
            {renderCompletionSteps()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {profileStatus === PROFILE_STATUS.PUBLISHED ? (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(PROFILE_STATUS.DRAFT)}
                disabled={isUpdating}
                className="bg-white hover:bg-blue-50"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish Profile
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => handleStatusUpdate(PROFILE_STATUS.PUBLISHED)}
                disabled={isUpdating || !canPublish}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {canPublish ? 'Publish Profile' : 'Complete Required Steps to Publish'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 