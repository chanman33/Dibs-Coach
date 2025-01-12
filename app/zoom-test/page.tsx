'use client';

import { useState, useRef } from 'react';
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
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(true);
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const [awaitingVerification, setAwaitingVerification] = useState<string | null>(null);
    const [verificationResolver, setVerificationResolver] = useState<((value: boolean) => void) | null>(null);

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

                try {
                    // Create proper container structure
                    const container = document.createElement('div');
                    container.className = 'video-list';
                    container.style.width = '100%';
                    container.style.height = '100%';
                    document.body.appendChild(container);

                    // Start video
                    await stream.startVideo();
                    const currentUser = client.getCurrentUserInfo();
                    
                    // Create video cell structure
                    const listItem = document.createElement('div');
                    listItem.style.width = '100%';
                    listItem.style.height = '100%';
                    listItem.style.minHeight = '300px';
                    
                    const videoCell = document.createElement('video-player-container');
                    videoCell.className = 'video-cell';
                    videoCell.style.width = '100%';
                    videoCell.style.height = '100%';
                    
                    // Attach video
                    const videoElement = await stream.attachVideo(currentUser.userId, { width: 1280, height: 720 });
                    if (!videoElement) throw new Error('Failed to create video element');
                    
                    // Verify video element structure
                    if (!(videoElement instanceof Element)) {
                        throw new Error('Video element not created correctly');
                    }
                    
                    if (videoElement.tagName.toLowerCase() !== 'video-player') {
                        throw new Error('Incorrect video element type: ' + videoElement.tagName);
                    }
                    
                    // Assemble structure
                    videoCell.appendChild(videoElement);
                    listItem.appendChild(videoCell);
                    container.appendChild(listItem);
                    
                    // Wait for video to initialize
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Verify video is capturing
                    const isCapturing = await stream.isCapturingVideo();
                    if (!isCapturing) {
                        throw new Error('Video is not capturing after initialization');
                    }
                    
                    // Verify DOM structure
                    const finalStructure = container.querySelector('video-player-container > video-player');
                    if (!finalStructure) {
                        throw new Error('Invalid video element structure');
                    }

                    // Clean up
                    await stream.stopVideo();
                    await sdk.leaveSession(client);
                    container.remove();
                    
                    return true;
                } catch (error) {
                    // Clean up on error
                    try {
                        await stream.stopVideo();
                    } catch {}
                    await sdk.leaveSession(client);
                    const container = document.querySelector('.video-list');
                    if (container) container.remove();
                    throw error;
                }
            }
        },
        {
            name: 'Video Attachment Structure',
            test: async () => {
                const sessionName = 'test-session-structure-' + Date.now();
                const token = await getZoomToken(sessionName);

                const { client, stream } = await sdk.joinZoomSession({
                    sessionName,
                    userName: 'Structure Test User',
                    sessionPasscode: 'test123',
                    token
                });

                try {
                    // Create container structure exactly like manual test
                    const mainContainer = document.createElement('div');
                    mainContainer.className = 'mt-4';
                    mainContainer.style.marginBottom = '400px'; // Space for the modal below

                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-player-container';
                    videoContainer.style.minHeight = '700px';
                    videoContainer.style.border = '1px solid var(--border-color)';
                    videoContainer.style.borderRadius = '5px';
                    videoContainer.style.padding = '0.5rem';
                    videoContainer.style.position = 'relative';
                    videoContainer.style.display = 'block';
                    videoContainer.style.backgroundColor = '#f0f0f0';

                    const focusedWrapper = document.createElement('div');
                    focusedWrapper.className = 'focused-users-wrapper';
                    focusedWrapper.style.height = '100%';

                    const videoList = document.createElement('ul');
                    videoList.className = 'video-list';
                    videoList.style.display = 'grid';
                    videoList.style.gridTemplateColumns = 'repeat(2, 1fr)';
                    videoList.style.gap = '16px';
                    videoList.style.padding = '0';
                    videoList.style.margin = '0';
                    videoList.style.listStyle = 'none';
                    videoList.style.height = '100%';
                    videoList.style.minHeight = '600px';

                    // Assemble container structure
                    focusedWrapper.appendChild(videoList);
                    videoContainer.appendChild(focusedWrapper);
                    mainContainer.appendChild(videoContainer);
                    document.body.appendChild(mainContainer);

                    // Start video
                    await stream.startVideo();
                    const currentUser = client.getCurrentUserInfo();

                    // Create video element structure exactly like manual test
                    const listItem = document.createElement('div');
                    listItem.style.width = '100%';
                    listItem.style.height = '100%';
                    listItem.style.minHeight = '300px';
                    
                    const videoCell = document.createElement('video-player-container');
                    videoCell.className = 'video-cell';
                    videoCell.style.width = '100%';
                    videoCell.style.height = '100%';
                    videoCell.style.position = 'relative';
                    videoCell.style.display = 'flex';
                    videoCell.style.flexDirection = 'column';
                    
                    // Create username span
                    const userName = document.createElement('span');
                    userName.className = 'user-name';
                    userName.textContent = client?.getCurrentUserInfo()?.userName || 'User';
                    userName.style.position = 'absolute';
                    userName.style.bottom = '8px';
                    userName.style.left = '8px';
                    userName.style.color = 'white';
                    userName.style.zIndex = '1';
                    userName.style.padding = '4px 8px';
                    userName.style.borderRadius = '4px';
                    userName.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

                    // Attach video
                    const videoElement = await stream.attachVideo(currentUser.userId, { width: 1280, height: 720 });
                    if (!videoElement) throw new Error('Failed to create video element');

                    // Verify video element
                    if (!(videoElement instanceof Element)) {
                        throw new Error('Video element not created correctly');
                    }
                    
                    if (videoElement.tagName.toLowerCase() !== 'video-player') {
                        throw new Error('Incorrect video element type: ' + videoElement.tagName);
                    }

                    // Style video element
                    (videoElement as HTMLElement).style.width = '100%';
                    (videoElement as HTMLElement).style.height = '100%';
                    (videoElement as HTMLElement).style.objectFit = 'cover';

                    // Assemble video structure
                    videoCell.appendChild(videoElement);
                    videoCell.appendChild(userName);
                    listItem.appendChild(videoCell);
                    videoList.appendChild(listItem);

                    // Wait for user verification
                    setAwaitingVerification('Video Attachment Structure');
                    const isVideoWorking = await new Promise<boolean>((resolve) => {
                        setVerificationResolver(() => resolve);
                    });
                    setAwaitingVerification(null);
                    setVerificationResolver(null);

                    if (!isVideoWorking) {
                        throw new Error('User reported video not functioning correctly');
                    }

                    // Clean up
                    await stream.stopVideo();
                    await sdk.leaveSession(client);
                    mainContainer.remove();
                    
                    return true;
                } catch (error) {
                    // Clean up on error
                    try {
                        await stream.stopVideo();
                    } catch {}
                    await sdk.leaveSession(client);
                    const container = document.querySelector('.mt-4');
                    if (container) container.remove();
                    setAwaitingVerification(null);
                    setVerificationResolver(null);
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

                // Initialize audio/video state
                setIsVideoMuted(!newClient.getCurrentUserInfo()?.bVideoOn);
                setIsAudioMuted(newClient.getCurrentUserInfo()?.muted ?? true);

                // Add event listener for peer video state changes
                newClient.on('peer-video-state-change', async (payload: any) => {
                    console.log('Peer video state change:', payload);
                    await renderVideo(newStream, payload);
                });

                setClient(newClient);
                setStream(newStream);
                setIsConnected(true);
            } catch (error: any) {
                console.error('Connection failed:', error?.message || 'Unknown error');
            }
        };

        const renderVideo = async (mediaStream: any, event: { action: 'Start' | 'Stop'; userId: number }) => {
            const container = document.querySelector('.video-list');
            if (!container) return;

            if (event.action === 'Stop') {
                // Remove the entire video cell for this user
                const videoCell = document.querySelector(`[data-userid="${event.userId}"]`)?.closest('.video-cell');
                if (videoCell) {
                    videoCell.remove();
                }
                await mediaStream.detachVideo(event.userId);
            } else {
                try {
                    // Create the list item wrapper
                    const listItem = document.createElement('div');
                    listItem.style.width = '100%';
                    listItem.style.height = '100%';
                    listItem.style.minHeight = '300px';
                    
                    // Create video cell container
                    const videoCell = document.createElement('video-player-container');
                    videoCell.className = 'video-cell';
                    videoCell.style.width = '100%';
                    videoCell.style.height = '100%';
                    videoCell.style.position = 'relative';
                    videoCell.style.display = 'flex';
                    videoCell.style.flexDirection = 'column';
                    
                    // Create username span
                    const userName = document.createElement('span');
                    userName.className = 'user-name';
                    userName.textContent = client?.getCurrentUserInfo()?.userName || 'User';
                    userName.style.position = 'absolute';
                    userName.style.bottom = '8px';
                    userName.style.left = '8px';
                    userName.style.color = 'white';
                    userName.style.zIndex = '1';
                    userName.style.padding = '4px 8px';
                    userName.style.borderRadius = '4px';
                    userName.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    
                    // Attach video directly to the video-player-container
                    const videoElement = await mediaStream.attachVideo(event.userId, { width: 1280, height: 720 });
                    if (videoElement) {
                        (videoElement as HTMLElement).style.width = '100%';
                        (videoElement as HTMLElement).style.height = '100%';
                        (videoElement as HTMLElement).style.objectFit = 'cover';
                        
                        // The SDK returns a video-player element, so we just need to append it
                        videoCell.appendChild(videoElement);
                        videoCell.appendChild(userName); // Add username after video for proper layering
                        listItem.appendChild(videoCell);
                        container.appendChild(listItem);
                        
                        console.log('Video element structure created:', {
                            listItem: listItem.outerHTML,
                            videoCell: videoCell.outerHTML
                        });
                    }
                } catch (error) {
                    console.error('Error creating video element:', error);
                }
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
                await stream.startVideo();
                const currentUser = client.getCurrentUserInfo();
                await renderVideo(stream, { action: 'Start', userId: currentUser.userId });
                setIsVideoMuted(false);
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
                        await renderVideo(stream, { action: 'Stop', userId: currentUser.userId });
                        await stream.stopVideo();
                        setIsVideoMuted(true);
                        console.log('Video stopped successfully');
                    }
                } catch (error: any) {
                    console.error('Failed to stop video:', error);
                }
            }
        };

        const handleToggleAudio = async (mute: boolean) => {
            if (stream) {
                try {
                    if (mute) {
                        await stream.muteAudio();
                    } else {
                        await stream.unmuteAudio();
                    }
                    setIsAudioMuted(mute);
                } catch (error) {
                    console.error('Failed to toggle audio:', error);
                }
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
                                <div className="video-player-container"
                                    style={{
                                        minHeight: '700px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '5px',
                                        padding: '0.5rem',
                                        position: 'relative',
                                        display: 'block',
                                        backgroundColor: '#f0f0f0'
                                    }}>
                                    <div className="focused-users-wrapper" style={{ height: '100%' }}>
                                        <ul className="video-list"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: '16px',
                                                padding: '0',
                                                margin: '0',
                                                listStyle: 'none',
                                                height: '100%',
                                                minHeight: '600px'
                                            }}>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Add verification UI */}
                {awaitingVerification && (
                    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Verify Video Functionality</h3>
                            <p className="mb-4">Please verify that you can see your video feed clearly above this dialog.</p>
                            <div className="flex justify-end space-x-4">
                                <Button
                                    variant="destructive"
                                    onClick={() => verificationResolver?.(false)}
                                >
                                    Not Working
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => verificationResolver?.(true)}
                                >
                                    Working Correctly
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <ZoomWrapper>
            {(sdk, cleanup) => renderContent(sdk, cleanup)}
        </ZoomWrapper>
    );
}
