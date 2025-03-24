'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCentralizedAuth } from '@/app/provider';
import { useOrganization } from '@/utils/auth/OrganizationContext';
import { permissionService } from '@/utils/auth';
import { ContainerLoading } from '@/components/loading/container';
import { OrgRole } from '@/utils/roles/roles';

// Define authorization levels that can be checked
export type AuthorizationLevel = 
  | 'business-dashboard'
  | 'business-analytics'
  | 'member-management'
  | 'coach-dashboard'
  | 'mentee-dashboard'
  | 'system-dashboard'
  | 'organization-owner';

// Define the route guard context type
export interface RouteGuardContextType {
  isAuthorized: boolean;
  isLoading: boolean;
  checkAuthorization: (level: AuthorizationLevel) => boolean;
}

// Create the context
const RouteGuardContext = createContext<RouteGuardContextType | null>(null);

// Create the hook to use this context
export function useRouteGuard() {
  const context = useContext(RouteGuardContext);
  if (!context) {
    throw new Error('useRouteGuard must be used within a RouteGuardProvider');
  }
  return context;
}

// Props for the provider
interface RouteGuardProviderProps {
  children: React.ReactNode;
  required?: AuthorizationLevel;
  redirectTo?: string;
}

export function RouteGuardProvider({
  children,
  required,
  redirectTo = '/not-authorized',
}: RouteGuardProviderProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authData: authContext } = useCentralizedAuth();
  const { organizationRole, isLoading: isOrgLoading, organizations, organizationUlid } = useOrganization();
  const router = useRouter();
  
  // Flag to track if we've already initiated a redirect
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Check if the user has the required permission
  const checkAuthorization = (level: AuthorizationLevel): boolean => {
    // Skip check if organization data is still loading or auth context not ready
    if (isOrgLoading || !authContext) {
      console.log('[ROUTE_GUARD] Still loading data, deferring permission check');
      return false;
    }
    
    // Set the user context on the permission service with organization info
    const userWithOrg = {
      ...authContext,
      orgRole: organizationRole as OrgRole | undefined,
      organizationUlid: organizationUlid || undefined,
      organizationName: organizations.find(org => 
        org.organizationUlid === organizationUlid
      )?.organization.name
    };
    
    console.log('[ROUTE_GUARD] Permission check with complete data:', {
      userId: userWithOrg.userId,
      orgRole: userWithOrg.orgRole || 'none',
      organizationUlid: userWithOrg.organizationUlid || 'none',
      organizationName: userWithOrg.organizationName || 'none',
      level,
      timestamp: new Date().toISOString()
    });
    
    permissionService.setUser(userWithOrg);
    
    // Check for different authorization levels
    switch (level) {
      case 'business-dashboard':
        return permissionService.canAccessBusinessDashboard();
      case 'business-analytics':
        return permissionService.canViewOrgAnalytics();
      case 'member-management':
        return permissionService.canManageOrgMembers();
      case 'coach-dashboard':
        return permissionService.canAccessCoachDashboard();
      case 'mentee-dashboard':
        return permissionService.canAccessMenteeDashboard();
      case 'system-dashboard':
        return permissionService.canAccessSystemDashboard();
      case 'organization-owner':
        return permissionService.isOrganizationOwner();
      default:
        return false;
    }
  };

  // Wait for organization data to load before making authorization decisions
  useEffect(() => {
    if (!authContext) {
      console.log('[ROUTE_GUARD] Waiting for auth context to load');
      return;
    }
    
    if (isOrgLoading) {
      console.log('[ROUTE_GUARD] Waiting for organization data to load');
      return;
    }
    
    if (isRedirecting) {
      console.log('[ROUTE_GUARD] Already redirecting, skipping further checks');
      return;
    }

    // Make sure the organization role has been properly set in context before proceeding
    // This prevents race conditions where organizationUlid exists but organizationRole hasn't been set yet
    if (organizationUlid && !organizationRole && organizations.length > 0) {
      console.log('[ROUTE_GUARD] Organization selected but role not yet set, waiting...');
      return;
    }

    if (required) {
      console.log('[ROUTE_GUARD] Running authorization check with complete data:', {
        organizationRole,
        organizationUlid,
        organizations: organizations?.length || 0,
        timestamp: new Date().toISOString()
      });

      // Set the user context on the permission service with organization info
      const userWithOrg = {
        ...authContext,
        orgRole: organizationRole as OrgRole | undefined,
        organizationUlid: organizationUlid || undefined,
        organizationName: organizations.find(org => 
          org.organizationUlid === organizationUlid
        )?.organization.name
      };

      console.log('[ROUTE_GUARD] Setting complete permission context:', {
        userId: userWithOrg.userId,
        orgRole: userWithOrg.orgRole || 'none',
        organizationUlid: userWithOrg.organizationUlid || 'none',
        organizationName: userWithOrg.organizationName || 'none',
        level: required,
        timestamp: new Date().toISOString()
      });
      
      permissionService.setUser(userWithOrg);
      
      const authorized = checkAuthorization(required);
      setIsAuthorized(authorized);
      
      // Log the authorization check
      console.log('[ROUTE_GUARD] Final authorization decision:', {
        level: required,
        authorized,
        userId: authContext.userId,
        timestamp: new Date().toISOString()
      });
      
      setIsLoading(false);
      
      // Redirect if not authorized
      if (!authorized) {
        setIsRedirecting(true);
        let redirectPath = redirectTo;
        
        // Add helpful message to the redirect
        if (redirectPath === '/not-authorized') {
          const messages: Record<AuthorizationLevel, string> = {
            'business-dashboard': 'Insufficient permissions to access business dashboard',
            'business-analytics': 'You need organization analytics permission',
            'member-management': 'Insufficient permissions to manage members',
            'coach-dashboard': 'You need coach capabilities to access this page',
            'mentee-dashboard': 'You need mentee capabilities to access this page',
            'system-dashboard': 'System Owner role required to access this page',
            'organization-owner': 'You need to be an organization owner to access this page'
          };
          redirectPath = `${redirectPath}?message=${encodeURIComponent(messages[required])}`;
        }
        
        console.log('[ROUTE_GUARD] Redirecting to:', redirectPath);
        router.push(redirectPath);
      }
    } else {
      // No authorization required
      setIsAuthorized(true);
      setIsLoading(false);
    }
  }, [required, authContext, organizationRole, isOrgLoading, redirectTo, router, organizationUlid, organizations, isRedirecting]);

  // Show enhanced loading state with better messaging based on what we're waiting for
  if (isLoading) {
    let loadingMessage = "Verifying permissions...";
    
    if (isOrgLoading) {
      loadingMessage = "Loading organization data...";
    } else if (organizationUlid && !organizationRole && organizations.length > 0) {
      loadingMessage = "Finalizing organization context...";
    }
    
    return (
      <ContainerLoading
        message={loadingMessage}
        spinnerSize="md"
        minHeight="h-full"
      />
    );
  }
  
  // Don't render children if not authorized (will redirect via useEffect)
  if (!isAuthorized) {
    return (
      <ContainerLoading
        message="Redirecting..."
        spinnerSize="md"
        minHeight="h-full"
      />
    );
  }

  return (
    <RouteGuardContext.Provider value={{ isAuthorized: !!isAuthorized, isLoading, checkAuthorization }}>
      {children}
    </RouteGuardContext.Provider>
  );
} 