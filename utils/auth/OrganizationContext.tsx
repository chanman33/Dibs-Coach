'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCentralizedAuth } from '@/app/provider';

export interface OrganizationContextType {
  organizationUlid: string | null;
  setOrganizationUlid: (id: string | null) => void;
  organizationName: string | null;
  organizationRole: string | null;
  isLoading: boolean;
  organizations: OrganizationMember[];
  refreshOrganizations: () => Promise<void>;
}

export interface OrganizationMember {
  organizationUlid: string;
  organization: {
    name: string;
    type: string;
    status: string;
    tier: string;
  };
  role: string;
  status: string;
  joinedAt: string;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  // Get auth status from Clerk and our centralized context
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isInitialized: isAuthInitialized } = useCentralizedAuth();
  
  const [organizationUlid, setOrganizationUlid] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Define fetchOrganizations as useCallback to prevent recreation on each render
  const fetchOrganizations = useCallback(async () => {
    // Skip if user is not authenticated
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/organizations');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error - user may have been logged out during the request
          if (process.env.NODE_ENV === 'development') {
            console.log('[ORGANIZATION_CONTEXT] Authentication required for organization data');
          }
          setOrganizations([]);
          return;
        }
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }
      
      const data = await response.json();
      setOrganizations(data.organizations || []);
      
      // If we have organizations but no active one selected, select the first one
      if (data.organizations?.length > 0 && !organizationUlid) {
        const firstOrg = data.organizations[0];
        setOrganizationUlid(firstOrg.organizationUlid);
        // Immediately set role and name to avoid race condition
        setOrganizationName(firstOrg.organization.name);
        setOrganizationRole(firstOrg.role);
        if (process.env.NODE_ENV === 'development') {
          console.log('[ORGANIZATION_CONTEXT] Set initial organization:', {
            id: firstOrg.organizationUlid,
            name: firstOrg.organization.name
          });
        }
      } else if (organizationUlid && data.organizations?.length > 0) {
        // If we already have an organizationUlid, make sure we update the role and name
        const selectedOrg = data.organizations.find((org: OrganizationMember) => org.organizationUlid === organizationUlid);
        if (selectedOrg) {
          setOrganizationName(selectedOrg.organization.name);
          setOrganizationRole(selectedOrg.role);
          if (process.env.NODE_ENV === 'development') {
            console.log('[ORGANIZATION_CONTEXT] Updated organization details after fetch');
          }
        }
      }
    } catch (error) {
      console.error('[ORGANIZATION_CONTEXT] Error fetching organizations:', error);
      // Don't show error in UI for auth errors
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, organizationUlid]);

  // Define refreshOrganizations after fetchOrganizations
  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);
  
  // Wait for both Clerk auth and our auth context before loading organizations
  const isAuthReady = isClerkLoaded && isAuthInitialized;
  
  // Now that refreshOrganizations is defined, we can use it in useMemo
  const contextValue = useMemo(() => ({
    organizationUlid,
    setOrganizationUlid,
    organizationName,
    organizationRole,
    isLoading,
    organizations,
    refreshOrganizations
  }), [organizationUlid, organizationName, organizationRole, isLoading, organizations, refreshOrganizations]);

  // Only try to load organizations when Clerk and auth context are ready
  useEffect(() => {
    // Skip organization loading if auth isn't ready
    if (!isAuthReady) return;
    
    if (!isSignedIn) {
      // User is not authenticated, reset state and stop loading
      setOrganizations([]);
      setOrganizationUlid(null);
      setOrganizationName(null);
      setOrganizationRole(null);
      setIsLoading(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('[ORGANIZATION_CONTEXT] User not authenticated, skipping organization fetch');
      }
      return;
    }
    
    // Load active organization from localStorage only when auth is confirmed
    try {
      const storedOrgId = localStorage.getItem('activeOrganizationUlid');
      if (storedOrgId) {
        setOrganizationUlid(storedOrgId);
      }
    } catch (error) {
      console.error('[ORGANIZATION_CONTEXT] Error reading from localStorage:', error);
    }
    
    // Fetch user's organizations
    fetchOrganizations();
  }, [isAuthReady, isSignedIn, fetchOrganizations]);

  useEffect(() => {
    // When organizationUlid changes, update localStorage
    if (!isAuthReady) return;
    
    if (organizationUlid) {
      try {
        localStorage.setItem('activeOrganizationUlid', organizationUlid);
      } catch (error) {
        console.error('[ORGANIZATION_CONTEXT] Error writing to localStorage:', error);
      }
      
      // Find the organization in the list and update name and role
      const activeOrg = organizations.find(org => org.organizationUlid === organizationUlid);
      if (activeOrg) {
        setOrganizationName(activeOrg.organization.name);
        setOrganizationRole(activeOrg.role);
        if (process.env.NODE_ENV === 'development') {
          console.log('[ORGANIZATION_CONTEXT] Organization switched:', {
            id: organizationUlid,
            name: activeOrg.organization.name,
            role: activeOrg.role
          });
        }
      } else {
        // If organization not found in list, we might need to reload organizations
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ORGANIZATION_CONTEXT] Organization not found in list:', {
            id: organizationUlid
          });
        }
        
        // If we have an organizationUlid but it's not in our current list and we're not loading,
        // we should try to load organizations again
        if (!isLoading && organizations.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[ORGANIZATION_CONTEXT] Refreshing organizations to find selected org');
          }
          refreshOrganizations();
        }
      }
    } else {
      try {
        localStorage.removeItem('activeOrganizationUlid');
      } catch (error) {
        console.error('[ORGANIZATION_CONTEXT] Error removing from localStorage:', error);
      }
      setOrganizationName(null);
      setOrganizationRole(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('[ORGANIZATION_CONTEXT] Organization context cleared');
      }
    }
  }, [organizationUlid, organizations, isLoading, isAuthReady, refreshOrganizations]);

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}; 