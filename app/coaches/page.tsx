'use client'

import { CoachesHero } from '@/components/coaching/coach-profiles/CoachesHero'
import { BrowseCoaches } from '@/components/coaching/coach-profiles/BrowseCoaches'
import { useAuth } from '@/utils/hooks/useAuth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CoachesPage() {
  const { isLoading, isSignedIn, capabilities, isFullyLoaded } = useAuth();

  const primaryCapability = capabilities?.includes(USER_CAPABILITIES.MENTEE)
    ? USER_CAPABILITIES.MENTEE
    : capabilities?.includes(USER_CAPABILITIES.COACH)
      ? USER_CAPABILITIES.COACH
      : null;

  if (isLoading || !isFullyLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertDescription>Please log in to browse coaches.</AlertDescription>
        </Alert>
      </div>
    );
  }

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
      <BrowseCoaches role={primaryCapability} />
    </div>
  )
}

