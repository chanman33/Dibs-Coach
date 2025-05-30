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
  const controlsRef = useRef<HTMLDivElement>(null);
  const [isSessionInternallyActive, setIsSessionInternallyActive] = useState(false);
  const initializationInProgress = useRef(false);
  const currentTokenRef = useRef<string | null>(null);
  const currentSessionNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('ZoomVideo: containerRef is not yet available during effect setup.');
      return;
    }
    if (!token || !sessionName) {
      console.warn('ZoomVideo: Token or sessionName is missing.');
      if (isSessionInternallyActive) {
        console.log('ZoomVideo: Token/sessionName removed, closing active session.');
        uitoolkit.closeSession(containerRef.current!);
        setIsSessionInternallyActive(false);
        currentTokenRef.current = null;
        currentSessionNameRef.current = null;
        initializationInProgress.current = false;
      }
      onError?.(new Error('Zoom token or sessionName is missing.'));
      return;
    }

    if (initializationInProgress.current) {
      console.log('ZoomVideo: Initialization already in progress, skipping.');
      return;
    }

    if (isSessionInternallyActive && currentTokenRef.current === token && currentSessionNameRef.current === sessionName) {
      console.log('ZoomVideo: Session already active with current token and sessionName, ensuring onSessionJoined is called.');
      onSessionJoined?.();
      return;
    }
    
    if (isSessionInternallyActive && (currentTokenRef.current !== token || currentSessionNameRef.current !== sessionName)) {
        console.log('ZoomVideo: Token or sessionName changed for an active session. Closing old session before re-initializing.');
        uitoolkit.closeSession(containerRef.current!);
        setIsSessionInternallyActive(false);
    }

    console.log(`ZoomVideo: Starting initialization. Current internal active: ${isSessionInternallyActive}, Token: ${token ? 'present' : 'absent'}, SessionName: ${sessionName}`);
    initializationInProgress.current = true;

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
        audio: {
          autoAdjustVolume: true,
          echoCancellation: true,
          noiseReduction: true,
          autoStartAudio: false,
        },
        video: {
          defaultQuality: 360,
          virtualBackground: {
            allowVirtualBackground: false,
          },
          autoStartVideo: false,
          videoQuality: {
            width: 640,
            height: 360,
            frameRate: 30,
          },
          layout: {
            mode: 'speaker',
            showActiveVideo: true,
            showNonActiveVideo: true,
          },
        },
        share: {
          quality: 720,
          optimizeForSharedVideo: true,
        },
      },
    };

    let isMounted = true;

    const initializeSession = async () => {
      if (!containerRef.current) {
        if (isMounted) onError?.(new Error('ZoomVideo container is not available for session initialization.'));
        initializationInProgress.current = false;
        return;
      }
      try {
        console.log('ZoomVideo: Attempting to join session with config:', config);
        await uitoolkit.joinSession(containerRef.current!, config);
        console.log('ZoomVideo: Session joined successfully.');
        
        await uitoolkit.showUitoolkitComponents(containerRef.current!, config);
        console.log('ZoomVideo: UI Toolkit components shown.');
        
        // if (controlsRef.current) { // Temporarily comment out to see if it resolves double audio prompt
        //   await uitoolkit.showControlsComponent(controlsRef.current);
        //   console.log('ZoomVideo: Controls component shown.');
        // }
        
        if (isMounted) {
          setIsSessionInternallyActive(true);
          currentTokenRef.current = token;
          currentSessionNameRef.current = sessionName;
          onSessionJoined?.();
        }
      } catch (error: any) {
        console.error('ZoomVideo: Failed to initialize Zoom session:', error);
        if (error.type === 'ALREADY_JOINED') {
            console.warn('ZoomVideo: Caught ALREADY_JOINED error. Assuming session is active from another instance.');
            if (isMounted) {
                setIsSessionInternallyActive(true);
                currentTokenRef.current = token;
                currentSessionNameRef.current = sessionName;
                onSessionJoined?.();
            }
        } else if (isMounted) {
          setIsSessionInternallyActive(false);
          currentTokenRef.current = null;
          currentSessionNameRef.current = null;
          onError?.(error instanceof Error ? error : new Error('Failed to initialize Zoom session'));
        }
      } finally {
        initializationInProgress.current = false;
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
      console.log(`ZoomVideo: Cleanup function called. isSessionInternallyActive: ${isSessionInternallyActive}, currentToken: ${currentTokenRef.current}, currentSessionName: ${currentSessionNameRef.current}`);
    };
  }, [sessionName, token, userName, sessionPasscode, onError, onSessionJoined]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        id="zoom-sdk-container"
        className="w-full h-[calc(100%-64px)]"
      />
      <div
        ref={controlsRef}
        className="absolute bottom-0 left-0 right-0 h-16 bg-black/50"
      />
    </div>
  );
} 