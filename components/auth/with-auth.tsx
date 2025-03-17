'use client';

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useAuthContext } from './providers'
import { ContainerLoading } from '@/components/loading'
import type { SystemRole, UserCapability } from '@/utils/roles/roles'

export interface WithAuthOptions {
  requiredSystemRole?: SystemRole
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
}

export function WithAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function ProtectedComponent(props: P) {
    const { isLoaded, isSignedIn } = useAuth()
    const router = useRouter()
    const authContext = useAuthContext()

    if (!isLoaded) {
      return <ContainerLoading message="Verifying authentication..." />
    }

    if (!isSignedIn) {
      router.push('/sign-in')
      return null
    }

    // Check system role if required
    if (options.requiredSystemRole && 
        authContext.systemRole !== options.requiredSystemRole) {
      router.push('/not-authorized')
      return null
    }

    // Check capabilities if required
    if (options.requiredCapabilities?.length) {
      const hasRequired = options.requireAll
        ? options.requiredCapabilities.every(cap => 
            authContext.capabilities.includes(cap))
        : options.requiredCapabilities.some(cap => 
            authContext.capabilities.includes(cap))

      if (!hasRequired) {
        router.push('/not-authorized')
        return null
      }
    }

    return <Component {...props} />
  }
} 