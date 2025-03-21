import { env } from '@/lib/env';

export const calConfig = {
  apiKey: env.NEXT_PUBLIC_CAL_API_KEY,
  // Base redirect URL for Cal.com
  redirectUrl: env.NEXT_PUBLIC_CAL_REDIRECT_URL,
  // Dynamic booking URLs
  bookingUrls: {
    success: env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL,
    cancel: env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL,
    reschedule: env.NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL,
  },
} as const;

// Utility function to generate dynamic Cal.com URLs
export function getCalUrls(customPath?: string) {
  return {
    ...calConfig.bookingUrls,
    // Allow for custom redirect paths if needed
    redirect: customPath ? `${env.FRONTEND_URL}${customPath}` : calConfig.redirectUrl,
  };
}

// Type safety
export type CalConfig = typeof calConfig;
export type CalUrls = ReturnType<typeof getCalUrls>; 