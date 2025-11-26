const db = require('../config/database');

class Notification {
  static async create(notificationData) {
    const { user_id, type, title, message, action_url } = notificationData;

    const query = `
      INSERT INTO notifications (user_id, type, title, message, action_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [
      user_id,
      type,
      title,
      message,
      action_url || null
    ]);
    return result.rows[0];
  }

  static async findByUserId(userId, unreadOnly = false) {
    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
    `;

    if (unreadOnly) {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE user_id = $1 AND read = false
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1';
    await db.query(query, [id]);
  }

  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Notification;
