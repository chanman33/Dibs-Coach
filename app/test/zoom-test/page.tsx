'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { getZoomToken } from '@/utils/zoom/auth/zoom-token';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Dynamically import the Zoom component with no SSR
const ZoomVideo = dynamic(() => import('@/components/zoom/zoom-video'), {
    ssr: false,
    loading: () => <div className="container mx-auto p-8">Loading Zoom SDK...</div>
});

interface TestUtilsModules {
    testVideoAudioToggle: (container: HTMLElement) => Promise<boolean>;
    testScreenSharing: (container: HTMLElement) => Promise<boolean>;
    testChatSystem: (container: HTMLElement) => Promise<boolean>;
    testParticipantList: (container: HTMLElement) => Promise<boolean>;
    testLayoutSwitching: (container: HTMLElement) => Promise<boolean>;
    testResponsiveDesign: (container: HTMLElement) => Promise<boolean>;
}

interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'pending' | 'skipped';
    error?: string;
}

interface TestDefinition {
    name: string;
    description: string;
    testFn?: (container: HTMLElement) => Promise<boolean>;
}

interface TestSuiteDefinition {
    name: string;
    tests: TestDefinition[];
}

const BASIC_CONNECTION_TEST_NAMES = {
    TOKEN: 'Token Generation',
    CREATION: 'Session Creation',
    INIT: 'Video Initialization',
    CONNECTION: 'Connection' // General connection error placeholder
};

