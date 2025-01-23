import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getUserDbIdAndRole(userId: string) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options 
            })
          } catch (error) {
            // Read-only cookie store in edge runtime
            console.warn('[COOKIE_SET_ERROR]', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              maxAge: 0 
            })
          } catch (error) {
            // Read-only cookie store in edge runtime
            console.warn('[COOKIE_REMOVE_ERROR]', error)
          }
        },
      },
    }
  )

  const { data: user, error } = await supabase
    .from('User')
    .select('id, role')
    .eq('userId', userId)
    .single()

  if (error || !user) {
    console.error('[AUTH_ERROR] Error fetching user:', error)
    return { userDbId: null, role: null }
  }

  return { userDbId: user.id, role: user.role }
} 