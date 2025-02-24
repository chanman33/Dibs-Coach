'use client'

import { BrowseCoaches } from '@/components/coaching/BrowseCoaches'
import { withRole } from '@/components/wrapper/with-role'
import { ROLES, USER_CAPABILITIES, SYSTEM_ROLES } from '@/utils/roles/roles'

function CoachBrowseCoachesPage() {
  return <BrowseCoaches role={USER_CAPABILITIES.COACH} />;
}

export default withRole(CoachBrowseCoachesPage, [SYSTEM_ROLES.USER]); 