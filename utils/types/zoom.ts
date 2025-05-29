import ZoomVideo from '@zoom/videosdk';
import { z } from 'zod'
import { SessionStatus as PrismaSessionStatus } from '@prisma/client'

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
  ulid: string;
  sessionUlid: string;
  sessionName: string;
  hostUlid: string;
  startUrl: string | null;
  joinUrl: string | null;
  status: ZoomSessionStatus;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export enum ZoomSessionStatus {
  SCHEDULED = 'SCHEDULED',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED'
}

// Map Zoom status to application status
export const mapZoomStatusToSessionStatus = (zoomStatus: ZoomSessionStatus): PrismaSessionStatus => {
  switch (zoomStatus) {
    case ZoomSessionStatus.SCHEDULED:
      return PrismaSessionStatus.SCHEDULED;
    case ZoomSessionStatus.STARTED:
      return PrismaSessionStatus.STARTED;
    case ZoomSessionStatus.ENDED:
      return PrismaSessionStatus.COMPLETED;
    case ZoomSessionStatus.CANCELLED:
      return PrismaSessionStatus.CANCELLED;
    default:
      return PrismaSessionStatus.SCHEDULED;
  }
};

// Map application status to Zoom status
export const mapSessionStatusToZoomStatus = (sessionStatus: PrismaSessionStatus): ZoomSessionStatus | null => {
  // Only map technical states that have direct Zoom equivalents
  switch (sessionStatus) {
    case PrismaSessionStatus.SCHEDULED:
      return ZoomSessionStatus.SCHEDULED;
    case PrismaSessionStatus.STARTED:
      return ZoomSessionStatus.STARTED;
    case PrismaSessionStatus.COMPLETED:
      return ZoomSessionStatus.ENDED;
    case PrismaSessionStatus.CANCELLED:
      return ZoomSessionStatus.CANCELLED;
    // Business statuses don't map to Zoom statuses
    case PrismaSessionStatus.RESCHEDULED:
    case PrismaSessionStatus.COACH_PROPOSED_RESCHEDULE:
    case PrismaSessionStatus.ABSENT:
    case PrismaSessionStatus.COACH_ABSENT:
      return null; // Return null to indicate no Zoom status mapping
    default:
      return null;
  }
};

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
export enum ZoomErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_JOIN_FAILED = 'SESSION_JOIN_FAILED',
  MEDIA_NO_PERMISSION = 'MEDIA_NO_PERMISSION',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  AUDIO_ALREADY_IN_PROGRESS = 'AUDIO_ALREADY_IN_PROGRESS',
  VIDEO_ALREADY_IN_PROGRESS = 'VIDEO_ALREADY_IN_PROGRESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DEVICE_IN_USE = 'DEVICE_IN_USE'
}

export interface ZoomError {
  code: ZoomErrorCode;
  message: string;
  details?: unknown;
}

// Client types
export type ZoomClient = ReturnType<typeof ZoomVideo.createClient>;
export type ZoomStream = ReturnType<ZoomClient['getMediaStream']>;

// Event types
export type ZoomEventCallback = (payload: any) => void;

export interface ZoomUserJoinPayload {
  userId: string;
  userName: string;
  userRole: 'host' | 'participant';
  joinTime: string;
}

export interface ZoomUserLeavePayload {
  userId: string;
  userName: string;
  leaveTime: string;
}

export interface ZoomMediaErrorPayload {
  code: ZoomErrorCode;
  message: string;
  deviceType?: 'video' | 'audio' | 'screen';
}

export interface ZoomEventHandlers {
  onUserJoin?: (payload: ZoomUserJoinPayload) => void;
  onUserLeave?: (payload: ZoomUserLeavePayload) => void;
  onSessionJoin?: ZoomEventCallback;
  onSessionLeave?: ZoomEventCallback;
  onMediaError?: (payload: ZoomMediaErrorPayload) => void;
  onDeviceChange?: ZoomEventCallback;
}

// UI Toolkit Types
export interface ZoomUIToolkitConfig {
  videoSDKJWT: string;
  sessionName: string;
  userName: string;
  sessionPasscode?: string;
  features?: Array<'video' | 'audio' | 'share' | 'chat' | 'users' | 'settings'>;
  options?: {
    audio?: {
      autoAdjustVolume?: boolean;
      echoCancellation?: boolean;
      noiseReduction?: boolean;
      autoStartAudio?: boolean;
    };
    video?: {
      defaultQuality?: number;
      virtualBackground?: {
        allowVirtualBackground?: boolean;
      };
      autoStartVideo?: boolean;
      videoQuality?: {
        width: number;
        height: number;
        frameRate: number;
      };
      layout?: {
        mode: 'speaker' | 'gallery';
        showActiveVideo?: boolean;
        showNonActiveVideo?: boolean;
      };
    };
    share?: {
      quality?: number;
      optimizeForSharedVideo?: boolean;
    };
  };
}

