"use client"

import { ReactNode } from "react"
import { useUser } from "@clerk/nextjs"
import { AdminSidebar } from "../admin/_components/admin-sidebar"
import { CoachSidebar } from "../coach/_components/coach-sidebar"
import { MenteeSidebar } from "../mentee/_components/mentee-sidebar"
import { useEffect, useState } from "react"
import { ROLES, type UserRole } from "@/utils/roles/roles"
import config from "@/config"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/role?userId=${user.id}`)
          const data = await response.json()
          setUserRoles(data.roles)
        } catch (error) {
          console.error("[ROLE_FETCH_ERROR]", error)
          setUserRoles([ROLES.MENTEE])
        }
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  if (loading) {
    return <div>Loading...</div>
  }

  const renderSidebar = () => {
    if (!userRoles) return null

    if (userRoles.includes(ROLES.ADMIN)) {
      return <AdminSidebar />
    }
    if (userRoles.includes(ROLES.COACH)) {
      return <CoachSidebar />
    }
    return <MenteeSidebar />
  }

  return (
    <div className="flex h-screen">
      {renderSidebar()}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </div>
    </div>
  )
} 