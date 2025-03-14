'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/coaches',
    '/coaches/[id]',
  ]

  // Check if current path is a public route
  const isPublicRoute = () => {
    return publicRoutes.some(route => {
      // Handle dynamic routes
      if (route.includes('[') && route.includes(']')) {
        const baseRoute = route.split('/').slice(0, -1).join('/')
        const currentBaseRoute = pathname.split('/').slice(0, -1).join('/')
        return currentBaseRoute === baseRoute
      }
      return pathname === route || pathname.startsWith(`${route}/`)
    })
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // If not authenticated and not on a public route, redirect to login
        if (!session && !isPublicRoute()) {
          router.push('/login')
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router, supabase])

  // Don't render anything while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
    </div>
  }

  // If it's a public route or user is authenticated, render children
  return <>{children}</>
} 