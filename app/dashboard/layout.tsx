import { ReactNode } from "react"
import { isAuthorized } from "@/utils/data/user/isAuthorized"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { getUserRole } from "@/utils/roles/checkUserRole"
import { ROLES } from "@/utils/roles/roles"
import NotAuthorized from "@/components/not-authorized"
import { headers } from "next/headers"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  
  if (!user?.id) {
    redirect('/sign-in')
  }

  const { authorized, message } = await isAuthorized(user.id)
  if (!authorized) {
    return <NotAuthorized />
  }

  // Get user role and redirect to appropriate dashboard
  const role = await getUserRole(user?.id!)
  
  // Get the current path
  const headersList = await headers()
  const path = headersList.get("x-invoke-path") || "/dashboard"
  
  // Only redirect if exactly at /dashboard, not any sub-paths
  if (path === '/dashboard') {
    switch (role) {
      case ROLES.REALTOR:
        return redirect('/dashboard-realtor')
      case ROLES.COACH:
        return redirect('/dashboard-coach')
      case ROLES.ADMIN:
        return redirect('/dashboard-admin')
      default:
        return redirect('/dashboard')
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      {children}
    </div>
  )
}
