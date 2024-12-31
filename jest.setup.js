import '@testing-library/jest-dom'

// Mock window.Calendly
window.Calendly = {
  initInlineWidget: jest.fn(),
}

// Mock process.env
process.env = {
  ...process.env,
  CALENDLY_API_TOKEN: 'mock-token',
  NEXT_PUBLIC_CALENDLY_API_KEY: 'mock-public-key',
} 