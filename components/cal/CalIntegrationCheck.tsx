'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

interface CalIntegrationCheckProps {
  showOnSuccess?: boolean;
}

export function CalIntegrationCheck({ showOnSuccess = false }: CalIntegrationCheckProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkIntegration = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/cal/test/get-integration');
        const data = await response.json();
        
        if (response.ok && data.success && data.data?.integration) {
          setHasIntegration(true);
        } else {
          setHasIntegration(false);
          setError(data.error || 'No Cal.com integration found');
        }
      } catch (err) {
        setHasIntegration(false);
        setError('Failed to check Cal.com integration');
        console.error('[CAL_INTEGRATION_CHECK_ERROR]', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkIntegration();
  }, []);

  if (isChecking) {
    return null; // Don't show anything while checking
  }

  if (hasIntegration && !showOnSuccess) {
    return null; // Don't show anything if integration exists
  }

  if (hasIntegration && showOnSuccess) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <AlertTitle>Cal.com integration detected</AlertTitle>
        <AlertDescription>
          Your account is successfully connected to Cal.com for scheduling and availability management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <XCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle>No Cal.com integration detected</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          Please connect your Cal.com account first. Webhook events may not work properly 
          without a connected Cal.com account.
        </p>
        <div>
          <Button variant="outline" asChild size="sm" className="mt-2">
            <Link href="/dashboard/settings?tab=integrations">
              Connect Cal.com
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 