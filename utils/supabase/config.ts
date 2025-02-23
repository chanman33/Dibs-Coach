import { env } from '@/lib/env'

/**
 * @description Get Supabase configuration with environment variable validation
 * Following .cursorrules for environment variable handling
 */
const getSupabaseConfig = () => {
  try {
    return {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: env.SUPABASE_SERVICE_KEY,
    }
  } catch (error) {
    console.error('[SUPABASE_CONFIG_ERROR]', error)
    throw new Error('Failed to load Supabase configuration')
  }
}

export default getSupabaseConfig 