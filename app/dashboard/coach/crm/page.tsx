"use client"
import { CoachCRMDashboard } from '../_components/CoachCRMDashboard'
import { withRole } from "@/components/wrapper/with-role"
import { USER_CAPABILITIES } from "@/utils/roles/roles"

function CoachCRMPage() {
  return <CoachCRMDashboard />
}

export default withRole(CoachCRMPage, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
})

