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

  // Add debug logging for auth context
  console.log('[MENTEE_LAYOUT] Auth context in client:', {
    capabilities: authContext.capabilities,
    hasMenteeCapability: authContext.capabilities.includes(USER_CAPABILITIES.MENTEE),
    timestamp: new Date().toISOString()
  });

  // Check for MENTEE capability
  if (!authContext.capabilities.includes(USER_CAPABILITIES.MENTEE)) {
    console.log('[MENTEE_LAYOUT] Access denied - missing MENTEE capability:', {
      capabilities: authContext.capabilities,
      requiredCapability: USER_CAPABILITIES.MENTEE,
      timestamp: new Date().toISOString()
    });
    return <NotAuthorized message="You must be a mentee to access this area" />
  }

  console.log('[MENTEE_LAYOUT] Access granted - MENTEE capability found');
  return (
    <div className="flex h-screen">
      <MenteeSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 