const stripeCustomersUpdateMock = jest.fn();
const stripeCustomersDelMock = jest.fn();
const stripeChargesListMock = jest.fn();

const mockStripeInstance = {
  customers: {
    update: stripeCustomersUpdateMock,
    del: stripeCustomersDelMock,
  },
  charges: {
    list: stripeChargesListMock,
  },
};

jest.mock("stripe", () => {
  return jest.fn(() => mockStripeInstance);
});

jest.mock("../../models/User", () => {
  const originalModule = jest.requireActual("../../models/User");

  return {
    ...originalModule,
    findById: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        _id: "123",
        name: "Test User",
        email: "test@example.com",
        stripeCustomerId: "cus_mock123",
      }),
    })),
    findByIdAndUpdate: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        _id: "123",
        name: "Updated User",
      }),
    })),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
  };
});

// Import profService AFTER mocks are set up
const {
  getProfile,
  updateProfile,
  getPurchaseHistory,
  deleteAccount,
} = require("../../service/profService");

const User = require("../../models/User");
const stripe = require("stripe")();

describe("profService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user profile without sensitive fields", async () => {
      const result = await getProfile("123");

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual({
        _id: "123",
        name: "Test User",
        email: "test@example.com",
        stripeCustomerId: "cus_mock123",
      });
    });

    it("should throw error if user not found", async () => {
      User.findById.mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      await expect(getProfile("invalid_id")).rejects.toThrow("User not found");
    });
  });

  describe("updateProfile", () => {
    it("should update only valid fields and call Stripe if needed", async () => {
      const updates = {
        email: "new@example.com",
        phone: "1234567890",
        address: "123 Main St",
      };
      const result = await updateProfile("123", "cus_mock123", updates);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        updates,
        { new: true, runValidators: true }
      );
      expect(stripeCustomersUpdateMock).toHaveBeenCalledWith("cus_mock123", {
        email: "new@example.com",
        phone: "1234567890",
        address: { line1: "123 Main St" },
      });
      expect(result).toEqual({
        _id: "123",
        name: "Updated User",
      });
    });

    it("should throw error for invalid fields", async () => {
      const updates = { invalidField: "value" };

      await expect(
        updateProfile("123", "cus_mock123", updates)
      ).rejects.toThrow("Invalid fields: invalidField");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(stripeCustomersUpdateMock).not.toHaveBeenCalled();
    });

    it("should skip Stripe call if no Stripe-relevant fields are updated", async () => {
      const updates = { name: "New Name" };
      const result = await updateProfile("123", "cus_mock123", updates);

      expect(stripeCustomersUpdateMock).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        updates,
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        _id: "123",
        name: "Updated User",
      });
    });
  });

  describe("getPurchaseHistory", () => {
    it("should format Stripe charges correctly", async () => {
      stripeChargesListMock.mockResolvedValue({
        data: [
          {
            id: "ch_123",
            amount: 1000,
            currency: "usd",
            created: 1234567890,
            description: "Test payment",
            status: "succeeded",
            receipt_url: "https://receipt.example.com",
            metadata: { orderId: "order_1" },
          },
        ],
      });

      const result = await getPurchaseHistory("cus_mock123");

      expect(stripeChargesListMock).toHaveBeenCalledWith({
        customer: "cus_mock123",
        limit: 100,
        expand: ["data.invoice"],
      });

      expect(result).toEqual([
        {
          id: "ch_123",
          amount: 1000,
          currency: "usd",
          created: new Date(1234567890 * 1000),
          description: "Test payment",
          status: "succeeded",
          receipt_url: "https://receipt.example.com",
          data: { orderId: "order_1" },
        },
      ]);
    });

    it("should throw error when Stripe API fails", async () => {
      stripeChargesListMock.mockRejectedValueOnce(new Error("Stripe API down"));

      await expect(
        getPurchaseHistory("cus_mock123")
      ).rejects.toThrow("Failed to retrieve purchase history");
    });
  });

  describe("deleteAccount", () => {
    it("should delete from both Stripe and MongoDB", async () => {
      await deleteAccount("123", "cus_mock123");

      expect(stripeCustomersDelMock).toHaveBeenCalledWith("cus_mock123");
      expect(User.findByIdAndDelete).toHaveBeenCalledWith("123");
    });
  });
});
