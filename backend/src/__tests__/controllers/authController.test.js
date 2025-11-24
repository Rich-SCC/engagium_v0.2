require('../setup');
const { register, login, getProfile, updateProfile, logout } = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role: 'instructor'
      };

      const mockUser = {
        id: 1,
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        role: req.body.role
      };

      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('test-token-123');

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        role: req.body.role
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          token: 'test-token-123'
        }
      });
    });

    it('should return 400 for missing required fields', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
        // Missing first_name and last_name
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide all required fields'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 for password less than 6 characters', async () => {
      req.body = {
        email: 'test@example.com',
        password: '12345',
        first_name: 'Test',
        last_name: 'User'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    });

    it('should return 400 for invalid email format', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide a valid email address'
      });
    });

    it('should return 400 when email already exists', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      User.create.mockRejectedValue(new Error('Email already exists'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists'
      });
    });

    it('should handle unexpected errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      User.create.mockRejectedValue(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: req.body.email,
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test-token-123');

      await login(req, res);

      expect(User.findByEmail).toHaveBeenCalledWith(req.body.email);
      expect(User.validatePassword).toHaveBeenCalledWith(req.body.password, mockUser.password_hash);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
            role: mockUser.role
          },
          token: 'test-token-123'
        }
      });
    });

    it('should return 400 for missing credentials', async () => {
      req.body = {
        email: 'test@example.com'
        // Missing password
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide email and password'
      });
    });

    it('should return 401 for non-existent user', async () => {
      req.body = {
        email: 'notfound@example.com',
        password: 'password123'
      };

      User.findByEmail.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should return 401 for invalid password', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: req.body.email,
        password_hash: 'hashed_password'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      req.user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor',
        created_at: new Date()
      };

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            role: req.user.role,
            created_at: req.user.created_at
          }
        }
      });
    });

    it('should handle errors', async () => {
      req.user = null;

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      req.user = { id: 1 };
      req.body = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: 1,
        ...req.body,
        role: 'instructor',
        updated_at: new Date()
      };

      User.updateProfile.mockResolvedValue(mockUpdatedUser);

      await updateProfile(req, res);

      expect(User.updateProfile).toHaveBeenCalledWith(1, req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUpdatedUser
        }
      });
    });

    it('should return 400 for missing fields', async () => {
      req.user = { id: 1 };
      req.body = {
        first_name: 'Updated'
        // Missing last_name and email
      };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide all required fields'
      });
    });

    it('should return 400 for invalid email', async () => {
      req.user = { id: 1 };
      req.body = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'invalid-email'
      };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide a valid email address'
      });
    });

    it('should return 400 when email already exists', async () => {
      req.user = { id: 1 };
      req.body = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'existing@example.com'
      };

      User.updateProfile.mockRejectedValue(new Error('Email already exists'));

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists'
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});
