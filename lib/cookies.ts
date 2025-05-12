/**
 * Safe cookie access functions that handle static site generation scenarios
 */

import { cookies } from 'next/headers'

/**
 * Safely gets cookies even during static site generation
 */
export async function getCookieStore() {
  try {
    const cookieStore = cookies()
    return cookieStore
  } catch (error) {
    // Return null during static generation
    return null
  }
}

/**
 * Gets cookies for Supabase - use createServerAuthClient instead
 * when possible for a complete solution
 */
export async function getSupabaseCookies() {
  try {
    const cookieStore = await getCookieStore()
    return cookieStore
  } catch (error) {
    return null
  }
} 