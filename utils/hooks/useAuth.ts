'use client';

import { useUser } from '@clerk/nextjs';
import { useAuthContext } from '@/components/auth/providers';
import { permissionService } from '@/utils/auth';
import type { SystemRole, UserCapability } from '@/utils/roles/roles';
import type { Ulid } from '@/utils/types/auth';

interface UseAuthReturn {
  // Clerk auth state
  isLoading: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  
  // Role context state
  userUlid: Ulid | null;
  systemRole: SystemRole;
  capabilities: UserCapability[];
  
  // Permission helpers
  canAccessBusinessDashboard: () => boolean;
  canAccessCoachDashboard: () => boolean;
  canAccessMenteeDashboard: () => boolean;
  canAccessSystemDashboard: () => boolean;
}

/**
 * Combined hook for auth state and role context
 * Provides type-safe access to both Clerk auth and role data
 * with permission utility methods
 */
export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, user } = useUser();
  const authContext = useAuthContext();
  
  // Set the auth context in the permission service
  if (authContext) {
    permissionService.setUser(authContext);
  }

  return {
    // Clerk auth state
    isLoading: !isLoaded,
    isSignedIn: isSignedIn || false,
    userId: user?.id || null,
    
    // Role context state
    userUlid: authContext.userUlid,
    systemRole: authContext.systemRole,
    capabilities: authContext.capabilities,
    
    // Permission helper methods
    canAccessBusinessDashboard: () => permissionService.canAccessBusinessDashboard(),
    canAccessCoachDashboard: () => permissionService.canAccessCoachDashboard(),
    canAccessMenteeDashboard: () => permissionService.canAccessMenteeDashboard(),
    canAccessSystemDashboard: () => permissionService.canAccessSystemDashboard()
  };
}