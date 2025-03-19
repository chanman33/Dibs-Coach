"use client"

import { useRouter } from "next/navigation"
import { MenteeSidebar } from "./_components/mentee-sidebar"
import { useAuthContext } from "@/components/auth/providers"
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { ContainerLoading } from "@/components/loading/container"
import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function MenteeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Handle unauthenticated users
  useEffect(() => {
    if (isAuthLoaded) {
      if (!isSignedIn) {
        router.push('/sign-in?redirect=/dashboard/mentee')
      } else {
        setLoading(false)
      }
    }
  }, [isSignedIn, isAuthLoaded, router])
  
  // Show loading state while authentication is in process
  if (!isAuthLoaded || loading) {
    return (
      <ContainerLoading 
        message="Checking authentication..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  return (
    <RouteGuardProvider required="mentee-dashboard">
      <div className="flex h-screen">
        <MenteeSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </RouteGuardProvider>
  )
} 