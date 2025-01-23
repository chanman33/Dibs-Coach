import { auth } from '@clerk/nextjs/server'
import { MessagesDashboard } from './_components/MessagesDashboard'
import { getUserDbIdAndRole } from '@/utils/auth'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export default async function MessagesPage() {
  const { userId } = await auth()
  if (!userId) return null

  const { userDbId, role } = await getUserDbIdAndRole(userId)
  if (!userDbId || !role) return null

  return (
    <div className="flex-1">
      <Suspense fallback={
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <MessagesDashboard 
          userDbId={userDbId} 
          userRole={role === 'REALTOR_COACH' || role === 'LOAN_OFFICER_COACH' ? 'coach' : 'realtor'} 
        />
      </Suspense>
    </div>
  )
} 