const ExtensionToken = require('../models/ExtensionToken');

/**
 * Middleware to authenticate requests using extension tokens
 * Use this for extension-only endpoints
 */
const extensionAuth = async (req, res, next) => {
  try {
    const token = req.header('X-Extension-Token');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No extension token provided'
      });
    }

    // Verify the extension token
    const result = await ExtensionToken.verify(token);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired extension token'
      });
    }

    // Attach user info to request (same format as JWT auth for compatibility)
    req.user = result.user;
    next();
  } catch (error) {
    console.error('Extension auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = { extensionAuth };
