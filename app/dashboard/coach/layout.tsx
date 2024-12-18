import { ReactNode } from "react"
import CoachSidebar from "./_components/coach-sidebar"

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <CoachSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 