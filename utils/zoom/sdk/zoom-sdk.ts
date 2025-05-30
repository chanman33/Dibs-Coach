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

  // Add WebSocket error handling
  client.on('connection-change', (payload: any) => {
    console.log('Connection state changed:', payload.state);
    
    if (payload.state === 'Disconnected') {
      console.warn('WebSocket disconnected, attempting to reconnect...');
      // The SDK will automatically attempt to reconnect
      // We just need to handle the state change
    }
  });

  // Handle WebSocket errors
  client.on('error', (error: any) => {
    console.warn('Zoom SDK error:', error);
    if (error.code === 'websocket_error' || error.message?.includes('WebSocket')) {
      // The SDK will handle reconnection automatically
      console.log('WebSocket error detected, SDK will handle reconnection');
    }
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
      
      // Remove all event listeners before leaving
      client.removeAllListeners();
      
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

// Initialize video for a stream
const initializeVideo = async (stream: any) => {
  try {
    // Check if video is already initialized
    const isVideoCapturing = await stream.isCapturingVideo();
    if (isVideoCapturing) {
      console.log('Video already initialized');
      return true;
    }

    // Add a delay before starting video to ensure camera is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Request video permissions and start video with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        // Check if video is already started before attempting to start it
        const isCapturing = await stream.isCapturingVideo();
        if (isCapturing) {
          console.log('Video is already capturing, skipping start');
          return true;
        }

        await stream.startVideo({
          width: 1280,
          height: 720,
          frameRate: 30
        });

        // Wait for video to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify video is working
        const isCapturingAfterStart = await stream.isCapturingVideo();
        if (isCapturingAfterStart) {
          return true;
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Video initialization attempt ${retryCount + 1} failed:`, error);
        
        // If error indicates video is already started, consider it a success
        if (error.reason?.includes('Video is started')) {
          console.log('Video is already started, considering initialization successful');
          return true;
        }
        
        // If error is about camera starting, wait longer
        if (error.reason?.includes('Camera is starting')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      retryCount++;
    }

    // If we've exhausted retries but video is actually working, consider it a success
    const finalCheck = await stream.isCapturingVideo();
    if (finalCheck) {
      console.log('Video is capturing after retries, considering initialization successful');
      return true;
    }

    throw lastError || new Error('Video initialization failed after retries');
  } catch (error) {
    console.error('Failed to initialize video:', error);
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
      // Add a longer delay before creating new session
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 1. Create and initialize client first
    const client = createZoomClient();
    
    // Add connection quality monitoring
    client.on('connection-quality-change', (payload: any) => {
      console.log('Connection quality:', payload.quality);
      if (payload.quality === 'Poor') {
        console.warn('Poor connection quality detected');
      }
    });
    
    // 2. Join session
    await client.join(sessionName, token, userName, sessionPasscode);
    
    // 3. Get media stream
    const stream = client.getMediaStream();
    
    activeClient = client;
    activeStream = stream;

    // 4. Initialize audio first (before video)
    console.log('Initializing audio...');
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
    } else {
      console.log('Audio initialized successfully');
    }

    // 5. Add delay before video initialization
    console.log('Waiting before video initialization...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Initialize video
    console.log('Initializing video...');
    let videoInitialized = false;
    retryCount = 0;
    while (!videoInitialized && retryCount < 3) {
      videoInitialized = await initializeVideo(stream);
      if (!videoInitialized) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!videoInitialized) {
      console.warn('Video initialization failed after retries');
    } else {
      console.log('Video initialized successfully');
    }

    // 7. Return client and stream for further use
    return { client, stream };
  } catch (error) {
    console.error('Failed to join session:', error);
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
  initializeVideo,
  isAudioAvailable,
  forceCleanup,
};

export default zoomSdk; 