"use client"

import { SystemSidebar } from "./_components/system-sidebar"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ContainerLoading } from "@/components/loading/container"

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Handle unauthenticated users
  useEffect(() => {
    if (isAuthLoaded) {
      if (!isSignedIn) {
        router.push('/sign-in?redirect=/dashboard/system')
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
    <RouteGuardProvider required="system-dashboard">
      <div className="flex h-full">
        <SystemSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuardProvider>
  )
}
