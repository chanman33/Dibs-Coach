"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState, createContext, useContext, useMemo, useEffect } from "react";
import { OrganizationProvider } from "@/utils/auth/OrganizationContext";
import { useAuth } from '@clerk/nextjs';
import type { AuthContext } from '@/utils/types/auth';

// Create a centralized auth context to prevent redundant checks
const CentralizedAuthContext = createContext<{
  authData: AuthContext | null;
  isLoading: boolean;
  isInitialized: boolean;
}>({
  authData: null,
  isLoading: true,
  isInitialized: false
});

// Create a hook to access the centralized auth context
export function useCentralizedAuth() {
  return useContext(CentralizedAuthContext);
}

// Loading spinner component for auth loading states
function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[100px]">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Initializing session...</p>
      </div>
    </div>
  );
}

// Centralized Auth Provider component
function CentralizedAuthProvider({ 
  children, 
  initialAuthState 
}: { 
  children: ReactNode; 
  initialAuthState: AuthContext | null;
}) {
  const { isLoaded, userId } = useAuth();
  const [authData, setAuthData] = useState<AuthContext | null>(initialAuthState);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Handle synchronization between Clerk auth and our context
  useEffect(() => {
    if (!isLoaded) return;
    
    // If user IDs match, keep the auth state
    if (userId && initialAuthState?.userId === userId) {
      setAuthData(initialAuthState);
    } else {
      // If no auth or IDs don't match, clear auth state
      setAuthData(null);
    }
    
    // Mark as initialized once Clerk auth state is known
    setIsInitialized(true);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH_PROVIDER] Auth initialization complete:', {
        isAuthenticated: !!userId,
        hasInitialState: !!initialAuthState,
        stateMatches: userId === initialAuthState?.userId,
        timestamp: new Date().toISOString()
      });
    }
  }, [isLoaded, userId, initialAuthState]);
  
  // Use useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    authData,
    isLoading: !isLoaded,
    isInitialized
  }), [authData, isLoaded, isInitialized]);

  // Only block rendering while Clerk is loading - we handle other loading states in the children
  if (!isLoaded) {
    return <AuthLoadingSpinner />;
  }

  return (
    <CentralizedAuthContext.Provider value={contextValue}>
      {children}
    </CentralizedAuthContext.Provider>
  );
}

export default function Provider({ 
  children, 
  initialAuthState 
}: { 
  children: ReactNode;
  initialAuthState?: AuthContext | null;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <CentralizedAuthProvider initialAuthState={initialAuthState || null}>
        <OrganizationProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          {children}
        </OrganizationProvider>
      </CentralizedAuthProvider>
    </QueryClientProvider>
  );
}
