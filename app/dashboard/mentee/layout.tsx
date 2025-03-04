"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MenteeSidebar } from "./_components/mentee-sidebar"
import { useAuthContext } from "@/components/auth/providers"
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import NotAuthorized from "@/components/auth/not-authorized"

export default function MenteeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const authContext = useAuthContext()

  // Check for MENTEE capability
  if (!authContext.capabilities.includes(USER_CAPABILITIES.MENTEE)) {
    return <NotAuthorized message="You must be a mentee to access this area" />
  }

  return (
    <div className="flex h-screen">
      <MenteeSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 