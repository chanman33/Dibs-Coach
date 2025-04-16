"use client"

import { CoachSidebar } from "./_components/coach-sidebar"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuardProvider required="coach-dashboard">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen">
          <CoachSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </RouteGuardProvider>
  )
} 