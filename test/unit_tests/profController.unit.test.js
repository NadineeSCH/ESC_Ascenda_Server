const {
  getProfile,
  updateProfile,
  getPurchaseHistory,
  deleteAccount,
} = require("../../controller/profController");
const profService = require("../../service/profService");

jest.mock("../../service/profService");

describe("profController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { userId: "123" },
      body: { name: "Updated Name" },
      user: { 
        _id: "123",
        stripeCustomerId: "cus_mock123" 
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      const mockUser = { 
        _id: "123", 
        name: "Test User",
        email: "test@example.com"
      };
      profService.getProfile.mockResolvedValue(mockUser);

      await getProfile(req, res);

      expect(profService.getProfile).toHaveBeenCalledWith("123");
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle errors", async () => {
      profService.getProfile.mockRejectedValue(new Error("User not found"));

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("updateProfile", () => {
    it("should update profile and return updated user", async () => {
      const mockUpdatedUser = { 
        _id: "123", 
        name: "Updated Name" 
      };
      profService.updateProfile.mockResolvedValue(mockUpdatedUser);

      await updateProfile(req, res);

      expect(profService.updateProfile).toHaveBeenCalledWith(
        "123",
        "cus_mock123",
        { name: "Updated Name" }
      );
      expect(res.json).toHaveBeenCalledWith(mockUpdatedUser);
    });

    it("should handle errors", async () => {
      profService.updateProfile.mockRejectedValue(new Error("Update failed"));

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
    });
  });

  describe("getPurchaseHistory", () => {
    it("should return purchase history", async () => {
      const mockHistory = [{
        id: "ch_123",
        amount: 1000,
        status: "succeeded"
      }];
      profService.getPurchaseHistory.mockResolvedValue(mockHistory);

      await getPurchaseHistory(req, res);

      expect(profService.getPurchaseHistory).toHaveBeenCalledWith("cus_mock123");
      expect(res.json).toHaveBeenCalledWith(mockHistory);
    });

    it("should handle errors", async () => {
      profService.getPurchaseHistory.mockRejectedValue(new Error("Stripe error"));

      await getPurchaseHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Stripe error" });
    });
  });

  describe("deleteAccount", () => {
    it("should delete account successfully", async () => {
      profService.deleteAccount.mockResolvedValue(true);

      await deleteAccount(req, res);

      expect(profService.deleteAccount).toHaveBeenCalledWith(
        "123",
        "cus_mock123"
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
    });

    it("should handle errors", async () => {
      profService.deleteAccount.mockRejectedValue(new Error("Delete failed"));

      await deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account deletion failed',
        details: "Delete failed"
      });
    });
  });
});
