import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import getSupabaseConfig from './config'

/**
 * @description Create a Supabase server client with proper cookie handling
 * Following .cursorrules database conventions and error handling
 */
export async function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  try {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig()
    const cookieObject = await cookieStore

    return _createServerClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        cookies: {
          get(name: string) {
            return cookieObject.get(name)?.value
          },
          set(name: string, value: string, options: { path: string; maxAge?: number }) {
            try {
              cookieObject.set({ name, value, ...options })
            } catch (error) {
              console.error('[COOKIE_SET_ERROR]', error)
            }
          },
          remove(name: string, options: { path: string }) {
            try {
              cookieObject.delete({ name, ...options })
            } catch (error) {
              console.error('[COOKIE_DELETE_ERROR]', error)
            }
          },
        },
        auth: {
          persistSession: true,
        },
      }
    )
  } catch (error) {
    console.error('[SUPABASE_CLIENT_ERROR]', error)
    throw error
  }
} 