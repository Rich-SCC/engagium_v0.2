require('../setup');
const User = require('../../models/User');
const bcrypt = require('bcrypt');

// Mock the database
jest.mock('../../config/database');
const db = require('../../config/database');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor'
      };

      const mockUser = {
        id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await User.create(userData);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][1][0]).toBe(userData.email);
      expect(db.query.mock.calls[0][1][2]).toBe(userData.first_name);
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const dbError = new Error('Duplicate key');
      dbError.code = '23505';
      db.query.mockRejectedValue(dbError);

      await expect(User.create(userData)).rejects.toThrow('Email already exists');
    });

    it('should default role to instructor if not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const mockUser = { ...userData, id: 1, role: 'instructor' };
      db.query.mockResolvedValue({ rows: [mockUser] });

      await User.create(userData);

      expect(db.query.mock.calls[0][1][4]).toBe('instructor');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor',
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );
    });

    it('should return undefined if user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await User.findByEmail('notfound@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor',
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: 1,
        ...updateData,
        role: 'instructor',
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUpdatedUser] });

      const result = await User.updateProfile(1, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [updateData.first_name, updateData.last_name, updateData.email, 1]
      );
    });

    it('should throw error if email already exists', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'existing@example.com'
      };

      const dbError = new Error('Duplicate key');
      dbError.code = '23505';
      db.query.mockRejectedValue(dbError);

      await expect(User.updateProfile(1, updateData)).rejects.toThrow('Email already exists');
    });
  });

  describe('updatePassword', () => {
    it('should update user password with hashed value', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await User.updatePassword(1, 'newpassword123');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([expect.any(String), 1])
      );
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const result = await User.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash('differentpassword', 10);

      const result = await User.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });
});
