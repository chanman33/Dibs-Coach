'use client';

import { useState, useEffect, useCallback } from 'react';
import { ZoomSession, ZoomMediaState, ZoomEventHandlers } from '@/utils/types/zoom';
import zoomSdk from '@/utils/zoom-sdk';

interface UseZoomProps {
  sessionId?: string;
  onError?: (error: Error) => void;
  eventHandlers?: ZoomEventHandlers;
}

export function useZoom({ sessionId, onError, eventHandlers }: UseZoomProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<ZoomSession | null>(null);
  const [mediaState, setMediaState] = useState<ZoomMediaState>({
    isVideoOn: false,
    isAudioOn: false,
    isSharingScreen: false
  });

  // Fetch session details
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/zoom/sessions?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      
      const { data } = await response.json();
      setSession(data);
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch session');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, onError]);

  // Join session
  const joinSession = useCallback(async (displayName: string) => {
    if (!sessionId) throw new Error('Session ID is required');
    
    try {
      setIsLoading(true);
      
      // Get join token
      const response = await fetch('/api/zoom/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, displayName })
      });
      
      if (!response.ok) throw new Error('Failed to join session');
      
      const { data } = await response.json();
      
      // Join with Zoom SDK
      const { client, stream } = await zoomSdk.joinZoomSession({
        sessionName: data.sessionName,
        userName: displayName,
        token: data.token,
        sessionPasscode: ''
      });

      // Set up event handlers
      if (eventHandlers) {
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          if (handler) {
            client.on(event.replace('on', '').toLowerCase(), handler);
          }
        });
      }

      return { client, stream };
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to join session');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, eventHandlers, onError]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const client = zoomSdk.getActiveClient();
      if (!client) throw new Error('No active session');
      
      const stream = client.getMediaStream();
      
      if (mediaState.isVideoOn) {
        await zoomSdk.stopVideo(stream);
      } else {
        await zoomSdk.startVideo(stream);
      }
      
      setMediaState(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }));
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to toggle video');
      setError(error);
      onError?.(error);
    }
  }, [mediaState.isVideoOn, onError]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      const client = zoomSdk.getActiveClient();
      if (!client) throw new Error('No active session');
      
      const stream = client.getMediaStream();
      await zoomSdk.toggleAudio(stream, mediaState.isAudioOn);
      
      setMediaState(prev => ({ ...prev, isAudioOn: !prev.isAudioOn }));
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to toggle audio');
      setError(error);
      onError?.(error);
    }
  }, [mediaState.isAudioOn, onError]);

  // Leave session
  const leaveSession = useCallback(async () => {
    try {
      const client = zoomSdk.getActiveClient();
      if (!client) return;
      
      await zoomSdk.leaveSession(client);
      setMediaState({
        isVideoOn: false,
        isAudioOn: false,
        isSharingScreen: false
      });
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to leave session');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveSession();
    };
  }, [leaveSession]);

  // Initial session fetch
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  return {
    isLoading,
    error,
    session,
    mediaState,
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio
  };
} 