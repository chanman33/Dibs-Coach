// Environment variable validation
if (!process.env.CALENDLY_CLIENT_ID || !process.env.CALENDLY_CLIENT_SECRET || !process.env.CALENDLY_WEBHOOK_SECRET) {
  throw new Error('Missing required Calendly environment variables')
}

const MOCK_SERVER_BASE = 'https://stoplight.io/mocks/calendly/api-docs/591407'

// Core configuration
export const CALENDLY_CONFIG = {
  // API Configuration
  api: {
    baseUrl: process.env.NODE_ENV === 'development' 
      ? `${MOCK_SERVER_BASE}`
      : 'https://api.calendly.com',
    version: 'v2'
  },

  // OAuth Configuration  
  oauth: {
    // Always use real Calendly OAuth endpoints
    baseUrl: 'https://calendly.com',
    authorizePath: '/oauth/authorize',
    tokenPath: '/oauth/token',
    clientId: process.env.CALENDLY_CLIENT_ID,
    clientSecret: process.env.CALENDLY_CLIENT_SECRET,
    redirectUri: process.env.CALENDLY_REDIRECT_URI
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.CALENDLY_WEBHOOK_SECRET
  },

  // Default Headers
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NODE_ENV === 'development' && {
      'Prefer': 'code=200, dynamic=true'
    })
  }
}

// Helper to check if we're in development/mock mode
export const isDevelopment = process.env.NODE_ENV === 'development' 