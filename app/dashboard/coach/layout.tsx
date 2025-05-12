"use client"

import React from 'react';
// import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
// Remove the unused dashboardCoachConfig import
// import { dashboardCoachConfig } from '@/config/dashboard'; 
import { CoachSidebar } from "./_components/coach-sidebar" 
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
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
          {/* Use the imported CoachSidebar component */}
          <CoachSidebar /> 
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </ThemeProvider>
    </RouteGuardProvider>
  )
}
