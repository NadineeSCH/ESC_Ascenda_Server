// test/unit_tests/paymentService.unit.test.js

// Mock stripe BEFORE requiring paymentService
const mockCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: mockCreate
    }
  }));
});

// Mock User model
const User = require('../../models/User');
jest.mock('../../models/User');

// Now require the service after mocking stripe
const paymentService = require('../../service/paymentService');

describe('paymentService.createPaymentIntent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw error if amount is invalid', async () => {
    await expect(paymentService.createPaymentIntent({
      amount: 0,
      customerId: 'cus_123',
      userId: 'user_123',
      address: 'SG'
    })).rejects.toThrow('Invalid amount.');
  });

  test('should throw error if customerId is missing', async () => {
    await expect(paymentService.createPaymentIntent({
      amount: 1000,
      userId: 'user_123',
      address: 'SG'
    })).rejects.toThrow('Missing Stripe customer ID.');
  });

  test('should throw error if userId is missing', async () => {
    await expect(paymentService.createPaymentIntent({
      amount: 1000,
      customerId: 'cus_123',
      address: 'SG'
    })).rejects.toThrow('Missing user ID.');
  });

  test('should throw error if user not found', async () => {
    User.findById.mockResolvedValue(null);

    await expect(paymentService.createPaymentIntent({
      amount: 1000,
      customerId: 'cus_123',
      userId: 'user_123',
      address: 'SG'
    })).rejects.toThrow('User not found');
  });

  test('should create payment intent successfully', async () => {
    const fakeUser = { address: '123 Street' };
    User.findById.mockResolvedValue(fakeUser);

    mockCreate.mockResolvedValue({ client_secret: 'secret_123' });

    const result = await paymentService.createPaymentIntent({
      amount: 1000,
      customerId: 'cus_123',
      userId: 'user_123',
      address: 'SG'
    });

    expect(result).toBe('secret_123');
    expect(mockCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'sgd',
      customer: 'cus_123',
      automatic_payment_methods: { enabled: true },
      metadata: { billing_address: '123 Street' }
    });
  });

  test('should handle Stripe error correctly', async () => {
    const fakeUser = { address: '123 Street' };
    User.findById.mockResolvedValue(fakeUser);

    const stripeError = new Error('Stripe failure');
    mockCreate.mockRejectedValue(stripeError);

    await expect(paymentService.createPaymentIntent({
      amount: 1000,
      customerId: 'cus_123',
      userId: 'user_123',
      address: 'SG'
    })).rejects.toThrow('Stripe failure');
  });
});
