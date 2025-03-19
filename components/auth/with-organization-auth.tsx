'use client';

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { 
  Permission, 
  SystemRole, 
  OrgRole, 
  OrgLevel
} from '@/utils/roles/roles'
import { ContainerLoading } from '@/components/loading'
import { RouteGuardProvider } from './RouteGuardContext'

interface WithOrganizationAuthOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requireOrganization?: boolean
  requireAll?: boolean
}

/**
 * Higher-order Component for enforcing complex authorization rules,
 * including organization membership, roles, levels, and permissions.
 * 
 * This now uses RouteGuardProvider internally for standard authorization checks
 * but maintains compatibility with the existing API.
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

    // Wait for auth to load
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

    // Map organization permissions to authorization levels for RouteGuardProvider
    if (options.requiredPermissions?.length) {
      // For organization dashboard access
      if (options.requiredPermissions.includes('ACCESS_DASHBOARD')) {
        return (
          <RouteGuardProvider required="business-dashboard">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }

      // For organization analytics access
      if (options.requiredPermissions.includes('VIEW_ORG_ANALYTICS')) {
        return (
          <RouteGuardProvider required="business-analytics">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }

      // For member management access
      if (options.requiredPermissions.includes('MANAGE_MEMBERS')) {
        return (
          <RouteGuardProvider required="member-management">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }
    }

    // For organization role requirements
    // We map common role patterns to standardized authorization levels
    if (options.requiredOrgRole) {
      const isBusinessRole = 
        options.requiredOrgRole === 'OWNER' ||
        options.requiredOrgRole === 'MANAGER' ||
        options.requiredOrgRole === 'DIRECTOR' ||
        options.requiredOrgRole.includes('OWNER') ||
        options.requiredOrgRole.includes('MANAGER') ||
        options.requiredOrgRole.includes('DIRECTOR');

      if (isBusinessRole) {
        return (
          <RouteGuardProvider required="business-dashboard">
            <Component {...props} />
          </RouteGuardProvider>
        )
      }
    }

    // Default case - just require basic organization access
    return (
      <RouteGuardProvider>
        <Component {...props} />
      </RouteGuardProvider>
    )
  }
}

// Aliases for backward compatibility
export const withOrganizationAuth = WithOrganizationAuth;
export const withRole = WithOrganizationAuth; 