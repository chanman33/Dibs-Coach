import { auth } from '@clerk/nextjs/server'
import { GoalsDashboard } from './_components/GoalsDashboard'
import { getUserDbIdAndRole } from '@/utils/auth'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { CoachGoalsDashboard } from './_components/CoachGoalsDashboard'
import { MenteeGoalsDashboard } from './_components/MenteeGoalsDashboard'

export default async function GoalsPage() {
  const { userId } = await auth()
  if (!userId) return null

  const { userDbId, role } = await getUserDbIdAndRole(userId)
  if (!userDbId || !role) return null

  const isCoach = role === 'REALTOR_COACH' || role === 'LOAN_OFFICER_COACH'
  const isRealtorCoach = role === 'REALTOR_COACH'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Suspense fallback={
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <MenteeGoalsDashboard
          userDbId={userDbId}
        />
        <CoachGoalsDashboard
          userDbId={userDbId}
          isRealtorCoach={isRealtorCoach}
        />
      </Suspense>
    </div>
  )
} 