const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is valid but user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Middleware to check if user is instructor or admin
const instructorAuth = async (req, res, next) => {
  try {
    // First run the base auth middleware
    await auth(req, res, () => {
      if (req.user.role === 'instructor' || req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Access denied. Instructor or admin role required.'
        });
      }
    });
  } catch (error) {
    console.error('Instructor auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    // First run the base auth middleware
    await auth(req, res, () => {
      if (req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = { auth, instructorAuth, adminAuth };