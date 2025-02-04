'use client'

import { BrowseCoaches } from '@/components/coaching/browse/BrowseCoaches'
import { withRole } from '@/components/wrapper/with-role'
import { ROLES } from '@/utils/roles/roles'

function CoachBrowseCoachesPage() {
  return <BrowseCoaches role="coach" />;
}

export default withRole(CoachBrowseCoachesPage, [ROLES.COACH]); 