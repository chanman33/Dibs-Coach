'use client';

import { useAuth } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { ContainerLoading } from '@/components/loading'

interface RouteGuardProps {
  children: ReactNode;
  publicPaths?: string[];
}

/**
 * Simple route protection component that redirects unauthenticated users
 * away from protected routes.
 * 
 * @param publicPaths Optional array of paths that don't require authentication
 */
export function RouteGuard({ 
  children, 
  publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/coaches',
    '/coaches/[id]',
    '/reset-password',
  ] 
}: RouteGuardProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Check if current path is a public route
  const isPublicRoute = () => {
    return publicPaths.some(route => {
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
    if (!isLoaded) return;

    // Allow access to public routes
    if (isPublicRoute()) {
      setIsAuthorized(true)
      return;
    }

    // Check authentication for protected routes
    if (!isSignedIn) {
      router.push('/sign-in')
    } else {
      setIsAuthorized(true)
    }
  }, [isLoaded, isSignedIn, pathname, router])

  // Loading state
  if (!isLoaded || !isAuthorized) {
    return (
      <ContainerLoading 
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  // Render children if authorized
  return <>{children}</>
} 