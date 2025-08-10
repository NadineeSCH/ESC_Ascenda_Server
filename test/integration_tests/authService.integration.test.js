const authService = require('../../service/authService');
const User = require('../../models/User');
const { connectDB, disconnectDB, clearDB } = require('../setup/testDb');
const { 
  validUserData, 
  validUserData2, 
  validUserData3,
  invalidUserDataSets, 
  loginCredentials,
  mockStripeErrors 
} = require('../mocks/userData');
const stripe = require('stripe');

// Mock Stripe
jest.mock('stripe');

describe('AuthService Integration Tests', () => {
  let mockStripe;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    jest.clearAllMocks();
    
    mockStripe = {
      customers: {
        create: jest.fn(),
        del: jest.fn()
      }
    };
    stripe.mockReturnValue(mockStripe);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Signup Integration Tests', () => {
    describe('Successful user creation', () => {
      it('should create user with valid data and store in database', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        const result = await authService.signup(validUserData);

        expect(result).toEqual({
          _id: expect.any(String),
          name: 'John Doe',
          email: 'john@example.com',
          phone: '91234567',
          stripeCustomerId: 'cus_test123',
          address: '123 Main Street, Singapore'
        });

        const savedUser = await User.findById(result._id);
        expect(savedUser).toBeTruthy();
        expect(savedUser.email).toBe('john@example.com');
        expect(savedUser.name).toBe('John Doe');
        expect(savedUser.stripeCustomerId).toBe('cus_test123');
        expect(savedUser.password).not.toBe(validUserData.password);
      });

      it('should handle email case normalization in database', async () => {
        const userDataWithUppercaseEmail = {
          ...validUserData,
          email: 'JOHN@EXAMPLE.COM'
        };
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });

        const result = await authService.signup(userDataWithUppercaseEmail);
        expect(result.email).toBe('john@example.com');
        const savedUser = await User.findById(result._id);
        expect(savedUser.email).toBe('john@example.com');
      });

      it('should trim whitespace from all fields', async () => {
        const userDataWithSpaces = {
          name: '  John Doe  ',
          email: '  john@example.com  ',
          phone: '  91234567  ',
          password: validUserData.password,
          address: '  123 Main Street  '
        };
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });

        const result = await authService.signup(userDataWithSpaces);
        const savedUser = await User.findById(result._id);
        expect(savedUser.name).toBe('John Doe');
        expect(savedUser.email).toBe('john@example.com');
        expect(savedUser.phone).toBe('91234567');
        expect(savedUser.address).toBe('123 Main Street');
      });
    });

    describe('Database constraint validation', () => {
      it('should enforce unique email constraint at database level', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        await authService.signup(validUserData);

        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test456' });
        await expect(authService.signup({
          ...validUserData,
          name: 'Different Name'
        })).rejects.toThrow('An account with email \'john@example.com\' already exists');
      });

      it('should cleanup Stripe customer when database save fails', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        mockStripe.customers.del.mockResolvedValue({});
        
        await authService.signup(validUserData);
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test456' });
        
        await expect(authService.signup(validUserData)).rejects.toThrow();
        expect(mockStripe.customers.del).toHaveBeenCalledWith('cus_test456');
      });

      it('should handle Stripe cleanup errors gracefully', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        await authService.signup(validUserData);

        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test456' });
        mockStripe.customers.del.mockRejectedValue(new Error('Cleanup failed'));

        await expect(authService.signup(validUserData)).rejects.toThrow();
        expect(console.error).toHaveBeenCalledWith('Failed to cleanup Stripe customer:', expect.any(Error));
      });
    });

    describe('MongoDB validation errors', () => {
      it('should handle missing required fields at schema level', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });

        await expect(authService.signup(invalidUserDataSets.missingName))
          .rejects.toThrow('Missing required fields: name');

        await expect(authService.signup(invalidUserDataSets.missingEmail))
          .rejects.toThrow('Missing required fields: email');

        await expect(authService.signup(invalidUserDataSets.missingPhone))
          .rejects.toThrow('Missing required fields: phone');

        await expect(authService.signup(invalidUserDataSets.missingPassword))
          .rejects.toThrow('Missing required fields: password');

        await expect(authService.signup(invalidUserDataSets.missingAddress))
          .rejects.toThrow('Missing required fields: address');
      });

      it('should handle empty and whitespace-only fields', async () => {
        await expect(authService.signup(invalidUserDataSets.emptyFields))
          .rejects.toThrow('Missing required fields: name, email, address');
      });
    });

    describe('Concurrent user creation', () => {
      it('should handle concurrent signup attempts with same email', async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        
        const userData1 = { ...validUserData };
        const userData2 = { ...validUserData, name: 'Different Name' };

        const promises = [
          authService.signup(userData1),
          authService.signup(userData2)
        ];

        const results = await Promise.allSettled(promises);
        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        expect(succeeded).toHaveLength(1);
        expect(failed).toHaveLength(1);
        expect(failed[0].reason.message).toContain('already exists');
      });
    });

    describe('Stripe error scenarios', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      Object.entries(mockStripeErrors).forEach(([errorType, errorData]) => {
        it(`should handle Stripe ${errorType} errors`, async () => {
          const stripeError = new Error(errorData.message);
          stripeError.type = errorData.type;
          mockStripe.customers.create.mockRejectedValue(stripeError);

          await expect(authService.signup(validUserData)).rejects.toThrow();
          const userCount = await User.countDocuments();
          expect(userCount).toBe(0);
        });
      });
    });

    describe('Performance and load testing', () => {
      it('should handle multiple users creation efficiently', async () => {
        mockStripe.customers.create.mockImplementation(() => 
          Promise.resolve({ id: `cus_test_${Math.random()}` })
        );

        const users = [validUserData, validUserData2, validUserData3];
        const startTime = Date.now();
        const results = await Promise.all(
          users.map(userData => authService.signup(userData))
        );
        const endTime = Date.now();

        expect(results).toHaveLength(3);
        expect(endTime - startTime).toBeLessThan(5000);
        const userCount = await User.countDocuments();
        expect(userCount).toBe(3);
      });
    });
  });

  describe('Login Integration Tests', () => {
    let createdUser;

    beforeEach(async () => {
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
      createdUser = await authService.signup(validUserData);
    });

    describe('Successful login', () => {
      it('should login with correct credentials', async () => {
        const result = await authService.login(loginCredentials.valid);

        expect(result).toEqual({
          token: expect.any(String),
          user: {
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            phone: createdUser.phone,
            stripeCustomerId: createdUser.stripeCustomerId,
            address: createdUser.address
          }
        });

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
        expect(decoded._id).toBe(createdUser._id);
      });

      it('should handle case-insensitive email login', async () => {
        const result = await authService.login(loginCredentials.validCaseInsensitive);
        expect(result.user.email).toBe('john@example.com');
        expect(result.token).toBeDefined();
      });

      it('should trim whitespace from email', async () => {
        const loginData = {
          email: '  john@example.com  ',
          password: 'StrongPass123!'
        };

        const result = await authService.login(loginData);
        expect(result.token).toBeDefined();
      });
    });

    describe('Login validation errors', () => {
      it('should reject login with non-existent email', async () => {
        await expect(authService.login(loginCredentials.invalidEmail))
          .rejects.toThrow('No account found with this email address');
      });

      it('should reject login with incorrect password', async () => {
        await expect(authService.login(loginCredentials.invalidPassword))
          .rejects.toThrow('Incorrect password');
      });

      it('should handle missing email', async () => {
        await expect(authService.login(loginCredentials.missingEmail))
          .rejects.toThrow('Email address is required');
      });

      it('should handle missing password', async () => {
        await expect(authService.login(loginCredentials.missingPassword))
          .rejects.toThrow('Password is required');
      });

      it('should handle empty email', async () => {
        await expect(authService.login(loginCredentials.emptyEmail))
          .rejects.toThrow('Email address is required');
      });

      it('should handle whitespace-only email', async () => {
        await expect(authService.login(loginCredentials.whitespaceEmail))
          .rejects.toThrow('Email address is required');
      });
    });

    describe('Login with multiple users', () => {
      beforeEach(async () => {
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test456' });
        await authService.signup(validUserData2);
        
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test789' });
        await authService.signup(validUserData3);
      });

      it('should login correct user when multiple users exist', async () => {
        const result1 = await authService.login({
          email: validUserData2.email,
          password: validUserData2.password
        });

        const result2 = await authService.login({
          email: validUserData3.email,
          password: validUserData3.password
        });

        expect(result1.user.email).toBe('jane@example.com');
        expect(result2.user.email).toBe('bob@example.com');
        expect(result1.user._id).not.toBe(result2.user._id);
      });
    });

    describe('Concurrent login attempts', () => {
      it('should handle multiple simultaneous login attempts', async () => {
        const loginPromises = Array(5).fill(null).map(() => 
          authService.login(loginCredentials.valid)
        );

        const results = await Promise.all(loginPromises);
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result.token).toBeDefined();
          expect(result.user._id).toBe(createdUser._id);
        });
      });
    });
  });

  describe('Database Integration Edge Cases', () => {
    it('should handle database connection issues gracefully', async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.login(loginCredentials.valid))
        .rejects.toThrow('Login temporarily unavailable');

      User.findOne = originalFindOne;
    });

    it('should maintain data integrity across operations', async () => {
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
      
      const signupResult = await authService.signup(validUserData);
      const loginResult = await authService.login(loginCredentials.valid);
      const dbUser = await User.findById(signupResult._id);

      expect(signupResult.email).toBe(loginResult.user.email);
      expect(signupResult._id).toBe(loginResult.user._id);
      expect(signupResult.email).toBe(dbUser.email);
      expect(signupResult.name).toBe(dbUser.name);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leave hanging database connections', async () => {
      const initialConnections = require('mongoose').connection.readyState;
      
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
      await authService.signup(validUserData);
      await authService.login(loginCredentials.valid);
      
      const finalConnections = require('mongoose').connection.readyState;
      expect(finalConnections).toBe(initialConnections);
    });
  });
});