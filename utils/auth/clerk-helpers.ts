'use server';

import { NextRequest } from 'next/server';

/**
 * Helper function to safely get headers for Clerk in Next.js 15+
 * This helps work around the `headers()` should be awaited error
 */
export async function getSecureHeaders() {
  try {
    // Return empty headers object to avoid static generation errors
    // related to headers() usage during build time
    return {};
  } catch (error) {
    console.error('[CLERK_HELPER] Error getting headers:', error);
    return {};
  }
}

/**
 * Creates a safe request object for Clerk authentication
 */
export async function createSafeRequest(url: string = 'https://placeholder.com') {
  try {
    const safeHeaders = await getSecureHeaders();
    return new NextRequest(url, { headers: safeHeaders });
  } catch (error) {
    console.error('[CLERK_HELPER] Error creating request:', error);
    return new NextRequest(url);
  }
} 