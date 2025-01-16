const config = {
  auth: {
    enabled: true,
  },
  payments: {
    enabled: true,
  },
  roles: {
    enabled: false,
  },
  calendly: {
    sandbox: {
      enabled: true,
      clientId: 'yg_LJx9do9N0qOYeZH6iTQj6vfMA8w2OsPpY6qk7AdI',
    },
    production: {
      enabled: false,
      clientId: process.env.CALENDLY_CLIENT_ID,
      clientSecret: process.env.CALENDLY_CLIENT_SECRET,
    },
    getCurrentMode() {
      return this.sandbox.enabled ? 'sandbox' : 'production';
    }
  }
};

config.calendly.production.enabled = !config.calendly.sandbox.enabled;

export default config;
