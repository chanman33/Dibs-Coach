'use client';

import { useUser } from '@clerk/nextjs';
import { permissionService } from '@/utils/auth';
import type { SystemRole, UserCapability, OrgRole } from '@/utils/roles/roles';
import type { Ulid } from '@/utils/types/auth';
import { useCentralizedAuth } from '@/app/provider';
import { useOrganization } from '@/utils/auth/OrganizationContext';

interface UseAuthReturn {
  // Authentication state
  isLoading: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  
  // User context
  userUlid: Ulid | null;
  systemRole: SystemRole;
  capabilities: UserCapability[];
  
  // Organization context
  organizationUlid: string | null;
  organizationName: string | null;
  organizationRole: string | null;
  isOrgLoading: boolean;
  
  // Combined loading state
  isFullyLoaded: boolean;
  
  // Permission helpers
  hasPermission: (capability: UserCapability) => boolean;
  canAccessBusinessDashboard: () => boolean;
  canAccessCoachDashboard: () => boolean;
  canAccessMenteeDashboard: () => boolean;
  canAccessSystemDashboard: () => boolean;
}

/**
 * Unified hook for authentication, user roles, and organization context
 * Follows the correct verification flow:
 * 1. Clerk Session (isSignedIn)
 * 2. User Role (systemRole)
 * 3. User Capabilities (capabilities)
 * 4. Organization Context (organizationRole)
 */
export function useAuth(): UseAuthReturn {
  // 1. Clerk authentication
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  
  // 2. User role and capabilities
  const { authData, isLoading: isAuthLoading } = useCentralizedAuth();
  
  // 3. Organization context
  const orgContext = useOrganization(); // Get full context
  
  // Default values for org context when not loaded
  const organizationUlid = orgContext?.organizationUlid ?? null;
  const organizationName = orgContext?.organizationName ?? null;
  const organizationRole = orgContext?.organizationRole ?? null;
  const isOrgLoading = !orgContext || orgContext.isLoading;

  // --- PUBLIC PAGE SHORT-CIRCUIT ---
  // If Clerk is loaded and user is not signed in, immediately return a public/unauthenticated state.
  // This prevents infinite loading on public pages for unauthenticated users.
  if (isClerkLoaded && !isSignedIn) {
    return {
      isLoading: false,
      isSignedIn: false,
      userId: null,
      userUlid: null,
      systemRole: 'USER',
      capabilities: [],
      organizationUlid: null,
      organizationName: null,
      organizationRole: null,
      isOrgLoading: false,
      isFullyLoaded: true,
      hasPermission: () => false,
      canAccessBusinessDashboard: () => false,
      canAccessCoachDashboard: () => false,
      canAccessMenteeDashboard: () => false,
      canAccessSystemDashboard: () => false,
    };
  }

  // Calculate fully loaded state - ensures we've verified all three levels
  // Now includes the check for orgContext itself
  const isFullyLoaded = isClerkLoaded && !isAuthLoading && !isOrgLoading;
  
  // Only set the auth context in the permission service when everything is loaded
  if (authData && isSignedIn && isFullyLoaded && orgContext) { // Ensure orgContext is available
    try {
      // Set the complete context including organization data
      permissionService.setUser({
        ...authData,
        organizationUlid: organizationUlid || undefined,
        organizationName: organizationName || undefined,
        orgRole: organizationRole as OrgRole | undefined
      });
    } catch (error) {
      console.error('[AUTH_HOOK] Error setting user in permission service:', error);
    }
  }

  // Create safe permission check functions that gracefully handle missing auth data
  const safePermissionCheck = (checkFn: () => boolean): boolean => {
    try {
      return checkFn();
    } catch (error) {
      return false;
    }
  };
  
  // Generic capability check helper
  const hasPermission = (capability: UserCapability): boolean => {
    if (!isFullyLoaded || !isSignedIn || !authData) return false;
    return authData.capabilities.includes(capability);
  };

  return {
    // Authentication state
    isLoading: !isClerkLoaded || isAuthLoading,
    isSignedIn: isSignedIn || false,
    userId: user?.id || null,
    
    // User context - with sensible defaults
    userUlid: authData?.userUlid || null,
    systemRole: authData?.systemRole || 'USER',
    capabilities: authData?.capabilities || [],
    
    // Organization context (using derived values)
    organizationUlid,
    organizationName,
    organizationRole,
    isOrgLoading,
    
    // Combined loading state
    isFullyLoaded,
    
    // Permission helpers with proper error handling
    hasPermission,
    canAccessBusinessDashboard: () => safePermissionCheck(permissionService.canAccessBusinessDashboard),
    canAccessCoachDashboard: () => safePermissionCheck(permissionService.canAccessCoachDashboard),
    canAccessMenteeDashboard: () => safePermissionCheck(permissionService.canAccessMenteeDashboard),
    canAccessSystemDashboard: () => safePermissionCheck(permissionService.canAccessSystemDashboard)
  };
}