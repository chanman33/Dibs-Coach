'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FullPageLoading } from '@/components/loading';

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
  
  useEffect(() => {
    // No delay needed
    setIsReady(true);
  }, []);
  
  if (!isReady) {
    return (
      <FullPageLoading 
        message="Loading your dashboard..."
        minHeight="min-h-[calc(100vh-4rem)]"
      />
    );
  }
  
  return <>{children}</>;
} 