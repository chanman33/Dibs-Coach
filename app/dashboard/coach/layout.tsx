"use client"

import { CoachSidebar } from "./_components/coach-sidebar"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { useAuthContext } from "@/components/auth/providers"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ContainerLoading } from "@/components/loading/container"
import { useAuth } from "@clerk/nextjs"

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSignedIn } = useAuth()
  const authContext = useAuthContext()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If not signed in, redirect to sign in page
    if (isSignedIn === false) {
      router.push("/sign-in")
    } else {
      setLoading(false)
    }
  }, [isSignedIn, router])

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