const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

jest.mock("../../service/paymentService");
const paymentService = require("../../service/paymentService");

// Mock authMiddleware to just call next()
jest.mock("../../middleware/authMiddleware", () => jest.fn((req, res, next) => next()));
const authenticateToken = require("../../middleware/authMiddleware");

const paymentController = require("../../controller/paymentController");

describe("POST /create-payment-intent (integration)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());

    const router = express.Router();
    router.post(
      "/create-payment-intent",
      authenticateToken,
      paymentController.createPaymentIntent
    );

    app.use("/api/payments", router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return clientSecret when successful", async () => {
    const mockSecret = "pi_mock_secret";
    paymentService.createPaymentIntent.mockResolvedValue(mockSecret);

    const token = "mocked-jwt";

    const response = await request(app)
      .post("/api/payments/create-payment-intent")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1000,
        customerId: "cus_mock123",
        userId: "user_mock123",
        address: "123 Mock St"
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ clientSecret: mockSecret });
    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith({
      amount: 1000,
      customerId: "cus_mock123",
      userId: "user_mock123",
      address: "123 Mock St"
    });
  });

  it("should return 404 if user not found", async () => {
    paymentService.createPaymentIntent.mockRejectedValue(new Error("User not found"));

    const token = "mocked-jwt";

    const response = await request(app)
      .post("/api/payments/create-payment-intent")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1000,
        customerId: "cus_mock123",
        userId: "nonexistent_user",
        address: "123 Mock St"
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found" });
  });

  it("should return 400 for invalid amount", async () => {
    paymentService.createPaymentIntent.mockRejectedValue(new Error("Invalid amount."));

    const token = "mocked-jwt";

    const response = await request(app)
      .post("/api/payments/create-payment-intent")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: -50,
        customerId: "cus_mock123",
        userId: "user_mock123",
        address: "123 Mock St"
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid amount." });
  });
});
