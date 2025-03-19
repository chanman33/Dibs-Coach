"use client"
import { BrowseCoaches } from '@/components/coaching/private/BrowseCoaches'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

export default function CoachBrowseCoachesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <BrowseCoaches role="COACH" />
    </Suspense>
  )
} 