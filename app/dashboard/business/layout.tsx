"use client"

import { BusinessSidebar } from "./_components/business-sidebar"
import { RouteGuard } from "@/components/auth"
import { WithOrganizationAuth } from "@/components/auth/with-organization-auth"
import { PERMISSIONS } from "@/utils/roles/roles"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { ContainerLoading } from "@/components/loading"

// Apply a base layer of authentication at the layout level for organization access
function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading } = useOrganization()
  
  // Show loading state while organization data is being fetched
  if (isLoading) {
    return (
      <ContainerLoading 
        message="Loading organization data..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }
  
  return (
    <div className="flex h-screen">
      <BusinessSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

// Wrap the layout with organization auth requirements
export default WithOrganizationAuth(BusinessLayout, {
  requireOrganization: true,
  requiredPermissions: [PERMISSIONS.ACCESS_DASHBOARD],
}); 