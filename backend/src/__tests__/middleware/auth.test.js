require('../setup');
const { auth, instructorAuth, adminAuth } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      header: jest.fn()
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('auth middleware', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'instructor'
      };

      req.header.mockReturnValue('Bearer valid-token-123');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockUser);

      await auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token-123', process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      req.header.mockReturnValue(undefined);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided, authorization denied'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      req.header.mockReturnValue('Bearer expired-token');
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired'
      });
    });

    it('should return 401 when user not found', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 999 });
      User.findById.mockResolvedValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token is valid but user not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('instructorAuth middleware', () => {
    it('should allow instructor role', async () => {
      const mockInstructor = {
        id: 1,
        email: 'instructor@example.com',
        role: 'instructor'
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockInstructor);

      await instructorAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('should allow admin role', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockAdmin);

      await instructorAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('should deny non-instructor/admin roles', async () => {
      const mockStudent = {
        id: 1,
        email: 'student@example.com',
        role: 'student'
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockStudent);

      await instructorAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Instructor or admin role required.'
      });
    });
  });

  describe('adminAuth middleware', () => {
    it('should allow admin role', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockAdmin);

      await adminAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('should deny non-admin roles', async () => {
      const mockInstructor = {
        id: 1,
        email: 'instructor@example.com',
        role: 'instructor'
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockInstructor);

      await adminAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    });

    it('should deny when no token provided', async () => {
      req.header.mockReturnValue(undefined);

      await adminAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
