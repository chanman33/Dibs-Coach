"use client"

import { CoachSidebar } from "./_components/coach-sidebar"

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <CoachSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 