export const ZoomMeetingSettingsSchema = z.object({
  host_video: z.boolean().default(true),
  participant_video: z.boolean().default(true),
  join_before_host: z.boolean().default(false),
  mute_upon_entry: z.boolean().default(false),
  waiting_room: z.boolean().default(true),
  meeting_authentication: z.boolean().default(false),
  auto_recording: z.enum(['none', 'local', 'cloud']).default('none'),
})

export const ZoomMeetingSchema = z.object({
  topic: z.string(),
  type: z.number().default(2), // 2 = scheduled meeting
  start_time: z.string(),
  duration: z.number(),
  timezone: z.string(),
  password: z.string().optional(),
  agenda: z.string().optional(),
  settings: ZoomMeetingSettingsSchema,
})

export type ZoomMeetingSettings = z.infer<typeof ZoomMeetingSettingsSchema>
export type ZoomMeeting = z.infer<typeof ZoomMeetingSchema>

export interface ZoomMeetingResponse extends ZoomMeeting {
  id: number
  host_id: string
  host_email: string
  status: string
  start_url: string
  join_url: string
  password: string
  h323_password: string
  pstn_password: string
  encrypted_password: string
  settings: ZoomMeetingSettings & {
    alternative_hosts: string
    alternative_hosts_email_notification: boolean
    global_dial_in_numbers: Array<{
      country: string
      number: string
      type: string
    }>
  }
}

export const ZoomMeetingUpdateSchema = ZoomMeetingSchema.partial().extend({
  id: z.number(),
})

export type ZoomMeetingUpdate = z.infer<typeof ZoomMeetingUpdateSchema>

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: {
    code: string
    message: string
    details?: unknown
  } | null
}

// Session Meeting Configuration
export const SessionMeetingConfigSchema = z.object({
  defaultSettings: ZoomMeetingSettingsSchema,
  durationSync: z.boolean().default(true),
  autoStart: z.boolean().default(false),
  reminderMinutes: z.number().default(5),
  customUrlHandling: z.boolean().default(false),
})

export type SessionMeetingConfig = z.infer<typeof SessionMeetingConfigSchema>

// Database Model Types
export interface ZoomSessionRecord {
  ulid: string;
  zoomMeetingId: string | null;
  zoomSessionName: string | null;
  zoomStartUrl: string | null;
  zoomJoinUrl: string | null;
  zoomMeetingPassword: string | null;
  zoomMeetingSettings: ZoomMeetingSettings | null;
  zoomMetadata: Record<string, unknown> | null;
  zoomStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachZoomConfigRecord {
  ulid: string;
  coachUlid: string;
  zoomApiKey: string;
  zoomApiSecret: string;
  zoomAccountId: string | null;
  zoomAccountEmail: string | null;
  staticZoomLink: string | null;
  defaultSettings: ZoomMeetingSettings | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Session Status Mapping
export const SESSION_STATUS_MAP = {
  SCHEDULED: 'SCHEDULED',
  STARTED: 'STARTED',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
  COACH_PROPOSED_RESCHEDULE: 'COACH_PROPOSED_RESCHEDULE',
  ABSENT: 'ABSENT'
} as const;

export type SessionStatus = typeof SESSION_STATUS_MAP[keyof typeof SESSION_STATUS_MAP];

// Cal.com Integration Types
export interface CalBookingCreatePayload {
  start: string;
  attendee: {
    name: string;
    email: string;
    timeZone?: string;
    phoneNumber?: string;
    language?: string;
  };
  meetingUrl: string;  // This will be the coach's staticZoomLink
  eventTypeId?: number;
  eventTypeSlug?: string;
  username?: string;
  teamSlug?: string;
  organizationSlug?: string;
  guests?: string[];
  location?: {
    type: string;
    [key: string]: any;
  };
  metadata?: Record<string, unknown>;
  lengthInMinutes?: number;
}

export interface CalBookingResponse {
  id: number;
  uid: string;
  title: string;
  description?: string;
  hosts: Array<{
    id: number;
    name: string;
    email: string;
    username: string;
    timeZone: string;
  }>;
  status: string;
  start: string;
  end: string;
  duration: number;
  eventTypeId: number;
  eventType: {
    id: number;
    slug: string;
  };
  meetingUrl: string;  // This will contain our Zoom link
  location: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  attendees: Array<{
    name: string;
    email: string;
    timeZone?: string;
    phoneNumber?: string;
    language?: string;
  }>;
  guests?: string[];
}

export interface CalEventTypeZoomConfig {
  staticZoomLink: string;
  defaultSettings?: ZoomMeetingSettings;
} 