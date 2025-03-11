import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import { Database } from '@/types/supabase'

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => {
          const cookieStore = cookies()
          return cookieStore.get(name)?.value
        },
        set: (name: string, value: string, options: CookieOptions) => {
          const cookieStore = cookies()
          cookieStore.set(name, value, options)
        },
        remove: (name: string, options: CookieOptions) => {
          const cookieStore = cookies()
          cookieStore.delete(name, options)
        },
      },
    }
  )
} 