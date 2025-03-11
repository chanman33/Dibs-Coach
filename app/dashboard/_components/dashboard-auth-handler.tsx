'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default function DashboardAuthHandler({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if we're coming from the coach application form
    const timestamp = searchParams.get('t');
    const applicationSubmitted = getCookie('coach_application_submitted');
    
    if (timestamp && applicationSubmitted) {
      console.log('[DASHBOARD_AUTH_HANDLER] Coming from coach application form, adding extra delay', {
        timestamp: new Date().toISOString()
      });
      
      // Add a small delay to ensure database updates are fully propagated
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // No delay needed
      setIsReady(true);
    }
  }, [searchParams]);
  
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 