'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoachProfilesTable } from '@/components/admin/CoachProfilesTable'
import { updateCoachProfileStatus, refreshCoachManagement } from '@/utils/actions/admin-coach-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, CheckCircle, PieChart, DollarSign, Search } from 'lucide-react'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { removeUserCapability } from '@/utils/permissions'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

interface CoachProfile {
  userUlid: string
  firstName: string
  lastName: string
  profileStatus: ProfileStatus
  coachRealEstateDomains: string[]
  coachPrimaryDomain: string | null
  completionPercentage: number
  hourlyRate: number
  updatedAt: string
  email: string
}

interface CoachManagementClientProps {
  profiles: CoachProfile[]
  publishedProfiles: CoachProfile[]
  draftProfiles: CoachProfile[]
}

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

export default function CoachManagementClient({
  profiles,
  publishedProfiles,
  draftProfiles
}: CoachManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');

  // Calculate average completion percentage
  const avgCompletion = profiles.length > 0
    ? Math.round(profiles.reduce((acc, p) => acc + p.completionPercentage, 0) / profiles.length)
    : 0;

  // Calculate average hourly rate (only for profiles with rate > 0)
  const profilesWithRate = profiles.filter(p => p.hourlyRate > 0);
  const avgRate = profilesWithRate.length > 0
    ? Math.round(profilesWithRate.reduce((acc, p) => acc + p.hourlyRate, 0) / profilesWithRate.length)
    : 0;

  const handleRefresh = async () => {
    try {
      await refreshCoachManagement();
      toast.success('Coach profiles refreshed');
    } catch (error) {
      toast.error('Failed to refresh coach profiles');
    }
  };

  const handleUpdateStatus = async (coachId: string, newStatus: typeof PROFILE_STATUS[keyof typeof PROFILE_STATUS]) => {
    try {
      const result = await updateCoachProfileStatus({ coachUlid: coachId, status: newStatus })
      if (result.error) {
        if (result.error.code === 'VALIDATION_ERROR') {
          toast.error(result.error.message)
        } else {
          toast.error('Failed to update profile status')
        }
        return
      }
      toast.success(`Profile status updated to ${newStatus.toLowerCase()} successfully`)
    } catch (error) {
      console.error('[UPDATE_STATUS_ERROR]', error)
      toast.error('Failed to update profile status')
    }
  }

  const handleRemoveCoachCapability = async (coachId: string) => {
    try {
      const success = await removeUserCapability(coachId, USER_CAPABILITIES.COACH)
      if (success) {
        toast.success('Coach capability removed successfully')
        await handleRefresh() // Refresh the list
      } else {
        toast.error('Failed to remove coach capability')
      }
    } catch (error) {
      console.error('[REMOVE_COACH_ERROR]', error)
      toast.error('Failed to remove coach capability')
    }
  }

  // Filter profiles based on search query and domain filter
  const filterProfiles = (profileList: CoachProfile[]) => {
    return profileList.filter(profile => {
      const nameMatch = `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      const domainMatch = domainFilter === 'all' || profile.coachRealEstateDomains.includes(domainFilter);
      return nameMatch && domainMatch;
    });
  }

  // Get the current profiles based on the active tab
  const getCurrentProfiles = () => {
    switch (currentTab) {
      case 'published':
        return filterProfiles(publishedProfiles);
      case 'draft':
        return filterProfiles(draftProfiles);
      default:
        return filterProfiles(profiles);
    }
  }

  return (
    <div className="container space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Coach Management</h1>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage coach profiles and their visibility status
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Coaches</p>
                <h3 className="text-2xl font-bold">{profiles.length}</h3>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <h3 className="text-2xl font-bold">{publishedProfiles.length}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                <h3 className="text-2xl font-bold">{avgCompletion}%</h3>
              </div>
              <PieChart className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rate</p>
                <h3 className="text-2xl font-bold">${avgRate}/hr</h3>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({profiles.length})
                  </TabsTrigger>
                  <TabsTrigger value="published">
                    Published ({publishedProfiles.length})
                  </TabsTrigger>
                  <TabsTrigger value="draft">
                    Draft ({draftProfiles.length})
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search coaches..." 
                      className="pl-8 w-full md:w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {REAL_ESTATE_DOMAINS.map(domain => (
                        <SelectItem key={domain} value={domain}>{domain.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <TabsContent value="all">
                <CoachProfilesTable 
                  profiles={getCurrentProfiles()}
                  onUpdateStatus={handleUpdateStatus}
                  onRemoveCoach={handleRemoveCoachCapability}
                />
              </TabsContent>
              <TabsContent value="published">
                <CoachProfilesTable 
                  profiles={getCurrentProfiles()}
                  onUpdateStatus={handleUpdateStatus}
                  onRemoveCoach={handleRemoveCoachCapability}
                />
              </TabsContent>
              <TabsContent value="draft">
                <CoachProfilesTable 
                  profiles={getCurrentProfiles()}
                  onUpdateStatus={handleUpdateStatus}
                  onRemoveCoach={handleRemoveCoachCapability}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 