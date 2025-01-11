'use client';

import { useState, useEffect } from 'react';
import zoomSdk from '@/utils/zoom-sdk';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  error?: string;
}

export default function ZoomTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [client, setClient] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Test Cases
  const testCases = [
    {
      name: 'SDK Client Creation',
      test: async () => {
        const client = zoomSdk.createZoomClient();
        if (!client) throw new Error('Failed to create Zoom client');
        return client;
      }
    },
    {
      name: 'Join Session',
      test: async () => {
        const testParams = {
          sessionName: 'test-session',
          userName: 'Test User',
          sessionPasscode: 'test123',
          token: 'YOUR_TEST_TOKEN' // This should be fetched from your token endpoint
        };
        
        const { client, stream } = await zoomSdk.joinZoomSession(testParams);
        if (!client || !stream) throw new Error('Failed to join session');
        return { client, stream };
      }
    }
  ];

  // Run a single test
  const runTest = async (test: { name: string; test: () => Promise<any> }) => {
    setTestResults(prev => [
      ...prev,
      { name: test.name, status: 'pending' }
    ]);

    try {
      await test.test();
      setTestResults(prev => 
        prev.map(result => 
          result.name === test.name 
            ? { ...result, status: 'passed' } 
            : result
        )
      );
    } catch (error: any) {
      setTestResults(prev => 
        prev.map(result => 
          result.name === test.name 
            ? { ...result, status: 'failed', error: error?.message || 'Unknown error' } 
            : result
        )
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    for (const testCase of testCases) {
      await runTest(testCase);
    }
  };

  // Manual Testing UI Functions
  const handleConnect = async () => {
    try {
      const { client, stream } = await zoomSdk.joinZoomSession({
        sessionName: 'manual-test',
        userName: 'Manual Tester',
        sessionPasscode: 'test123',
        token: 'YOUR_TEST_TOKEN' // This should be fetched from your token endpoint
      });
      
      setClient(client);
      setStream(stream);
      setIsConnected(true);
    } catch (error: any) {
      console.error('Connection failed:', error?.message || 'Unknown error');
    }
  };

  const handleStartVideo = async () => {
    if (stream) {
      await zoomSdk.startVideo(stream);
    }
  };

  const handleStopVideo = async () => {
    if (stream) {
      await zoomSdk.stopVideo(stream);
    }
  };

  const handleToggleAudio = async (mute: boolean) => {
    if (stream) {
      await zoomSdk.toggleAudio(stream, mute);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Zoom SDK Test Suite</h1>
      
      {/* Automated Tests Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Automated Tests</h2>
        <Button onClick={runAllTests} className="mb-4">Run All Tests</Button>
        
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center space-x-4">
              <span className="font-medium">{result.name}:</span>
              <span className={`
                ${result.status === 'passed' ? 'text-green-500' : ''}
                ${result.status === 'failed' ? 'text-red-500' : ''}
                ${result.status === 'pending' ? 'text-yellow-500' : ''}
              `}>
                {result.status}
              </span>
              {result.error && (
                <span className="text-red-500 text-sm">{result.error}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Manual Testing Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Manual Testing</h2>
        
        <div className="space-y-4">
          <div>
            <Button 
              onClick={handleConnect}
              disabled={isConnected}
              className="mr-4"
            >
              Connect to Session
            </Button>
          </div>

          <div className="space-x-4">
            <Button 
              onClick={handleStartVideo}
              disabled={!isConnected}
            >
              Start Video
            </Button>
            <Button 
              onClick={handleStopVideo}
              disabled={!isConnected}
            >
              Stop Video
            </Button>
          </div>

          <div className="space-x-4">
            <Button 
              onClick={() => handleToggleAudio(true)}
              disabled={!isConnected}
            >
              Mute Audio
            </Button>
            <Button 
              onClick={() => handleToggleAudio(false)}
              disabled={!isConnected}
            >
              Unmute Audio
            </Button>
          </div>

          {/* Video Display */}
          {isConnected && (
            <div className="mt-4">
              <video id="zoom-video" className="w-full max-w-2xl border rounded"></video>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
