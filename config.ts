const config = {
  auth: {
    enabled: true,
    clerkPrimaryColor: '#6c47ff',
  },
  payments: {
    enabled: true,
  },
  roles: {
    enabled: true,
  },
  development: {
    mockData: {
      // Calendar mocking has been removed to ensure only live API usage
      // Add other mock data toggles here as needed
    }
  }
};

export default config;
