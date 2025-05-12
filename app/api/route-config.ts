// Configuration options for Next.js API routes
// This helps prevent static generation errors for dynamic routes

// Force routes to be dynamic (server-rendered only)
export const dynamicConfig = {
  dynamic: 'force-dynamic'
};

// Export as named constants for reuse
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Optional: Use edge runtime for better performance 