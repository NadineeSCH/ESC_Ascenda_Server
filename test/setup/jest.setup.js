// __tests__/setup/jest.setup.js
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default environment variables for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key';
process.env.NODE_ENV = 'test';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  // Suppress console.log in tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
  }
});

// Clean up after all tests
afterAll(() => {
  // Restore console.log
  if (console.log.mockRestore) {
    console.log.mockRestore();
  }
});