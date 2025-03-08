"use client"
import { CoachCRMDashboard } from '../_components/CoachCRMDashboard'
import { WithAuth } from "@/components/auth/with-auth"
import { USER_CAPABILITIES } from "@/utils/roles/roles"

function CoachCRMPage() {
  return <CoachCRMDashboard />
}

export default WithAuth(CoachCRMPage, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
});

