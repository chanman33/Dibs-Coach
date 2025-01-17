import ZoomVideo from '@zoom/videosdk';

// Core session types
export interface ZoomSessionConfig {
  sessionName: string;
  userName: string;
  sessionPasscode: string;
  token: string;
  startTime?: string;
  duration?: number;
  role?: 'host' | 'participant';
}

export interface ZoomSession {
  id: string;
  hostId: string;
  topic: string;
  startTime: string;
  duration: number;
  status: ZoomSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export type ZoomSessionStatus = 'scheduled' | 'started' | 'ended' | 'failed';

// Media types
export interface ZoomMediaState {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSharingScreen: boolean;
}

export interface ZoomDevice {
  deviceId: string;
  label: string;
}

export interface ZoomDevices {
  videoInputs: ZoomDevice[];
  audioInputs: ZoomDevice[];
  audioOutputs: ZoomDevice[];
}

// Error types
export interface ZoomError {
  code: string;
  message: string;
  details?: unknown;
}

// Client types
export type ZoomClient = ReturnType<typeof ZoomVideo.createClient>;
export type ZoomStream = ReturnType<ZoomClient['getMediaStream']>;

// Event types
export type ZoomEventCallback = (payload: any) => void;

export interface ZoomEventHandlers {
  onUserJoin?: ZoomEventCallback;
  onUserLeave?: ZoomEventCallback;
  onSessionJoin?: ZoomEventCallback;
  onSessionLeave?: ZoomEventCallback;
  onMediaError?: ZoomEventCallback;
  onDeviceChange?: ZoomEventCallback;
} 