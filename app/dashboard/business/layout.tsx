"use client"

import { BusinessSidebar } from "./_components/business-sidebar"
import { RouteGuard } from "@/components/auth"

// Apply a base layer of authentication at the layout level
// The business pages will still apply more specific authorization
// with WithOrganizationAuth for role and permission checks
export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
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