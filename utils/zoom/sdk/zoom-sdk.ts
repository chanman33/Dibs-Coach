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
    // Only try to leave if this is the active client or if we are certain this client instance needs cleanup
    // The logic in ZoomVideo.tsx for stale effects will pass the specific client to clean up.
    console.log(`leaveSession called for client: ${client.userId || 'client (no userId yet)'}`);

    const stream = client.getMediaStream();
    if (stream) {
      console.log('leaveSession: Stream exists, attempting to stop video and mute audio.');
      try {
        if (await stream.isCapturingVideo()) {
          console.log('leaveSession: Stopping video...');
          await stream.stopVideo();
          console.log('leaveSession: Video stopped.');
        }
      } catch (e) {
        console.warn('leaveSession: Failed to stop video:', e);
      }
      
      try {
        // Check if audio is active before trying to mute
        const audioState = await stream.getAudioState?.(); // getAudioState is more reliable
        if (audioState?.isStarted && !audioState?.isMuted) { // Check if audio started and not muted
          console.log('leaveSession: Muting audio...');
          await stream.muteAudio();
          console.log('leaveSession: Audio muted.');
        } else if (audioState?.isStarted && audioState?.isMuted) {
          console.log('leaveSession: Audio already muted.');
        } else {
          console.log('leaveSession: Audio not started or unavailable, skipping mute.');
        }
      } catch (e) {
        // Log the error but don't let it stop the leave process
        console.warn('leaveSession: Failed to mute audio (continuing leave process):', e);
      }
    } else {
      console.log('leaveSession: No media stream found for this client.');
    }
    
    // The SDK's client.leave() should handle its own internal listener cleanup.
    // Explicitly removing listeners we added would be done with client.off().
    // console.log('leaveSession: Removing all listeners (client.off() for specific events would be used here if needed)');
    // client.removeAllListeners(); // THIS IS THE INCORRECT LINE TO BE REMOVED
    
    console.log('leaveSession: Adding small delay before client.leave().');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('leaveSession: Calling client.leave(true).');
    await client.leave(true); // Force leave
    console.log('leaveSession: client.leave(true) completed.');

    // Only nullify global activeClient if the client being left IS the global activeClient
    if (client === activeClient) {
        activeClient = null;
        activeStream = null;
        console.log('leaveSession: Global activeClient and activeStream nullified.');
    }
    
  } catch (error) {
    console.error('leaveSession: Failed to leave session comprehensively:', error);
    // Do not re-throw the error to allow subsequent cleanup or operations to proceed if possible,
    // as the primary goal is to ensure the session is left.
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
        console.warn(`Video initialization attempt ${retryCount + 1} of ${maxRetries} failed:`, error);
        
        // If error indicates video is already started, consider it a success
        if (error.reason?.includes('Video is started')) {
          console.log('Video is already started, considering initialization successful');
          return true;
        }
        
        let specificDelay = 1000; // Default delay for unknown errors in retry loop
        if (error.reason?.includes('Camera is starting')) {
          specificDelay = 3000; // Increased delay for camera readiness
          console.log(`Camera is starting, waiting ${specificDelay}ms before next attempt.`);
        } else if (error.type === 'IMPROPER_MEETING_STATE' && error.reason === 'closed') {
          specificDelay = 1500; // Delay hoping the closed state is transient after a quick leave/rejoin scenario
          console.log(`Meeting state reported as closed, waiting ${specificDelay}ms before next attempt.`);
        }
        await new Promise(resolve => setTimeout(resolve, specificDelay));
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
    // REMOVED: Initial cleanup block for activeClient.
    // The calling component (ZoomVideo.tsx) is now responsible for managing stale session cleanup.
    // This prevents a new joinZoomSession call from prematurely closing a client 
    // that a previous, slower joinZoomSession call might still be initializing (e.g., waiting for camera).

    // 1. Create and initialize client first
    const client = createZoomClient();
    console.log(`joinZoomSession: New client created.`);
    
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