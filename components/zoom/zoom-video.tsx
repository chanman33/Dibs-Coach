'use client';

import React, { useEffect, useRef } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';

interface ZoomVideoProps {
  sessionName: string;
  userName: string;
  sessionPasscode: string;
  token: string;
  onError?: (error: Error) => void;
}

export default function ZoomVideo({
  sessionName,
  userName,
  sessionPasscode,
  token,
  onError
}: ZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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

    const initializeSession = async () => {
      try {
        // Join the session
        await uitoolkit.joinSession(containerRef.current!, config);
        
        // Show UI components
        await uitoolkit.showUitoolkitComponents(containerRef.current!, config);
        
        // Show controls if container exists
        if (controlsRef.current) {
          await uitoolkit.showControlsComponent(controlsRef.current);
        }
      } catch (error) {
        console.error('Failed to initialize Zoom session:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to initialize Zoom session'));
      }
    };

    initializeSession();

    // Cleanup
    return () => {
      if (containerRef.current) {
        uitoolkit.closeSession(containerRef.current);
      }
    };
  }, [sessionName, userName, sessionPasscode, token, onError]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-[calc(100%-64px)]"
      />
      <div
        ref={controlsRef}
        className="absolute bottom-0 left-0 right-0 h-16 bg-black/50"
      />
    </div>
  );
} 