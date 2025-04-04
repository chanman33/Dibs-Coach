// Central export file for all Cal.com utilities
// This helps organize imports and prevents circular dependencies

// Token expiration utility (synchronous function)
export function isTokenExpiredOrExpiringSoon(
  expiresAt: string | null | undefined,
  bufferMinutes = 5
): { isExpired: boolean; isExpiringImminent: boolean } {
  if (!expiresAt) {
    return { isExpired: true, isExpiringImminent: true };
  }

  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    // Check if expiry date is valid
    if (isNaN(expiryDate.getTime())) {
      return { isExpired: true, isExpiringImminent: true };
    }
    
    // Check if token is already expired
    const isExpired = expiryDate <= now;
    
    // Check if token will expire soon
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
    const isExpiringImminent = !isExpired && 
                             (expiryDate.getTime() - now.getTime() < bufferTime);
    
    return { isExpired, isExpiringImminent };
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error checking token expiration:', error);
    // Default to considering it expired if we can't parse the date
    return { isExpired: true, isExpiringImminent: true };
  }
}

// Export types shared across multiple files
export interface CalTokenInfo {
  isExpired: boolean;
  isExpiringImminent: boolean;
  expiresAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  managedUserId: number | null;
}

export interface TokenRefreshResult {
  success: boolean;
  tokenInfo: CalTokenInfo | null;
  error?: string;
}

// Re-export API utilities for easier imports
export * from './cal-api-utils';

// Server actions are exported directly from their files
// to prevent 'use server' directive issues 