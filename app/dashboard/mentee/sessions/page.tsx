import { Suspense } from 'react'
import { fetchTrainingHistory } from '@/utils/actions/training'
import { Loader2 } from 'lucide-react'
import { TrainingHistoryClient } from './training-history-client'

export const metadata = {
  title: 'Coaching History | DIBS',
  description: 'View your past and upcoming coaching sessions'
}

// Server Component
export default async function TrainingHistoryPage() {
  const { data, error } = await fetchTrainingHistory({})
  
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-destructive/10 text-destructive rounded-md p-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Error Loading Coaching History</h2>
          <p>We encountered a problem while loading your coaching session history. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your coaching history...</p>
          </div>
        </div>
      }>
        <TrainingHistoryClient initialData={data || undefined} />
      </Suspense>
    </div>
  )
}
