"use client"

import { SystemSidebar } from "./_components/system-sidebar"

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <SystemSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 