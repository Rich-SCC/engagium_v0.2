const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ExtensionToken = require('../models/ExtensionToken');

/**
 * Flexible auth middleware that accepts either:
 * - JWT token in Authorization header (for web app)
 * - Extension token in X-Extension-Token header (for extension)
 * 
 * Both methods result in req.user being populated
 */
const flexibleAuth = async (req, res, next) => {
  try {
    // Check for JWT token first (Authorization header)
    const jwtToken = req.header('Authorization')?.replace('Bearer ', '');
    
    if (jwtToken) {
      // Verify JWT token
      try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Token is valid but user not found'
          });
        }

        req.user = user;
        return next();
      } catch (jwtError) {
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            error: 'Invalid JWT token'
          });
        } else if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'JWT token expired'
          });
        }
        throw jwtError;
      }
    }

    // Check for extension token (X-Extension-Token header)
    const extensionToken = req.header('X-Extension-Token');
    
    if (extensionToken) {
      const result = await ExtensionToken.verify(extensionToken);

      if (!result) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired extension token'
        });
      }

      req.user = result.user;
      return next();
    }

    // No valid token found
    return res.status(401).json({
      success: false,
      error: 'No authentication token provided'
    });

  } catch (error) {
    console.error('Flexible auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = { flexibleAuth };
