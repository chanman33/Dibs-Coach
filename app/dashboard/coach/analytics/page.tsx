"use client"
import { CoachAnalyticsDashboard } from '../_components/CoachAnalyticsDashboard'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthContext } from '@/components/auth/providers'

export default function CoachAnalyticsPage() {
  const { userUlid } = useAuthContext()
  
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