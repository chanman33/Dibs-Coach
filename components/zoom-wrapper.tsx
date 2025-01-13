'use client';

import { useEffect, useState } from 'react';
import zoomSdk from '@/utils/zoom-sdk';

interface ZoomWrapperProps {
  children: (sdk: typeof zoomSdk, cleanup: () => Promise<void>) => React.ReactNode;
}

export default function ZoomWrapper({ children }: ZoomWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setError('Zoom SDK can only be loaded in a browser environment');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        try {
          const activeClient = zoomSdk.getActiveClient();
          if (activeClient) {
            zoomSdk.leaveSession(activeClient);
          }
        } catch (error) {
          console.warn('Failed to cleanup on unmount:', error);
        }
      }
    };
  }, []);

  if (isLoading) {
    return <div>Loading Zoom SDK...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const cleanup = async () => {
    try {
      const activeClient = zoomSdk.getActiveClient();
      if (activeClient) {
        await zoomSdk.leaveSession(activeClient);
      }
    } catch (error) {
      console.warn('Failed to cleanup:', error);
    }
  };

  return <>{children(zoomSdk, cleanup)}</>;
} 