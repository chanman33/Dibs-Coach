import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoachProfilesTable } from '@/components/admin/CoachProfilesTable'
import { fetchCoachProfiles } from '@/utils/actions/admin-coach-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { PROFILE_STATUS } from '@/utils/types/coach'

// Loading UI
function CoachManagementLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded mb-6" />
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  )
}

// Client component for controlling refresh
export default async function CoachManagementPage() {
  // Fetch coach profiles
  const { data: profilesData } = await fetchCoachProfiles(null)
  
  // Handle null data case
  const profiles = profilesData || []
  
  // Group profiles by status
  const publishedProfiles = profiles.filter(p => p.profileStatus === PROFILE_STATUS.PUBLISHED)
  const reviewProfiles = profiles.filter(p => p.profileStatus === PROFILE_STATUS.REVIEW)
  const draftProfiles = profiles.filter(p => p.profileStatus === PROFILE_STATUS.DRAFT)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach Profile Management</h1>
          <p className="text-muted-foreground">
            Manage coach profiles and their visibility status
          </p>
        </div>
        <form action={async () => {
          'use server'
          // This will cause the page to refresh
        }}>
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
                <TabsTrigger value="review">
                  In Review ({reviewProfiles.length})
                </TabsTrigger>
                <TabsTrigger value="draft">
                  Draft ({draftProfiles.length})
                </TabsTrigger>
              </TabsList>
              
              <Suspense fallback={<CoachManagementLoading />}>
                <TabsContent value="all">
                  <CoachProfilesTable 
                    profiles={profiles} 
                  />
                </TabsContent>
                <TabsContent value="published">
                  <CoachProfilesTable 
                    profiles={publishedProfiles} 
                  />
                </TabsContent>
                <TabsContent value="review">
                  <CoachProfilesTable 
                    profiles={reviewProfiles}
                  />
                </TabsContent>
                <TabsContent value="draft">
                  <CoachProfilesTable 
                    profiles={draftProfiles}
                  />
                </TabsContent>
              </Suspense>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 