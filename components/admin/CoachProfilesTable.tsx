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
  DropdownMenuSeparator,
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateRealEstateDomains } from '@/utils/actions/admin-coach-actions'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateUserDomains } from '@/utils/actions/user-profile-actions'

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
  primaryDomain: string | null
  completionPercentage: number
  hourlyRate: number
  updatedAt: string
  isSystemOwner?: boolean // Added to determine if user is system owner
  email: string
}

interface CoachProfilesTableProps {
  profiles: CoachProfile[]
  onUpdateStatus: (coachId: string, newStatus: ProfileStatus) => void
  onRemoveCoach: (coachId: string) => Promise<void>
}

export function CoachProfilesTable({ profiles, onUpdateStatus, onRemoveCoach }: CoachProfilesTableProps) {
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenDomains = (coach: CoachProfile) => {
    setSelectedCoach(coach)
    setSelectedDomains(coach.realEstateDomains || [])
    setSelectedPrimaryDomain(coach.primaryDomain)
    setIsDialogOpen(true)
  }

  const handleDomainChange = (domain: string) => {
    setSelectedDomains(current => {
      if (current.includes(domain)) {
        // If removing a domain that's the primary, clear the primary domain
        if (selectedPrimaryDomain === domain) {
          setSelectedPrimaryDomain(null)
        }
        return current.filter(d => d !== domain)
      }
      return [...current, domain]
    })
  }

  const handlePrimaryDomainChange = (domain: string) => {
    // Ensure the domain is in the selected domains list
    if (!selectedDomains.includes(domain)) {
      setSelectedDomains(prev => [...prev, domain])
    }
    setSelectedPrimaryDomain(domain)
  }

  const handleSaveDomains = async () => {
    if (!selectedCoach) return

    try {
      // Use updateUserDomains to update both realEstateDomains and primaryDomain
      const result = await updateUserDomains({
        realEstateDomains: selectedDomains,
        primaryDomain: selectedPrimaryDomain,
        targetUserUlid: selectedCoach.userUlid
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to update domains')
        return
      }

      toast.success('Domains updated successfully')
      setIsDialogOpen(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('[SAVE_DOMAINS_ERROR]', error)
      toast.error('Failed to update domains')
    }
  }

  const handleStatusUpdate = async (profile: CoachProfile, newStatus: ProfileStatus) => {
    try {
      await onUpdateStatus(profile.userUlid, newStatus)
    } catch (error) {
      console.error('[STATUS_UPDATE_ERROR]', error)
      toast.error('Failed to update status')
    }
  }

  const validateProfileRequirements = (profile: CoachProfile) => {
    const requirements = {
      profileCompletion: profile.completionPercentage >= 70,
      hasValidDomains: profile.realEstateDomains.length >= 1,
      hasValidRate: profile.hourlyRate > 0
    }

    return {
      isValid: Object.values(requirements).every(Boolean),
      requirements,
      missingRequirements: Object.entries(requirements)
        .filter(([_, satisfied]) => !satisfied)
        .map(([req]) => req)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Real Estate Domains</TableHead>
            <TableHead>Primary Domain</TableHead>
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
              <TableCell className="text-sm text-muted-foreground">
                {profile.email}
              </TableCell>
              <TableCell>
                <Badge variant={
                  profile.profileStatus === 'PUBLISHED' ? 'default' : 
                  profile.profileStatus === 'ARCHIVED' ? 'destructive' : 
                  profile.profileStatus === 'SUSPENDED' ? 'outline' :
                  'secondary'
                } className={
                  profile.profileStatus === 'SUSPENDED' ? 'border-yellow-500 text-yellow-600' : ''
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
                {profile.primaryDomain ? (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {profile.primaryDomain}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground italic">None set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Draft Profile Actions */}
                      {profile.profileStatus === 'DRAFT' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(profile, 'PUBLISHED')}
                          className="text-green-600 focus:text-green-600"
                        >
                          Publish Profile
                        </DropdownMenuItem>
                      )}

                      {/* Published Profile Actions */}
                      {profile.profileStatus === 'PUBLISHED' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(profile, 'DRAFT')}
                          >
                            Unpublish to Draft
                          </DropdownMenuItem>
                          {profile.isSystemOwner && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(profile, 'SUSPENDED')}
                                className="text-yellow-600 focus:text-yellow-600"
                              >
                                Suspend Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(profile, 'ARCHIVED')}
                                className="text-destructive focus:text-destructive"
                              >
                                Archive Profile
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}

                      {/* Suspended Profile Actions */}
                      {profile.profileStatus === 'SUSPENDED' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(profile, 'PUBLISHED')}
                            className="text-green-600 focus:text-green-600"
                          >
                            Restore to Published
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(profile, 'ARCHIVED')}
                            className="text-destructive focus:text-destructive"
                          >
                            Archive Profile
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Archived Profile Actions */}
                      {profile.profileStatus === 'ARCHIVED' && profile.isSystemOwner && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(profile, 'DRAFT')}
                          className="text-muted-foreground focus:text-muted-foreground"
                        >
                          Un-Archive to Draft
                        </DropdownMenuItem>
                      )}

                      {/* Always show Update Domains option */}
                      <DropdownMenuItem 
                        onClick={() => handleOpenDomains(profile)}
                        className="focus:text-primary"
                      >
                        <Tags className="h-4 w-4 mr-2" />
                        Update Domains
                      </DropdownMenuItem>

                      {/* Remove Coach Capability - moved to bottom */}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onRemoveCoach(profile.userUlid)}
                        className="text-destructive focus:text-destructive"
                      >
                        Remove Coach Capability
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>No coach profiles found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Domain Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Real Estate Domains</DialogTitle>
            <DialogDescription>
              Select the domains for this coach and set a primary domain.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domains" className="font-medium">Real Estate Domains</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="grid gap-3">
                  {REAL_ESTATE_DOMAINS.map((domain) => (
                    <div key={domain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`domain-${domain}`}
                        checked={selectedDomains.includes(domain)}
                        onCheckedChange={() => handleDomainChange(domain)}
                      />
                      <label
                        htmlFor={`domain-${domain}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {domain.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primaryDomain" className="font-medium">Primary Domain</Label>
              <RadioGroup 
                value={selectedPrimaryDomain || ''} 
                onValueChange={handlePrimaryDomainChange}
                className="grid gap-3"
              >
                {selectedDomains.map((domain) => (
                  <div key={domain} className="flex items-center space-x-2">
                    <RadioGroupItem value={domain} id={`primary-${domain}`} />
                    <Label htmlFor={`primary-${domain}`}>{domain.replace(/_/g, ' ')}</Label>
                  </div>
                ))}
                {selectedDomains.length === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    Select at least one domain above to set a primary domain
                  </div>
                )}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveDomains}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 