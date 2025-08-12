const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const profController = require("../../controller/profController");
const profService = require("../../service/profService");
const User = require("../../models/User");

jest.mock("../../service/profService");
jest.mock("../../models/User");

describe("profController Integration Test", () => {
  let app;
  const testUserId = "user123";
  const testStripeCustomerId = "cus_abc123";

  const token = jwt.sign({ _id: testUserId }, process.env.JWT_SECRET || "testsecret");

  beforeAll(() => {
    User.findById.mockImplementation((id) => {
      if (id === testUserId) {
        return Promise.resolve({
          _id: testUserId,
          stripeCustomerId: testStripeCustomerId,
        });
      }
      return Promise.resolve(null);
    });
  });

  beforeEach(() => {
    const authenticateToken = require("../../middleware/authMiddleware");
    app = express();
    app.use(express.json());

    app.get("/profile/get", authenticateToken, profController.getProfile);
    app.patch("/profile/patch", authenticateToken, profController.updateProfile);
    app.get("/profile/history", authenticateToken, profController.getPurchaseHistory);
    app.delete("/profile/delete", authenticateToken, profController.deleteAccount);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /profile/get returns profile", async () => {
    const fakeProfile = { name: "John" };
    profService.getProfile.mockResolvedValue(fakeProfile);

    const res = await request(app).get("/profile/get").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeProfile);
    expect(profService.getProfile).toHaveBeenCalledWith(testUserId);
  });

  it("PATCH /profile/patch updates profile", async () => {
    const updates = { name: "New Name" };
    const updated = { ...updates };
    profService.updateProfile.mockResolvedValue(updated);

    const res = await request(app)
      .patch("/profile/patch")
      .set("Authorization", `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(profService.updateProfile).toHaveBeenCalledWith(testUserId, testStripeCustomerId, updates);
  });

  it("GET /profile/history returns purchase history", async () => {
    const history = [{ id: "ch_1", amount: 1000 }];
    profService.getPurchaseHistory.mockResolvedValue(history);

    const res = await request(app).get("/profile/history").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(history);
    expect(profService.getPurchaseHistory).toHaveBeenCalledWith(testStripeCustomerId);
  });

  it("DELETE /profile/delete deletes account", async () => {
    profService.deleteAccount.mockResolvedValue();

    const res = await request(app).delete("/profile/delete").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Account deleted successfully" });
    expect(profService.deleteAccount).toHaveBeenCalledWith(testUserId, testStripeCustomerId);
  });
});
