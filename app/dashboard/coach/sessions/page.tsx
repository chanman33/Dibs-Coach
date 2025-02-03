"use client"
import { CoachSessionsDashboard } from '../_components/CoachSessionsDashboard'
import { withRole } from "@/components/wrapper/with-role"
import { ROLES } from "@/utils/roles/roles"

function CoachSessionsPage() {
  return <CoachSessionsDashboard />
}

export default withRole(CoachSessionsPage, [ROLES.REALTOR_COACH])