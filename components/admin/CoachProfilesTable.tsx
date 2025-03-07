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
import { updateRealEstateDomains } from '@/utils/actions/admin-coach-actions'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

// Available real estate domains
const REAL_ESTATE_DOMAINS = [
  'REALTOR',
  'INVESTOR',
  'MORTGAGE',
  'PROPERTY_MANAGER',
  'TITLE_ESCROW',
  'INSURANCE',
  'COMMERCIAL',
  'PRIVATE_CREDIT'
] as const;

interface CoachProfile {
  userUlid: string
  firstName: string
  lastName: string
  profileStatus: ProfileStatus
  realEstateDomains: string[]
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
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenDomains = (coach: CoachProfile) => {
    setSelectedCoach(coach)
    setSelectedDomains(coach.realEstateDomains || [])
    setIsDialogOpen(true)
  }

  const handleDomainChange = (domain: string) => {
    setSelectedDomains(current => {
      if (current.includes(domain)) {
        return current.filter(d => d !== domain)
      }
      return [...current, domain]
    })
  }

  const handleSaveDomains = async () => {
    if (!selectedCoach) return

    try {
      const result = await updateRealEstateDomains({
        coachUlid: selectedCoach.userUlid,
        domains: selectedDomains
      })

      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Real estate domains updated successfully')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('[SAVE_DOMAINS_ERROR]', error)
      toast.error('Failed to update domains')
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Real Estate Domains</TableHead>
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
                <Badge variant={
                  profile.profileStatus === 'PUBLISHED' ? 'default' : 
                  profile.profileStatus === 'ARCHIVED' ? 'destructive' : 
                  'secondary'
                }>
                  {profile.profileStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {profile.realEstateDomains?.map((domain) => (
                    <Badge key={domain} variant="outline">
                      {domain}
                    </Badge>
                  ))}
                  {profile.realEstateDomains?.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">None specified</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={profile.completionPercentage} className="w-24 h-2" />
                  <span className="text-sm font-medium">{profile.completionPercentage}%</span>
                </div>
              </TableCell>
              <TableCell>
                {profile.hourlyRate > 0 ? (
                  <span className="font-medium">${profile.hourlyRate}/hr</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{formatDate(profile.updatedAt)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDomains(profile)}
                    className="h-8 px-2"
                  >
                    <Tags className="h-4 w-4 mr-1" />
                    Domains
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {profile.profileStatus === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'PUBLISHED')}>
                          Publish Profile
                        </DropdownMenuItem>
                      )}
                      {profile.profileStatus === 'PUBLISHED' && (
                        <>
                          <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'DRAFT')}>
                            Unpublish Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'ARCHIVED')}>
                            Archive Profile
                          </DropdownMenuItem>
                        </>
                      )}
                      {profile.profileStatus === 'ARCHIVED' && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(profile.userUlid, 'DRAFT')}>
                          Restore Profile
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>No coach profiles found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Real Estate Domains</DialogTitle>
            <DialogDescription>
              Select the real estate domains for {selectedCoach?.firstName} {selectedCoach?.lastName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] px-4">
            <div className="space-y-4">
              {REAL_ESTATE_DOMAINS.map((domain) => (
                <div key={domain} className="flex items-center space-x-2">
                  <Checkbox
                    id={domain}
                    checked={selectedDomains.includes(domain)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDomains(prev => [...prev, domain])
                      } else {
                        setSelectedDomains(prev => prev.filter(d => d !== domain))
                      }
                    }}
                  />
                  <label
                    htmlFor={domain}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {domain.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDomains}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 