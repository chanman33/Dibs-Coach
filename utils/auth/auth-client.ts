import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for database operations only.
 * Auth is handled by Clerk, so we don't need Supabase's auth features.
 */
export function createAuthClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false // Disable Supabase auth since we use Clerk
      }
    }
  )
}