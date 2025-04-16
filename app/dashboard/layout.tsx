import { ReactNode } from "react"
import { cookies } from "next/headers"
import { RefreshButton } from "@/components/ui/refresh-button"
import DashboardTopNav from "./_components/dashboard-top-nav"
import DashboardAuthHandler from "./_components/dashboard-auth-handler"

export default async function DashboardLayout({ 
  children,
}: { 
  children: ReactNode 
}) {
  // Layout simplified: Middleware handles auth check & user existence.
  // Page (/dashboard/page.tsx) handles role-based redirection.
  // This layout now focuses only on structure.

  // We assume middleware has already run and validated the user or redirected.
  // No need for getAuthContext, waitForUser, or redirects here.
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardTopNav>
        {/* DashboardAuthHandler might still be useful for client-side context */}
        <DashboardAuthHandler>
          {children} 
        </DashboardAuthHandler>
      </DashboardTopNav>
    </div>
  )
}
