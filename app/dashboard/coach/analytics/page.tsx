'use client'

import { CoachAnalyticsDashboard } from '../_components/CoachAnalyticsDashboard'
import { WithAuth } from '@/components/auth/with-auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useAuthContext } from '@/components/auth/providers'

function CoachAnalyticsPage() {
  const { userUlid } = useAuthContext()

  if (!userUlid) {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <CoachAnalyticsDashboard userDbId={userUlid} />
    </div>
  )
}

export default WithAuth(CoachAnalyticsPage, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
}); 