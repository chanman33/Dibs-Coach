"use client"
import { CoachSessionsDashboard } from '../_components/CoachSessionsDashboard'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function CoachSessionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CoachSessionsDashboard />
    </Suspense>
  )
}