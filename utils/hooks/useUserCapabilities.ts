'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchUserCapabilities } from '@/utils/actions/user-profile-actions';
import { useUser } from '@clerk/nextjs';

/**
 * Optimized hook for fetching user capabilities
 * - Only fetches capabilities when user is authenticated
 * - Can skip profile completion checks for public pages
 * - Caches results in memory
 */
export function useUserCapabilities(options: { 
  skipProfileCheck?: boolean,
  onlyWhenAuthenticated?: boolean
} = {}) {
  const { skipProfileCheck = false, onlyWhenAuthenticated = true } = options;
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [realEstateDomains, setRealEstateDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isLoaded, isSignedIn } = useUser();

  const loadCapabilities = useCallback(async () => {
    // Skip if we should only fetch when authenticated and user is not signed in
    if (onlyWhenAuthenticated && !isSignedIn) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load capabilities with a profile check flag
      const response = await fetchUserCapabilities({ skipProfileCheck });
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setCapabilities(response.data.capabilities || []);
        setRealEstateDomains(response.data.realEstateDomains || []);
        setPrimaryDomain(response.data.primaryRealEstateDomain);
      }
    } catch (err) {
      console.error('[USER_CAPABILITIES_HOOK_ERROR]', err);
      setError(err instanceof Error ? err : new Error('Failed to load user capabilities'));
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, onlyWhenAuthenticated, skipProfileCheck]);

  useEffect(() => {
    // Only load capabilities when Clerk has loaded
    // and we know the authentication state
    if (isLoaded) {
      if (!onlyWhenAuthenticated || isSignedIn) {
        loadCapabilities();
      }
    }
  }, [isLoaded, isSignedIn, loadCapabilities, onlyWhenAuthenticated]);

  return {
    capabilities,
    realEstateDomains,
    primaryDomain,
    isLoading,
    error,
    refresh: loadCapabilities
  };
} 