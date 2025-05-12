import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { createAuthClient } from './auth-client'

/**
 * Creates a Supabase client with cookie support for server components.
 * This version is safe for static site generation by handling the case
 * where cookies aren't available during build.
 * 
 * IMPORTANT: Only use this in App Router server components.
 * For Pages Router, use createAuthClient() instead.
 */
export async function createServerAuthClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  delete: (options: { name: string } & CookieOptions) => void;
} | null) {
  try {
    // If no cookieStore is provided, use regular client
    if (!cookieStore) {
      return createAuthClient();
    }
    
    // Handle cookies with the provided store
    const cookiesHandler = {
      get: (name: string) => {
        try {
          return cookieStore.get(name)?.value;
        } catch (error) {
          return undefined;
        }
      },
      set: (name: string, value: string, options: CookieOptions) => {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Silent fail during static generation
        }
      },
      remove: (name: string, options: CookieOptions) => {
        try {
          cookieStore.delete({
            name,
            ...options
          });
        } catch (error) {
          // Silent fail during static generation
        }
      },
    };

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookiesHandler,
      }
    );
  } catch (error) {
    // Fall back to regular client if cookies aren't available
    return createAuthClient();
  }
} 