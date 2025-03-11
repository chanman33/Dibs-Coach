// Rate limiting configuration
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 50;

const requestTimestamps: number[] = [];

export function checkRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_DURATION;
  
  // Remove timestamps outside the current window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
}

// Rate limit by user tier
export function checkUserTierRateLimit(tier: 'FREE' | 'PREMIUM'): boolean {
  const maxRequests = tier === 'PREMIUM' ? 100 : 20;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_DURATION;
  
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= maxRequests) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
} 