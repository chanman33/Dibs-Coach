'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { createContext, useContext } from 'react';
import { useAuth } from '@/utils/hooks/useAuth';
import config from '@/config';
import type { Ulid } from '@/utils/types/auth';

// Auth Context
interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  userUlid: Ulid | null;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Internal Context Provider
function AuthContextProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Clerk Provider Wrapper
function ClerkWrapper({ children }: { children: ReactNode }) {
  if (!config.auth.enabled) {
    return <>{children}</>;
  }
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}

// Combined Auth Provider
export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkWrapper>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ClerkWrapper>
  );
}

// Hook for consuming auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProviders');
  }
  return context;
} 