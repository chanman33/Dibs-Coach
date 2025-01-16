// Environment variable validation
if (!process.env.CALENDLY_CLIENT_ID || !process.env.CALENDLY_CLIENT_SECRET || !process.env.CALENDLY_WEBHOOK_SECRET) {
  throw new Error('Missing required Calendly environment variables')
}

// Core configuration
export const CALENDLY_CONFIG = {
  // API Configuration
  api: {
    baseUrl: 'https://api.calendly.com',
    version: 'v2'
  },

  // OAuth Configuration  
  oauth: {
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
    'Content-Type': 'application/json'
  }
}

// Helper to check if we're in production mode
export const isProduction = process.env.NODE_ENV === 'production' 