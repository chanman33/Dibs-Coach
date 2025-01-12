'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getZoomToken } from '@/utils/zoom-token';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ['video-player-container']: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            ['video-player']: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

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

interface SessionInfo {
    isInMeeting: boolean;
    password: string;
    sessionId: string;
    topic: string;
    userId: number;
    userName: string;
}

export default function ZoomTestPage() {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [client, setClient] = useState<any>(null);
    const [stream, setStream] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

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

                    // Create video container elements
                    const videoContainer = document.createElement('video-player-container');
                    videoContainer.id = 'test-video-container';
                    videoContainer.style.width = '100%';
                    videoContainer.style.height = '360px';

                    const videoPlayerElement = document.createElement('video-player');
                    videoPlayerElement.id = 'test-video';
                    videoPlayerElement.style.width = '100%';
                    videoPlayerElement.style.height = 'auto';
                    videoPlayerElement.style.aspectRatio = '16/9';

                    // Append elements
                    videoContainer.appendChild(videoPlayerElement);
                    document.body.appendChild(videoContainer);

                    console.log('Video elements created with dimensions:', {
                        containerWidth: videoContainer.style.width,
                        containerHeight: videoContainer.style.height,
                        playerWidth: videoPlayerElement.style.width,
                        playerAspectRatio: videoPlayerElement.style.aspectRatio
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

                            // Get current user info
                            const currentUser = client.getCurrentUserInfo();
                            console.log('Current user info:', currentUser);

                            // Attach video using documented method
                            console.log('Attaching video for user:', currentUser.userId);
                            const RESOLUTION: { width: number; height: number } = { width: 1280, height: 720 };
                            const userVideo = await stream.attachVideo(currentUser.userId, RESOLUTION);

                            // Clear existing content and append the new video element
                            const existingPlayer = document.getElementById('test-video');
                            if (existingPlayer) {
                                existingPlayer.innerHTML = '';
                                existingPlayer.appendChild(userVideo);
                            }

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
                    const playerToDetach = document.getElementById('test-video');
                    if (playerToDetach) {
                        playerToDetach.innerHTML = '';
                    }
                    console.log('Video detached successfully');

                    // Clean up
                    console.log('Starting cleanup...');
                    const containerToRemove = document.getElementById('test-video-container');
                    if (containerToRemove) {
                        document.body.removeChild(containerToRemove);
                    }
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
        },
        {
            name: 'Session Info Test',
            test: async () => {
                const sessionName = 'test-session-info-' + Date.now();
                const token = await getZoomToken(sessionName);

                const { client, stream } = await sdk.joinZoomSession({
                    sessionName,
                    userName: 'Session Info Test',
                    sessionPasscode: 'test123',
                    token
                });

                try {
                    // Get session info
                    const sessionInfo = client.getSessionInfo();

                    // Log full session info with proper formatting
                    console.log('Session Information:', {
                        isInMeeting: sessionInfo.isInMeeting,
                        password: sessionInfo.password,
                        sessionId: sessionInfo.sessionId,
                        topic: sessionInfo.topic,
                        userId: sessionInfo.userId,
                        userName: sessionInfo.userName
                    });

                    // Validate session info fields
                    if (!sessionInfo) {
                        throw new Error('Failed to get session info');
                    }

                    // Check required fields
                    const requiredFields = [
                        'isInMeeting',
                        'password',
                        'sessionId',
                        'topic',
                        'userId',
                        'userName'
                    ];

                    const missingFields = requiredFields.filter(field => !(field in sessionInfo));
                    if (missingFields.length > 0) {
                        throw new Error(`Missing required session info fields: ${missingFields.join(', ')}`);
                    }

                    // Validate field types
                    if (typeof sessionInfo.isInMeeting !== 'boolean') {
                        throw new Error('isInMeeting should be a boolean');
                    }
                    if (typeof sessionInfo.userId !== 'number') {
                        throw new Error('userId should be a number');
                    }
                    if (typeof sessionInfo.sessionId !== 'string') {
                        throw new Error('sessionId should be a string');
                    }

                    // Validate field values
                    if (sessionInfo.topic !== sessionName) {
                        throw new Error(`Session topic mismatch. Expected: ${sessionName}, Got: ${sessionInfo.topic}`);
                    }
                    if (sessionInfo.userName !== 'Session Info Test') {
                        throw new Error(`Username mismatch. Expected: Session Info Test, Got: ${sessionInfo.userName}`);
                    }

                    // Clean up
                    await sdk.leaveSession(client);
                    return sessionInfo;
                } catch (error: any) {
                    // Clean up on error
                    await sdk.leaveSession(client);
                    throw new Error(`Session info test failed: ${error?.message || 'Unknown error'}`);
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

                // Log session info after connection
                const sessionInfo = newClient.getSessionInfo();
                console.log('Manual Test Session Info:', sessionInfo);

                // Check for multiple video support
                const supportsMultipleVideos = await newStream.isSupportMultipleVideos();
                console.log('Supports multiple videos:', supportsMultipleVideos);

                // Add event listener for peer video state changes
                newClient.on('peer-video-state-change', async (payload: any) => {
                    console.log('Peer video state change:', payload);
                    const container = document.querySelector('video-player-container');
                    if (!container) return;

                    if (payload.action === 'Start') {
                        // A user turned on their video, render it
                        const userVideo = await newStream.attachVideo(payload.userId, { width: 1280, height: 720 });
                        container.appendChild(userVideo);
                    } else if (payload.action === 'Stop') {
                        // A user turned off their video, stop rendering it
                        await newStream.detachVideo(payload.userId);
                    }
                });

                // Check for existing participants with video on
                const users = newClient.getAllUser();
                console.log('Existing users:', users);
                
                const container = document.querySelector('video-player-container');
                if (container) {
                    for (const user of users) {
                        if (user.bVideoOn) {
                            const userVideo = await newStream.attachVideo(user.userId, { width: 1280, height: 720 });
                            container.appendChild(userVideo);
                        }
                    }
                }

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
                // Start video using the exact pattern from docs
                await stream.startVideo();
                const currentUser = client.getCurrentUserInfo();
                const userVideo = await stream.attachVideo(currentUser.userId, { width: 1280, height: 720 });
                
                // Get container and attach video exactly as docs show
                const container = document.querySelector('video-player-container');
                if (!container) {
                    throw new Error('Video container not found');
                }
                container.appendChild(userVideo);
                console.log('Video attached successfully');

            } catch (error: any) {
                console.error('Failed to start video:', error);
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
                    const currentUser = client.getCurrentUserInfo();
                    if (currentUser) {
                        // Detach video first, then stop
                        await stream.detachVideo(currentUser.userId);
                        await stream.stopVideo();
                        console.log('Video stopped successfully');
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
                            <Button
                                onClick={async () => {
                                    if (!stream) return;
                                    try {
                                        const cameras = await stream.getCameraList();
                                        console.log('Available cameras:', cameras);
                                        if (cameras.length > 1) {
                                            // Calculate next camera index
                                            const nextIndex = (currentCameraIndex + 1) % cameras.length;
                                            await stream.switchCamera(cameras[nextIndex].deviceId);
                                            console.log('Switched to camera:', cameras[nextIndex].label);
                                            setCurrentCameraIndex(nextIndex);
                                        } else {
                                            console.log('No alternative cameras available');
                                        }
                                    } catch (error) {
                                        console.error('Failed to switch camera:', error);
                                    }
                                }}
                                disabled={!isConnected}
                            >
                                Switch Camera
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
                                {/* @ts-ignore */}
                                <video-player-container
                                    id="zoom-video-container"
                                    style={{
                                        width: '100%',
                                        height: '1000px'
                                    }}
                                >
                                    {/* @ts-ignore */}
                                    <video-player
                                        id="zoom-video"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            aspectRatio: '16/9'
                                        }}
                                    >
                                    {/* @ts-ignore */}
                                    </video-player>
                                {/* @ts-ignore */}
                                </video-player-container>
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
