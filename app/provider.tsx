"use client";
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
      console.log('[AUTH_PROVIDER] No Clerk user ID, clearing auth data.');
      setAuthData(null);
      setIsFetchingAuthData(false);
      return;
    }

    if (isLoggingOut) {
      setIsLoggingOut(false);
    }
    
    console.log('[AUTH_PROVIDER] Clerk user found, fetching full auth context...');
    setIsFetchingAuthData(true);
    try {
      const response = await fetch('/api/user/context');
      if (!response.ok) {
        if (response.status === 401) {
           console.warn('[AUTH_PROVIDER] Unauthorized fetching auth context. User might be logged out.');
           setAuthData(null);
        } else {
          throw new Error(`Failed to fetch auth context: ${response.status}`);
        }
      } else {
        const data: AuthContext = await response.json();
         if (data && data.userId === userId) {
           console.log('[AUTH_PROVIDER] Auth context fetched successfully:', data);
           setAuthData(data);
         } else {
            console.warn('[AUTH_PROVIDER] Fetched auth context user ID mismatch. Clearing data.', { clerkUserId: userId, fetchedUserId: data?.userId });
            setAuthData(null);
         }
      }
    } catch (error) {
      console.error('[AUTH_PROVIDER] Error fetching auth context:', error);
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
      fetchAuthData();
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

  // Re-added: Show loading spinner until auth is initialized
  if (contextValue.isLoading && !isInitialized) {
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