export default function ZoomTestPage() {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [sessionName, setSessionName] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSessionJoined, setIsSessionJoined] = useState(false);
    const [activeTest, setActiveTest] = useState<string | null>(null);
    const [testUtils, setTestUtils] = useState<TestUtilsModules | null>(null);
    const [sessionState, setSessionState] = useState<'waiting' | 'active' | 'ended'>('waiting');
    const [participants, setParticipants] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<'host' | 'participant'>('host');
    
    const zoomHostRef = useRef<HTMLDivElement>(null);

    // Load test utilities on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@/utils/zoom/testing/test-utils').then(utils => {
                setTestUtils(utils);
            });
        }
    }, []);

    // Helper to update test results immutably
    const updateTestResult = (name: string, status: TestResult['status'], error?: string) => {
        setTestResults(prev => {
            const existingIndex = prev.findIndex(r => r.name === name);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], status, error: error !== undefined ? error : updated[existingIndex].error };
                if (status !== 'pending' && error === undefined) delete updated[existingIndex].error; // Clear error if new status is not pending and no new error
                return updated;
            }
            return [...prev, { name, status, error }];
        });
    };

    const runTest = async (testName: string, testFn?: (container: HTMLElement) => Promise<boolean>) => {
        const zoomSDKContainerElement = zoomHostRef.current?.querySelector<HTMLElement>('#zoom-sdk-container');
        
        updateTestResult(testName, 'pending');

        if (!isSessionJoined) {
            updateTestResult(testName, 'skipped', 'Session not joined');
            return;
        }

        if (sessionState !== 'active') {
            updateTestResult(testName, 'skipped', `Session not active (current state: ${sessionState})`);
            return;
        }

        if (!testFn) {
            updateTestResult(testName, 'skipped', 'Test function not available');
            return;
        }

        if (!zoomSDKContainerElement) {
            updateTestResult(testName, 'failed', 'Zoom SDK container element not found for test.');
            return;
        }
        
        setActiveTest(testName);
        try {
            // Ensure session is still active before running test
            if (sessionState !== 'active') {
                throw new Error('Session is no longer active');
            }

            const result = await testFn(zoomSDKContainerElement);
            
            // Verify session is still active after test
            if (sessionState !== 'active') {
                throw new Error('Session became inactive during test');
            }

            updateTestResult(testName, result ? 'passed' : 'failed', result ? undefined : 'Test failed implicitly');
        } catch (error: any) {
            console.error(`Error running test ${testName}:`, error);
            updateTestResult(testName, 'failed', error.message);
        } finally {
            setActiveTest(null);
        }
    };

    const runTestSuite = async (suiteName: string) => {
        const suite = TEST_SUITE.find(s => s.name === suiteName);
        if (!suite) return;

        // Verify session is active before running suite
        if (!isSessionJoined || sessionState !== 'active') {
            console.warn("Cannot run test suite, session not active");
            suite.tests.forEach(test => 
                updateTestResult(test.name, 'skipped', 'Session not active')
            );
            return;
        }

        // Set all tests in the suite to pending first
        suite.tests.forEach(test => {
            const existingResult = testResults.find(r => r.name === test.name);
            if (!existingResult || existingResult.status === 'pending') {
                if (suite.name !== 'Basic Connection') {
                    updateTestResult(test.name, 'pending');
                }
            }
        });

        for (const test of suite.tests) {
            // Verify session is still active before each test
            if (sessionState !== 'active') {
                console.warn("Session became inactive during test suite");
                suite.tests.forEach(t => 
                    updateTestResult(t.name, 'skipped', 'Session became inactive')
                );
                break;
            }

            if (test.testFn) {
                await runTest(test.name, test.testFn);
            } else if (suite.name !== 'Basic Connection') {
                updateTestResult(test.name, 'skipped', "No test function defined");
            }
        }
    };
    
    const handleConnect = async () => {
        if (isLoadingToken || isConnected) return;
        setIsLoadingToken(true);
        setTestResults([]); 
        setIsSessionJoined(false); 

        // Initialize test results for basic connection tests
        updateTestResult(BASIC_CONNECTION_TEST_NAMES.TOKEN, 'pending');
        updateTestResult(BASIC_CONNECTION_TEST_NAMES.CREATION, 'pending');
        updateTestResult(BASIC_CONNECTION_TEST_NAMES.INIT, 'pending');

        try {
            // 1. Generate session name and token
            const newSessionName = 'test-session-' + Date.now();
            const newToken = await getZoomToken(newSessionName);
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.TOKEN, 'passed');
            
            setSessionName(newSessionName);
            setToken(newToken);
            setIsConnected(true); 

            // 2. Wait for session to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
            console.error('Connection failed (token generation):', error?.message || 'Unknown error');
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.TOKEN, 'failed', error?.message || 'Token fetch error');
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.CREATION, 'failed', 'Prerequisite failed: Token generation');
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.INIT, 'failed', 'Prerequisite failed: Token generation');
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.CONNECTION, 'failed', error?.message || 'Token fetch error');
            setIsConnected(false);
        } finally {
            setIsLoadingToken(false);
        }
    };

    const handleDisconnect = () => {
        setSessionName('');
        setToken('');
        setIsConnected(false);
        setIsSessionJoined(false);
        setTestResults([]); 
    };

    const onZoomError = useCallback((error: Error) => {
        console.error('Zoom Component Error:', error);
        
        // Check if error is related to initialization
        if (error.message.includes('initialization') || error.message.includes('initialize')) {
            updateTestResult(BASIC_CONNECTION_TEST_NAMES.INIT, 'failed', `ZoomVideo Error: ${error.message}`);
        }
        
        // Check if error is related to session creation
        if (error.message.includes('session') || error.message.includes('join')) {
            const creationResult = testResults.find(r => r.name === BASIC_CONNECTION_TEST_NAMES.CREATION);
            if (creationResult && creationResult.status === 'pending') {
                updateTestResult(BASIC_CONNECTION_TEST_NAMES.CREATION, 'failed', `Session creation failed: ${error.message}`);
            }
        }
        
        setIsSessionJoined(false);
        setSessionState('ended');
    }, [testResults]);

    const onZoomSessionJoined = useCallback(() => {
        console.log("ZoomTestPage: Received onZoomSessionJoined callback!");
        
        // Update test results in order
        updateTestResult(BASIC_CONNECTION_TEST_NAMES.CREATION, 'passed');
        updateTestResult(BASIC_CONNECTION_TEST_NAMES.INIT, 'passed');
        
        setIsSessionJoined(true);
        setSessionState('active');
        
        // Add host to participants list when they join
        if (userRole === 'host') {
            setParticipants(prev => [...prev, { userId: 'host', userName: 'Test Host' }]);
        }
    }, [userRole]);

    const onWaitingRoom = useCallback(() => {
        console.log("ZoomTestPage: Entered waiting room");
        setSessionState('waiting');
    }, []);

    const onParticipantJoined = useCallback((participant: any) => {
        console.log("ZoomTestPage: Participant joined:", participant);
        setParticipants(prev => {
            // Don't add duplicate participants
            if (prev.some(p => p.userId === participant.userId)) {
                return prev;
            }
            return [...prev, participant];
        });
    }, []);

    const onParticipantLeft = useCallback((participant: any) => {
        console.log("ZoomTestPage: Participant left:", participant);
        setParticipants(prev => prev.filter(p => p.userId !== participant.userId));
    }, []);

    const TEST_SUITE: TestSuiteDefinition[] = [
        {
            name: 'Basic Connection',
            tests: [
                { name: BASIC_CONNECTION_TEST_NAMES.TOKEN, description: 'Generate valid session token' },
                { name: BASIC_CONNECTION_TEST_NAMES.CREATION, description: 'Create new Zoom session (via ZoomVideo)' },
                { name: BASIC_CONNECTION_TEST_NAMES.INIT, description: 'Initialize video component (via ZoomVideo)' },
            ]
        },
        {
            name: 'Core Features',
            tests: [
                { name: 'Video/Audio Toggle', description: 'Toggle video and audio controls', testFn: testUtils?.testVideoAudioToggle },
                { name: 'Screen Sharing', description: 'Share screen functionality', testFn: testUtils?.testScreenSharing },
                { name: 'Chat System', description: 'Send and receive chat messages', testFn: testUtils?.testChatSystem },
                { name: 'Participant List', description: 'View and manage participants', testFn: testUtils?.testParticipantList },
            ]
        },
        {
            name: 'UI/UX',
            tests: [
                { name: 'Layout Switching', description: 'Switch between speaker and gallery views', testFn: testUtils?.testLayoutSwitching },
                { name: 'Responsive Design', description: 'Verify responsive layout', testFn: testUtils?.testResponsiveDesign },
            ]
        }
    ];

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-8">Zoom SDK Test Page</h1>

            <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />

            <div className="mb-8"> 
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Manual Testing Control</h2>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Role:</label>
                            <select 
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value as 'host' | 'participant')}
                                className="border rounded px-2 py-1"
                                disabled={isConnected}
                            >
                                <option value="host">Host</option>
                                <option value="participant">Participant</option>
                            </select>
                        </div>
                        {!isConnected ? (
                            <Button onClick={handleConnect} disabled={isLoadingToken}>
                                {isLoadingToken ? 'Connecting...' : 'Start Test Session'}
                            </Button>
                        ) : (
                            <Button onClick={handleDisconnect} variant="destructive" disabled={activeTest !== null}>
                                End Session
                            </Button>
                        )}
                    </div>
                    {sessionState === 'waiting' && (
                        <p className="text-yellow-600 mt-2">
                            {userRole === 'host' 
                                ? 'Waiting for participants to join...' 
                                : 'Waiting for host to join...'}
                        </p>
                    )}
                    {sessionState === 'active' && (
                        <p className="text-green-600 mt-2">
                            Session active with {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
                            {userRole === 'host' && participants.length === 1 && ' (you are the host)'}
                        </p>
                    )}
                    {sessionState === 'ended' && (
                        <p className="text-red-600 mt-2">Session ended</p>
                    )}
                </Card>
            </div>

            <div className="mb-8"> 
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Suites</h2>
                    <div className="space-y-4">
                        {TEST_SUITE.map((suite) => (
                            <div key={suite.name} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium">{suite.name}</h3>
                                    <Button
                                        onClick={() => runTestSuite(suite.name)}
                                        disabled={isLoadingToken || (suite.name !== 'Basic Connection' && !isSessionJoined) || activeTest !== null}
                                        size="sm"
                                    >
                                        Run All Tests in Suite
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {suite.tests.map((test) => (
                                        <div key={test.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                            <div>
                                                <div className="font-medium">{test.name}</div>
                                                <div className="text-sm text-gray-500">{test.description}</div>
                                            </div>
                                            {/* Safely check if testFn exists on the test object before rendering the button */}
                                            {Object.prototype.hasOwnProperty.call(test, 'testFn') && test.testFn && (
                                                <Button
                                                    onClick={() => runTest(test.name, test.testFn)}
                                                    disabled={isLoadingToken || !isSessionJoined || activeTest !== null}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    {activeTest === test.name ? 'Running...' : 'Run Test'}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {isConnected && token && (
                <div className="mb-8"> 
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Active Session Video</h2>
                        <div className="aspect-video bg-gray-100"> 
                            <div ref={zoomHostRef} className="w-full h-full"> 
                                <ZoomVideo
                                    sessionName={sessionName}
                                    userName="Test User"
                                    sessionPasscode="" 
                                    token={token}
                                    onError={onZoomError}
                                    onSessionJoined={onZoomSessionJoined}
                                    onWaitingRoom={onWaitingRoom}
                                    onParticipantJoined={onParticipantJoined}
                                    onParticipantLeft={onParticipantLeft}
                                    role={userRole}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div> 
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                    {testResults.length === 0 && <p>No tests run yet.</p>}
                    <div className="space-y-2">
                        {testResults.map((result, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded ${
                                    result.status === 'passed' ? 'bg-green-100 text-green-800'
                                    : result.status === 'failed' ? 'bg-red-100 text-red-800'
                                    : result.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800' 
                                }`}
                            >
                                <div className="font-medium">{result.name} ({result.status})</div>
                                {result.error && (
                                    <div className="text-sm mt-1">Error: {result.error}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
