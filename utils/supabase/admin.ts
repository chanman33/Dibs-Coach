import { createClient } from '@supabase/supabase-js'
import getSupabaseConfig from './config'
import type { Database } from '@/types/supabase'

/**
 * Creates an admin Supabase client with service role access
 * This should only be used in trusted server contexts
 */
export async function createAdminClient() {
  try {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig()
    
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
    if (!supabaseServiceKey) throw new Error('Missing SUPABASE_SERVICE_KEY')
    
    return createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
  } catch (error) {
    console.error('[ADMIN_CLIENT_ERROR]', error)
    throw error
  }
} 