'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, CheckCircle, Clock, FileEdit, Eye, Loader2, InfoIcon } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { updateCoachProfileStatus } from '@/utils/actions/admin-coach-actions'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { PUBLICATION_THRESHOLD } from '@/utils/profile/calculateProfileCompletion'

type CoachProfile = {
  userUlid: string
  profileUlid: string
  firstName: string
  lastName: string
  email: string
  profileImageUrl: string | null
  profileStatus: ProfileStatus
  completionPercentage: number
  specialties: string[]
  hourlyRate: number | null
  createdAt: string
  updatedAt: string
}

interface CoachProfilesTableProps {
  profiles: CoachProfile[]
}

export function CoachProfilesTable({ profiles }: CoachProfilesTableProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const handleStatusUpdate = async (coachUlid: string, status: ProfileStatus) => {
    try {
      setUpdating(coachUlid)
      const { data, error } = await updateCoachProfileStatus({ coachUlid, status })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      if (data?.success) {
        toast.success(`Profile status updated to ${status}`)
        router.refresh()
      }
    } catch (err) {
      toast.error('Failed to update profile status')
      console.error(err)
    } finally {
      setUpdating(null)
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

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p className="flex items-center">
          <InfoIcon className="mr-2 h-4 w-4" />
          Coaches can now publish their profiles directly if they reach {PUBLICATION_THRESHOLD}% completion. 
          You can still manually review and update profiles as needed.
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No coach profiles found
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.userUlid}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.profileImageUrl || undefined} alt={`${profile.firstName} ${profile.lastName}`} />
                        <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{profile.firstName} {profile.lastName}</div>
                        <div className="text-sm text-muted-foreground">{profile.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(profile.profileStatus)}</TableCell>
                  <TableCell>
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{profile.completionPercentage}%</span>
                      </div>
                      <Progress value={profile.completionPercentage} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-40 truncate">
                      {profile.specialties.length > 0 
                        ? profile.specialties.join(', ') 
                        : <span className="text-muted-foreground italic">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.hourlyRate 
                      ? `$${profile.hourlyRate}/hr`
                      : <span className="text-muted-foreground italic">Not set</span>}
                  </TableCell>
                  <TableCell>
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {updating === profile.userUlid ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => window.open(`/dashboard/system/coach-mgmt/${profile.userUlid}`, '_blank')}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(profile.userUlid, PROFILE_STATUS.DRAFT)}
                            disabled={profile.profileStatus === PROFILE_STATUS.DRAFT}
                          >
                            <FileEdit className="mr-2 h-4 w-4" />
                            Mark as Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(profile.userUlid, PROFILE_STATUS.REVIEW)}
                            disabled={profile.profileStatus === PROFILE_STATUS.REVIEW}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Mark as In Review
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(profile.userUlid, PROFILE_STATUS.PUBLISHED)}
                            disabled={profile.profileStatus === PROFILE_STATUS.PUBLISHED || profile.completionPercentage < 80}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publish Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 