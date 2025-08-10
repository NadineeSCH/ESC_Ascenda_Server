const express = require("express");
const request = require("supertest");
const { connectDB, disconnectDB, clearDB } = require("../setup/testDb");
const authRoutes = require("../../routes/authRoutes");
const User = require("../../models/User");
const { tempUsers } = require("../../controller/authController");


// Mock email service to avoid sending real emails
jest.mock("../../service/emailService", () => ({
  sendOtp: jest.fn().mockResolvedValue(true),
}));

// Mock stripe to avoid network calls
jest.mock("stripe", () => {
  return jest.fn(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_test123" }),
    },
  }));
});

describe("Auth Routes Integration", () => {
  let app;
  const validUser = {
    name: "Test User",
    email: "test@example.com",
    phone: "91234567",
    password: "Password123!",
    address: "123 Test Street",
  };

  beforeAll(async () => {
    await connectDB();
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    await clearDB();
    jest.clearAllMocks();
  });

  // Helper to sign up user
  const signupUser = (user = validUser) =>
    request(app).post("/api/auth/signup").send(user);

  // Helper to verify OTP
  const verifyOtp = (email = validUser.email, otp = "1234") =>
    request(app).post("/api/auth/verify-otp").send({ email, otp });

  // Helper to login user
  const loginUser = (email = validUser.email, password = validUser.password) =>
    request(app).post("/api/auth/login").send({ email, password });

  // 1. Successful signup
  it("should signup a user and store OTP", async () => {
    const res = await signupUser();
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("OTP sent to email");
  });

  // 2. Signup validation errors
  it.each([
    [{ ...validUser, name: "A" }, "Name must be between 2-50 characters"],
    [{ ...validUser, name: "Name@" }, "Name contains invalid characters"],
    [{ ...validUser, phone: "12345678" }, "Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)"],
    [{ ...validUser, password: "short" }, "Password must be at least 8 characters"],
    [{ ...validUser, password: "alllowercase1" }, "Password needs at least 1 uppercase letter"],
    [{ ...validUser, password: "ALLUPPERCASE1" }, "Password needs at least 1 lowercase letter"],
    [{ ...validUser, password: "NoNumbers" }, "Password needs at least 1 number"],
  ])("should reject invalid signup data %#", async (badUser, expectedError) => {
    const res = await signupUser(badUser);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(expectedError);
  });

  // 3. OTP verification failures
  it("should reject OTP verification with missing email or otp", async () => {
    let res = await request(app).post("/api/auth/verify-otp").send({ email: validUser.email });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");

    res = await request(app).post("/api/auth/verify-otp").send({ otp: "1234" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");
  });

  it("should reject invalid OTP", async () => {
    await signupUser();
    const res = await verifyOtp(validUser.email, "9999");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");
  });

  it("should reject expired OTP", async () => {
    await signupUser();
    // Manually expire OTP
    const { tempUsers } = require("../../controller/authController");
    const tempUser = tempUsers.get(validUser.email);
    tempUser.expiresAt = Date.now() - 1000; // expired
    tempUsers.set(validUser.email, tempUser);

    const res = await verifyOtp(validUser.email, "1234");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("OTP expired");
  });

  // 4. Duplicate signup after OTP verified
    it("should reject signup if user already exists", async () => {
    await signupUser();   // first signup, store OTP
    await verifyOtp();    // verify OTP, creates user in DB

    await signupUser();   // send OTP again (status 200 expected)
    
    // Now try to verify OTP again - this triggers duplicate user check
    const res = await verifyOtp();

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exists");
    });



  // 5. Email sending failure on signup
  it("should return 500 if emailService.sendOtp throws", async () => {
    const emailService = require("../../service/emailService");
    emailService.sendOtp.mockRejectedValueOnce(new Error("SMTP failure"));

    const res = await signupUser();
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to send OTP");
  });

  // 6. Successful OTP verification creates user
  it("should verify OTP and create user", async () => {
    await signupUser();
    const res = await verifyOtp();
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User verified and account created");
    expect(res.body.user.email).toBe(validUser.email);
  });

  // 7. Login failures
  it("should reject login with missing email or password", async () => {
    let res = await loginUser("", validUser.password);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email and password are required");

    res = await loginUser(validUser.email, "");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email and password are required");
  });

  it("should reject login with wrong password", async () => {
    await signupUser();
    await verifyOtp();

    const res = await loginUser(validUser.email, "WrongPass123");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("should reject login for non-existent user", async () => {
    const res = await loginUser("noone@example.com", "Password123!");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email or password");
  });

  // 8. Successful login
  it("should login an existing user", async () => {
    await signupUser();
    await verifyOtp();

    const res = await loginUser();
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
  });

  // 9. Edge cases
  it("should reject OTP verification with correct OTP but wrong email", async () => {
    await signupUser();
    const res = await verifyOtp("wrongemail@example.com", "1234");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");
  });

  it("should only accept the last OTP sent if multiple signups before verify", async () => {
    await signupUser();
    // Change OTP to 5678 manually for the same email
    
    tempUsers.set(validUser.email, {
      ...tempUsers.get(validUser.email),
      otp: "5678",
      expiresAt: Date.now() + 300000,
    });

    // Verify with old OTP fails
    let res = await verifyOtp(validUser.email, "1234");
    expect(res.status).toBe(400);

    // Verify with new OTP succeeds
    res = await verifyOtp(validUser.email, "5678");
    expect(res.status).toBe(201);
  });
});
