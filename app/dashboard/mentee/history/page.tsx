import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { CalendarDays, Clock, Search, Star, UserCircle } from 'lucide-react'
import { fetchTrainingHistory } from '@/utils/actions/training'
import { WithAuth } from '@/components/auth/with-auth'
import TrainingHistoryClient from './training-history-client'

// Server Component
export default async function TrainingHistoryPage() {
  const { data, error } = await fetchTrainingHistory({})
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load training history</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No training data available</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrainingHistoryClient initialData={data} />
    </Suspense>
  )
}
