import { ReactNode } from "react"
import UnifiedSidebar from "@/components/layout/unified-sidebar"
import { auth } from "@clerk/nextjs/server"
import { getUserRole } from "@/utils/roles/checkUserRole"

export default async function RealtorLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth()
  const userRole = await getUserRole(userId!)
  
  return (
    <div className="flex h-screen">
      <UnifiedSidebar userRole={userRole} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 