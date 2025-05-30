'use client';

import ZoomVideo from '@zoom/videosdk';

let activeClient: any = null;
let activeStream: any = null;

// Force cleanup all sessions
const forceCleanup = async () => {
  try {
    // Create a temporary client to force cleanup
    const tempClient = ZoomVideo.createClient();
    tempClient.init('en-US', 'CDN', {
      patchJsMedia: true,
      webEndpoint: 'https://zoom.us'
    });
    
    // Try to leave any existing sessions
    try {
      await tempClient.leave(true);
    } catch (e) {
      console.warn('No active session to leave');
    }
    
    // Reset our tracking variables
    activeClient = null;
    activeStream = null;
    
    // Add a delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Failed to force cleanup:', error);
    return false;
  }
};

// Initialize Zoom Video SDK client
const createZoomClient = () => {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Zoom SDK can only be initialized in a browser environment');
  }
  
  const client = ZoomVideo.createClient();
  
  // Initialize with English language and CDN
  client.init('en-US', 'CDN', {
    patchJsMedia: true,
    webEndpoint: 'https://zoom.us',
    enforceMultipleVideos: true
  });
  
  return client;
};

// Clean up function to properly end a session
const leaveSession = async (client: any) => {
  if (!client) return;
  
  try {
    // Only try to leave if this is the active client
    if (client === activeClient) {
      const stream = client.getMediaStream();
      if (stream) {
        try {
          if (await stream.isCapturingVideo()) {
            await stream.stopVideo();
          }
        } catch (e) {
          console.warn('Failed to stop video:', e);
        }
        
        try {
          // Always try to mute audio before leaving
          await stream.muteAudio();
        } catch (e) {
          console.warn('Failed to mute audio:', e);
        }
      }
      
      // Add a small delay before leaving to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Leave the session
      await client.leave(true); // Force leave
      activeClient = null;
      activeStream = null;
    }
  } catch (error) {
    console.error('Failed to leave session:', error);
    throw error;
  }
};

// Check if audio is available and unmuted
const isAudioAvailable = async (stream: any) => {
  try {
    const audioMuted = await stream.isAudioMuted();
    return !audioMuted;
  } catch (error) {
    return false;
  }
};

// Initialize audio for a stream
const initializeAudio = async (stream: any) => {
  try {
    // Check if audio is already initialized
    const isAudioMuted = await stream.isAudioMuted();
    if (!isAudioMuted) {
      console.log('Audio already initialized');
      return true;
    }

    // Request audio permissions first
    await stream.startAudio({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    });

    // Wait for audio to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify audio is working
    const isMuted = await stream.isAudioMuted();
    if (isMuted) {
      throw new Error('Audio initialization failed - still muted after start');
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
};

// Type definitions for session parameters
export interface JoinSessionParams {
  sessionName: string;
  userName: string;
  sessionPasscode: string;
  token: string;
}

// Join or start a Zoom session
const joinZoomSession = async ({
  sessionName,
  userName,
  sessionPasscode,
  token,
}: JoinSessionParams) => {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Zoom SDK can only be used in a browser environment');
  }

  try {
    // Clean up any existing session first
    if (activeClient) {
      await leaveSession(activeClient);
      // Add a small delay before creating new session
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const client = createZoomClient();
    
    // Join with basic options
    await client.join(sessionName, token, userName, sessionPasscode);
    
    const stream = client.getMediaStream();
    
    activeClient = client;
    activeStream = stream;
    
    // Initialize audio by default with retry
    let audioInitialized = false;
    let retryCount = 0;
    while (!audioInitialized && retryCount < 3) {
      audioInitialized = await initializeAudio(stream);
      if (!audioInitialized) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!audioInitialized) {
      console.warn('Audio initialization failed after retries');
    }
    
    return { client, stream };
  } catch (error) {
    console.error('Failed to join Zoom session:', error);
    throw error;
  }
};

// Helper function to start video
const startVideo = async (stream: any) => {
  try {
    await stream.startVideo();
  } catch (error) {
    console.error('Failed to start video:', error);
    throw error;
  }
};

// Helper function to stop video
const stopVideo = async (stream: any) => {
  try {
    await stream.stopVideo();
  } catch (error) {
    console.error('Failed to stop video:', error);
    throw error;
  }
};

// Helper function to mute/unmute audio
const toggleAudio = async (stream: any, mute: boolean) => {
  try {
    if (!stream) {
      throw new Error('No audio stream available');
    }

    // Add delay before operation
    await new Promise(resolve => setTimeout(resolve, 500));

    if (mute) {
      await stream.muteAudio();
    } else {
      await stream.unmuteAudio();
    }
  } catch (error) {
    console.error('Failed to toggle audio:', error);
    throw error;
  }
};

// Get the active client if any
const getActiveClient = () => activeClient;

// Export all functions as a default object
const zoomSdk = {
  createZoomClient,
  joinZoomSession,
  startVideo,
  stopVideo,
  toggleAudio,
  leaveSession,
  getActiveClient,
  initializeAudio,
  isAudioAvailable,
  forceCleanup,
};

export default zoomSdk; 