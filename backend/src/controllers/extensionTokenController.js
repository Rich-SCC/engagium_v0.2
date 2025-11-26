const ExtensionToken = require('../models/ExtensionToken');

/**
 * Generate a new extension token
 * POST /api/extension-tokens/generate
 */
const generateToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plainToken, tokenInfo } = await ExtensionToken.create(userId, 30);
    
    res.json({
      success: true,
      data: {
        token: plainToken,
        token_preview: tokenInfo.token_preview,
        expires_at: tokenInfo.expires_at,
        created_at: tokenInfo.created_at
      },
      message: 'Extension token generated successfully. Save this token securely - it will not be shown again.'
    });
  } catch (error) {
    console.error('Generate extension token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate extension token'
    });
  }
};

/**
 * Get all extension tokens for the current user
 * GET /api/extension-tokens
 */
const getTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const tokens = await ExtensionToken.getByUserId(userId);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Get extension tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve extension tokens'
    });
  }
};

/**
 * Revoke a specific extension token
 * DELETE /api/extension-tokens/:id
 */
const revokeToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const tokenId = req.params.id;
    
    const revoked = await ExtensionToken.revoke(tokenId, userId);
    
    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or already revoked'
      });
    }
    
    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    console.error('Revoke extension token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke extension token'
    });
  }
};

/**
 * Revoke all extension tokens for the current user
 * DELETE /api/extension-tokens/revoke-all
 */
const revokeAllTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await ExtensionToken.revokeAll(userId);
    
    res.json({
      success: true,
      data: { count },
      message: `${count} token(s) revoked successfully`
    });
  } catch (error) {
    console.error('Revoke all extension tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke extension tokens'
    });
  }
};

/**
 * Verify an extension token (for extension use)
 * POST /api/extension-tokens/verify
 */
const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    const result = await ExtensionToken.verify(token);
    
    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: result.user
      }
    });
  } catch (error) {
    console.error('Verify extension token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify extension token'
    });
  }
};

module.exports = {
  generateToken,
  getTokens,
  revokeToken,
  revokeAllTokens,
  verifyToken
};
