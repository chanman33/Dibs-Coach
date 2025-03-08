'use client'

import { BrowseCoaches } from '@/components/coaching/private/BrowseCoaches'
import { WithAuth } from '@/components/auth/with-auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

function CoachBrowseCoachesPage() {
  return <BrowseCoaches role={USER_CAPABILITIES.COACH} />;
}

export default WithAuth(CoachBrowseCoachesPage, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
}); 