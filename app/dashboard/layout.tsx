import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/utils/auth"
import NotAuthorized from "@/components/not-authorized"
import DashboardTopNav from "./_components/dashboard-top-nav"
import config from '@/config';
import { ensureUserExists } from "@/utils/auth"
import { isAuthorized } from "@/utils/data/user/isAuthorized"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser()
  
  if (!user?.id && config.auth.enabled) {
    redirect('/sign-in')
  }

  // Ensure user exists in database before proceeding
  try {
    await ensureUserExists()
  } catch (error) {
    console.error("[DASHBOARD_ERROR] Failed to ensure user exists:", error)
    // If this is a new sign-up, show a friendly message
    if (error instanceof Error && error.message.includes('User not found')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Setting up your account...</h2>
            <p className="text-muted-foreground">This may take a few moments.</p>
          </div>
        </div>
      )
    }
    redirect('/error?code=setup_failed')
  }

  if (!config.roles.enabled) {
    return (
      <div className="grid min-h-screen w-full">
        <DashboardTopNav>
          {children}
        </DashboardTopNav>
      </div>
    );
  }

  const { authorized, message } = await isAuthorized()
  if (!authorized) {
    return <NotAuthorized />
  }

  return (
    <div className="grid min-h-screen w-full">
      <DashboardTopNav>
        {children}
      </DashboardTopNav>
    </div>
  )
}
