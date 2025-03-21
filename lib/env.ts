import { z } from 'zod'

const envSchema = z.object({
  // App Configuration
  NEXT_PUBLIC_USE_MOCK_CALENDAR: z.coerce.boolean().default(false),
  NEXT_PUBLIC_MOCK_CALENDAR_SCENARIO: z.enum(['mixed', 'only_past']).optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),

  // Cal.com
  NEXT_PUBLIC_CAL_CLIENT_ID: z.string().min(1),
  CAL_CLIENT_SECRET: z.string().min(1),
  NEXT_PUBLIC_CAL_WEBHOOK_SECRET: z.string(),
  NEXT_PUBLIC_CAL_ORGANIZATION_ID: z.string().min(1),
  NEXT_PUBLIC_CAL_REDIRECT_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL: z.string().url().default('http://localhost:3000/booking-success'),
  NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL: z.string().url().default('http://localhost:3000/booking-cancelled'),
  NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL: z.string().url().default('http://localhost:3000/booking-rescheduled'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_PROJECT_ID: z.string().min(1).optional(),

  // Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().nullable().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().nullable().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PRICE_ID: z.string().min(1),

  // Zoom
  ZOOM_SDK_KEY: z.string().min(1),
  ZOOM_SDK_SECRET: z.string().min(1),
  ZOOM_ACCESS_TOKEN: z.string().min(1).optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),

  // Email
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM_NAME: z.string().min(1),
  EMAIL_FROM_ADDRESS: z.string().email(),

  // Security
  CRON_SECRET: z.string().min(1),

})

// Validate and export environment variables
export const env = envSchema.parse({
  // App Configuration
  NEXT_PUBLIC_USE_MOCK_CALENDAR: process.env.NEXT_PUBLIC_USE_MOCK_CALENDAR,
  NEXT_PUBLIC_MOCK_CALENDAR_SCENARIO: process.env.NEXT_PUBLIC_MOCK_CALENDAR_SCENARIO,
  FRONTEND_URL: process.env.FRONTEND_URL,

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,

  // Cal.com
  NEXT_PUBLIC_CAL_API_KEY: process.env.NEXT_PUBLIC_CAL_API_KEY,
  NEXT_PUBLIC_CAL_CLIENT_ID: process.env.NEXT_PUBLIC_CAL_CLIENT_ID,
  CAL_CLIENT_SECRET: process.env.CAL_CLIENT_SECRET,
  NEXT_PUBLIC_CAL_WEBHOOK_SECRET: process.env.NEXT_PUBLIC_CAL_WEBHOOK_SECRET,
  NEXT_PUBLIC_CAL_ORGANIZATION_ID: process.env.NEXT_PUBLIC_CAL_ORGANIZATION_ID,
  NEXT_PUBLIC_CAL_REDIRECT_URL: process.env.NEXT_PUBLIC_CAL_REDIRECT_URL,
  NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL,
  NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL,
  NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL,

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,

  // Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || null,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,

  // Zoom
  ZOOM_SDK_KEY: process.env.ZOOM_SDK_KEY,
  ZOOM_SDK_SECRET: process.env.ZOOM_SDK_SECRET,
  ZOOM_ACCESS_TOKEN: process.env.ZOOM_ACCESS_TOKEN,

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,

  // Security
  CRON_SECRET: process.env.CRON_SECRET,
}) 