// test/integration_tests/paymentService.integration.test.js
const stripe = require("stripe");
const paymentService = require("../../service/paymentService");
const User = require("../../models/User");

// Mock Stripe with deep inspection capabilities
jest.mock("stripe", () => {
  const paymentIntentsCreateMock = jest.fn();
  const StripeMock = jest.fn(() => ({
    paymentIntents: {
      create: paymentIntentsCreateMock,
    },
  }));
  // Expose mock for assertions
  StripeMock._paymentIntentsCreateMock = paymentIntentsCreateMock;
  return StripeMock;
});

// Mock User model
jest.mock("../../models/User");

describe("Payment Service Integration", () => {
  const stripeMock = stripe._paymentIntentsCreateMock;
  const testUser = {
    _id: "user123",
    address: "123 Test St, Singapore"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Silence expected error logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("Successful Payment Intent Creation", () => {
    it("should create payment intent with correct parameters", async () => {
      User.findById.mockResolvedValue(testUser);
      stripeMock.mockResolvedValue({
        client_secret: "pi_test_secret_123",
        id: "pi_test_123"
      });

      const params = {
        amount: 1999, // $19.99 SGD
        customerId: "cus_test_123",
        userId: "user123"
      };

      const result = await paymentService.createPaymentIntent(params);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(stripeMock).toHaveBeenCalledWith({
        amount: 1999,
        currency: "sgd",
        customer: "cus_test_123",
        automatic_payment_methods: { enabled: true },
        metadata: {
          billing_address: testUser.address
        }
      });
      expect(result).toBe("pi_test_secret_123");
    });
  });

  describe("Input Validation", () => {
    it("should reject zero amount", async () => {
      await expect(paymentService.createPaymentIntent({
        amount: 0,
        customerId: "cus_test_123",
        userId: "user123"
      })).rejects.toThrow("Invalid amount.");
    });

    it("should reject negative amount", async () => {
      await expect(paymentService.createPaymentIntent({
        amount: -100,
        customerId: "cus_test_123",
        userId: "user123"
      })).rejects.toThrow("Invalid amount.");
    });

    it("should require customerId", async () => {
      await expect(paymentService.createPaymentIntent({
        amount: 1000,
        userId: "user123"
      })).rejects.toThrow("Missing Stripe customer ID.");
    });

    it("should require userId", async () => {
      await expect(paymentService.createPaymentIntent({
        amount: 1000,
        customerId: "cus_test_123"
      })).rejects.toThrow("Missing user ID.");
    });
  });

  describe("Error Handling", () => {
    it("should handle user not found", async () => {
      User.findById.mockResolvedValue(null);

      await expect(paymentService.createPaymentIntent({
        amount: 1000,
        customerId: "cus_test_123",
        userId: "nonexistent_user"
      })).rejects.toThrow("User not found");
    });

    it("should handle Stripe API errors", async () => {
      User.findById.mockResolvedValue(testUser);
      stripeMock.mockRejectedValue(new Error("Stripe API timeout"));

      await expect(paymentService.createPaymentIntent({
        amount: 1000,
        customerId: "cus_test_123",
        userId: "user123"
      })).rejects.toThrow("Stripe API timeout");
    });

    it("should handle missing user address", async () => {
      const userWithoutAddress = { ...testUser, address: undefined };
      User.findById.mockResolvedValue(userWithoutAddress);
      stripeMock.mockResolvedValue({ client_secret: "pi_test_secret_123" });

      await paymentService.createPaymentIntent({
        amount: 1000,
        customerId: "cus_test_123",
        userId: "user123"
      });

      expect(stripeMock).toHaveBeenCalledWith(expect.objectContaining({
        metadata: {
          billing_address: "No address provided"
        }
      }));
    });
  });
});