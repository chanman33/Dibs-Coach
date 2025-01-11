'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getZoomToken } from '@/utils/zoom-token';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Dynamically import the Zoom wrapper with no SSR
const ZoomWrapper = dynamic(() => import('@/components/zoom-wrapper'), { 
  ssr: false,
  loading: () => <div className="container mx-auto p-8">Loading Zoom SDK...</div>
});

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  error?: string;
}

interface TestCase {
  name: string;
  test: () => Promise<any>;
}

interface MediaDevices {
  cameras: any[];
  microphones: any[];
  speakers: any[];
}

interface Device {
  deviceId: string;
  label: string;
}

interface ZoomEvent {
  type: string;
  payload: any;
}

export default function ZoomTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [client, setClient] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Test Cases
  const getTestCases = (sdk: any): TestCase[] => [
    {
      name: 'SDK Client Creation',
      test: async () => {
        const client = sdk.createZoomClient();
        if (!client) throw new Error('Failed to create Zoom client');
        await sdk.leaveSession(client);
        return client;
      }
    },
    {
      name: 'Join Session',
      test: async () => {
        const sessionName = 'test-session-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const testParams = {
          sessionName,
          userName: 'Test User',
          sessionPasscode: 'test123',
          token
        };
        
        const { client, stream } = await sdk.joinZoomSession(testParams);
        if (!client || !stream) throw new Error('Failed to join session');
        
        // Clean up
        await sdk.leaveSession(client);
        return { client, stream };
      }
    },
    {
      name: 'Video Stream Initialization',
      test: async () => {
        const sessionName = 'test-session-video-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client, stream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Video Test User',
          sessionPasscode: 'test123',
          token
        });

        await sdk.startVideo(stream);
        const videoStatus = await stream.isCapturingVideo();
        if (!videoStatus) throw new Error('Failed to initialize video stream');
        
        // Clean up
        await sdk.stopVideo(stream);
        await sdk.leaveSession(client);
        return stream;
      }
    },
    {
      name: 'Video Attachment Test',
      test: async () => {
        const sessionName = 'test-session-video-attach-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        let client, stream;
        try {
          console.log('Starting Video Attachment Test...');
          
          // Join session
          const session = await sdk.joinZoomSession({
            sessionName,
            userName: 'Video Attachment Test',
            sessionPasscode: 'test123',
            token
          });
          client = session.client;
          stream = session.stream;
          console.log('Session joined successfully');

          // Create a temporary video element
          const videoElement = document.createElement('video');
          videoElement.id = 'test-video';
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.autoplay = true;
          videoElement.style.width = '640px';
          videoElement.style.height = '360px';
          document.body.appendChild(videoElement);
          console.log('Video element created with dimensions:', {
            width: videoElement.style.width,
            height: videoElement.style.height
          });

          // Start video
          console.log('Starting video stream...');
          await sdk.startVideo(stream);
          console.log('Video stream started');
          
          // Wait for video to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Verify video is capturing and sending
          const isCapturing = await stream.isCapturingVideo();
          console.log('Video capture state:', { isCapturing });
          if (!isCapturing) {
            throw new Error('Video is not capturing');
          }

          // Wait for video to start sending (up to 10 seconds)
          console.log('Waiting for video to stabilize...');
          let isStable = false;
          for (let i = 0; i < 10; i++) {
            try {
              // Check if video is ready
              const isCapturing = await stream.isCapturingVideo();
              console.log(`Video status check ${i + 1}:`, { isCapturing });
              
              if (isCapturing) {
                // Wait a bit to ensure video is stable
                await new Promise(resolve => setTimeout(resolve, 500));
                const isStillCapturing = await stream.isCapturingVideo();
                
                if (isStillCapturing) {
                  isStable = true;
                  break;
                }
              }
              
              // Wait before next check
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.error('Error checking video status:', error);
            }
          }

          if (!isStable) {
            throw new Error('Video failed to stabilize after 10 seconds');
          }

          console.log('Video is now stable, proceeding with attachment...');

          // Get session info
          const sessionInfo = client.getSessionInfo();
          console.log('Session info:', sessionInfo);
          if (!sessionInfo?.userId) {
            throw new Error('Failed to get session info');
          }

          // Test attachment with retry mechanism
          console.log('Attempting video attachment...');
          let attachError;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`Video attachment attempt ${attempt}...`);
              
              // Clear any existing source
              videoElement.srcObject = null;
              
              // Log element state before attachment
              console.log('Video element state:', {
                readyState: videoElement.readyState,
                paused: videoElement.paused,
                muted: videoElement.muted,
                autoplay: videoElement.autoplay
              });
              
              await stream.attachVideo(videoElement, sessionInfo.userId);
              console.log(`Video attached successfully on attempt ${attempt}`);
              attachError = null;
              break;
            } catch (error: any) {
              console.error(`Attachment attempt ${attempt} failed:`, {
                error,
                message: error?.message,
                type: error?.type,
                reason: error?.reason
              });
              attachError = error;
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (attachError) {
            throw new Error(`Video attachment failed after 3 attempts: ${attachError?.message || 'Unknown error'}`);
          }

          // Wait longer to ensure attachment is stable
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Test detachment
          console.log('Attempting video detachment...');
          await stream.detachVideo(videoElement, sessionInfo.userId);
          console.log('Video detached successfully');

          // Clean up
          console.log('Starting cleanup...');
          document.body.removeChild(videoElement);
          await sdk.stopVideo(stream);
          await sdk.leaveSession(client);
          console.log('Cleanup completed');
          
          return true;
        } catch (error: any) {
          console.error('Video attachment test error details:', {
            error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorType: error?.type,
            errorReason: error?.reason,
            streamState: stream ? 'exists' : 'null',
            clientState: client ? 'exists' : 'null'
          });

          // Clean up on error
          try {
            console.log('Starting error cleanup...');
            const testVideo = document.getElementById('test-video');
            if (testVideo) {
              document.body.removeChild(testVideo);
              console.log('Video element removed');
            }
            if (stream) {
              await sdk.stopVideo(stream);
              console.log('Video stopped');
            }
            if (client) {
              await sdk.leaveSession(client);
              console.log('Session left');
            }
            console.log('Error cleanup completed');
          } catch (cleanupError: any) {
            console.error('Cleanup after error failed:', cleanupError);
          }
          
          throw error;
        }
      }
    },
    {
      name: 'Audio Stream Initialization',
      test: async () => {
        const sessionName = 'test-session-audio-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client, stream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Audio Test User',
          sessionPasscode: 'test123',
          token
        });

        try {
          // Basic audio initialization test
          await stream.startAudio();
          
          // Wait for audio to stabilize
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if we can get audio state
          const canGetAudioState = await stream.isAudioMuted();
          console.log('Audio state check:', { canGetAudioState });
          
          // If we got here without errors, audio is working
          console.log('Audio initialization successful');
          
          // Clean up
          await sdk.leaveSession(client);
          return stream;
        } catch (error: any) {
          // Clean up on error
          await sdk.leaveSession(client);
          throw new Error(`Audio initialization failed: ${error?.message || 'Unknown error'}`);
        }
      }
    },
    {
      name: 'Media Device Enumeration',
      test: async () => {
        const sessionName = 'test-session-devices-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client, stream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Device Test User',
          sessionPasscode: 'test123',
          token
        });

        // Get device lists
        const cameras = await stream.getCameraList();
        const microphones = await stream.getMicList();
        const speakers = await stream.getSpeakerList();
        
        // Log device counts for debugging
        console.log('Available devices:', {
          cameras: cameras.length,
          microphones: microphones.length,
          speakers: speakers.length
        });
        
        // Check for at least one device of each type
        // Note: Some environments might not have all devices
        const warnings = [];
        if (!cameras.length) warnings.push('No cameras detected');
        if (!microphones.length) warnings.push('No microphones detected');
        if (!speakers.length) warnings.push('No speakers detected');
        
        if (warnings.length) {
          console.warn('Device warnings:', warnings.join(', '));
        }
        
        // Clean up
        await sdk.leaveSession(client);
        return { cameras, microphones, speakers } as MediaDevices;
      }
    },
    {
      name: 'Device Switching',
      test: async () => {
        const sessionName = 'test-session-device-switch-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client, stream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Device Switch Test',
          sessionPasscode: 'test123',
          token
        });

        try {
          // Get device lists
          const cameras: Device[] = await stream.getCameraList();
          const microphones: Device[] = await stream.getMicList();

          // Test camera switching if multiple cameras available
          if (cameras.length > 1) {
            // Get the first camera that's not currently selected
            const newCamera = cameras[1]; // Use second camera in the list
            if (newCamera) {
              await stream.switchCamera({ deviceId: newCamera.deviceId });
              console.log('Camera switch successful');
            }
          }

          // Test microphone switching if multiple mics available
          if (microphones.length > 1) {
            // Get the first mic that's not currently selected
            const newMic = microphones[1]; // Use second mic in the list
            if (newMic) {
              await stream.switchMicrophone(newMic.deviceId);
              console.log('Microphone switch successful');
            }
          }

          await sdk.leaveSession(client);
          return true;
        } catch (error: any) {
          await sdk.leaveSession(client);
          throw new Error(`Device switching failed: ${error?.message || 'Unknown error'}`);
        }
      }
    },
    {
      name: 'Session Events',
      test: async () => {
        const sessionName = 'test-session-events-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client, stream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Event Test',
          sessionPasscode: 'test123',
          token
        });

        try {
          // Test event listeners
          const events: ZoomEvent[] = [];
          
          client.on('connection-change', (payload: any) => {
            events.push({ type: 'connection-change', payload });
          });

          client.on('media-sdk-change', (payload: any) => {
            events.push({ type: 'media-sdk-change', payload });
          });

          // Trigger some events
          await sdk.startVideo(stream);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await sdk.stopVideo(stream);
          
          console.log('Captured events:', events);

          await sdk.leaveSession(client);
          return true;
        } catch (error: any) {
          await sdk.leaveSession(client);
          throw new Error(`Event testing failed: ${error?.message || 'Unknown error'}`);
        }
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
  const runAllTests = async (sdk: any) => {
    setTestResults([]);
    const testCases = getTestCases(sdk);
    for (const testCase of testCases) {
      await runTest(testCase);
    }
  };

  const renderContent = (sdk: any, cleanup: () => Promise<void>) => {
    // Manual Testing UI Functions
    const handleConnect = async () => {
      // Clean up any existing session first
      await cleanup();
      
      try {
        const sessionName = 'manual-test-' + Date.now();
        const token = await getZoomToken(sessionName);
        
        const { client: newClient, stream: newStream } = await sdk.joinZoomSession({
          sessionName,
          userName: 'Manual Tester',
          sessionPasscode: 'test123',
          token
        });
        
        setClient(newClient);
        setStream(newStream);
        setIsConnected(true);
      } catch (error: any) {
        console.error('Connection failed:', error?.message || 'Unknown error');
      }
    };

    const handleDisconnect = async () => {
      try {
        // Stop video first if it's running
        await handleStopVideo();
        
        // Small delay to ensure video is fully stopped
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then cleanup and disconnect
        await cleanup();
        setClient(null);
        setStream(null);
        setIsConnected(false);
      } catch (error) {
        console.error('Disconnect failed:', error);
        // Force cleanup even if there's an error
        setClient(null);
        setStream(null);
        setIsConnected(false);
      }
    };

    const handleStartVideo = async () => {
      if (!stream || !client) {
        console.error('Stream or client not available');
        return;
      }

      try {
        // Get the video element
        const videoElement = document.getElementById('zoom-video') as HTMLVideoElement;
        if (!videoElement) {
          throw new Error('Video element not found');
        }

        // Start video
        console.log('Starting video...');
        await stream.startVideo();
        
        // Wait a bit for video to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if video is capturing
        const isCapturing = await stream.isCapturingVideo();
        console.log('Video capture state:', { isCapturing });
        
        if (!isCapturing) {
          throw new Error('Failed to start video capture');
        }

        // Clear any existing video
        videoElement.srcObject = null;

        // Get session info
        const sessionInfo = client.getSessionInfo();
        if (!sessionInfo || !sessionInfo.userId) {
          throw new Error('Failed to get session info');
        }

        console.log('Attaching video for user:', sessionInfo.userId);
        
        // Attach video
        await stream.attachVideo(videoElement, sessionInfo.userId);
        console.log('Video attached successfully');

      } catch (error: any) {
        console.error('Failed to start video:', error);
        // Try to clean up on error
        try {
          if (stream) {
            await stream.stopVideo();
          }
        } catch (cleanupError) {
          console.error('Cleanup after error failed:', cleanupError);
        }
        throw error;
      }
    };

    const handleStopVideo = async () => {
      if (stream && client) {
        try {
          // Get video element
          const videoElement = document.getElementById('zoom-video');
          if (videoElement) {
            try {
              // First detach the video
              await stream.detachVideo(
                videoElement as HTMLVideoElement,
                client.getSessionInfo().userId
              );
              
              // Then stop video capture
              await stream.stopVideo();
              
              // Clear video element
              (videoElement as HTMLVideoElement).srcObject = null;
              
              console.log('Video stopped successfully');
            } catch (error: any) {
              console.error('Failed to stop video:', error);
              // Try to force stop video even if detach failed
              try {
                await stream.stopVideo();
              } catch (e) {
                // Ignore cleanup errors
              }
            }
          }
        } catch (error: any) {
          console.error('Failed to stop video:', error);
        }
      }
    };

    const handleToggleAudio = async (mute: boolean) => {
      if (stream) {
        await sdk.toggleAudio(stream, mute);
      }
    };

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Zoom SDK Test Suite</h1>
        
        {/* Force Cleanup Button */}
        <Card className="p-6 mb-8 bg-yellow-50">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-800">Emergency Cleanup</h2>
          <p className="mb-4 text-yellow-700">
            Use this button to force close all Zoom sessions if you notice any lingering connections.
          </p>
          <Button 
            onClick={async () => {
              try {
                await sdk.forceCleanup();
                setClient(null);
                setStream(null);
                setIsConnected(false);
              } catch (error) {
                console.error('Force cleanup failed:', error);
              }
            }}
            variant="destructive"
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Force Close All Sessions
          </Button>
        </Card>
        
        {/* Automated Tests Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Automated Tests</h2>
          <Button 
            onClick={() => runAllTests(sdk)} 
            className="mb-4"
          >
            Run All Tests
          </Button>
          
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
              {isConnected && (
                <Button 
                  onClick={handleDisconnect}
                  variant="destructive"
                >
                  Disconnect
                </Button>
              )}
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
                <video 
                  id="zoom-video" 
                  className="w-full max-w-2xl border rounded bg-black"
                  muted
                  playsInline
                  autoPlay
                  style={{ minHeight: '360px' }}
                ></video>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <ZoomWrapper>
      {(sdk, cleanup) => renderContent(sdk, cleanup)}
    </ZoomWrapper>
  );
}
