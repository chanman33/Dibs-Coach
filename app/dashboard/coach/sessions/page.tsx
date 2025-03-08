"use client"
import { CoachSessionsDashboard } from '../_components/CoachSessionsDashboard'
import { WithAuth } from "@/components/auth/with-auth"
import { USER_CAPABILITIES } from "@/utils/roles/roles"

function CoachSessionsPage() {
  return <CoachSessionsDashboard />
}

export default WithAuth(CoachSessionsPage, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
});