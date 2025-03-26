import { z } from 'zod'

const isDevelopment = process.env.NODE_ENV === 'development'
const isClient = typeof window !== 'undefined'

// Create separate schema for client and server
const sharedSchema = {
  // App Configuration
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),

  // Cal.com Client-Side
  NEXT_PUBLIC_CAL_CLIENT_ID: z.string().optional().default(''),
  NEXT_PUBLIC_CAL_REDIRECT_URL: z.string().url().optional(),
  NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL: z.string().url().optional(),
  NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL: z.string().url().optional(),
  NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL: z.string().url().optional(),

  // Supabase Public
  NEXT_PUBLIC_SUPABASE_URL: isDevelopment ? z.string().optional() : z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isDevelopment ? z.string().optional() : z.string().min(1),

  // Stripe Public
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  NEXT_PUBLIC_STRIPE_PRICE_ID: isDevelopment ? z.string().optional() : z.string().min(1),
}

// Server-only variables
const serverOnlySchema = {
  // Clerk Server
  CLERK_SECRET_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  CLERK_WEBHOOK_SECRET: isDevelopment ? z.string().optional() : z.string().min(1),
  
  // Cal.com Server
  CAL_CLIENT_SECRET: z.string().optional().default(''),
  CAL_WEBHOOK_SECRET: z.string().optional().default(''),
  CAL_ORGANIZATION_ID: z.string().optional().default(''),

  // Supabase Server
  SUPABASE_URL: isDevelopment ? z.string().optional() : z.string().url(),
  SUPABASE_SERVICE_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  DATABASE_URL: isDevelopment ? z.string().optional() : z.string().min(1),
  DIRECT_URL: isDevelopment ? z.string().optional() : z.string().min(1),
  SUPABASE_PROJECT_ID: z.string().optional(),

  // Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().nullable().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().nullable().optional(),

  // Stripe Server
  STRIPE_SECRET_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  STRIPE_WEBHOOK_SECRET: isDevelopment ? z.string().optional() : z.string().min(1),

  // Zoom
  ZOOM_SDK_KEY: isDevelopment ? z.string().optional() : z.string().min(1),
  ZOOM_SDK_SECRET: isDevelopment ? z.string().optional() : z.string().min(1),
  ZOOM_ACCESS_TOKEN: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: isDevelopment ? z.string().optional() : z.string().min(1),

  // Email
  SMTP_HOST: isDevelopment ? z.string().optional() : z.string().min(1),
  SMTP_PORT: isDevelopment ? z.coerce.number().optional() : z.coerce.number().int().positive(),
  SMTP_USER: isDevelopment ? z.string().optional() : z.string().min(1),
  SMTP_PASS: isDevelopment ? z.string().optional() : z.string().min(1),
  EMAIL_FROM_NAME: isDevelopment ? z.string().optional() : z.string().min(1),
  EMAIL_FROM_ADDRESS: isDevelopment ? z.string().optional() : z.string().email(),

  // Security
  CRON_SECRET: isDevelopment ? z.string().optional() : z.string().min(1),
}

// Create appropriate schema based on environment
const envSchema = isClient 
  ? z.object(sharedSchema)
  : z.object({
      ...sharedSchema,
      ...serverOnlySchema
    })

// Create a function to generate Cal.com URLs based on FRONTEND_URL
const getCalComUrls = (frontendUrl: string) => {
  const baseUrl = frontendUrl || 'http://localhost:3000';
  return {
    redirectUrl: baseUrl,
    bookingSuccessUrl: `${baseUrl}/booking-success`,
    bookingCancelUrl: `${baseUrl}/booking-cancelled`,
    bookingRescheduleUrl: `${baseUrl}/booking-rescheduled`
  };
};

// Define the environment variable types
type EnvSchema = {
  // App Configuration
  FRONTEND_URL: string;

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: string;

  // Cal.com
  NEXT_PUBLIC_CAL_CLIENT_ID?: string;
  CAL_CLIENT_SECRET?: string;
  CAL_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_CAL_ORGANIZATION_ID?: string;
  NEXT_PUBLIC_CAL_REDIRECT_URL?: string;
  NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL?: string;
  NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL?: string;
  NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL?: string;

  // Supabase
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  DATABASE_URL?: string;
  DIRECT_URL?: string;
  SUPABASE_PROJECT_ID?: string;

  // Redis
  UPSTASH_REDIS_REST_URL?: string | null;
  UPSTASH_REDIS_REST_TOKEN?: string | null;

  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY?: string;
  NEXT_PUBLIC_STRIPE_PRICE_ID?: string;

  // Zoom
  ZOOM_SDK_KEY?: string;
  ZOOM_SDK_SECRET?: string;
  ZOOM_ACCESS_TOKEN?: string;

  // OpenAI
  OPENAI_API_KEY?: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_FROM_ADDRESS?: string;

  // Security
  CRON_SECRET?: string;
};

// Validate and export environment variables
export const env = (() => {
  // Get the frontend URL first
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Generate Cal.com URLs
  const calUrls = getCalComUrls(frontendUrl);
  
  return envSchema.parse({
    // App Configuration
    FRONTEND_URL: frontendUrl,

    // Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,

    // Cal.com OAuth
    NEXT_PUBLIC_CAL_CLIENT_ID: process.env.NEXT_PUBLIC_CAL_CLIENT_ID,
    CAL_CLIENT_SECRET: process.env.CAL_CLIENT_SECRET,
    CAL_ORGANIZATION_ID: process.env.CAL_ORGANIZATION_ID,
    CAL_WEBHOOK_SECRET: process.env.CAL_WEBHOOK_SECRET,
    NEXT_PUBLIC_CAL_REDIRECT_URL: process.env.NEXT_PUBLIC_CAL_REDIRECT_URL || calUrls.redirectUrl,
    NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL || calUrls.bookingSuccessUrl,
    NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL || calUrls.bookingCancelUrl,
    NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL: process.env.NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL || calUrls.bookingRescheduleUrl,

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
  }) as EnvSchema;
})(); 