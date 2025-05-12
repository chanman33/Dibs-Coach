"use client"

import { CoachAnalyticsDashboard } from '../_components/CoachAnalyticsDashboard'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useCentralizedAuth } from '@/app/provider'

export default function CoachAnalyticsPage() {
  const { authData } = useCentralizedAuth()
  const { userUlid } = authData || {}
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      {userUlid ? <CoachAnalyticsDashboard userUlid={userUlid} /> : null}
    </Suspense>
  )
}
