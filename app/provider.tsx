"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState, createContext, useContext, useMemo, useEffect, useCallback, useRef } from "react";
import { OrganizationProvider } from "@/utils/auth/OrganizationContext";
import { useAuth } from '@clerk/nextjs';
import type { AuthContext } from '@/utils/types/auth';
import { FullPageLoading } from "@/components/loading";

// Create a centralized auth context to prevent redundant checks
const CentralizedAuthContext = createContext<{
  authData: AuthContext | null;
  isLoading: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
  refreshAuthData: () => Promise<void>;
}>({
  authData: null,
  isLoading: true,
  isInitialized: false,
  isLoggingOut: false,
  refreshAuthData: async () => {},
});

// Create a hook to access the centralized auth context
export function useCentralizedAuth() {
  return useContext(CentralizedAuthContext);
}

// Modified loading spinner component for auth loading states
function AuthLoadingSpinner() {
  return (
    <FullPageLoading
      showLogo={true}
      spinnerSize="lg"
    />
  );
}

// Centralized Auth Provider component
function CentralizedAuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const { isLoaded: isClerkLoaded, userId } = useAuth();
  const [authData, setAuthData] = useState<AuthContext | null>(null);
  const [isFetchingAuthData, setIsFetchingAuthData] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const previousUserIdRef = useRef<string | null | undefined>(userId);

  const fetchAuthData = useCallback(async () => {
    if (!userId) {
      console.log('[AUTH_PROVIDER] No Clerk user ID (client-side), clearing auth data.');
      setAuthData(null);
      setIsFetchingAuthData(false);
      setIsInitialized(true);
      return;
    }

    if (isLoggingOut) {
      setIsLoggingOut(false);
    }
    
    console.log('[AUTH_PROVIDER] Client-side Clerk user found, fetching full auth context from /api/user/context...');
    setIsFetchingAuthData(true);
    try {
      const response = await fetch('/api/user/context', {
        headers: {
          'Accept': 'application/json', 
        }
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('[AUTH_PROVIDER] Failed to parse JSON response from /api/user/context:', { 
          status: response.status, 
          responseText: await response.text().catch(() => "Could not get response text.") 
        }, jsonError);
        setAuthData(null);
        throw new Error('Invalid response from auth context API.'); 
      }

      if (!response.ok) {
        console.warn(`[AUTH_PROVIDER] Error response (${response.status}) from /api/user/context:`, data?.error || data);
        setAuthData(null);
      } else {
        if (data && data.userId === userId) {
          console.log('[AUTH_PROVIDER] Auth context fetched successfully via API:', data);
          setAuthData(data as AuthContext); 
        } else {
          console.warn('[AUTH_PROVIDER] Fetched auth context API data mismatch or invalid structure.', { 
            clerkUserId_client: userId, 
            fetchedUserId_api: data?.userId,
            data_received: data 
          });
          setAuthData(null);
        }
      }
    } catch (error) { 
      console.error('[AUTH_PROVIDER] Overall error fetching auth context:', error);
      setAuthData(null);
    } finally {
      setIsFetchingAuthData(false);
      setIsInitialized(true); 
      console.log('[AUTH_PROVIDER] Auth context fetch attempt complete.');
    }
  }, [userId, isLoggingOut]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    if (isClerkLoaded && previousUserId && !userId) {
        console.log('[AUTH_PROVIDER] Logout detected, setting isLoggingOut flag.');
        setIsLoggingOut(true);
        setAuthData(null);
        setIsFetchingAuthData(false);
        setIsInitialized(true);
    }
    previousUserIdRef.current = userId;

    if (isClerkLoaded && !isLoggingOut) {
      if (userId) {
        fetchAuthData();
      } else {
        setIsFetchingAuthData(false);
        setIsInitialized(true);
        setAuthData(null);
      }
    } else if (!isClerkLoaded) {
      setIsFetchingAuthData(true);
      setIsInitialized(false);
    }
  }, [isClerkLoaded, userId, fetchAuthData, isLoggingOut]);

  const refreshAuthData = useCallback(async () => {
    console.log('[AUTH_PROVIDER] Refreshing auth data explicitly...');
    await fetchAuthData();
  }, [fetchAuthData]);

  const contextValue = useMemo(() => ({
    authData,
    isLoading: !isClerkLoaded || isFetchingAuthData,
    isInitialized,
    isLoggingOut,
    refreshAuthData
  }), [authData, isClerkLoaded, isFetchingAuthData, isInitialized, isLoggingOut, refreshAuthData]);

  // Show loading spinner if Clerk is not loaded yet, or if we are fetching and not yet initialized.
  if (!isClerkLoaded || (isFetchingAuthData && !isInitialized)) {
     return <AuthLoadingSpinner />;
  }

  return (
    <CentralizedAuthContext.Provider value={contextValue}>
      {children}
    </CentralizedAuthContext.Provider>
  );
}

export default function Provider({
  children
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <CentralizedAuthProvider>
        <OrganizationProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          {children}
        </OrganizationProvider>
      </CentralizedAuthProvider>
    </QueryClientProvider>
  );
}
