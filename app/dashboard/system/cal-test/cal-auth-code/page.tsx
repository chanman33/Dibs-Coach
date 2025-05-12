'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useCentralizedAuth } from '@/app/provider';
import { SYSTEM_ROLES } from '@/utils/roles/roles';
import { ContainerLoading } from '@/components/loading/container';

export default function CalAuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { authData, isLoading } = useCentralizedAuth();
  const [clientProfileData, setClientProfileData] = useState<any>(null);
  const [isLoadingClientProfile, setIsLoadingClientProfile] = useState(false);

  // Test the /v2/me endpoint using CAL_CLIENT_ID and CAL_CLIENT_SECRET
  const testMeEndpointWithClientCredentials = async () => {
    setIsLoadingClientProfile(true);
    
    try {
      const clientId = process.env.NEXT_PUBLIC_CAL_CLIENT_ID;
      if (!clientId) {
        throw new Error('Missing Cal.com client ID');
      }

      // This is a client-side component, so we need to make a request to our own API 
      // which will include the server-side secret
      const response = await fetch('/api/cal/test/me-endpoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API returned status ${response.status}`);
      }

      const data = await response.json();
      console.log('[CAL_API_DEBUG] Me endpoint response with client credentials:', data);
      setClientProfileData(data);

      toast({
        title: 'Success',
        description: 'Successfully tested Cal.com /v2/me endpoint with client credentials.',
      });
    } catch (error) {
      console.error('[CAL_API_ERROR] Error testing /v2/me endpoint:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test Cal.com /v2/me endpoint',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClientProfile(false);
    }
  };

  // Redirect if not a system owner
  if (!isLoading && authData?.systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
    router.push('/dashboard');
    return null;
  }

  if (isLoading) {
    return <ContainerLoading />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Cal.com API with Client Credentials</CardTitle>
          <CardDescription>
            Test the /v2/me endpoint using client credentials (Client ID and Client Secret) without user authentication.
            This verifies that your OAuth client is properly configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button 
              onClick={testMeEndpointWithClientCredentials} 
              disabled={isLoadingClientProfile}
              className="w-full"
            >
              {isLoadingClientProfile ? 'Testing...' : 'Test Cal.com OAuth Client Configuration'}
            </Button>

            {clientProfileData && (
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">API Response:</h4>
                <pre className="text-sm overflow-auto p-2 bg-background rounded border">
                  {JSON.stringify(clientProfileData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
