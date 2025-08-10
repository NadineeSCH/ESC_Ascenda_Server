const mockStripe = {
  customers: {
    create: jest.fn()
  }
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});


const authService = require('../../service/authService');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const stripe = require('stripe')();

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.STRIPE_SECRET_KEY = 'stripekey';
  });

  describe('signup', () => {
    it('should throw if required fields are missing', async () => {
      await expect(authService.signup({})).rejects.toThrow(
        'All fields (name, email, phone, password, address) are required'
      );
    });

    it('should throw if user already exists', async () => {
      User.findOne.mockResolvedValue({ _id: '123' });
      await expect(
        authService.signup({
          name: 'John',
          email: 'test@example.com',
          phone: '82345678',
          password: 'password',
          address: '123 Street'
        })
      ).rejects.toThrow('User already exists');
    });

    it('should create a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      stripe.customers.create.mockResolvedValue({ id: 'stripe123' });
      User.create.mockResolvedValue({
        _id: 'u1',
        name: 'John',
        email: 'test@example.com',
        phone: '82345678',
        password: 'hashedPassword',
        stripeCustomerId: 'stripe123',
        address: '123 Street'
      });

      const result = await authService.signup({
        name: 'John',
        email: 'test@example.com',
        phone: '82345678',
        password: 'password',
        address: '123 Street'
      });

      expect(result).toEqual({
        _id: 'u1',
        name: 'John',
        email: 'test@example.com',
        phone: '82345678',
        stripeCustomerId: 'stripe123',
        address: '123 Street'
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(stripe.customers.create).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw if email or password is missing', async () => {
      await expect(authService.login({})).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(
        authService.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw if password does not match', async () => {
      User.findOne.mockResolvedValue({ password: 'hashedPassword' });
      bcrypt.compare.mockResolvedValue(false);
      await expect(
        authService.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should login successfully and return token', async () => {
      const fakeUser = {
        _id: 'u1',
        name: 'John',
        email: 'test@example.com',
        phone: '82345678',
        password: 'hashedPassword',
        stripeCustomerId: 'stripe123',
        address: '123 Street'
      };

      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fakeToken');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result).toEqual({
        token: 'fakeToken',
        user: {
          _id: 'u1',
          name: 'John',
          email: 'test@example.com',
          phone: '82345678',
          stripeCustomerId: 'stripe123',
          address: '123 Street'
        }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { _id: 'u1' },
        'testsecret',
        { expiresIn: '1h' }
      );
    });
  });
});
