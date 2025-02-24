'use client'

import { BrowseCoaches } from '@/components/coaching/private/BrowseCoaches'
import { withRole } from '@/components/wrapper/with-role'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

function CoachBrowseCoachesPage() {
  return <BrowseCoaches role={USER_CAPABILITIES.COACH} />;
}

export default withRole(CoachBrowseCoachesPage, [USER_CAPABILITIES.COACH]); 