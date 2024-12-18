import { ReactNode } from "react"
import RealtorSidebar from "./_components/realtor-sidebar"

export default function RealtorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <RealtorSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 