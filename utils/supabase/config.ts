/**
 * @description Get Supabase configuration with environment variable validation
 * Following .cursorrules for environment variable handling
 */
const getSupabaseConfig = () => {
  // Following .cursorrules: client_side prefix required for public variables
  const supabaseUrl = process.env.SUPABASE_URL
  // Following .cursorrules: server_side direct access for service key
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL in environment variables')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY in environment variables')
  }

  return {
    supabaseUrl,
    supabaseServiceKey,
  }
}

export default getSupabaseConfig 