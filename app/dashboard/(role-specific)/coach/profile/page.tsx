'use client'

import { withRole } from '@/components/wrapper/with-role'
import { ROLES } from '@/utils/roles/roles'
import RealtorProfilePage from '../../realtor/profile/page'

function CoachProfilePage() {
  return <RealtorProfilePage />
}

export default withRole(CoachProfilePage, [ROLES.REALTOR_COACH]) 