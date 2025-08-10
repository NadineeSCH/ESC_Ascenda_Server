const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { connectDB, disconnectDB, clearDB } = require('../setup/testDb');
const authService = require('../../service/authService');
const User = require('../../models/User');

// Mock stripe to avoid hitting real API
jest.mock('stripe', () => {
  return jest.fn(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test_123'
      })
    }
  }));
});

describe('AuthService Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    await clearDB();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return correct data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '12345678',
        password: 'password123',
        address: '123 Main St'
      };

      const result = await authService.signup(userData);

      expect(result).toMatchObject({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        stripeCustomerId: 'cus_test_123'
      });

      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(await bcrypt.compare(userData.password, savedUser.password)).toBe(true);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '12345678',
        password: 'password123',
        address: '123 Main St'
      };

      await authService.signup(userData);
      await expect(authService.signup(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should log in an existing user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        phone: '12345678',
        password: hashedPassword,
        address: '123 Main St',
        stripeCustomerId: 'cus_test_123'
      });

      const result = await authService.login({
        email: 'alice@example.com',
        password: 'password123'
      });

      expect(result.user.email).toBe('alice@example.com');
      expect(typeof result.token).toBe('string');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded._id.toString()).toBe(user._id.toString());
    });

    it('should throw error for invalid credentials', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid email or password');
    });
  });
  describe('signup edge cases', () => {
  it('should throw error if any required field is missing', async () => {
    const incompleteUserDataSets = [
      { email: 'a@b.com', phone: '1234', password: 'pass', address: 'addr' }, // missing name
      { name: 'Name', phone: '1234', password: 'pass', address: 'addr' }, // missing email
      { name: 'Name', email: 'a@b.com', password: 'pass', address: 'addr' }, // missing phone
      { name: 'Name', email: 'a@b.com', phone: '1234', address: 'addr' }, // missing password
      { name: 'Name', email: 'a@b.com', phone: '1234', password: 'pass' } // missing address
    ];

    for (const data of incompleteUserDataSets) {
      await expect(authService.signup(data)).rejects.toThrow(
        /All fields \(name, email, phone, password, address\) are required/
      );
    }
  });
});

    describe('login edge cases', () => {
    it('should throw error if email or password is missing', async () => {
        await expect(authService.login({ email: '', password: 'somepass' })).rejects.toThrow(
        'Email and password are required'
        );

        await expect(authService.login({ email: 'a@b.com', password: '' })).rejects.toThrow(
        'Email and password are required'
        );

        await expect(authService.login({})).rejects.toThrow('Email and password are required');
    });

    it('should throw error if password is incorrect', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        await User.create({
        name: 'Wrong Pass',
        email: 'wrongpass@example.com',
        phone: '12345678',
        password: hashedPassword,
        address: '123 Main St',
        stripeCustomerId: 'cus_test_123'
        });

        await expect(
        authService.login({ email: 'wrongpass@example.com', password: 'incorrectpassword' })
        ).rejects.toThrow('Invalid email or password');
    });
    });

});
