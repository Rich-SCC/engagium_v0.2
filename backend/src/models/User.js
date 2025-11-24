const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
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
  static async storeRefreshToken(userId, refreshToken) {
    const query = `
      UPDATE users
      SET refresh_token = $1
      WHERE id = $2
    `;

    await db.query(query, [refreshToken, userId]);
  }

  // Validate refresh token
  static async validateRefreshToken(userId, refreshToken) {
    const query = `
      SELECT refresh_token
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].refresh_token === refreshToken;
  }

  // Clear refresh token (for logout)
  static async clearRefreshToken(userId) {
    const query = `
      UPDATE users
      SET refresh_token = NULL
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }
}

module.exports = User;