// test/unit_tests/paymentController.unit.test.js

const paymentService = require("../../service/paymentService");
const paymentController = require("../../controller/paymentController");

jest.mock("../../service/paymentService");

describe("paymentController.createPaymentIntent", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        amount: 1000,
        customerId: "cus_test_123",
        userId: "user_test_456",
        address: "123 Test Street"
      }
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  it("should call paymentService.createPaymentIntent with correct args and return clientSecret", async () => {
    const mockClientSecret = "pi_test_secret";
    paymentService.createPaymentIntent.mockResolvedValue(mockClientSecret);

    await paymentController.createPaymentIntent(req, res);

    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith({
      amount: 1000,
      customerId: "cus_test_123",
      userId: "user_test_456",
      address: "123 Test Street"
    });

    expect(res.send).toHaveBeenCalledWith({ clientSecret: mockClientSecret });
  });

  it("should return 400 and error message if paymentService throws", async () => {
    const mockError = new Error("Something went wrong");
    paymentService.createPaymentIntent.mockRejectedValue(mockError);

    await paymentController.createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
  });
});
