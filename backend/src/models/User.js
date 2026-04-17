const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async create(userData) {
    const { email, password, first_name, last_name, role = 'instructor' } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `;

    try {
      const result = await db.query(query, [email, password_hash, first_name, last_name, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, created_at
      FROM users
      WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateProfile(id, userData) {
    const { first_name, last_name, email } = userData;

    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, email = $3
      WHERE id = $4
      RETURNING id, email, first_name, last_name, role, updated_at
    `;

    try {
      const result = await db.query(query, [first_name, last_name, email, id]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `;

    await db.query(query, [password_hash, id]);
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate password reset token
  static async createPasswordResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store hashed token and expiration in database
    const query = `
      UPDATE users
      SET reset_token = $1, reset_token_expires = $2
      WHERE email = $3
      RETURNING id, email, first_name, last_name
    `;

    const result = await db.query(query, [hashedToken, expiresAt, email]);
    
    // Return the original unhashed token to send via email
    return {
      resetToken,
      user: result.rows[0]
    };
  }

  // Validate reset token and reset password
  static async resetPasswordWithToken(token, newPassword) {
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const query = `
      SELECT id, email, first_name, last_name, reset_token, reset_token_expires
      FROM users
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;

    const result = await db.query(query, [hashedToken]);
    
    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const user = result.rows[0];

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const updateQuery = `
      UPDATE users
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role
    `;

    const updateResult = await db.query(updateQuery, [password_hash, user.id]);
    return updateResult.rows[0];
  }

  // Clear password reset token
  static async clearPasswordResetToken(userId) {
    const query = `
      UPDATE users
      SET reset_token = NULL, reset_token_expires = NULL
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  // Store refresh token
  static async storeRefreshToken(userId, refreshToken, metadata = {}) {
    const {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceId = null,
      userAgent = null,
      ipAddress = null,
    } = metadata;
    const tokenHash = this.hashToken(refreshToken);

    const sessionQuery = `
      INSERT INTO refresh_token_sessions (
        user_id,
        token_hash,
        expires_at,
        device_id,
        user_agent,
        ip_address,
        last_used_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, token_hash)
      DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        revoked = false,
        device_id = EXCLUDED.device_id,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        last_used_at = NOW()
    `;

    const legacyQuery = `
      UPDATE users
      SET refresh_token = $1
      WHERE id = $2
    `;

    await db.query(sessionQuery, [
      userId,
      tokenHash,
      expiresAt,
      deviceId,
      userAgent,
      ipAddress,
    ]);
    await db.query(legacyQuery, [refreshToken, userId]);

    await db.query(
      `
        DELETE FROM refresh_token_sessions
        WHERE user_id = $1
          AND (revoked = true OR expires_at <= NOW())
      `,
      [userId]
    );
  }

  // Validate refresh token
  static async validateRefreshToken(userId, refreshToken) {
    const tokenHash = this.hashToken(refreshToken);

    const sessionQuery = `
      SELECT id
      FROM refresh_token_sessions
      WHERE user_id = $1
        AND token_hash = $2
        AND revoked = false
        AND expires_at > NOW()
      LIMIT 1
    `;
    const sessionResult = await db.query(sessionQuery, [userId, tokenHash]);

    if (sessionResult.rows.length > 0) {
      await db.query(
        `
          UPDATE refresh_token_sessions
          SET last_used_at = NOW()
          WHERE id = $1
        `,
        [sessionResult.rows[0].id]
      );
      return true;
    }

    const legacyQuery = `
      SELECT refresh_token
      FROM users
      WHERE id = $1
    `;

    const legacyResult = await db.query(legacyQuery, [userId]);

    if (legacyResult.rows.length === 0) {
      return false;
    }

    return legacyResult.rows[0].refresh_token === refreshToken;
  }

  static async rotateRefreshToken(userId, oldRefreshToken, newRefreshToken, metadata = {}) {
    const {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceId = null,
      userAgent = null,
      ipAddress = null,
    } = metadata;

    const oldHash = this.hashToken(oldRefreshToken);
    const newHash = this.hashToken(newRefreshToken);

    const rotateQuery = `
      UPDATE refresh_token_sessions
      SET token_hash = $3,
          expires_at = $4,
          revoked = false,
          device_id = $5,
          user_agent = $6,
          ip_address = $7,
          last_used_at = NOW()
      WHERE user_id = $1
        AND token_hash = $2
    `;

    const rotated = await db.query(rotateQuery, [
      userId,
      oldHash,
      newHash,
      expiresAt,
      deviceId,
      userAgent,
      ipAddress,
    ]);

    if (rotated.rowCount === 0) {
      await this.storeRefreshToken(userId, newRefreshToken, metadata);
      return;
    }

    await db.query(
      `
        UPDATE users
        SET refresh_token = $1
        WHERE id = $2
      `,
      [newRefreshToken, userId]
    );
  }

  static async revokeRefreshToken(userId, refreshToken) {
    const tokenHash = this.hashToken(refreshToken);

    await db.query(
      `
        UPDATE refresh_token_sessions
        SET revoked = true
        WHERE user_id = $1
          AND token_hash = $2
      `,
      [userId, tokenHash]
    );

    await db.query(
      `
        UPDATE users
        SET refresh_token = CASE WHEN refresh_token = $1 THEN NULL ELSE refresh_token END
        WHERE id = $2
      `,
      [refreshToken, userId]
    );
  }

  // Clear refresh token (for logout)
  static async clearRefreshToken(userId) {
    await db.query(
      `
        UPDATE refresh_token_sessions
        SET revoked = true
        WHERE user_id = $1
      `,
      [userId]
    );

    await db.query(
      `
        UPDATE users
        SET refresh_token = NULL
        WHERE id = $1
      `,
      [userId]
    );
  }
}

module.exports = User;