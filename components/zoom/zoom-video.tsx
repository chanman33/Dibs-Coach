'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import { 
    ZoomSessionConfig, 
    ZoomUserJoinPayload, 
    ZoomUserLeavePayload,
    ZoomUIToolkitConfig,
    ZoomErrorCode
} from '@/utils/types/zoom';
import zoomSdk from '@/utils/zoom/sdk/zoom-sdk';

interface ZoomVideoProps extends Omit<ZoomSessionConfig, 'token'> {
  token: string;
  onError?: (error: Error) => void;
  onSessionJoined?: () => void;
  onWaitingRoom?: () => void;
  onParticipantJoined?: (participant: ZoomUserJoinPayload) => void;
  onParticipantLeft?: (participant: ZoomUserLeavePayload) => void;
  role?: 'host' | 'participant';
}

export default function ZoomVideo({
  sessionName,
  userName,
  sessionPasscode,
  token,
  onError,
  onSessionJoined,
  onWaitingRoom,
  onParticipantJoined,
  onParticipantLeft,
  role = 'participant'
}: ZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSessionInternallyActive, setIsSessionInternallyActive] = useState(false);
  const [sessionState, setSessionState] = useState<'waiting' | 'active' | 'ended'>('waiting');
  const [participants, setParticipants] = useState<ZoomUserJoinPayload[]>([]);
  const [waitingRoomTimeout, setWaitingRoomTimeout] = useState<NodeJS.Timeout | null>(null);
  const initializationInProgress = useRef(false);
  const currentTokenRef = useRef<string | null>(null);
  const currentSessionNameRef = useRef<string | null>(null);
  const effectInstanceId = useRef(Math.random());
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Add participant tracking using Zoom SDK
  useEffect(() => {
    if (!containerRef.current || !isSessionInternallyActive) return;

    const client = zoomSdk.getActiveClient();
    if (!client) return;

    const handleParticipantJoined = (payload: ZoomUserJoinPayload) => {
      setParticipants(prev => [...prev, payload]);
      onParticipantJoined?.(payload);
      
      // If host joins and current user is participant, activate session
      if (payload.userRole === 'host' && role === 'participant') {
        setSessionState('active');
      }
    };

    const handleParticipantLeft = (payload: ZoomUserLeavePayload) => {
      setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
      onParticipantLeft?.(payload);
      
      // If host leaves, end session for participant
      if (payload.userId === client.getCurrentUser()?.userId && role === 'host') {
        setSessionState('ended');
      }
    };

    // Subscribe to participant events using Zoom SDK
    client.on('user-joined', handleParticipantJoined);
    client.on('user-left', handleParticipantLeft);

    return () => {
      client.off('user-joined', handleParticipantJoined);
      client.off('user-left', handleParticipantLeft);
    };
  }, [isSessionInternallyActive, role, onParticipantJoined, onParticipantLeft]);

  // Add waiting room timeout
  useEffect(() => {
    if (sessionState === 'waiting' && role === 'participant') {
      const timeout = setTimeout(() => {
        setSessionState('ended');
        onError?.(new Error('Session timed out waiting for host to join'));
      }, 15 * 60 * 1000); // 15 minutes timeout

      setWaitingRoomTimeout(timeout);

      return () => {
        if (waitingRoomTimeout) {
          clearTimeout(waitingRoomTimeout);
        }
      };
    }
  }, [sessionState, role, onError]);

  // Initialize session
  useEffect(() => {
    const instanceId = effectInstanceId.current;
    console.log(`ZoomVideo Effect [${instanceId}]: Start. Token: ${token ? 'OK' : 'Missing'}, SessionName: ${sessionName || 'Missing'}, Initializing: ${initializationInProgress.current}, Active: ${isSessionInternallyActive}`);

    if (!containerRef.current) {
      console.warn(`ZoomVideo Effect [${instanceId}]: containerRef not available.`);
      return;
    }

    if (!token || !sessionName) {
      console.warn(`ZoomVideo Effect [${instanceId}]: Token or sessionName missing.`);
      if (isSessionInternallyActive) {
        console.log(`ZoomVideo Effect [${instanceId}]: Token/sessionName removed, closing active session.`);
        uitoolkit.closeSession(containerRef.current!);
        setIsSessionInternallyActive(false);
        currentTokenRef.current = null;
        currentSessionNameRef.current = null;
      }
      initializationInProgress.current = false;
      onError?.(new Error('Zoom token or sessionName is missing.'));
      return;
    }

    if (initializationInProgress.current && currentTokenRef.current === token && currentSessionNameRef.current === sessionName) {
      console.log(`ZoomVideo Effect [${instanceId}]: Initialization already in progress for same session, skipping.`);
      return;
    }

    if (isSessionInternallyActive && currentTokenRef.current === token && currentSessionNameRef.current === sessionName) {
      console.log(`ZoomVideo Effect [${instanceId}]: Session already active with current token/sessionName.`);
      return;
    }
    
    if (isSessionInternallyActive && (currentTokenRef.current !== token || currentSessionNameRef.current !== sessionName)) {
      console.log(`ZoomVideo Effect [${instanceId}]: Props changed for active session. Closing old: ${currentSessionNameRef.current}.`);
      uitoolkit.closeSession(containerRef.current!);
      setIsSessionInternallyActive(false);
      currentTokenRef.current = null;
      currentSessionNameRef.current = null;
    }

    console.log(`ZoomVideo Effect [${instanceId}]: Proceeding with initialization for session: ${sessionName}`);
    initializationInProgress.current = true;
    effectInstanceId.current = Math.random();
    setInitializationError(null);

    const config: ZoomUIToolkitConfig = {
      videoSDKJWT: token,
      sessionName,
      userName,
      sessionPasscode,
      features: [
        'video',
        'audio',
        'share',
        'chat',
        'users',
        'settings'
      ],
      options: {
        video: { 
          layout: { mode: 'speaker' }, 
          virtualBackground: { allowVirtualBackground: false },
          autoStartVideo: false,
          videoQuality: {
            width: 1280,
            height: 720,
            frameRate: 30
          }
        },
        audio: {
          autoStartAudio: false,
          echoCancellation: true,
          noiseReduction: true,
          autoAdjustVolume: true
        }
      },
    };

    let isMounted = true;

    const initializeSession = async () => {
      if (!containerRef.current) {
        if (isMounted) onError?.(new Error('ZoomVideo container not available during async init.'));
        if (isMounted) initializationInProgress.current = false;
        return;
      }

      try {
        // Join session using our SDK
        await zoomSdk.joinZoomSession({
          sessionName,
          userName,
          sessionPasscode,
          token
        });

        console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Session joined:`, config.sessionName);
        
        await uitoolkit.showUitoolkitComponents(containerRef.current!, config);
        console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - UI Toolkit shown for:`, config.sessionName);
        
        if (isMounted) {
          setIsSessionInternallyActive(true);
          currentTokenRef.current = token;
          currentSessionNameRef.current = sessionName;
          initializationInProgress.current = false;
          
          // Set initial session state based on role
          if (role === 'host') {
            setSessionState('active');
            onSessionJoined?.();
          } else {
            setSessionState('waiting');
            onWaitingRoom?.();
          }
        }
      } catch (error: any) {
        console.error(`ZoomVideo Effect [${instanceId}]: initializeSession() - Failed for: ${config.sessionName}`, error);
        if (isMounted) {
          setIsSessionInternallyActive(false);
          currentTokenRef.current = null;
          currentSessionNameRef.current = null;
          initializationInProgress.current = false;
          setSessionState('ended');
          setInitializationError(error.message || 'Failed to initialize Zoom session');
          onError?.(error instanceof Error ? error : new Error('Failed to initialize Zoom session'));
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
      console.log(`ZoomVideo Effect [${instanceId}]: Cleanup. Initializing: ${initializationInProgress.current}, Active: ${isSessionInternallyActive}, Token: ${currentTokenRef.current}, Session: ${currentSessionNameRef.current}`);
      
      if (initializationInProgress.current && effectInstanceId.current !== instanceId) {
        console.log(`ZoomVideo Effect [${instanceId}]: Cleanup - Newer effect instance running, this cleanup is for an older attempt.`);
      } else if (initializationInProgress.current) {
        console.log(`ZoomVideo Effect [${instanceId}]: Cleanup - Initialization was in progress, resetting flag.`);
        initializationInProgress.current = false;
      }

      // Clean up session only if it's active
      if (containerRef.current && isSessionInternallyActive) {
        try {
          uitoolkit.closeSession(containerRef.current);
          setIsSessionInternallyActive(false);
          currentTokenRef.current = null;
          currentSessionNameRef.current = null;
        } catch (error) {
          console.warn('Error during session cleanup:', error);
        }
      }
    };
  }, [sessionName, token, userName, sessionPasscode, onError, onSessionJoined, onWaitingRoom, role]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      {sessionState === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-center p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Waiting for host to join...</h3>
            <p className="text-gray-300">Please wait while we connect you to the session</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </div>
      )}
      {sessionState === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-center p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Session Ended</h3>
            <p className="text-gray-300">
              {initializationError 
                ? `Error: ${initializationError}`
                : 'The session has ended. Please contact your host for assistance.'}
            </p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        id="zoom-sdk-container"
        className="w-full h-[calc(100%-64px)]"
      />
    </div>
  );
} 