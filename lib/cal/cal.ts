import { env } from '@/lib/env';

// Fallback to direct process.env access to ensure values are available
const getEnvValue = (key: string, defaultValue = ''): string => {
  // Try direct environment access as fallback
  return process.env[key] || defaultValue;
};

// Get the base frontend URL
const frontendUrl = getEnvValue('FRONTEND_URL', 'http://localhost:3000');

export const calConfig = {
  clientId: getEnvValue('NEXT_PUBLIC_CAL_CLIENT_ID', env.NEXT_PUBLIC_CAL_CLIENT_ID || ''),
  clientSecret: getEnvValue('CAL_CLIENT_SECRET', ''),
  organizationId: getEnvValue('NEXT_PUBLIC_CAL_ORGANIZATION_ID', env.NEXT_PUBLIC_CAL_ORGANIZATION_ID || ''),
  // Base redirect URL for Cal.com - must match exactly what's configured in Cal.com
  redirectUrl: `${frontendUrl}/callback`,
  // Dynamic booking URLs
  bookingUrls: {
    success: getEnvValue('NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL', env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL),
    cancel: getEnvValue('NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL', env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL),
    reschedule: getEnvValue('NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL', env.NEXT_PUBLIC_CAL_BOOKING_RESCHEDULE_URL),
  },
} as const;

// Utility function to generate dynamic Cal.com URLs
export function getCalUrls(customPath?: string) {
  return {
    ...calConfig.bookingUrls,
    // Allow for custom redirect paths if needed
    redirect: customPath ? `${frontendUrl}${customPath}` : calConfig.redirectUrl,
  };
}

// Log configuration to aid debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[CAL_CONFIG]', {
    isConfigured: !!(calConfig.clientId && calConfig.clientSecret && calConfig.organizationId),
    clientId: calConfig.clientId ? 'Present' : 'Missing',
    clientSecret: calConfig.clientSecret ? 'Present' : 'Missing',
    organizationId: calConfig.organizationId ? 'Present' : 'Missing',
    redirectUrl: calConfig.redirectUrl
  });
}

// Type safety
export type CalConfig = typeof calConfig;
export type CalUrls = ReturnType<typeof getCalUrls>; 