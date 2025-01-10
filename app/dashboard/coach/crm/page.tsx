"use client"
import { CoachCRMDashboard } from '../_components/CoachCRMDashboard'
import { withRole } from "@/components/wrapper/with-role"
import { ROLES } from "@/utils/roles/roles"
import { Users, Target, Clock, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from 'next/link'

function CoachCRMPage() {
  return <CoachCRMDashboard />
}

export default withRole(CoachCRMPage, [ROLES.REALTOR_COACH])

