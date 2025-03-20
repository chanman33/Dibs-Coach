"use client"

import { BusinessSidebar } from "./_components/business-sidebar"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { useRouter } from "next/navigation"
import { ContainerLoading } from "@/components/loading"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const router = useRouter()
  
  // Handle unauthenticated users - simple redirect for users not signed in
  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/dashboard/business')
    }
  }, [isSignedIn, isAuthLoaded, router])
  
  // Show loading state while authentication is in process
  if (!isAuthLoaded || !isSignedIn) {
    return (
      <ContainerLoading 
        message="Checking authentication..."
        spinnerSize="md"
        minHeight="h-full"
      />
    );
  }
  
  // User is signed in, use RouteGuardProvider for authorization
  return (
    <RouteGuardProvider required="business-dashboard">
      <div className="flex h-screen">
        <BusinessSidebar />
        <main className="flex-1 overflow-hidden p-6">
          {children}
        </main>
      </div>
    </RouteGuardProvider>
  );
}

// Export the layout
export default BusinessLayout; 