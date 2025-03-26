'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export default function CalDbTest() {
  const [loading, setLoading] = useState(false);
  const [createResult, setCreateResult] = useState<TestResult | null>(null);
  const [getResult, setGetResult] = useState<TestResult | null>(null);

  const generateRandomEmail = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `test-user-${randomString}@example.com`;
  };

  const testCreateUser = async () => {
    setLoading(true);
    setCreateResult(null);
    
    try {
      const response = await fetch('/api/cal/test/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: generateRandomEmail(),
          name: 'Test User',
        }),
      });
      
      const result = await response.json();
      
      setCreateResult({
        success: response.ok,
        message: response.ok ? 'Successfully created user and saved to database' : 'Failed to create user',
        data: result.data,
        error: !response.ok ? result.error : undefined,
      });
    } catch (error) {
      setCreateResult({
        success: false,
        message: 'Error creating user',
        error: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetIntegration = async () => {
    setLoading(true);
    setGetResult(null);
    
    try {
      const response = await fetch('/api/cal/test/get-integration?lastTestUser=true');
      const result = await response.json();
      
      setGetResult({
        success: response.ok,
        message: response.ok ? 'Successfully retrieved integration from database' : 'Failed to retrieve integration',
        data: result.data,
        error: !response.ok ? result.error : undefined,
      });
    } catch (error) {
      setGetResult({
        success: false,
        message: 'Error retrieving integration',
        error: error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Cal.com Database Integration Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={testCreateUser} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Cal User &amp; Save to DB
            </Button>
            <Button onClick={testGetIntegration} disabled={loading} variant="outline">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Cal Integration from DB
            </Button>
          </div>
          
          {createResult && (
            <Alert className={`mb-4 ${createResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {createResult.success ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <AlertTitle>{createResult.message}</AlertTitle>
              </div>
              {createResult.error && (
                <AlertDescription className="mt-2">
                  <div className="text-red-600 text-sm">
                    <pre className="overflow-auto p-2 bg-red-100 rounded">
                      {JSON.stringify(createResult.error, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              )}
              {createResult.data && (
                <AlertDescription className="mt-2">
                  <div className="text-sm">
                    <h4 className="font-semibold mb-1">Integration Data:</h4>
                    <pre className="overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(createResult.data, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              )}
            </Alert>
          )}
          
          {getResult && (
            <Alert className={`mb-4 ${getResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {getResult.success ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <AlertTitle>{getResult.message}</AlertTitle>
              </div>
              {getResult.error && (
                <AlertDescription className="mt-2">
                  <div className="text-red-600 text-sm">
                    <pre className="overflow-auto p-2 bg-red-100 rounded">
                      {JSON.stringify(getResult.error, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              )}
              {getResult.data && (
                <AlertDescription className="mt-2">
                  <div className="text-sm">
                    <h4 className="font-semibold mb-1">Integration Data:</h4>
                    <pre className="overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(getResult.data, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 