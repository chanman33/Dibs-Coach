'use client';

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ContainerLoading } from '@/components/loading'
import type { SystemRole, UserCapability } from '@/utils/roles/roles'
import { RouteGuardProvider } from './RouteGuardContext'

export interface WithAuthOptions {
  requiredSystemRole?: SystemRole
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
}

/**
 * Higher-order component for protecting routes with authentication and basic authorization
 * For more complex authorization needs, consider using RouteGuardProvider directly
 */
export function WithAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function ProtectedComponent(props: P) {
    const { isLoaded, isSignedIn } = useAuth()
    const router = useRouter()

    if (!isLoaded) {
      return <ContainerLoading message="Verifying authentication..." />
    }

    if (!isSignedIn) {
      router.push('/sign-in')
      return null
    }
    
    // Use specific capabilities when checking requirements
    if (options.requiredCapabilities?.length === 1) {
      // Coach capability check
      if (options.requiredCapabilities.includes('COACH')) {
        return (
          <RouteGuardProvider required="coach-dashboard">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }
      
      // Mentee capability check
      if (options.requiredCapabilities.includes('MENTEE')) {
        return (
          <RouteGuardProvider required="mentee-dashboard">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }
    }
    
    // For system role requirements or other capability combinations,
    // continue using the existing auth context pattern for now
    // Note: This is a candidate for future refactoring to use RouteGuardProvider
    return (
      <RouteGuardProvider>
        <Component {...props} />
      </RouteGuardProvider>
    )
  }
} 