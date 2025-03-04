'use client';

import { ReactNode } from 'react';
import { useAuthContext } from './providers';
import NotAuthorized from './not-authorized';
import { AuthOptions } from '@/utils/types/auth';
import { isAuthorized } from '@/utils/auth/auth-utils';

interface WithAuthProps {
  children: ReactNode;
  options?: AuthOptions;
  fallback?: ReactNode;
  loading?: ReactNode;
}

/**
 * Higher-order component for protecting routes and components with authentication and authorization
 */
export function WithAuth({ 
  children, 
  options = {}, 
  fallback, 
  loading 
}: WithAuthProps) {
  const { isLoading, isSignedIn } = useAuthContext();

  if (isLoading) {
    return loading || null;
  }

  if (!isSignedIn) {
    return fallback || <NotAuthorized message="Please sign in to access this content" />;
  }

  // Server-side authorization is handled in layout.tsx
  // This is just for client-side components
  const checkAuth = async () => {
    const { authorized, message } = await isAuthorized(options);
    if (!authorized) {
      return fallback || <NotAuthorized message={message} />;
    }
    return children;
  };

  return checkAuth();
} 