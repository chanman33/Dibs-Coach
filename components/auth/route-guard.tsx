'use client';

import { ReactNode } from 'react';
import { RouteGuardProvider } from './RouteGuardContext';

interface RouteGuardProps {
  children: ReactNode;
  requiredAuth?: boolean;
  requiredCapability?: string;
  requiredRole?: string;
  redirectTo?: string;
}

/**
 * Legacy RouteGuard component - wraps the new RouteGuardProvider for backward compatibility
 * For new components, use RouteGuardProvider directly with required permission level
 */
export function RouteGuard({
  children,
  requiredAuth = true,
  requiredCapability,
  requiredRole,
  redirectTo = '/sign-in',
}: RouteGuardProps) {
  // Just basic authentication, no special authorization
  if (requiredAuth && !requiredCapability && !requiredRole) {
    return <RouteGuardProvider>{children}</RouteGuardProvider>;
  }
  
  // Handle capability-based routing
  if (requiredCapability === 'COACH') {
    return (
      <RouteGuardProvider 
        required="coach-dashboard" 
        redirectTo={redirectTo}
      >
        {children}
      </RouteGuardProvider>
    );
  }
  
  if (requiredCapability === 'MENTEE') {
    return (
      <RouteGuardProvider 
        required="mentee-dashboard" 
        redirectTo={redirectTo}
      >
        {children}
      </RouteGuardProvider>
    );
  }
  
  // For business-related roles, default to business dashboard access
  if (requiredRole && 
      (requiredRole.includes('OWNER') || 
       requiredRole.includes('MANAGER') || 
       requiredRole.includes('DIRECTOR'))) {
    return (
      <RouteGuardProvider 
        required="business-dashboard" 
        redirectTo={redirectTo}
      >
        {children}
      </RouteGuardProvider>
    );
  }
  
  // Default case - just check authenticated
  return <RouteGuardProvider>{children}</RouteGuardProvider>;
} 