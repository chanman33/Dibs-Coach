'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

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
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const [organizationUlid, setOrganizationUlid] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip organization loading if not signed in
    if (!isAuthLoaded) return;
    
    if (!isSignedIn) {
      // User is not authenticated, reset state and stop loading
      setOrganizations([]);
      setOrganizationUlid(null);
      setOrganizationName(null);
      setOrganizationRole(null);
      setIsLoading(false);
      console.log('[ORGANIZATION_CONTEXT] User not authenticated, skipping organization fetch');
      return;
    }
    
    // Load active organization from localStorage on initial render
    const storedOrgId = localStorage.getItem('activeOrganizationUlid');
    if (storedOrgId) {
      setOrganizationUlid(storedOrgId);
    }
    
    // Fetch user's organizations
    fetchOrganizations();
  }, [isSignedIn, isAuthLoaded]);

  useEffect(() => {
    // When organizationUlid changes, update localStorage
    if (organizationUlid) {
      localStorage.setItem('activeOrganizationUlid', organizationUlid);
      
      // Find the organization in the list and update name and role
      const activeOrg = organizations.find(org => org.organizationUlid === organizationUlid);
      if (activeOrg) {
        setOrganizationName(activeOrg.organization.name);
        setOrganizationRole(activeOrg.role);
        console.log('[ORGANIZATION_CONTEXT] Organization switched:', {
          id: organizationUlid,
          name: activeOrg.organization.name,
          role: activeOrg.role,
          status: activeOrg.status,
          type: activeOrg.organization.type,
          tier: activeOrg.organization.tier,
          timestamp: new Date().toISOString(),
          availableOrgs: organizations.length
        });
      } else {
        console.warn('[ORGANIZATION_CONTEXT] Organization not found in list:', {
          id: organizationUlid,
          organizations: organizations.map(o => ({
            id: o.organizationUlid, 
            name: o.organization.name,
            role: o.role,
            status: o.status
          })),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      localStorage.removeItem('activeOrganizationUlid');
      setOrganizationName(null);
      setOrganizationRole(null);
      console.log('[ORGANIZATION_CONTEXT] Organization context cleared', {
        timestamp: new Date().toISOString(),
        availableOrgs: organizations.length
      });
    }
  }, [organizationUlid, organizations]);

  const fetchOrganizations = async () => {
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
          console.log('[ORGANIZATION_CONTEXT] Authentication required for organization data');
          setOrganizations([]);
          return;
        }
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }
      
      const data = await response.json();
      setOrganizations(data.organizations || []);
      
      // If we have organizations but no active one selected, select the first one
      if (data.organizations?.length > 0 && !organizationUlid) {
        setOrganizationUlid(data.organizations[0].organizationUlid);
      }
    } catch (error) {
      console.error('[ORGANIZATION_CONTEXT] Error fetching organizations:', error);
      // Don't show error in UI for auth errors
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizationUlid,
        setOrganizationUlid,
        organizationName,
        organizationRole,
        isLoading,
        organizations,
        refreshOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}; 