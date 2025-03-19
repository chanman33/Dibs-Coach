'use client';

import { useAuth } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthContext } from '@/utils/types/auth';
import { SYSTEM_ROLES } from '@/utils/roles/roles';

const AuthContext = createContext<AuthContext | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('[AUTH_CONTEXT] No auth context found in provider');
    throw new Error('useAuthContext must be used within AuthProviders');
  }
  
  // Log whenever context is accessed
  console.log('[AUTH_CONTEXT] Context accessed:', {
    userId: context.userId,
    systemRole: context.systemRole,
    capabilities: context.capabilities,
    timestamp: new Date().toISOString()
  });
  
  return context;
}

interface AuthProvidersProps {
  children: React.ReactNode;
  initialState: AuthContext | null;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}

function AuthStateProvider({ children, initialState }: AuthProvidersProps) {
  const { isLoaded, userId } = useAuth();
  const [authState, setAuthState] = useState<AuthContext | null>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('[AUTH_PROVIDER] Clerk auth state:', {
      isLoaded,
      userId,
      initialStateUserId: initialState?.userId,
      timestamp: new Date().toISOString()
    });

    if (isLoaded) {
      if (userId && initialState?.userId === userId) {
        console.log('[AUTH_PROVIDER] Setting authenticated state:', {
          ...initialState,
          timestamp: new Date().toISOString()
        });
        setAuthState(initialState);
      } else {
        console.log('[AUTH_PROVIDER] Setting unauthenticated state');
        setAuthState(null);
      }
      setIsInitialized(true);
    }
  }, [isLoaded, userId, initialState]);

  // Show loading state while Clerk initializes
  if (!isLoaded || !isInitialized) {
    console.log('[AUTH_PROVIDER] Waiting for initialization...');
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProviders({ children, initialState }: AuthProvidersProps) {
  if (initialState) {
    console.log('[AUTH_PROVIDERS] Initializing with state:', {
      userId: initialState.userId,
      systemRole: initialState.systemRole,
      capabilities: initialState.capabilities,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('[AUTH_PROVIDERS] Initializing without auth state');
  }

  return (
    <AuthStateProvider initialState={initialState}>
      {children}
    </AuthStateProvider>
  );
} 