const authService = require('../../service/authService');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe');

jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('stripe');

describe('Auth Service - Improved Error Messages', () => {
  const mockStripe = {
    customers: {
      create: jest.fn(),
      del: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock stripe instance
    stripe.mockReturnValue(mockStripe);
    
    // Set up default environment variable
    process.env.JWT_SECRET = 'test-secret';
    
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('signup', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: 'StrongPass123!',
      address: '123 Main St'
    };

    describe('Enhanced field validation', () => {
      it('should throw specific error for single missing field', async () => {
        const userData = { ...validUserData };
        delete userData.name;

        await expect(authService.signup(userData))
          .rejects
          .toThrow('Missing required fields: name');
      });

      it('should throw specific error for multiple missing fields', async () => {
        const userData = { email: 'test@example.com' };

        await expect(authService.signup(userData))
          .rejects
          .toThrow('Missing required fields: name, phone, password, address');
      });

      it('should handle empty strings as missing fields', async () => {
        const userData = {
          name: '',
          email: '  ',
          phone: validUserData.phone,
          password: validUserData.password,
          address: validUserData.address
        };

        await expect(authService.signup(userData))
          .rejects
          .toThrow('Missing required fields: name, email');
      });

      it('should handle whitespace-only strings as missing fields', async () => {
        const userData = {
          name: '   ',
          email: validUserData.email,
          phone: validUserData.phone,
          password: validUserData.password,
          address: '   '
        };

        await expect(authService.signup(userData))
          .rejects
          .toThrow('Missing required fields: name, address');
      });

      it('should handle null and undefined values', async () => {
        const userData = {
          name: null,
          email: undefined,
          phone: validUserData.phone,
          password: validUserData.password,
          address: validUserData.address
        };

        await expect(authService.signup(userData))
          .rejects
          .toThrow('Missing required fields: name, email');
      });
    });

    describe('Enhanced existing user error', () => {
      it('should provide detailed error message when user already exists', async () => {
        const existingUser = { _id: 'existing123', email: validUserData.email };
        User.findOne.mockResolvedValue(existingUser);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow(`An account with email '${validUserData.email}' already exists`);
      });

      it('should handle case-insensitive email checking', async () => {
        const existingUser = { _id: 'existing123', email: 'john@example.com' };
        const userData = { ...validUserData, email: 'JOHN@EXAMPLE.COM' };
        
        User.findOne.mockResolvedValue(existingUser);

        await expect(authService.signup(userData))
          .rejects
          .toThrow(`An account with email 'john@example.com' already exists`);
      });
    });

    describe('Enhanced bcrypt error handling', () => {
      it('should provide user-friendly message for bcrypt errors', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockRejectedValue(new Error('Bcrypt internal error'));

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Failed to process password. Please try again.');

        expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      });
    });

    describe('Enhanced Stripe error handling', () => {
      beforeEach(() => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-password');
      });

      it('should handle Stripe card errors', async () => {
        const stripeError = new Error('Card error');
        stripeError.type = 'StripeCardError';
        mockStripe.customers.create.mockRejectedValue(stripeError);
        console.log('DEBUG stripeError in signup:', stripeError, "the stripeerrortype is: ", stripeError.type);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Payment processing setup failed. Please check your information and try again.');
      });

      it('should handle Stripe rate limit errors', async () => {
        const stripeError = new Error('Rate limit');
        stripeError.type = 'StripeRateLimitError';
        mockStripe.customers.create.mockRejectedValue(stripeError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Too many requests. Please wait a moment and try again.');
      });

      it('should handle Stripe invalid request errors', async () => {
        const stripeError = new Error('Invalid request');
        stripeError.type = 'StripeInvalidRequestError';
        mockStripe.customers.create.mockRejectedValue(stripeError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Invalid account information provided. Please check your details.');
      });

      it('should handle Stripe API errors', async () => {
        const stripeError = new Error('API error');
        stripeError.type = 'StripeAPIError';
        mockStripe.customers.create.mockRejectedValue(stripeError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Account setup temporarily unavailable. Please try again later.');
      });

      it('should handle unknown Stripe errors', async () => {
        const stripeError = new Error('Unknown stripe error');
        stripeError.type = 'UnknownStripeError';
        mockStripe.customers.create.mockRejectedValue(stripeError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Account setup failed. Please try again or contact support if the problem persists.');
      });
    });

    describe('Enhanced database error handling', () => {
      beforeEach(() => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-password');
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
      });

      it('should handle MongoDB duplicate key errors', async () => {
        const dbError = new Error('Duplicate key');
        dbError.code = 11000;
        dbError.keyPattern = { email: 1 };
        
        User.create.mockRejectedValue(dbError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('An account with this email already exists. Please use a different email.');

        // Should cleanup Stripe customer
        expect(mockStripe.customers.del).toHaveBeenCalledWith('cus_test123');
      });

      it('should handle MongoDB validation errors', async () => {
        const dbError = new Error('Validation failed');
        dbError.name = 'ValidationError';
        dbError.errors = {
          phone: { message: 'Phone number is invalid' },
          email: { message: 'Email format is invalid' }
        };
        
        User.create.mockRejectedValue(dbError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Account validation failed: Phone number is invalid, Email format is invalid');
      });

      it('should handle general database errors', async () => {
        const dbError = new Error('Database connection failed');
        User.create.mockRejectedValue(dbError);

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Account creation failed. Please try again or contact support if the problem persists.');
      });

      it('should handle Stripe cleanup errors gracefully', async () => {
        const dbError = new Error('Database error');
        dbError.code = 11000;
        dbError.keyPattern = { email: 1 };
        
        User.create.mockRejectedValue(dbError);
        mockStripe.customers.del.mockRejectedValue(new Error('Cleanup failed'));

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('An account with this email already exists. Please use a different email.');

        expect(console.error).toHaveBeenCalledWith('Failed to cleanup Stripe customer:', expect.any(Error));
      });
    });

    describe('Successful signup with data trimming', () => {
      it('should trim whitespace from input fields', async () => {
        const userDataWithSpaces = {
          name: '  John Doe  ',
          email: '  JOHN@EXAMPLE.COM  ',
          phone: '  +1234567890  ',
          password: validUserData.password,
          address: '  123 Main St  '
        };

        const mockCreatedUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password: 'hashed-password',
          stripeCustomerId: 'cus_test123',
          address: '123 Main St'
        };

        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-password');
        mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
        User.create.mockResolvedValue(mockCreatedUser);

        const result = await authService.signup(userDataWithSpaces);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(mockStripe.customers.create).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: {
            line1: '123 Main St',
            country: 'SG'
          },
          metadata: { source: 'hotel-booking-app' }
        });
        expect(User.create).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password: 'hashed-password',
          stripeCustomerId: 'cus_test123',
          address: '123 Main St'
        });
      });
    });

    describe('Unexpected error handling', () => {
      it('should handle and log unexpected errors', async () => {
        User.findOne.mockRejectedValue(new Error('Completely unexpected error'));

        await expect(authService.signup(validUserData))
          .rejects
          .toThrow('Account creation failed due to an unexpected error. Please try again or contact support.');

        expect(console.error).toHaveBeenCalledWith('Unexpected signup error:', expect.any(Error));
      });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: 'hashed-password',
      stripeCustomerId: 'cus_test123',
      address: '123 Main St'
    };

    describe('Enhanced input validation', () => {
      it('should throw specific error when email is missing', async () => {
        const loginData = { password: 'password123' };

        await expect(authService.login(loginData))
          .rejects
          .toThrow('Email address is required');
      });

      it('should throw specific error when password is missing', async () => {
        const loginData = { email: 'john@example.com' };

        await expect(authService.login(loginData))
          .rejects
          .toThrow('Password is required');
      });

      it('should handle empty email', async () => {
        const loginData = { email: '', password: 'password123' };

        await expect(authService.login(loginData))
          .rejects
          .toThrow('Email address is required');
      });

      it('should handle whitespace-only email', async () => {
        const loginData = { email: '   ', password: 'password123' };

        await expect(authService.login(loginData))
          .rejects
          .toThrow('Email address is required');
      });
    });

    describe('Enhanced user lookup errors', () => {
      it('should provide helpful error when no user found', async () => {
        User.findOne.mockResolvedValue(null);

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('No account found with this email address. Please check your email or sign up for a new account.');

        expect(User.findOne).toHaveBeenCalledWith({ email: validLoginData.email.toLowerCase() });
      });

      it('should handle database errors during user lookup', async () => {
        User.findOne.mockRejectedValue(new Error('Database connection failed'));

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('Login temporarily unavailable. Please try again later.');

        expect(console.error).toHaveBeenCalledWith('Database error during user lookup:', expect.any(Error));
      });

      it('should handle case-insensitive email lookup', async () => {
        const loginData = { email: 'JOHN@EXAMPLE.COM', password: 'password123' };
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('jwt-token');

        await authService.login(loginData);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      });
    });

    describe('Enhanced password verification errors', () => {
      beforeEach(() => {
        User.findOne.mockResolvedValue(mockUser);
      });

      it('should provide specific error for incorrect password', async () => {
        bcrypt.compare.mockResolvedValue(false);

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('Incorrect password. Please check your password and try again.');
      });

      it('should handle bcrypt comparison errors', async () => {
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt comparison failed'));

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('Login verification failed. Please try again.');

        expect(console.error).toHaveBeenCalledWith('Password comparison error:', expect.any(Error));
      });
    });

    describe('Enhanced JWT generation errors', () => {
      beforeEach(() => {
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
      });

      it('should handle JWT generation errors', async () => {
        jwt.sign.mockImplementation(() => {
          throw new Error('JWT signing failed');
        });

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('Login session creation failed. Please try again.');

        expect(console.error).toHaveBeenCalledWith('JWT generation error:', expect.any(Error));
      });
    });

    describe('Successful login with email trimming and case handling', () => {
      it('should successfully login and trim/lowercase email', async () => {
        const loginData = { email: '  JOHN@EXAMPLE.COM  ', password: 'password123' };
        const mockToken = 'jwt-token';

        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue(mockToken);

        const result = await authService.login(loginData);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(result).toEqual({
          token: mockToken,
          user: {
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone,
            stripeCustomerId: mockUser.stripeCustomerId,
            address: mockUser.address
          }
        });
      });
    });

    describe('Unexpected error handling', () => {
      it('should handle and log unexpected errors', async () => {
        // Simulate an unexpected error that doesn't match our specific cases
        User.findOne.mockImplementation(() => {
          throw new TypeError('Unexpected type error');
        });

        await expect(authService.login(validLoginData))
          .rejects
          .toThrow('Login failed due to an unexpected error. Please try again or contact support.');

        expect(console.error).toHaveBeenCalledWith('Unexpected login error:', expect.any(TypeError));
      });
    });
  });
});