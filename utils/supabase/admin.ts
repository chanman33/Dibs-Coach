import { createClient } from '@supabase/supabase-js'
import getSupabaseConfig from './config'
import type { SupabaseClient } from './types'

/**
 * Creates an admin Supabase client with service role access
 * This should only be used in trusted server contexts
 */
export async function createAdminClient(): Promise<SupabaseClient> {
  try {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig()
    
    return createClient(
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