'use client'

import { CoachesHero } from '@/components/coaching/coach-profiles/CoachesHero'
import { BrowseCoaches } from '@/components/coaching/coach-profiles/BrowseCoaches'
import { useAuth } from '@/utils/hooks/useAuth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'

export default function CoachesPage() {
  const { isLoading, isSignedIn, capabilities, isFullyLoaded } = useAuth();

  // Determine the primary capability for signed-in users, or use a default for public users
  const primaryCapability = capabilities?.includes(USER_CAPABILITIES.MENTEE)
    ? USER_CAPABILITIES.MENTEE
    : capabilities?.includes(USER_CAPABILITIES.COACH)
      ? USER_CAPABILITIES.COACH
      : USER_CAPABILITIES.MENTEE; // Default to MENTEE for public users

  if (isLoading || !isFullyLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Remove the auth check that blocks unauthenticated users
  // Allow all users to browse coaches; restrict actions in BrowseCoaches if needed

  if (!primaryCapability) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="default">
          <AlertDescription>You do not have the necessary permissions to browse coaches.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <CoachesHero />
      <BrowseCoaches role={primaryCapability} isSignedIn={!!isSignedIn} />
    </div>
  )
}
