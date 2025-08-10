// test/debug/stripe.test.js
// Simple test to verify Stripe mocking works correctly

const stripe = require('stripe');

// Mock Stripe
jest.mock('stripe');

describe('Stripe Mocking Debug', () => {
  let mockStripe;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up Stripe mock
    mockStripe = {
      customers: {
        create: jest.fn(),
        del: jest.fn()
      }
    };
    
    // Mock the stripe function to return our mock object
    stripe.mockImplementation(() => mockStripe);
  });

  test('should properly mock Stripe customer creation', async () => {
    // Arrange
    const mockCustomer = { id: 'cus_test123' };
    mockStripe.customers.create.mockResolvedValue(mockCustomer);

    // Act
    const stripeInstance = stripe('sk_test_fake_key');
    const result = await stripeInstance.customers.create({
      name: 'Test User',
      email: 'test@example.com'
    });

    // Assert
    expect(result).toEqual(mockCustomer);
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  test('should handle Stripe errors correctly', async () => {
    // Arrange
    const stripeError = new Error('Stripe error');
    stripeError.type = 'StripeCardError';
    mockStripe.customers.create.mockRejectedValue(stripeError);

    // Act & Assert
    const stripeInstance = stripe('sk_test_fake_key');
    await expect(stripeInstance.customers.create({})).rejects.toThrow('Stripe error');
    
    // Verify error has the correct type
    try {
      await stripeInstance.customers.create({});
    } catch (error) {
      expect(error.type).toBe('StripeCardError');
    }
  });
});