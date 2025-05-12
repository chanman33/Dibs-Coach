/**
 * Centralized Supabase client access
 * Uses auth-client.ts without cookie handling
 */

import { createAuthClient, createServerAuthClient } from '@/utils/auth/auth-client'

// No need for cookies since we're using Clerk for auth
export const createSafeClient = createServerAuthClient 