import { auth } from '@clerk/nextjs/server'
import { ProfileDashboard } from './_components/ProfileDashboard'
import { getUserDbIdAndRole } from '@/utils/auth'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) return null

  const { userDbId, role } = await getUserDbIdAndRole(userId)
  if (!userDbId || !role) return null

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Suspense fallback={
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <ProfileDashboard 
          userId={userId}
          userRole={role}
        />
      </Suspense>
    </div>
  )
} 