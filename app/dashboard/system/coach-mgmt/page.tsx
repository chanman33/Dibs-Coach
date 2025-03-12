import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchCoachProfiles } from '@/utils/actions/admin-coach-actions'
import { PROFILE_STATUS } from '@/utils/types/coach'
import CoachManagementClient from './_components/CoachManagementClient'

// Loading UI
function CoachManagementLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded mb-6" />
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  )
}

// Server Component for data fetching
export default async function CoachManagementPage() {
  // Fetch coach profiles
  const { data: profilesData } = await fetchCoachProfiles(null)
  
  // Handle null data case and transform to match CoachProfile type
  const profiles = (profilesData || []).map(profile => ({
    userUlid: profile.userUlid,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    profileStatus: profile.profileStatus,
    coachRealEstateDomains: profile.coachRealEstateDomains || [],
    coachPrimaryDomain: profile.coachPrimaryDomain || null,
    completionPercentage: profile.completionPercentage,
    hourlyRate: profile.hourlyRate || 0,
    updatedAt: profile.updatedAt
  }))
  
  // Group profiles by status
  const publishedProfiles = profiles.filter(p => p.profileStatus === PROFILE_STATUS.PUBLISHED)
  const draftProfiles = profiles.filter(p => p.profileStatus === PROFILE_STATUS.DRAFT)

  return (
    <Suspense fallback={<CoachManagementLoading />}>
      <CoachManagementClient
        profiles={profiles}
        publishedProfiles={publishedProfiles}
        draftProfiles={draftProfiles}
      />
    </Suspense>
  )
} 