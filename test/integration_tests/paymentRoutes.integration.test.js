// test/integration_tests/paymentRoutes.integration.test.js
const request = require("supertest");
const express = require("express");
const paymentRoutes = require("../../routes/paymentRoutes");
const paymentController = require("../../controller/paymentController");
const authenticateToken = require("../../middleware/authMiddleware");

jest.mock("../../controller/paymentController", () => ({
  createPaymentIntent: jest.fn(),
}));

jest.mock("../../middleware/authMiddleware", () =>
  jest.fn((req, res, next) => next())
);

describe("Payment Routes Integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/payments", paymentRoutes);
  });

  it("POST /payments/create-payment-intent should call createPaymentIntent", async () => {
    paymentController.createPaymentIntent.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    const res = await request(app)
      .post("/payments/create-payment-intent")
      .send({ amount: 1000, currency: "usd" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(paymentController.createPaymentIntent).toHaveBeenCalledTimes(1);
  });
});
