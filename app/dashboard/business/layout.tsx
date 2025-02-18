"use client"

import { BusinessSidebar } from "./_components/business-sidebar"

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <BusinessSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 