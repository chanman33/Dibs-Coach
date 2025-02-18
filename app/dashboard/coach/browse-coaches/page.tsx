'use client'

import { BrowseCoaches } from '@/components/coaching/BrowseCoaches'
import { withRole } from '@/components/wrapper/with-role'
import { ROLES } from '@/utils/roles/roles'

function CoachBrowseCoachesPage() {
  return <BrowseCoaches role="coach" />;
}

export default withRole(CoachBrowseCoachesPage, [ROLES.COACH]); 