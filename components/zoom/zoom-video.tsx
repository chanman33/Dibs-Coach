'use client';

import React, { useEffect, useRef, useState } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';

interface ZoomVideoProps {
  sessionName: string;
  userName: string;
  sessionPasscode: string;
  token: string;
  onError?: (error: Error) => void;
  onSessionJoined?: () => void;
}

export default function ZoomVideo({
  sessionName,
  userName,
  sessionPasscode,
  token,
  onError,
  onSessionJoined
}: ZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSessionInternallyActive, setIsSessionInternallyActive] = useState(false);
  const initializationInProgress = useRef(false);
  const currentTokenRef = useRef<string | null>(null);
  const currentSessionNameRef = useRef<string | null>(null);
  const effectInstanceId = useRef(Math.random());

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

    const config = {
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
        video: { layout: { mode: 'speaker' }, virtualBackground: { allowVirtualBackground: false } },
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
        console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Attempting to join:`, config.sessionName);
        await uitoolkit.joinSession(containerRef.current!, config);
        console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Session joined:`, config.sessionName);
        
        await uitoolkit.showUitoolkitComponents(containerRef.current!, config);
        console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - UI Toolkit shown for:`, config.sessionName);
        
        if (isMounted) {
          setIsSessionInternallyActive(true);
          currentTokenRef.current = token;
          currentSessionNameRef.current = sessionName;
          initializationInProgress.current = false;
          onSessionJoined?.();
          console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Successfully joined and called onSessionJoined for:`, config.sessionName);
        } else {
          console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Component unmounted before onSessionJoined could be called for:`, config.sessionName);
          initializationInProgress.current = false;
        }
      } catch (error: any) {
        console.error(`ZoomVideo Effect [${instanceId}]: initializeSession() - Failed for: ${config.sessionName}`, error);
        if (isMounted) {
          setIsSessionInternallyActive(false);
          currentTokenRef.current = null;
          currentSessionNameRef.current = null;
          initializationInProgress.current = false;
          onError?.(error instanceof Error ? error : new Error('Failed to initialize Zoom session'));
        } else {
          console.log(`ZoomVideo Effect [${instanceId}]: initializeSession() - Component unmounted during error handling for:`, config.sessionName);
          initializationInProgress.current = false;
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
    };
  }, [sessionName, token, userName, sessionPasscode, onError, onSessionJoined]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        id="zoom-sdk-container"
        className="w-full h-[calc(100%-64px)]"
      />
    </div>
  );
} 