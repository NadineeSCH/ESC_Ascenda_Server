const authController = require("../../controller/authController");
const User = require("../../models/User");
const { connectDB, disconnectDB, clearDB } = require("../setup/testDb");
const {
  validUserData,
  emailOtp,
  invalidUserDataSets,
  loginCredentials,
} = require("../mocks/userData");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// mock Stripe and nodemailer(external service)
jest.mock("stripe", () => {
  return jest.fn(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({
        id: "cus_test_123",
      }),
    },
  }));
});

jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn().mockResolvedValue({
    messageId: "test-message-id",
    accepted: ["test@example.com"],
    rejected: [],
    response: "250 OK",
  });

  const mockTransporter = { sendMail: mockSendMail };
  const mockCreateTransport = jest.fn().mockReturnValue(mockTransporter);

  return {
    createTransport: mockCreateTransport,
    __mockSendMail: mockSendMail,
    __mockTransporter: mockTransporter,
    __mockCreateTransport: mockCreateTransport,
  };
});

describe("AuthController Integration Tests", () => {
  let mockStripe;
  let res;

  beforeAll(async () => {
    await connectDB();
    // Get the mocked stripe instance
    const stripe = require("stripe");
    mockStripe = stripe();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterAll(async () => {
    authController.cleanup(); // Clear tempUsers and stop cleanup interval
    await disconnectDB();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    //Clear tempUsers
    if (authController.tempUsers) {
      authController.tempUsers.clear();
    }
  });

  describe("Successful signup-verify-login integration flow", () => {
    beforeAll(async () => {
      await clearDB();
    });

    it("Complete signup -> verify -> login flow", async () => {
      let expecterUser = {
        name: validUserData.name,
        email: validUserData.email,
        phone: validUserData.phone,
        address: validUserData.address,
        stripeCustomerId: "cus_test_123",
      };

      // Step 1: Signup
      await authController.signup({ body: validUserData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "OTP sent to email" });
      expect(authController.tempUsers.size).toBe(1);
      expect(authController.tempUsers.get(validUserData.email)).toMatchObject({
        name: validUserData.name,
        email: validUserData.email,
        phone: validUserData.phone,
        password: validUserData.password,
        address: validUserData.address,
        otp: "1234",
        expiresAt: expect.any(Number),
      });

      // Clear mocks for next step
      jest.clearAllMocks();

      // Step 2: Verify OTP

      await authController.verifyOtp({ body: emailOtp.valid }, res);

      //verify that user was created in database
      expect(
        User.findOne({ email: validUserData.email })
      ).resolves.toMatchObject({
        ...expecterUser,
        password: expect.any(String), // Password should be hashed
      });

      //fetch actual id from databas
      let id = await User.findOne({ email: validUserData.email }).select("_id");
      id = id._id;

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User verified and account created",
        user: expect.objectContaining({
          _id: id,
          ...expecterUser,
        }),
      });

      // Clear mocks for next step
      jest.clearAllMocks();

      // Step 3: Login
      req = {
        body: loginCredentials.valid,
      };
      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: expect.any(String),
          user: {
            _id: id,
            ...expecterUser,
          },
        })
      );
    });
  });

  describe("Signup Integration Tests", () => {
    let req;
    const fields = ["name", "email", "phone", "password", "address"];
    beforeEach(async () => {
      await clearDB();

      //add mock user to tempUsers
      authController.tempUsers.set(validUserData.email, {
        name: validUserData.name,
        email: validUserData.email,
        phone: validUserData.phone,
        password: validUserData.password,
        address: validUserData.address,
        otp: "1234",
        expiresAt: Date.now() + 300000,
      });
    });

    it("should handle invalid name", async () => {
      req = {
        body: invalidUserDataSets.invalidName,
      };
      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be between 2-50 characters",
      });
    });
    it("should handle invalid phone", async () => {
      req = {
        body: invalidUserDataSets.invalidPhone,
      };
      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)",
      });
    });
    it("should handle invalid password", async () => {
      req = {
        body: invalidUserDataSets.invalidPassword,
      };
      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password needs at least 1 uppercase letter",
      });
    });

    test.each(fields)(
      "should return status 400 and indicate for missing field %p",
      async (missingField) => {
        const invalidRequestBody = { ...validUserData };
        delete invalidRequestBody[missingField]; // Remove required field

        await authController.signup({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "All fields (name, email, phone, password, address) are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for null field %p",
      async (missingField) => {
        const invalidRequestBody = { ...validUserData };
        invalidRequestBody[missingField] = null; // set field to null

        await authController.signup({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "All fields (name, email, phone, password, address) are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for empty string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...validUserData };
        invalidRequestBody[missingField] = ""; // set field to empty string

        await authController.signup({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "All fields (name, email, phone, password, address) are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for non string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...validUserData };
        invalidRequestBody[missingField] = 1; // set field to non-string value

        await authController.signup({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "All fields must be strings",
        });
      }
    );
  });

  describe("VerifyOTP Integration Tests", () => {
    let req;
    const fields = ["email", "otp"];

    beforeEach(() => {
      // setup tempUsers before each test
      authController.tempUsers.set(emailOtp.valid.email, {
        name: "Test User",
        email: emailOtp.valid.email,
        phone: "91234567",
        password: "ValidPass123!",
        address: "123 Test Street",
        otp: emailOtp.valid.otp,
        expiresAt: Date.now() + 300000, // 5 minutes expiry
      });
    });

    it("should handle invalid email", async () => {
      req = {
        body: emailOtp.invalidEmail,
      };
      await authController.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid OTP",
      });
    });

    it("should handle invalid OTP", async () => {
      req = {
        body: emailOtp.invalidOtp,
      };
      await authController.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid OTP",
      });
    });

    it("should handle expired OTP", async () => {
      // Change the expiry time to past
      authController.tempUsers.get(emailOtp.valid.email).expiresAt =
        Date.now() - 1000;

      req = {
        body: emailOtp.valid,
      };
      await authController.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "OTP expired",
      });
    });

    test.each(fields)(
      "should return status 400 and indicate for missing field %p",
      async (missingField) => {
        const invalidRequestBody = { ...emailOtp.valid };
        delete invalidRequestBody[missingField]; // Remove required field

        await authController.verifyOtp({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Email and OTP are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for null field %p",
      async (missingField) => {
        const invalidRequestBody = { ...emailOtp.valid };
        invalidRequestBody[missingField] = null; // set field to null

        await authController.verifyOtp({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Email and OTP are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for empty string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...emailOtp.valid };
        invalidRequestBody[missingField] = ""; // set field to empty string

        await authController.verifyOtp({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Email and OTP are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for non string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...emailOtp.valid };
        invalidRequestBody[missingField] = 1; // set field to non-string value

        await authController.verifyOtp({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Email and OTP must be strings",
        });
      }
    );
  });

  describe("Login Integration Tests", () => {
    let req;
    const fields = ["email", "password"];

    beforeAll(async () => {
      await clearDB();
      //add mock user to database
      let hashedPassword = await bcrypt.hash(validUserData.password, 10);
      await User.create({
        name: validUserData.name,
        email: validUserData.email,
        phone: validUserData.phone,
        password: hashedPassword,
        address: validUserData.address,
        stripeCustomerId: "cus_test_123",
      });
    });

    it("should handle invalid email", async () => {
      req = {
        body: loginCredentials.invalidEmail,
      };
      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email or password",
      });
    });
    it("should handle invalid password", async () => {
      req = {
        body: loginCredentials.invalidPassword,
      };
      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email or password",
      });
    });
    test.each(fields)(
      "should return status 400 and indicate for missing field %p",
      async (missingField) => {
        const invalidRequestBody = { ...loginCredentials.valid };
        delete invalidRequestBody[missingField]; // Remove required field

        await authController.login({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for null field %p",
      async (missingField) => {
        const invalidRequestBody = { ...loginCredentials.valid };
        invalidRequestBody[missingField] = null; // set field to null

        await authController.login({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for empty string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...loginCredentials.valid };
        invalidRequestBody[missingField] = ""; // set field to empty string

        await authController.login({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      }
    );

    test.each(fields)(
      "should return status 400 and indicate for non string field %p",
      async (missingField) => {
        const invalidRequestBody = { ...loginCredentials.valid };
        invalidRequestBody[missingField] = 1; // set field to non-string value

        await authController.login({ body: invalidRequestBody }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email and password must be strings",
        });
      }
    );
  });
});
