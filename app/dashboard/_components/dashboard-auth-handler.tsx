'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FullPageLoading } from '@/components/loading';
import { useCentralizedAuth } from '@/app/provider';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default function DashboardAuthHandler({ children }: { children: React.ReactNode }) {
  const { authData, isLoggingOut, isLoading, isInitialized } = useCentralizedAuth();
  
  if ((isLoading && !isInitialized) || isLoggingOut) {
    return (
      <FullPageLoading 
        message={isLoggingOut ? "Signing out..." : "Loading your dashboard..."}
        minHeight="min-h-[calc(100vh-4rem)]"
      />
    );
  }

  if (isInitialized && !isLoading && !authData && !isLoggingOut) {
    console.error("[AuthHandler] Auth data missing unexpectedly after initialization.");
    return null;
  }
  
  return <>{children}</>;
}
