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
import { useOrganization } from '@/utils/auth/OrganizationContext'

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
    const { isLoading: isLoadingOrg, organizationRole, organizationName } = useOrganization()

    // Wait for both auth and organization data to load
    if (!isLoaded || (options.requireOrganization && isLoadingOrg)) {
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

    // Update auth context with organization data
    const effectiveAuthContext = {
      ...authContext,
      // Use organization context values if available and not in auth context
      orgRole: authContext.orgRole || (organizationRole as OrgRole | undefined) || undefined,
      // Default to LOCAL level if we have a role but no level
      orgLevel: authContext.orgLevel || (organizationRole ? 'LOCAL' as OrgLevel : undefined)
    }

    // Check organization requirement
    if (options.requireOrganization && 
        (!effectiveAuthContext.orgRole || !effectiveAuthContext.orgLevel)) {
      console.error('[AUTH_ERROR] Organization membership required but not found:', {
        contextOrgRole: authContext.orgRole,
        contextOrgLevel: authContext.orgLevel,
        organizationRole,
        organizationName,
        userId: authContext.userId,
        timestamp: new Date().toISOString()
      })
      router.push('/not-authorized?message=Organization%20membership%20required')
      return null
    }

    // Check permissions first - this is our primary authorization method
    if (options.requiredPermissions?.length) {
      const hasRequired = options.requireAll
        ? options.requiredPermissions.every(p => hasPermission(effectiveAuthContext, p))
        : options.requiredPermissions.some(p => hasPermission(effectiveAuthContext, p))

      if (!hasRequired) {
        router.push('/not-authorized?message=Insufficient%20permissions')
        return null
      }
    }
    
    // Only check org role and level if permissions check passes and explicit roles are required
    // This is a secondary, more strict authorization check
    if (options.requiredOrgRole && options.requiredOrgLevel &&
        effectiveAuthContext.orgRole && effectiveAuthContext.orgLevel) {
      const hasRole = hasOrgRole(
        effectiveAuthContext.orgRole,
        options.requiredOrgRole,
        effectiveAuthContext.orgLevel,
        options.requiredOrgLevel
      )
      
      if (!hasRole) {
        router.push('/not-authorized?message=Insufficient%20organization%20role')
        return null
      }
    }

    return <Component {...props} />
  }
}

// Aliases for backward compatibility
export const withOrganizationAuth = WithOrganizationAuth;
export const withRole = WithOrganizationAuth; 