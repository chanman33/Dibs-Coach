const config = {
  auth: {
    enabled: true,
  },
  payments: {
    enabled: false,
  },
  roles: {
    enabled: true,
  },
  development: {
    mockData: {
      calendar: process.env.NEXT_PUBLIC_USE_MOCK_CALENDAR === 'true',
      // Add other mock data toggles here as needed
    }
  }
};

export default config;
