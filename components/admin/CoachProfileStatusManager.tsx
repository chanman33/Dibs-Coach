'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface CoachProfileStatusManagerProps {
  coachId: string
  coachName: string
  currentStatus: ProfileStatus
  completionPercentage: number
  updateStatus: (coachId: string, newStatus: ProfileStatus) => Promise<boolean>
}

export function CoachProfileStatusManager({
  coachId,
  coachName,
  currentStatus,
  completionPercentage,
  updateStatus
}: CoachProfileStatusManagerProps) {
  const [status, setStatus] = useState<ProfileStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async () => {
    try {
      setIsUpdating(true)
      const success = await updateStatus(coachId, status)
      
      if (success) {
        toast.success(`Status updated to ${status} for ${coachName}`)
      } else {
        toast.error('Failed to update status')
        // Reset to current status
        setStatus(currentStatus)
      }
    } catch (error) {
      console.error('Error updating coach profile status:', error)
      toast.error('An unexpected error occurred')
      setStatus(currentStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStatusBadge = (status: ProfileStatus) => {
    switch (status) {
      case PROFILE_STATUS.PUBLISHED:
        return <Badge className="bg-green-500">Published</Badge>
      case PROFILE_STATUS.REVIEW:
        return <Badge className="bg-yellow-500">In Review</Badge>
      case PROFILE_STATUS.DRAFT:
        return <Badge className="bg-gray-500">Draft</Badge>
      default:
        return null
    }
  }

  const renderStatusIcon = (status: ProfileStatus) => {
    switch (status) {
      case PROFILE_STATUS.PUBLISHED:
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case PROFILE_STATUS.REVIEW:
        return <Clock className="h-5 w-5 text-yellow-500" />
      case PROFILE_STATUS.DRAFT:
        return <XCircle className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }

  const isStatusChanged = status !== currentStatus

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{coachName}</CardTitle>
          {renderStatusBadge(currentStatus)}
        </div>
        <CardDescription>Coach Profile Status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <div className="flex items-center gap-1">
              {renderStatusIcon(currentStatus)}
              <span>{currentStatus}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Change Status</label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ProfileStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PROFILE_STATUS).map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    <div className="flex items-center gap-2">
                      {renderStatusIcon(statusOption as ProfileStatus)}
                      <span>{statusOption}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStatusChange}
          disabled={!isStatusChanged || isUpdating}
          className="w-full"
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </Button>
      </CardFooter>
    </Card>
  )
} 