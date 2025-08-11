// test/unit_tests/paymentRoutes.unit.test.js

const request = require("supertest");
const express = require("express");

// Mocks
jest.mock("../../middleware/authMiddleware", () => jest.fn((req, res, next) => next()));
jest.mock("../../controller/paymentController", () => ({
  createPaymentIntent: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

const authenticateToken = require("../../middleware/authMiddleware");
const paymentController = require("../../controller/paymentController");

// Create app with paymentRoutes mounted
const paymentRoutes = require("../../routes/paymentRoutes");
const app = express();
app.use(express.json());
app.use("/payment", paymentRoutes);

describe("paymentRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call authenticateToken and paymentController.createPaymentIntent on POST /create-payment-intent", async () => {
    const res = await request(app)
      .post("/payment/create-payment-intent")
      .send({ amount: 1000, currency: "usd" });

    expect(authenticateToken).toHaveBeenCalledTimes(1);
    expect(paymentController.createPaymentIntent).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("should return 200 and success response", async () => {
    const res = await request(app)
      .post("/payment/create-payment-intent")
      .send({ amount: 500, currency: "usd" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
