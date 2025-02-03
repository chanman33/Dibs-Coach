"use client"

import { MenteeSidebar } from "./_components/mentee-sidebar"

export default function MenteeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <MenteeSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 