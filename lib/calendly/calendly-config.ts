export const CALENDLY_CONFIG = {
  // Base URLs
  API_BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'https://stoplight.io/mocks/calendly/api-docs/591407'
    : 'https://api.calendly.com',
  
  // API Versions
  API_VERSION: 'v2',
  
  // OAuth2 Settings
  OAUTH_BASE_URL: process.env.NODE_ENV === 'development'
    ? 'https://stoplight.io/mocks/calendly/api-docs/591407/oauth'
    : 'https://auth.calendly.com/oauth',
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },

  // Development Mode Settings
  IS_SANDBOX: process.env.NODE_ENV === 'development',
  
  // Mock Server Settings (for development)
  MOCK_SERVER: {
    enabled: process.env.NODE_ENV === 'development',
    // Add any specific mock server settings here
    headers: {
      Prefer: 'code=200, dynamic=true'
    }
  }
} 