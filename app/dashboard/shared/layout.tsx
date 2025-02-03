import UnifiedSidebar from "@/app/dashboard/_components/unified-sidebar"
import { auth } from "@clerk/nextjs/server"
import { getUserDbIdAndRole } from "@/utils/auth"
import { redirect } from "next/navigation"

export default async function SharedDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { role } = await getUserDbIdAndRole(userId)
  if (!role) redirect("/")

  return (
    <div className="flex h-screen">
      <UnifiedSidebar userRole={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}