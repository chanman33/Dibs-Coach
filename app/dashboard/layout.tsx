import { ReactNode } from "react"
import { isAuthorized } from "@/utils/data/user/isAuthorized"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import NotAuthorized from "@/components/not-authorized"
import DashboardTopNav from "./_components/dashboard-top-nav"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  
  if (!user?.id) {
    redirect('/sign-in')
  }

  const { authorized, message } = await isAuthorized(user.id)
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
