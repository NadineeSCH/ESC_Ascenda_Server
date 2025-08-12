const stripe = require("stripe");
const profService = require("../../service/profService");
const User = require("../../models/User");

jest.mock("stripe", () => {
  const chargesListMock = jest.fn();
  const customersUpdateMock = jest.fn();
  const customersDelMock = jest.fn();

  const StripeMock = jest.fn(() => ({
    charges: { list: chargesListMock },
    customers: {
      update: customersUpdateMock,
      del: customersDelMock,
    },
  }));

  // Expose mocks for assertions
  StripeMock._chargesListMock = chargesListMock;
  StripeMock._customersUpdateMock = customersUpdateMock;
  StripeMock._customersDelMock = customersDelMock;

  return StripeMock;
});

// Mock User model methods with chained select where needed
User.findById = jest.fn();
User.findByIdAndUpdate = jest.fn();
User.findByIdAndDelete = jest.fn();

describe("profService Integration Test", () => {
  const testUser = {
    _id: "user123",
    name: "Test User",
    email: "test@example.com",
    phone: "12345678",
    address: "123 Test St",
    stripeCustomerId: "cus_test123",
  };

  const stripeInstance = stripe();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock findById to return user with chained select()
    User.findById.mockImplementation(() => ({
      select: jest.fn(() => Promise.resolve(testUser)),
    }));

    // Mock findByIdAndUpdate to return user with chained select()
    User.findByIdAndUpdate.mockImplementation(() => ({
      select: jest.fn(() => Promise.resolve(testUser)),
    }));

    // Mock findByIdAndDelete
    User.findByIdAndDelete.mockResolvedValue(true);

    // Mock Stripe charges.list()
    stripeInstance.charges.list.mockResolvedValue({
      data: [
        {
          id: "ch_1",
          amount: 1000,
          currency: "sgd",
          created: Math.floor(Date.now() / 1000),
          description: "Test charge",
          status: "succeeded",
          receipt_url: "https://receipt.url",
          metadata: { orderId: "order123" },
        },
      ],
    });

    // Mock Stripe customers.update()
    stripeInstance.customers.update.mockResolvedValue(true);

    // Mock Stripe customers.del()
    stripeInstance.customers.del.mockResolvedValue(true);
  });

  describe("getProfile", () => {
    it("returns user profile", async () => {
      const result = await profService.getProfile(testUser._id);
      expect(User.findById).toHaveBeenCalledWith(testUser._id);
      expect(result).toEqual(testUser);
    });

    it("throws if user not found", async () => {
      User.findById.mockImplementationOnce(() => ({
        select: jest.fn(() => Promise.resolve(null)),
      }));

      await expect(profService.getProfile("nonexistent")).rejects.toThrow("User not found");
    });
  });

  describe("updateProfile", () => {
    it("updates user and stripe customer", async () => {
      const updates = { name: "New Name", email: "newemail@example.com" };
      const result = await profService.updateProfile(testUser._id, testUser.stripeCustomerId, updates);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        testUser._id,
        updates,
        { new: true, runValidators: true }
      );

      expect(stripeInstance.customers.update).toHaveBeenCalledWith(testUser.stripeCustomerId, {
        email: updates.email,
      });

      expect(result).toEqual(testUser);
    });

    it("throws on invalid fields", async () => {
      const updates = { invalidField: "oops" };
      await expect(
        profService.updateProfile(testUser._id, testUser.stripeCustomerId, updates)
      ).rejects.toThrow("Invalid fields: invalidField");
    });
  });

  describe("getPurchaseHistory", () => {
    it("returns formatted charge data", async () => {
      const history = await profService.getPurchaseHistory(testUser.stripeCustomerId);
      expect(stripeInstance.charges.list).toHaveBeenCalledWith({
        customer: testUser.stripeCustomerId,
        limit: 100,
        expand: ["data.invoice"],
      });
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty("id", "ch_1");
    });

    it("throws on Stripe error", async () => {
      stripeInstance.charges.list.mockRejectedValueOnce(new Error("Stripe failure"));
      await expect(profService.getPurchaseHistory(testUser.stripeCustomerId)).rejects.toThrow(
        "Failed to retrieve purchase history"
      );
    });
  });

  describe("deleteAccount", () => {
    it("deletes stripe customer and user", async () => {
      await profService.deleteAccount(testUser._id, testUser.stripeCustomerId);
      expect(stripeInstance.customers.del).toHaveBeenCalledWith(testUser.stripeCustomerId);
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(testUser._id);
    });
  });
});
