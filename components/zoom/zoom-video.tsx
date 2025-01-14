'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { handleZoomError } from '../../lib/zoom/middleware/zoom-error-handler';

interface ZoomMeetingProps {
  sessionName: string;
  userName: string;
  sessionPasscode: string;
  token: string;
  onError?: (error: Error) => void;
}

export const ZoomMeeting = ({
  sessionName,
  userName,
  sessionPasscode,
  token,
  onError,
}: ZoomMeetingProps) => {
  const uiToolkitRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSessionJoined, setIsSessionJoined] = useState(false);
  const [toolkit, setToolkit] = useState<any>(null);
  const [showStartButton, setShowStartButton] = useState(true);
  const [audioState, setAudioState] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [videoState, setVideoState] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [zoomClient, setZoomClient] = useState<any>(null);
  const initializationAttempts = useRef(0);

  // Initialize devices
  const initializeDevices = useCallback(async (client: any) => {
    try {
      console.log('Initializing devices...');
      
      // Check device permissions first
      const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const videoPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });

      if (audioPermission.state === 'denied' || videoPermission.state === 'denied') {
        throw new Error('Camera or microphone permission denied');
      }

      // Initialize audio
      if (client.audio) {
        console.log('Starting audio...');
        await client.audio.startAudio();
        setAudioState('ready');
        console.log('Audio started');
      }

      // Initialize video
      if (client.video) {
        console.log('Starting video...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
          await client.video.startVideo();
          setVideoState('ready');
          console.log('Video started');
        } else {
          console.log('No video devices found');
          setVideoState('error');
        }
      }
    } catch (error) {
      console.error('Failed to initialize devices:', error);
      setAudioState('error');
      setVideoState('error');
      throw error;
    }
  }, []);

  // Session event handlers
  const handleSessionJoined = useCallback(async () => {
    console.log('Session joined, initializing devices...');
    setIsSessionJoined(true);
    setIsInitializing(false);

    if (toolkit) {
      try {
        const client = toolkit.getClient();
        console.log('Got Zoom client:', client);
        setZoomClient(client);

        await initializeDevices(client);
      } catch (error) {
        console.error('Error initializing devices:', error);
        onError?.(new Error('Failed to initialize devices'));
        
        // Attempt to recover
        if (initializationAttempts.current < 3) {
          initializationAttempts.current++;
          console.log(`Retrying device initialization (attempt ${initializationAttempts.current})...`);
          setTimeout(() => handleSessionJoined(), 2000);
        }
      }
    }
  }, [toolkit, onError, initializeDevices]);

  const handleSessionClosed = useCallback(() => {
    console.log('Session closed, cleaning up...');
    if (!toolkit || !uiToolkitRef.current) return;

    // Stop video and audio if they're running
    if (zoomClient) {
      if (zoomClient.video) {
        zoomClient.video.stopVideo();
      }
      if (zoomClient.audio) {
        zoomClient.audio.stopAudio();
      }
    }

    // Clean up video container
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = '';
    }

    toolkit.hideUitoolkitComponents(uiToolkitRef.current);
    setIsSessionJoined(false);
    setShowStartButton(true);
    setAudioState('initializing');
    setVideoState('initializing');
    setZoomClient(null);
  }, [toolkit, zoomClient]);

  // Device event handlers
  const handleAudioStateChange = useCallback((state: any) => {
    console.log('Audio state changed:', state);
    if (state.isAudioEnabled) {
      setAudioState('ready');
      console.log('Audio initialized successfully');
    } else if (state.error) {
      console.error('Audio initialization error:', state.error);
      setAudioState('error');
      onError?.(new Error(`Audio error: ${state.error}`));
    }
  }, [onError]);

  const handleVideoStateChange = useCallback((state: any) => {
    console.log('Video state changed:', state);
    if (state.isVideoEnabled) {
      setVideoState('ready');
      console.log('Video initialized successfully');
    } else if (state.error) {
      console.error('Video initialization error:', state.error);
      setVideoState('error');
      onError?.(new Error(`Video error: ${state.error}`));
    }
  }, [onError]);

  // Initialize the UI Toolkit
  const initializeZoomSDK = useCallback(async () => {
    try {
      console.log('Starting Zoom SDK initialization...');
      setIsInitializing(true);
      setShowStartButton(false);
      setAudioState('initializing');
      setVideoState('initializing');
      initializationAttempts.current = 0;
      
      if (!uiToolkitRef.current || !controlsRef.current || !videoContainerRef.current) {
        throw new Error('UI containers not ready');
      }

      const uitoolkit = (await import('@zoom/videosdk-ui-toolkit')).default;
      console.log('UI Toolkit imported successfully');
      setToolkit(uitoolkit);

      const config = {
        videoSDKJWT: token,
        sessionName: sessionName,
        userName: userName,
        sessionPasscode: sessionPasscode,
        cloud_recording_option: {
          recording_layouts: [],
        },
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
        deviceEvents: {
          onAudioStateChange: handleAudioStateChange,
          onVideoStateChange: handleVideoStateChange,
        },
      };

      console.log('Initializing UI Toolkit components...');
      
      // First join the session
      await uitoolkit.joinSession(uiToolkitRef.current, config);
      console.log('Session joined successfully');

      // Set up event listeners after joining
      uitoolkit.onSessionJoined(handleSessionJoined);
      uitoolkit.onSessionClosed(handleSessionClosed);

      // Then show the UI components
      await uitoolkit.showUitoolkitComponents(uiToolkitRef.current, config);
      console.log('UI Toolkit components initialized');

      // Finally show the controls
      await uitoolkit.showControlsComponent(controlsRef.current);
      console.log('Controls component initialized');

      // Manually trigger session joined since we might have missed the event
      await handleSessionJoined();
    } catch (error) {
      console.error('Failed to initialize Zoom UI Toolkit:', error);
      onError?.(new Error('Failed to initialize Zoom UI Toolkit'));
      setIsInitializing(false);
      setShowStartButton(true);
      setAudioState('error');
      setVideoState('error');
      
      if (uiToolkitRef.current) {
        uiToolkitRef.current.innerHTML = '';
      }
    }
  }, [
    sessionName,
    userName,
    sessionPasscode,
    token,
    handleSessionJoined,
    handleSessionClosed,
    handleAudioStateChange,
    handleVideoStateChange,
    onError
  ]);

  // Update the cleanup effect
  useEffect(() => {
    return () => {
      if (toolkit && uiToolkitRef.current) {
        try {
          // Clean up event listeners
          toolkit.offSessionJoined(handleSessionJoined);
          toolkit.offSessionClosed(handleSessionClosed);
          
          // Clean up the session
          handleSessionClosed();
          
          // Clean up the containers
          if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = '';
          }
          if (uiToolkitRef.current) {
            uiToolkitRef.current.innerHTML = '';
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    };
  }, [toolkit, handleSessionJoined, handleSessionClosed]);

  const getDeviceStatus = () => {
    if (!isSessionJoined) return null;
    
    return (
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <div className={`px-3 py-1 rounded-full text-sm ${
          audioState === 'ready' ? 'bg-green-500' : 
          audioState === 'error' ? 'bg-red-500' : 
          'bg-yellow-500'
        } text-white`}>
          Audio: {audioState}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          videoState === 'ready' ? 'bg-green-500' : 
          videoState === 'error' ? 'bg-red-500' : 
          'bg-yellow-500'
        } text-white`}>
          Video: {videoState}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      {showStartButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <button
            onClick={initializeZoomSDK}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Session
          </button>
        </div>
      )}
      
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4" />
          <p className="text-white">Initializing session...</p>
        </div>
      )}

      {getDeviceStatus()}
      
      <div 
        ref={uiToolkitRef} 
        className="w-full h-full"
        style={{ position: 'relative', background: '#000' }}
      >
        {/* Video container */}
        <div
          ref={videoContainerRef}
          className="w-full h-[calc(100%-64px)]"
          style={{ position: 'relative' }}
        />
        
        {/* Controls container at the bottom */}
        <div
          ref={controlsRef}
          className="absolute bottom-0 left-0 right-0 h-16 bg-black/50 z-20"
        />
      </div>
    </div>
  );
}; 