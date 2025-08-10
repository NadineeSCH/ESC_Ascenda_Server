const validUserData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '91234567', 
  password: 'StrongPass123!',
  address: '123 Main Street, Singapore'
};

const validUserData2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '81234567', 
  password: 'SecurePass456!',
  address: '456 Orchard Road, Singapore'
};

const validUserData3 = {
  name: 'Bob Wilson',
  email: 'bob@example.com',
  phone: '61234567', 
  password: 'MyPassword789!',
  address: '789 Marina Bay, Singapore'
};

const invalidUserDataSets = {
  missingName: {
    email: 'test@example.com',
    phone: '91234567',
    password: 'ValidPass123!',
    address: '123 Test Street'
  },
  missingEmail: {
    name: 'Test User',
    phone: '91234567',
    password: 'ValidPass123!',
    address: '123 Test Street'
  },
  missingPhone: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'ValidPass123!',
    address: '123 Test Street'
  },
  missingPassword: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '91234567',
    address: '123 Test Street'
  },
  missingAddress: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '91234567',
    password: 'ValidPass123!'
  },
  emptyFields: {
    name: '',
    email: '  ',
    phone: '91234567',
    password: 'ValidPass123!',
    address: '   '
  },
  invalidPhone: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '12345678', // Invalid: doesn't start with 6, 8, or 9
    password: 'ValidPass123!',
    address: '123 Test Street'
  },
  shortPhone: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9123456', // Invalid: only 7 digits
    password: 'ValidPass123!',
    address: '123 Test Street'
  }
};

const mockStripeCustomer = {
  id: 'cus_test_123456',
  object: 'customer',
  created: Math.floor(Date.now() / 1000),
  email: 'john@example.com',
  name: 'John Doe',
  phone: '91234567'
};

const mockStripeErrors = {
  cardError: {
    type: 'StripeCardError',
    message: 'Your card was declined.'
  },
  rateLimitError: {
    type: 'StripeRateLimitError',
    message: 'Too many requests made to the API too quickly'
  },
  invalidRequestError: {
    type: 'StripeInvalidRequestError',
    message: 'Invalid request parameters'
  },
  apiError: {
    type: 'StripeAPIError',
    message: 'An error occurred with our API'
  },
  connectionError: {
    type: 'StripeConnectionError',
    message: 'Network communication with Stripe failed'
  },
  authenticationError: {
    type: 'StripeAuthenticationError',
    message: 'Authentication failed'
  }
};

const loginCredentials = {
  valid: {
    email: 'john@example.com',
    password: 'StrongPass123!'
  },
  validCaseInsensitive: {
    email: 'JOHN@EXAMPLE.COM',
    password: 'StrongPass123!'
  },
  invalidEmail: {
    email: 'nonexistent@example.com',
    password: 'StrongPass123!'
  },
  invalidPassword: {
    email: 'john@example.com',
    password: 'WrongPassword123!'
  },
  missingEmail: {
    password: 'StrongPass123!'
  },
  missingPassword: {
    email: 'john@example.com'
  },
  emptyEmail: {
    email: '',
    password: 'StrongPass123!'
  },
  whitespaceEmail: {
    email: '   ',
    password: 'StrongPass123!'
  }
};

module.exports = {
  validUserData,
  validUserData2,
  validUserData3,
  invalidUserDataSets,
  mockStripeCustomer,
  mockStripeErrors,
  loginCredentials
};