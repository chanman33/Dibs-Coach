'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth } from '@clerk/nextjs/server';
import { ZoomSession, ZoomSessionConfig } from '@/utils/types/zoom';
import { handleZoomError } from './middleware/zoom-error-handler';
import { type SupabaseClient } from '@supabase/supabase-js';
import type {
  ZoomMeeting,
  ZoomMeetingResponse,
  ZoomMeetingUpdate,
  SessionMeetingConfig,
} from '@/utils/types/zoom';
import { env } from '@/lib/env';
import { createAuthClient, getUserUlidAndRole } from '@/utils/auth';

// Initialize Supabase client
const getSupabase = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
};

export async function createZoomSession(config: Omit<ZoomSessionConfig, 'token'>) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await getSupabase();
    
    // Get user's database ID
    const { data: user } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single();
    
    if (!user) throw new Error('User not found');

    // Create session record
    const { data: session, error } = await supabase
      .from('ZoomSession')
      .insert({
        hostId: user.id,
        topic: config.sessionName,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function getZoomSession(sessionId: string): Promise<ZoomSession> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await getSupabase();
    
    const { data: session, error } = await supabase
      .from('ZoomSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    if (!session) throw new Error('Session not found');

    return session;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function updateZoomSessionStatus(sessionId: string, status: ZoomSession['status']) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('ZoomSession')
      .update({ 
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export async function deleteZoomSession(sessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('ZoomSession')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    throw handleZoomError(error);
  }
}

export class ZoomService {
  private baseUrl = 'https://api.zoom.us/v2'
  private supabase: SupabaseClient;
  private userId: string | null = null;
  private userUlid: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.supabase = null as any;
    this.accessToken = env.ZOOM_ACCESS_TOKEN;
  }

  async init() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    this.userId = userId;
    const { userUlid } = await getUserUlidAndRole(userId);
    this.userUlid = userUlid;
    
    this.supabase = await getSupabase();
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
      .from('ZoomMeetingConfig')
      .select('*')
      .eq('userUlid', targetUlid)
      .single();

    return data;
  }

  async updateMeetingConfig(config: SessionMeetingConfig, userUlid?: string): Promise<void> {
    const targetUlid = userUlid || this.userUlid;
    if (!targetUlid) throw new Error('User ULID is required');

    const { error } = await this.supabase
      .from('ZoomMeetingConfig')
      .upsert({
        userUlid: targetUlid,
        ...config,
        updatedAt: new Date().toISOString()
      });

    if (error) throw error;
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
      .from('ZoomSession')
      .select('startUrl, joinUrl')
      .eq('meetingId', meetingId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Meeting URLs not found');

    return {
      startUrl: data.startUrl,
      joinUrl: data.joinUrl,
    };
  }

  async storeMeetingUrls(
    sessionId: string,
    meetingId: number,
    urls: { startUrl: string; joinUrl: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('ZoomSession')
      .update({
        meetingId,
        startUrl: urls.startUrl,
        joinUrl: urls.joinUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('ulid', sessionId);

    if (error) throw error;
  }
} 