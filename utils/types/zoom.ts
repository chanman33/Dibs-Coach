import ZoomVideo from '@zoom/videosdk';
import { z } from 'zod'

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