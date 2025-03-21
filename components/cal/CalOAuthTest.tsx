'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TestResult {
  success?: boolean;
  message?: string;
  error?: string;
  details?: any;
  data?: {
    createdUser: any;
    managedUsers: any[];
  };
}

export function CalOAuthTest() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cal/test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to run test',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cal.com OAuth Credentials Test</h2>
        <Button 
          onClick={runTest}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Run Test'}
        </Button>
      </div>

      {result && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>

            {result.message && (
              <div className="text-sm">
                <strong>Message:</strong> {result.message}
              </div>
            )}

            {result.error && (
              <div className="text-sm text-red-500">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.data && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Created User:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(result.data.createdUser, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Managed Users List:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(result.data.managedUsers, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {result.details && !result.success && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Error Details:</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm text-red-500">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 