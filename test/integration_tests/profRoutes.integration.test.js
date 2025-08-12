const request = require("supertest");
const express = require("express");
const profRoutes = require("../../routes/profRoutes");

jest.mock("../../controller/profController", () => ({
  getProfile: jest.fn((req, res) => res.json({ mocked: "getProfile" })),
  updateProfile: jest.fn((req, res) => res.json({ mocked: "updateProfile" })),
  deleteAccount: jest.fn((req, res) => res.json({ mocked: "deleteAccount" })),
  getPurchaseHistory: jest.fn((req, res) => res.json({ mocked: "getPurchaseHistory" })),
}));

const authenticateToken = require("../../middleware/authMiddleware");
jest.mock("../../middleware/authMiddleware", () => jest.fn((req, res, next) => next()));

describe("profRoutes Integration Test - routes + middleware", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/profile", profRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /profile/get calls controller.getProfile", async () => {
    const res = await request(app).get("/profile/get").set("Authorization", "Bearer mocktoken");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mocked: "getProfile" });
  });

  it("PATCH /profile/patch calls controller.updateProfile", async () => {
    const res = await request(app).patch("/profile/patch").send({ name: "new" }).set("Authorization", "Bearer mocktoken");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mocked: "updateProfile" });
  });

  it("GET /profile/history calls controller.getPurchaseHistory", async () => {
    const res = await request(app).get("/profile/history").set("Authorization", "Bearer mocktoken");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mocked: "getPurchaseHistory" });
  });

  it("DELETE /profile/delete calls controller.deleteAccount", async () => {
    const res = await request(app).delete("/profile/delete").set("Authorization", "Bearer mocktoken");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mocked: "deleteAccount" });
  });
});
