import { ReactNode } from "react"
import LOSidebar from "./_components/lo-sidebar"

export default function LoanOfficerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
        <LOSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
    </div>
  )
} 