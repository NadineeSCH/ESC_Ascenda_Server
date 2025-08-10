const express = require("express");
const request = require("supertest");

jest.mock("../../controller/authController", () => ({
  signup: jest.fn((req, res) => res.sendStatus(200)),
  login: jest.fn((req, res) => res.sendStatus(200)),
  verifyOtp: jest.fn((req, res) => res.sendStatus(200)),
}));

const authController = require("../../controller/authController");
const authRoutes = require("../../routes/authRoutes");

describe("authRoutes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/", authRoutes);
  });

  it("POST /signup calls authController.signup", async () => {
    await request(app).post("/signup").send({});
    expect(authController.signup).toHaveBeenCalled();
  });

  it("POST /login calls authController.login", async () => {
    await request(app).post("/login").send({});
    expect(authController.login).toHaveBeenCalled();
  });

  it("POST /verify-otp calls authController.verifyOtp", async () => {
    await request(app).post("/verify-otp").send({});
    expect(authController.verifyOtp).toHaveBeenCalled();
  });
});
