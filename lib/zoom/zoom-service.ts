'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth } from '@clerk/nextjs/server';
import { ZoomSession, ZoomSessionConfig } from '@/utils/types/zoom';
import { handleZoomError } from './middleware/zoom-error-handler';

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