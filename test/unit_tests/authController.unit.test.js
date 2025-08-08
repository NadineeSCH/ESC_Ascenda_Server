const authController = require("../../controller/authController");

const authService = require("../../service/authService");
const emailService = require("../../service/emailService");
const validate = require("../../service/validate");
const crypto = require("crypto");

jest.mock("../../service/authService", () => ({
  login: jest.fn(),
  signup: jest.fn(),
}));

jest.mock("../../service/emailService", () => ({
  sendOtp: jest.fn(),
}));

jest.mock("../../service/validate", () => ({
  validator: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomInt: jest.fn(() => 123456), // Mock to always return a fixed OTP
}));

describe("authController.signup Unit Tests", () => {
  let req, res;
  beforeAll(() => {
    req = {
      body: {
        name: "Test User",
        email: "testuser@example.com",
        phone: "1234567890",
        password: "password123",
        address: "123 Test St, Test City, SG",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });
  beforeEach(() => {
    jest.clearAllMocks();
    authController.tempUsers.clear(); // Clear the mock tempUsers before each test
  });

  it("should successfully sign up a user and send OTP", async () => {
    emailService.sendOtp.mockResolvedValueOnce();
    validate.validator.mockResolvedValueOnce();

    await authController.signup(req, res);

    expect(validate.validator).toHaveBeenCalledWith({
      name: req.body.name,
      phone: req.body.phone,
      password: req.body.password,
    });

    expect(authController.tempUsers.has(req.body.email)).toBe(true);
    expect(authController.tempUsers.get(req.body.email)).toEqual(expect.objectContaining({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      address: req.body.address,
      otp: "1234",
    }));

    expect(emailService.sendOtp).toHaveBeenCalledWith(req.body.email, "1234");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "OTP sent to email" });
  });

  it("should handle validation errors", async () => {
    const errorMessage = "Validation failed";
    validate.validator.mockRejectedValueOnce(new Error(errorMessage));

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });

  it("should handle email sending errors", async () => {
    const errorMessage = "Failed to send OTP";
    emailService.sendOtp.mockRejectedValueOnce(new Error(errorMessage));

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to send OTP" });
  });
});

describe("authController.login Unit Tests", () => {
  let req, res;

  beforeAll(() => {
    req = {
      body: {
        email: "testuser@example.com",
        password: "password123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully log in a user", async () => {
    const mockResult = {
      user: {
        id: "user-id",
        email: "testuser@example.com",
      },
      token: "jwt-token",
    };
    authService.login.mockResolvedValueOnce(mockResult);

    await authController.login(req, res);

    expect(authService.login).toHaveBeenCalledWith(
      req.body
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Login successful", ...mockResult });
  });

  it("should handle login errors", async () => {
    const errorMessage = "Login failed";
    authService.login.mockRejectedValueOnce(new Error(errorMessage));

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

describe("authController.verifyOtp Unit Tests", () => {
  let req, res;

  beforeAll(() => {
    req = {
      body: {
        email: "testuser@example.com",
        otp: "1234",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully verify OTP and create new user", async () => {
    authController.tempUsers.set(req.body.email, {
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      address: "123 Test St, Test City, SG",
      otp: "1234",
      expiresAt: Date.now() + 300000, // 5 minutes from now
    });

    mockUser = {
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      stripeCustomerId: "user-id",
      address: "123 Test St, Test City, SG",
    };

    authService.signup.mockResolvedValueOnce(mockUser);

    await authController.verifyOtp(req, res);

    expect(authService.signup).toHaveBeenCalledWith({
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      address: "123 Test St, Test City, SG",
    });
    expect(authController.tempUsers.has(req.body.email)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User verified and account created",
      user: mockUser,
    });
  });

  it("should handle OTP verification errors", async () => {
    authController.tempUsers.set(req.body.email, {
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      address: "123 Test St, Test City, SG",
      otp: "12345", //incorrect OTP
      expiresAt: Date.now() + 300000, // 5 minutes from now
    });

    await authController.verifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
  });

  it("should handle expired OTP", async () => {
    authController.tempUsers.set(req.body.email, {
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      address: "123 Test St, Test City, SG",
      otp: "1234",
      expiresAt: Date.now() - 1000, //already expired
    });

    await authController.verifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "OTP expired" });
  });

  it("should handle signup errors from authService", async () => {
    authController.tempUsers.set(req.body.email, {
      name: "Test User",
      email: req.body.email,
      phone: "1234567890",
      password: "password123",
      address: "123 Test St, Test City, SG",
      otp: "1234",
      expiresAt: Date.now() + 300000, // 5 minutes from now
    });

    authService.signup.mockRejectedValueOnce(new Error("Signup failed"));
    await authController.verifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Signup failed" });
  });
});
