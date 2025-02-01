import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  
  // Calendly
  CALENDLY_CLIENT_ID: z.string().min(1),
  CALENDLY_CLIENT_SECRET: z.string().min(1),
  CALENDLY_WEBHOOK_SIGNING_KEY: z.string().min(1),
  
  // Vercel Cron
  CRON_SECRET: z.string().min(1),
  ZOOM_ACCESS_TOKEN: z.string(),
})

// Validate and export environment variables
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  CALENDLY_CLIENT_ID: process.env.CALENDLY_CLIENT_ID,
  CALENDLY_CLIENT_SECRET: process.env.CALENDLY_CLIENT_SECRET,
  CALENDLY_WEBHOOK_SIGNING_KEY: process.env.CALENDLY_WEBHOOK_SIGNING_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  ZOOM_ACCESS_TOKEN: process.env.ZOOM_ACCESS_TOKEN,
}) 