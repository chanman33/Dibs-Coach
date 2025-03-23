"use client"
import { CoachSessionsDashboard } from '../_components/CoachSessionsDashboard'
import { Suspense, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function CoachSessionsPage() {
  // Create a fresh QueryClient for each page render to avoid shared state issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Disable retries by default
        refetchOnWindowFocus: false, // Disable refetching on window focus
        refetchOnMount: false, // Disable refetching on mount
        refetchOnReconnect: false, // Disable refetching on reconnect
      },
    },
  }))

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