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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Tags } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { formatDate } from '@/utils/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateCoachSpecialties } from '@/utils/actions/admin-coach-actions'
import { toast } from 'sonner'

// Available industry specialties
const INDUSTRY_SPECIALTIES = [
  'REALTOR',
  'LOAN_OFFICER',
  'INVESTOR',
  'PROPERTY_MANAGER',
  'TITLE_ESCROW',
  'INSURANCE',
  'COMMERCIAL',
  'PRIVATE_CREDIT'
]

interface CoachProfile {
  userUlid: string
  firstName: string
  lastName: string
  profileStatus: ProfileStatus
  industrySpecialties: string[]
  completionPercentage: number
  hourlyRate: number
  updatedAt: string
}

interface CoachProfilesTableProps {
  profiles: CoachProfile[]
  onUpdateStatus: (coachId: string, newStatus: ProfileStatus) => void
}

export function CoachProfilesTable({ profiles, onUpdateStatus }: CoachProfilesTableProps) {
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenSpecialties = (coach: CoachProfile) => {
    setSelectedCoach(coach)
    setSelectedSpecialties(coach.industrySpecialties || [])
    setIsDialogOpen(true)
  }

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(current => {
      if (current.includes(specialty)) {
        return current.filter(s => s !== specialty)
      }
      return [...current, specialty]
    })
  }

  const handleSaveSpecialties = async () => {
    if (!selectedCoach) return

    try {
      const result = await updateCoachSpecialties({
        coachUlid: selectedCoach.userUlid,
        specialties: selectedSpecialties
      })

      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Specialties updated successfully')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('[SAVE_SPECIALTIES_ERROR]', error)
      toast.error('Failed to update specialties')
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.userUlid}>
              <TableCell>
                {profile.firstName} {profile.lastName}
              </TableCell>
              <TableCell>
                <Badge variant={profile.profileStatus === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {profile.profileStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {profile.industrySpecialties?.map((specialty) => (
                    <Badge key={specialty} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{profile.completionPercentage}%</TableCell>
              <TableCell>${profile.hourlyRate}/hr</TableCell>
              <TableCell>{formatDate(profile.updatedAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenSpecialties(profile)}>
                      <Tags className="mr-2 h-4 w-4" />
                      Edit Specialties
                    </DropdownMenuItem>
                    {profile.profileStatus === 'DRAFT' ? (
                      <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'PUBLISHED')}>
                        Publish Profile
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'DRAFT')}>
                        Unpublish Profile
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Industry Specialties</DialogTitle>
            <DialogDescription>
              Select the industry specialties for {selectedCoach?.firstName} {selectedCoach?.lastName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] px-4">
            <div className="space-y-4">
              {INDUSTRY_SPECIALTIES.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={specialty}
                    checked={selectedSpecialties.includes(specialty)}
                    onCheckedChange={() => handleSpecialtyChange(specialty)}
                  />
                  <label
                    htmlFor={specialty}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {specialty.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSpecialties}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 