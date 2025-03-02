'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoachProfilesTable } from '@/components/admin/CoachProfilesTable'
import { updateCoachProfileStatus, refreshCoachManagement } from '@/utils/actions/admin-coach-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { ProfileStatus } from '@/utils/types/coach'
import { toast } from 'sonner'

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

interface CoachManagementClientProps {
  profiles: CoachProfile[]
  publishedProfiles: CoachProfile[]
  draftProfiles: CoachProfile[]
}

export default function CoachManagementClient({
  profiles,
  publishedProfiles,
  draftProfiles
}: CoachManagementClientProps) {
  const handleUpdateStatus = async (coachId: string, newStatus: ProfileStatus) => {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach Profile Management</h1>
          <p className="text-muted-foreground">
            Manage coach profiles and their visibility status
          </p>
        </div>
        <form action={refreshCoachManagement}>
          <Button type="submit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </form>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Coach Profiles Overview</CardTitle>
            <CardDescription>
              View and manage coach profiles. Use the tabs to filter by status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
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
              
              <TabsContent value="all">
                <CoachProfilesTable 
                  profiles={profiles}
                  onUpdateStatus={handleUpdateStatus}
                />
              </TabsContent>
              <TabsContent value="published">
                <CoachProfilesTable 
                  profiles={publishedProfiles}
                  onUpdateStatus={handleUpdateStatus}
                />
              </TabsContent>
              <TabsContent value="draft">
                <CoachProfilesTable 
                  profiles={draftProfiles}
                  onUpdateStatus={handleUpdateStatus}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 