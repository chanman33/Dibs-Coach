'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { createContext, useContext } from 'react';
import type { AuthContext } from '@/utils/types/auth';

const AuthContext = createContext<AuthContext | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProviders');
  }
  return context;
}

interface AuthProvidersProps {
  children: React.ReactNode;
  initialState: AuthContext;
}

export function AuthProviders({ children, initialState }: AuthProvidersProps) {
  return (
    <ClerkProvider>
      <AuthContext.Provider value={initialState}>
        {children}
      </AuthContext.Provider>
    </ClerkProvider>
  );
} 