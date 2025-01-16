import config from '@/config'

export const CALENDLY_CONFIG = {
  // Base URLs - use mock server for API calls in sandbox mode
  API_BASE_URL: config.calendly.sandbox.enabled
    ? 'https://stoplight.io/mocks/calendly/api-docs/395'
    : 'https://api.calendly.com',
  
  // API Versions
  API_VERSION: 'v2',
  
  // OAuth2 Settings - always use real Calendly OAuth endpoints
  OAUTH_BASE_URL: 'https://auth.calendly.com/oauth',
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    ...(config.calendly.sandbox.enabled && {
      // Add required headers for mock server
      'Prefer': 'code=200, dynamic=true'
    })
  },

  // Client Configuration
  CLIENT: {
    id: config.calendly.sandbox.enabled
      ? config.calendly.sandbox.clientId
      : config.calendly.production.clientId,
    secret: config.calendly.sandbox.enabled
      ? undefined // Sandbox mode doesn't use client secret
      : config.calendly.production.clientSecret,
  },

  // Environment Settings
  IS_SANDBOX: config.calendly.sandbox.enabled,
  CURRENT_MODE: config.calendly.getCurrentMode(),
  
  // Mock Server Settings
  MOCK_SERVER: {
    enabled: config.calendly.sandbox.enabled,
    headers: {
      'Prefer': 'code=200, dynamic=true'
    }
  }
} 