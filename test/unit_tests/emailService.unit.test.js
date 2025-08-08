
const nodemailer = require("nodemailer");
const emailService = require("../../service/emailService");

// Mock nodemailer before requiring emailService
jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn();
  const mockTransporter = {
    sendMail: mockSendMail,
  };
  const mockCreateTransport = jest.fn().mockReturnValue(mockTransporter);

  return {
    createTransport: mockCreateTransport,
    __mockSendMail: mockSendMail,
    __mockTransporter: mockTransporter,
  };
});


// Test transporter configuration immediately after module load
describe("emailService transporter configuration", () => {
  it("should create transporter with correct SMTP settings", () => {
    // Check that createTransport was called during module loading
    expect(nodemailer.createTransport).toHaveBeenCalled();

    // Verify it was called with correct SMTP configuration
    const calls = nodemailer.createTransport.mock.calls;
    const firstCall = calls[0][0]; // Get the configuration from the first call

    expect(firstCall).toMatchObject({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD, 
      },
    });
  });
});

describe("emailService Unit Tests", () => {
  let mockSendMail;

  beforeEach(() => {
    // Get the mock sendMail function
    mockSendMail = nodemailer.__mockSendMail;

    // Clear all mocks
    jest.clearAllMocks();

    // Mock environment variables
    process.env.EMAIL_SENDER = "test@example.com";
    process.env.EMAIL_PASSWORD = "test-password";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.EMAIL_SENDER;
    delete process.env.EMAIL_PASSWORD;
  });

  describe("sendOtp", () => {
    it("should send OTP email successfully", async () => {
      const testEmail = "user@example.com";
      const testOtp = "123456";
      const mockMessageInfo = {
        messageId: "test-message-id-12345",
      };

      // Mock successful email sending
      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, testOtp);

      // Verify sendMail was called with correct parameters
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Hotel Booking App" <test@example.com>',
        to: testEmail,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${testOtp}`,
      });
    });

    it("should handle different OTP formats", async () => {
      const testEmail = "user@test.com";
      const numericOtp = 987654;
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, numericOtp);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Hotel Booking App" <test@example.com>',
        to: testEmail,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${numericOtp}`,
      });
    });

    it("should handle different email addresses", async () => {
      const emails = [
        "test@gmail.com",
        "user.name+tag@example.org",
        "simple@domain.co.uk",
      ];
      const testOtp = "555555";
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      for (const email of emails) {
        await emailService.sendOtp(email, testOtp);

        expect(mockSendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: email,
          })
        );
      }

      expect(mockSendMail).toHaveBeenCalledTimes(emails.length);
    });

    it("should use correct email template structure", async () => {
      const testEmail = "user@example.com";
      const testOtp = "999888";
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, testOtp);

      const calledWith = mockSendMail.mock.calls[0][0];

      expect(calledWith).toEqual({
        from: '"Hotel Booking App" <test@example.com>',
        to: testEmail,
        subject: "Your OTP Code",
        text: "Your OTP code is: 999888",
      });
    });

    it("should propagate errors when email sending fails", async () => {
      const testEmail = "user@example.com";
      const testOtp = "123456";
      const emailError = new Error("SMTP connection failed");

      mockSendMail.mockRejectedValue(emailError);

      await expect(emailService.sendOtp(testEmail, testOtp)).rejects.toThrow(
        "SMTP connection failed"
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("should handle network timeouts", async () => {
      const testEmail = "user@example.com";
      const testOtp = "123456";
      const timeoutError = new Error("Connection timeout");
      timeoutError.code = "ETIMEDOUT";

      mockSendMail.mockRejectedValue(timeoutError);

      await expect(emailService.sendOtp(testEmail, testOtp)).rejects.toThrow(
        "Connection timeout"
      );
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("should handle authentication errors", async () => {
      const testEmail = "user@example.com";
      const testOtp = "123456";
      const authError = new Error("Invalid login");
      authError.code = "EAUTH";

      mockSendMail.mockRejectedValue(authError);

      await expect(emailService.sendOtp(testEmail, testOtp)).rejects.toThrow(
        "Invalid login"
      );
    });


    it("should use environment variables for email configuration", async () => {
      // Test with different environment variables
      process.env.EMAIL_SENDER = "custom@company.com";

      const testEmail = "user@example.com";
      const testOtp = "123456";
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, testOtp);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Hotel Booking App" <custom@company.com>',
        })
      );
    });

  });

  describe("equivalence class testing: error edge cases", () => {

    it("should handle empty or null OTP values", async () => {
      const testEmail = "user@example.com";
      // Test with empty string
      await expect(emailService.sendOtp(testEmail, "")).rejects.toThrow("Email and OTP are required");
      expect(mockSendMail).not.toHaveBeenCalled();

      // Test with null
      await expect(emailService.sendOtp(testEmail, null)).rejects.toThrow("Email and OTP are required");
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should handle empty or null email values", async () => {
      const otp = "123456";
      // Test with empty string
      await expect(emailService.sendOtp("", otp)).rejects.toThrow("Email and OTP are required");
      expect(mockSendMail).not.toHaveBeenCalled();

      // Test with null
      await expect(emailService.sendOtp(null,otp)).rejects.toThrow("Email and OTP are required");
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should handle malformed email addresses gracefully", async () => {
      const invalidEmails = ["invalid-email", "@domain.com", "user@"];
      const testOtp = "123456";
      const validationError = new Error("Invalid recipient");

      mockSendMail.mockRejectedValue(validationError);

      for (const invalidEmail of invalidEmails) {
        await expect(
          emailService.sendOtp(invalidEmail, testOtp)
        ).rejects.toThrow("Invalid recipient");
      }
    });

    it("should handle special characters in OTP", async () => {
      const testEmail = "user@example.com";
      const specialOtp = "AB-12#34";
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, specialOtp);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Your OTP code is: AB-12#34",
        })
      );
    });

    it("should handle very long OTP codes", async () => {
      const testEmail = "user@example.com";
      const longOtp = "1".repeat(1000); // Very long OTP
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(testEmail, longOtp);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: `Your OTP code is: ${longOtp}`,
        })
      );
    });

    it("should handle very long email addresses", async () => {
      const longEmail = "a".repeat(50) + "@" + "b".repeat(50) + ".com";
      const testOtp = "123456";
      const mockMessageInfo = { messageId: "test-id" };

      mockSendMail.mockResolvedValue(mockMessageInfo);

      await emailService.sendOtp(longEmail, testOtp);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: longEmail,
        })
      );
    });
  });
});
