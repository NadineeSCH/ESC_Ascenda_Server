const request = require("supertest");
const express = require("express");

const mockProfController = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  getPurchaseHistory: jest.fn(),
  deleteAccount: jest.fn()
};

const mockAuthMiddleware = jest.fn((req, res, next) => {
  req.user = { 
    _id: "123", 
    name: "Test User",
    email: "test@example.com",
    stripeCustomerId: "cus_mock123" 
  };
  next();
});

jest.mock("../../controller/profController", () => mockProfController);
jest.mock("../../middleware/authMiddleware", () => mockAuthMiddleware);

const profRoutes = require("../../routes/profRoutes");

describe("profRoutes Unit Tests", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/profile", profRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProfController.getProfile.mockImplementation((req, res) => 
      res.status(200).json(req.user));
    
    mockProfController.updateProfile.mockImplementation((req, res) => 
      res.status(200).json({ ...req.user, ...req.body }));
    
    mockProfController.getPurchaseHistory.mockImplementation((req, res) => 
      res.status(200).json([]));
    
    mockProfController.deleteAccount.mockImplementation((req, res) => 
      res.status(204).send());
  });

  describe("GET /profile/get", () => {
    it("should return user profile with 200 status", async () => {
      const response = await request(app)
        .get("/profile/get")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        _id: "123",
        name: "Test User",
        email: "test@example.com",
        stripeCustomerId: "cus_mock123"
      });
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockProfController.getProfile).toHaveBeenCalled();
    });
  });

  describe("PATCH /profile/patch", () => {
    it("should update profile with 200 status", async () => {
      const updatedData = { name: "Updated Name" };
      
      const response = await request(app)
        .patch("/profile/patch")
        .set("Authorization", "Bearer validtoken")
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
      expect(mockProfController.updateProfile).toHaveBeenCalled();
    });
  });

  describe("GET /profile/history", () => {
    it("should return purchase history with 200 status", async () => {
      mockProfController.getPurchaseHistory.mockImplementation((req, res) => {
        res.status(200).json([{ id: "ch_1", amount: 1000 }]);
      });

      const response = await request(app)
        .get("/profile/history")
        .set("Authorization", "Bearer validtoken");

      expect(response.body).toEqual([{ id: "ch_1", amount: 1000 }]);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("DELETE /profile/delete", () => {
    it("should delete account with 204 status", async () => {
      const response = await request(app)
        .delete("/profile/delete")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(204);
      expect(mockProfController.deleteAccount).toHaveBeenCalled();
    });
  });

  describe("Error Cases", () => {
    it("should return 500 if controller throws error", async () => {
      mockProfController.getProfile.mockImplementation((req, res) => 
        res.status(500).json({ error: "Server error" }));

      const response = await request(app)
        .get("/profile/get")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Server error");
    });
  });
});