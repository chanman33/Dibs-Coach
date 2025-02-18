import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase server client for authenticated server-side operations.
 * 
 * IMPORTANT: This client should ONLY be used in server-side code (server actions, API routes, etc).
 * All database operations must go through server actions, never directly from the client.
 * 
 * Pattern:
 * 1. Client generates ULID using utils/ulid.ts
 * 2. ULID is passed to server action
 * 3. Server action uses this client to perform database operations
 * 
 * This ensures:
 * - Service key remains secure
 * - All database access is controlled
 * - Data validation happens server-side
 * - Row Level Security (RLS) is enforced
 */
export const createAuthClient = () => {
  if (!process.env.SUPABASE_URL) throw new Error('Missing SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY')

  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  )
} 