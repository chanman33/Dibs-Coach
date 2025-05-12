"use client"

import { ReactNode } from "react"
import { useUser } from "@clerk/nextjs"
import { CoachSidebar } from "../coach/_components/coach-sidebar"
import { MenteeSidebar } from "../mentee/_components/mentee-sidebar"
import { useEffect, useState } from "react"
import { SYSTEM_ROLES, type SystemRole, type UserRoleContext, USER_CAPABILITIES } from "@/utils/roles/roles"
import { Loader2 } from "lucide-react"
import { fetchUserCapabilities } from "@/utils/actions/user-actions"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [roleContext, setRoleContext] = useState<UserRoleContext>({
    systemRole: SYSTEM_ROLES.USER,
    capabilities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRoles() {
      if (user?.id) {
        try {
          console.log("[FETCHING_ROLES] Fetching roles for user:", user.id)
          const result = await fetchUserCapabilities()
          console.log("[ROLE_DATA_RECEIVED]", result)
          
          if (result.error) {
            throw result.error
          }

          if (result.data) {
            // Filter capabilities to only include valid role capabilities
            const validCapabilities = result.data.capabilities.filter(
              (cap): cap is keyof typeof USER_CAPABILITIES => 
                cap === 'COACH' || cap === 'MENTEE'
            )

            setRoleContext(prev => ({
              ...prev,
              capabilities: validCapabilities
            }))
          }
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

    fetchRoles()
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
    console.log("[RENDER_SIDEBAR] Current roleContext:", roleContext)
    
    // If user has COACH capability, show coach sidebar regardless of other capabilities
    if (roleContext.capabilities.includes('COACH')) {
      console.log("[RENDER_SIDEBAR] Rendering CoachSidebar")
      return <CoachSidebar />
    }

    // Default to mentee sidebar for all other cases
    console.log("[RENDER_SIDEBAR] Rendering MenteeSidebar")
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
