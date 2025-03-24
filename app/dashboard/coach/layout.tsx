"use client"

import { CoachSidebar } from "./_components/coach-sidebar"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { useCentralizedAuth } from '@/app/provider'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ContainerLoading } from "@/components/loading/container"

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authData, isLoading } = useCentralizedAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If auth is loaded and we have no auth data, redirect to sign in
    if (!isLoading && !authData) {
      router.push("/sign-in")
    } else if (!isLoading) {
      setLoading(false)
    }
  }, [isLoading, authData, router])

  if (loading) {
    return (
      <ContainerLoading message="Checking authentication..." />
    )
  }

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