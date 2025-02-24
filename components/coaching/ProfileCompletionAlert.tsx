'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  EyeOff,
  Edit
} from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { useState } from 'react'
import { updateProfileStatus } from '@/utils/actions/coach-actions'
import { toast } from 'sonner'
import { getMissingFieldsMessage } from '@/utils/profile/calculateProfileCompletion'

interface ProfileCompletionAlertProps {
  completionPercentage: number
  profileStatus: ProfileStatus
  canPublish: boolean
  missingFields: string[]
  onEdit?: () => void
}

export function ProfileCompletionAlert({
  completionPercentage,
  profileStatus,
  canPublish,
  missingFields,
  onEdit
}: ProfileCompletionAlertProps) {
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
        toast.success(`Profile status updated to ${status}`)
      }
    } catch (err) {
      toast.error('Failed to update profile status')
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Content based on status
  if (profileStatus === PROFILE_STATUS.PUBLISHED) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Your profile is published</AlertTitle>
        <AlertDescription className="text-green-700">
          Your profile is visible to potential clients. You can unpublish it at any time.
        </AlertDescription>
        <div className="mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleStatusUpdate(PROFILE_STATUS.DRAFT)}
            disabled={isUpdating}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Unpublish Profile
          </Button>
        </div>
      </Alert>
    )
  }

  if (profileStatus === PROFILE_STATUS.REVIEW) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Your profile is being reviewed</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Your profile is complete and awaiting approval. You'll be notified once it's published.
        </AlertDescription>
        <div className="mt-2 flex gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleStatusUpdate(PROFILE_STATUS.DRAFT)}
            disabled={isUpdating}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Return to Draft
          </Button>
        </div>
      </Alert>
    )
  }

  // DRAFT status
  return (
    <Alert className={canPublish ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}>
      {canPublish ? (
        <CheckCircle className="h-4 w-4 text-blue-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      )}
      <AlertTitle className={canPublish ? "text-blue-800" : "text-amber-800"}>
        {canPublish ? "Your profile is ready to publish" : "Complete your profile"}
      </AlertTitle>
      <AlertDescription className={canPublish ? "text-blue-700" : "text-amber-700"}>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Profile completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className={canPublish ? "bg-blue-100" : "bg-amber-100"} />
        </div>
        {missingFields.length > 0 && (
          <p className="text-sm mb-2">{getMissingFieldsMessage(missingFields)}</p>
        )}
        {canPublish ? (
          <p className="text-sm">
            Your profile is complete and ready to be published. Once published, it will be visible to potential clients.
          </p>
        ) : (
          <p className="text-sm">
            Complete your profile to make it visible to potential clients. A complete profile increases your chances of being found.
          </p>
        )}
      </AlertDescription>
      <div className="mt-3 flex gap-2">
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
        {canPublish && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleStatusUpdate(PROFILE_STATUS.REVIEW)}
            disabled={isUpdating || !canPublish}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        )}
      </div>
    </Alert>
  )
} 