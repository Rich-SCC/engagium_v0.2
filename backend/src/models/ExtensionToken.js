const pool = require('../config/database');
const crypto = require('crypto');

class ExtensionToken {
  /**
   * Generate a secure random token
   * @returns {string} A 32-byte random token in hex format
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token for storage
   * @param {string} token - The plain token
   * @returns {string} The hashed token
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new extension token for a user
   * @param {string} userId - The user's ID
   * @param {number} expiryDays - Number of days until expiration (default 30)
   * @returns {Object} The plain token and token info
   */
  static async create(userId, expiryDays = 30) {
    const plainToken = this.generateToken();
    const tokenHash = this.hashToken(plainToken);
    const tokenPreview = plainToken.substring(0, 8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const query = `
      INSERT INTO extension_tokens (user_id, token_hash, token_preview, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, token_preview, expires_at, created_at
    `;
    
    const result = await pool.query(query, [userId, tokenHash, tokenPreview, expiresAt]);
    
    return {
      plainToken, // Only returned once, never stored
      tokenInfo: result.rows[0]
    };
  }

  /**
   * Verify a token and return the user ID if valid
   * @param {string} token - The plain token to verify
   * @returns {Object|null} User ID and token info if valid, null otherwise
   */
  static async verify(token) {
    const tokenHash = this.hashToken(token);
    
    const query = `
      SELECT et.id, et.user_id, et.expires_at, et.revoked, u.email, u.first_name, u.last_name, u.role
      FROM extension_tokens et
      JOIN users u ON et.user_id = u.id
      WHERE et.token_hash = $1
        AND et.revoked = false
        AND et.expires_at > NOW()
    `;
    
    const result = await pool.query(query, [tokenHash]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const tokenData = result.rows[0];

    // Update last_used_at
    await pool.query(
      'UPDATE extension_tokens SET last_used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );

    return {
      userId: tokenData.user_id,
      user: {
        id: tokenData.user_id,
        email: tokenData.email,
        first_name: tokenData.first_name,
        last_name: tokenData.last_name,
        role: tokenData.role
      }
    };
  }

  /**
   * Get all tokens for a user
   * @param {string} userId - The user's ID
   * @returns {Array} List of tokens (without hash)
   */
  static async getByUserId(userId) {
    const query = `
      SELECT id, token_preview, last_used_at, expires_at, revoked, created_at
      FROM extension_tokens
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Revoke a token
   * @param {string} tokenId - The token's ID
   * @param {string} userId - The user's ID (for security)
   * @returns {boolean} True if revoked successfully
   */
  static async revoke(tokenId, userId) {
    const query = `
      UPDATE extension_tokens
      SET revoked = true
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [tokenId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Revoke all tokens for a user
   * @param {string} userId - The user's ID
   * @returns {number} Number of tokens revoked
   */
  static async revokeAll(userId) {
    const query = `
      UPDATE extension_tokens
      SET revoked = true
      WHERE user_id = $1 AND revoked = false
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.length;
  }

  /**
   * Clean up expired tokens (called periodically)
   * @returns {number} Number of tokens deleted
   */
  static async cleanupExpired() {
    const query = `
      DELETE FROM extension_tokens
      WHERE expires_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `;
    
    const result = await pool.query(query);
    return result.rows.length;
  }
}

module.exports = ExtensionToken;
