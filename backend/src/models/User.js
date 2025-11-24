const db = require('../config/database');
const bcrypt = require('bcrypt');

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
}

module.exports = User;