/**
 * Centralized Supabase client access
 * Redirects to the proper implementation in utils/auth/server-client.ts
 */

import { createServerAuthClient } from '@/utils/auth/server-client'
import { getSupabaseCookies } from '@/lib/cookies'

export const createSafeClient = async () => {
  const cookieStore = await getSupabaseCookies()
  return createServerAuthClient(cookieStore)
} 