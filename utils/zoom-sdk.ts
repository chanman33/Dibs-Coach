'use client';

import ZoomVideo from '@zoom/videosdk';

// Initialize Zoom Video SDK client
const createZoomClient = () => {
  const client = ZoomVideo.createClient();
  
  // Initialize with English language and CDN
  client.init('en-US', 'CDN');
  
  return client;
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
  try {
    const client = createZoomClient();

    await client.join(sessionName, token, userName, sessionPasscode);
    const stream = client.getMediaStream();
    
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

// Export all functions as a default object
const zoomSdk = {
  createZoomClient,
  joinZoomSession,
  startVideo,
  stopVideo,
  toggleAudio,
};

export default zoomSdk; 