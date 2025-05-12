import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth } from '@clerk/nextjs/server';
import { ZoomSession, ZoomSessionConfig, ZoomSessionStatus, ZOOM_SESSION_STATUS } from '@/utils/types/zoom';
import { handleZoomError } from './middleware/zoom-error-handler';
import { type SupabaseClient } from '@supabase/supabase-js';
import type {
  ZoomMeeting,
  ZoomMeetingResponse,
  ZoomMeetingUpdate,
  SessionMeetingConfig,
} from '@/utils/types/zoom';
import { env } from '@/lib/env';
import { createAuthClient } from '@/utils/auth';
import { getUserById } from '@/utils/auth/user-management';
import { generateUlid } from '@/utils/ulid';

export async function createZoomSession(config: Omit<ZoomSessionConfig, 'token'>): Promise<ZoomSession> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await createAuthClient();
    
    // Get user's database ID using our standard pattern
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    // Create session record with ULID
    const ulid = generateUlid();
    const sessionUlid = generateUlid();

    const sessionData: ZoomSession = {
      ulid,
      sessionUlid,
      sessionName: config.sessionName,
      hostUlid: user.userUlid,
      status: ZOOM_SESSION_STATUS.SCHEDULED,
      startUrl: null,
      joinUrl: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data: session, error } = await supabase
      .from('Session')
      .insert(sessionData as any)
      .select()
      .single();

    if (error) throw error;
    if (!session) throw new Error('Failed to create session');
    
    return session as unknown as ZoomSession;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function getZoomSession(sessionId: string): Promise<ZoomSession> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await createAuthClient();
    
    const { data: session, error } = await supabase
      .from('Session')
      .select('*')
      .eq('ulid', sessionId)
      .single();

    if (error) throw error;
    if (!session) throw new Error('Session not found');

    return session as unknown as ZoomSession;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function updateZoomSessionStatus(sessionId: string, status: ZoomSession['status']) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await createAuthClient();
    
    const { error } = await supabase
      .from('Session')
      .update({ 
        status: status as any,
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', sessionId);

    if (error) throw error;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function deleteZoomSession(sessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await createAuthClient();
    
    const { error } = await supabase
      .from('Session')
      .delete()
      .eq('ulid', sessionId);

    if (error) throw error;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export class ZoomService {
  private baseUrl = 'https://api.zoom.us/v2'
  private supabase!: SupabaseClient;
  private userId: string | null = null;
  private userUlid: string | null = null;
  private accessToken: string;

  constructor() {
    if (!env.ZOOM_ACCESS_TOKEN) {
      throw new Error('ZOOM_ACCESS_TOKEN is required');
    }
    this.accessToken = env.ZOOM_ACCESS_TOKEN;
  }

  async init() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    this.userId = userId;
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    
    this.userUlid = user.userUlid;
    this.supabase = await createAuthClient();
    return this;
  }

  private async fetchZoom<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[ZOOM_API_ERROR]', errorData)
        throw new Error(`Zoom API error: ${errorData.message || response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('[ZOOM_API_ERROR]', error)
      throw error
    }
  }

  async createMeeting(data: ZoomMeeting): Promise<ZoomMeetingResponse> {
    return this.fetchZoom('/users/me/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMeeting(data: ZoomMeetingUpdate): Promise<ZoomMeetingResponse> {
    const { id, ...updateData } = data
    return this.fetchZoom(`/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  }

  async getMeeting(meetingId: number): Promise<ZoomMeetingResponse> {
    return this.fetchZoom(`/meetings/${meetingId}`)
  }

  async deleteMeeting(meetingId: number): Promise<void> {
    await this.fetchZoom(`/meetings/${meetingId}`, {
      method: 'DELETE',
    })
  }

  async getMeetingConfig(userUlid?: string): Promise<SessionMeetingConfig | null> {
    const targetUlid = userUlid || this.userUlid;
    if (!targetUlid) throw new Error('User ULID is required');

    const { data } = await this.supabase
      .from('CoachZoomConfig')
      .select('defaultSettings')
      .eq('userUlid', targetUlid)
      .maybeSingle();

    if (data && data.defaultSettings) {
      return data.defaultSettings as SessionMeetingConfig;
    }
    return null;
  }

  async updateMeetingConfig(config: SessionMeetingConfig, userUlid?: string): Promise<void> {
    const targetUlid = userUlid || this.userUlid;
    if (!targetUlid) throw new Error('User ULID is required');

    const { data: existingConfig, error: fetchError } = await this.supabase
      .from('CoachZoomConfig')
      .select('ulid')
      .eq('userUlid', targetUlid)
      .maybeSingle();

    if (fetchError) {
      console.error("[ZOOM_SERVICE_UPDATE_CONFIG_ERROR] Fetching existing config failed:", fetchError);
      throw fetchError;
    }

    const recordToUpsert = {
      userUlid: targetUlid,
      defaultSettings: config,
      updatedAt: new Date().toISOString(),
      ...(existingConfig ? { ulid: existingConfig.ulid } : { ulid: generateUlid(), createdAt: new Date().toISOString() })
    };

    const { error } = await this.supabase
      .from('CoachZoomConfig')
      .upsert(recordToUpsert);

    if (error) {
      console.error("[ZOOM_SERVICE_UPDATE_CONFIG_ERROR] Upsert failed:", error);
      throw error;
    }
  }

  async syncMeetingDuration(
    meetingId: number,
    durationMinutes: number
  ): Promise<ZoomMeetingResponse> {
    return this.updateMeeting({
      id: meetingId,
      duration: durationMinutes,
    })
  }

  async getMeetingUrls(meetingId: number): Promise<{
    startUrl: string;
    joinUrl: string;
  }> {
    const { data, error } = await this.supabase
      .from('Session')
      .select('zoomStartUrl, zoomJoinUrl')
      .eq('zoomMeetingId', String(meetingId))
      .single();

    if (error) throw error;
    if (!data) throw new Error('Meeting URLs not found');

    return {
      startUrl: data.zoomStartUrl,
      joinUrl: data.zoomJoinUrl,
    };
  }

  async storeMeetingUrls(
    sessionId: string,
    meetingId: number,
    urls: { startUrl: string; joinUrl: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('Session')
      .update({
        zoomMeetingId: String(meetingId),
        zoomStartUrl: urls.startUrl,
        zoomJoinUrl: urls.joinUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('ulid', sessionId);

    if (error) throw error;
  }
} 