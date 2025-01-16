export const MOCK_DATA = {
  'users/me': {
    resource: {
      uri: 'https://api.calendly.com/users/mock-user',
      name: 'Mock User',
      slug: 'mock-user',
      email: 'mock@example.com',
      scheduling_url: 'https://calendly.com/mock-user',
      timezone: 'UTC',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_organization: 'https://api.calendly.com/organizations/MOCK-ORG'
    }
  },
  'event_types': {
    collection: [
      {
        uri: 'https://api.calendly.com/event_types/mock-event-type',
        name: 'Mock Meeting',
        active: true,
        slug: 'mock-meeting',
        scheduling_url: 'https://calendly.com/mock-user/mock-meeting',
        duration: 30,
        kind: 'solo',
        pooling_type: null,
        type: 'StandardEventType',
        color: '#0088ff',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      count: 1,
      next_page: null,
      previous_page: null,
      next_page_token: null,
      previous_page_token: null
    }
  }
} 