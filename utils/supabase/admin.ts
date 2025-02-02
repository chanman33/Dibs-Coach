import { createClient } from '@supabase/supabase-js'

export async function createServerSupabase() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  return { supabase }
} 