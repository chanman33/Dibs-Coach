"use client"

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CoachSessionsDashboard } from '../_components/CoachSessionsDashboard'

// Log for debugging
console.log('[DEBUG_PAGE] CoachSessionsPage module loaded')

// Create a client with enhanced serialization settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      // Disable structural sharing to prevent non-serializable objects
      structuralSharing: false
    },
  },
})

/**
 * Coach Sessions Page Component
 * Provides query client context and suspense boundary for the sessions dashboard
 */
export default function CoachSessionsPage() {
  console.log('[DEBUG_PAGE] CoachSessionsPage component rendered')
  
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <CoachSessionsDashboard />
      </Suspense>
    </QueryClientProvider>
  )
} 