"use client"

import { ReactNode } from "react"
import { useUser } from "@clerk/nextjs"
import { CoachSidebar } from "../coach/_components/coach-sidebar"
import { MenteeSidebar } from "../mentee/_components/mentee-sidebar"
import { useEffect, useState } from "react"
import { SYSTEM_ROLES, type SystemRole, type UserRoleContext } from "@/utils/roles/roles"
import { Loader2 } from "lucide-react"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [roleContext, setRoleContext] = useState<UserRoleContext>({
    systemRole: SYSTEM_ROLES.USER,
    capabilities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/role?userId=${user.id}`)
          const data = await response.json()
          setRoleContext(data.roleData)
        } catch (error) {
          console.error("[ROLE_FETCH_ERROR]", error)
          setRoleContext({
            systemRole: SYSTEM_ROLES.USER,
            capabilities: []
          })
        }
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading settings...
          </p>
        </div>
      </div>
    )
  }

  const renderSidebar = () => {
    // Check for system roles first
    if (roleContext.systemRole === SYSTEM_ROLES.SYSTEM_OWNER || 
        roleContext.systemRole === SYSTEM_ROLES.SYSTEM_MODERATOR) {
      return <MenteeSidebar />
    }

    // Check for coach capability
    if (roleContext.capabilities.includes('COACH')) {
      return <CoachSidebar />
    }

    // Default to mentee sidebar
    return <MenteeSidebar />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {renderSidebar()}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </div>
    </div>
  )
} 