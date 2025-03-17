'use client';

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useAuthContext } from './providers'
import { 
  Permission, 
  SystemRole, 
  OrgRole, 
  OrgLevel,
  hasPermission,
  hasOrgRole
} from '@/utils/roles/roles'
import { ContainerLoading } from '@/components/loading'

interface WithOrganizationAuthOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requireOrganization?: boolean
  requireAll?: boolean
}

/**
 * Higher-Order Component for enforcing authentication and complex authorization rules,
 * including organization membership, roles, levels, and permissions.
 * 
 * @param Component The component to wrap with auth checks
 * @param options Authorization requirements including system roles, org roles, permissions
 * @returns A protected component with all auth checks applied
 */
export function WithOrganizationAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithOrganizationAuthOptions = {}
) {
  return function ProtectedComponent(props: P) {
    const { isLoaded, isSignedIn } = useAuth()
    const router = useRouter()
    const authContext = useAuthContext()

    if (!isLoaded) {
      return (
        <ContainerLoading 
          message="Verifying organization access..." 
          spinnerSize="md"
          minHeight="h-full"
        />
      )
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

    // Check organization requirement
    if (options.requireOrganization && 
        (!authContext.orgRole || !authContext.orgLevel)) {
      router.push('/not-authorized?message=Organization%20membership%20required')
      return null
    }

    // Check org role and level if required
    if (options.requiredOrgRole && options.requiredOrgLevel &&
        authContext.orgRole && authContext.orgLevel) {
      const hasRole = hasOrgRole(
        authContext.orgRole,
        options.requiredOrgRole,
        authContext.orgLevel,
        options.requiredOrgLevel
      )
      
      if (!hasRole) {
        router.push('/not-authorized?message=Insufficient%20organization%20role')
        return null
      }
    }

    // Check permissions if required
    if (options.requiredPermissions?.length) {
      const hasRequired = options.requireAll
        ? options.requiredPermissions.every(p => hasPermission(authContext, p))
        : options.requiredPermissions.some(p => hasPermission(authContext, p))

      if (!hasRequired) {
        router.push('/not-authorized?message=Insufficient%20permissions')
        return null
      }
    }

    return <Component {...props} />
  }
}

// Aliases for backward compatibility
export const withOrganizationAuth = WithOrganizationAuth;
export const withRole = WithOrganizationAuth; 