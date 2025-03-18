"use client"

import { BusinessSidebar } from "./_components/business-sidebar"
import { RouteGuard } from "@/components/auth"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { ContainerLoading } from "@/components/loading"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasPermission } from "@/utils/roles/roles"
import { useAuthContext } from "@/components/auth/providers"
import { PERMISSIONS } from "@/utils/roles/roles"
import { useAuth } from "@clerk/nextjs"

function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading, organizationRole, organizations } = useOrganization()
  const authContext = useAuthContext()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  
  // Handle unauthenticated users
  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/dashboard/business')
    }
  }, [isSignedIn, isAuthLoaded, router])
  
  // Effect to check authorization once both auth context and organization data are loaded
  useEffect(() => {
    // Skip checks if auth is still loading or user isn't signed in
    if (!isAuthLoaded || !isSignedIn || isLoading) return
    
    // 1. Check if user belongs to any organization
    if (organizations.length === 0) {
      console.log("[BUSINESS_LAYOUT] No organizations found for user")
      setIsAuthorized(false)
      return
    }
    
    // 2. Check if user has required permission using combined context
    const effectiveContext = {
      ...authContext,
      orgRole: authContext.orgRole || (organizationRole as any) || undefined,
      orgLevel: authContext.orgLevel || (organizationRole ? 'LOCAL' : undefined)
    }
    
    const hasAccess = hasPermission(effectiveContext, PERMISSIONS.ACCESS_DASHBOARD)
    console.log("[BUSINESS_LAYOUT] Access permission check:", { 
      hasAccess, 
      orgRole: effectiveContext.orgRole,
      systemRole: effectiveContext.systemRole
    })
    
    setIsAuthorized(hasAccess)
  }, [isLoading, organizationRole, organizations, authContext, isSignedIn, isAuthLoaded])
  
  // Handle unauthorized access
  useEffect(() => {
    if (isAuthorized === false) {
      router.push('/not-authorized?message=Insufficient%20permissions%20to%20access%20business%20dashboard')
    }
  }, [isAuthorized, router])
  
  // Show loading state while authentication is in process
  if (!isAuthLoaded || !isSignedIn) {
    return (
      <ContainerLoading 
        message="Checking authentication..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }
  
  // Show loading state while we determine authorization
  if (isLoading || isAuthorized === null) {
    return (
      <ContainerLoading 
        message="Verifying organization access..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }
  
  // No need to render if not authorized (will redirect via useEffect)
  if (!isAuthorized) {
    return (
      <ContainerLoading 
        message="Redirecting..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }
  
  // User is authorized, show content
  return (
    <RouteGuard>
      <div className="flex h-screen">
        <BusinessSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}

// Wrap the layout with organization auth requirements
export default BusinessLayout; 