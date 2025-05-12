"use client"

import { BrowseCoaches } from '@/components/coaching/coach-profiles/BrowseCoaches'
import { YourCoaches } from '@/components/coaching/coach-profiles/YourCoaches'
import { Suspense, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useRouter } from 'next/navigation'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData } from '@/utils/types/browse-coaches'

export default function CoachBrowseCoachesPage() {
  const router = useRouter();
  const role = "COACH" as keyof typeof USER_CAPABILITIES;
  
  // Use the same hook as BrowseCoaches to access booked coaches and loading state
  const { isLoading, filteredBookedCoaches } = useBrowseCoaches({ role, isSignedIn: true });
  
  // Coach click handler for navigation
  const handleCoachClick = (coach: BrowseCoachData) => {
    const profilePath = coach.profileSlug || coach.ulid;
    router.push(`/profile/${profilePath}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Your Coaches section with proper spacing */}
      <YourCoaches
        isLoading={isLoading}
        bookedCoaches={filteredBookedCoaches}
        role={role}
        onCoachClick={handleCoachClick}
        className="pt-8"
      />
      
      {/* All coaches browse section */}
      <div className="flex-grow">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <BrowseCoaches role={role} isSignedIn={true} />
        </Suspense>
      </div>
    </div>
  )
}
