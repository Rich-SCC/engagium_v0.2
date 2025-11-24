const db = require('../config/database');

class Session {
  static async create(sessionData) {
    const { class_id, title, meeting_link } = sessionData;

    const query = `
      INSERT INTO sessions (class_id, title, meeting_link)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [class_id, title, meeting_link]);
    return result.rows[0];
  }

  static async findByInstructorId(instructorId) {
    const query = `
      SELECT s.*, c.name as class_name, c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1
      ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, [instructorId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT s.*, c.name as class_name, c.subject, c.instructor_id
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByClassId(classId) {
    const query = `
      SELECT * FROM sessions
      WHERE class_id = $1
      ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, [classId]);
    return result.rows;
  }

  static async update(id, sessionData) {
    const { title, meeting_link } = sessionData;

    const query = `
      UPDATE sessions
      SET title = $1, meeting_link = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(query, [title, meeting_link, id]);
    return result.rows[0];
  }

  static async start(id) {
    const query = `
      UPDATE sessions
      SET status = 'active', started_at = NOW()
      WHERE id = $1 AND status = 'scheduled'
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async end(id) {
    const query = `
      UPDATE sessions
      SET status = 'ended', ended_at = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    // Delete participation logs first
    await db.query('DELETE FROM participation_logs WHERE session_id = $1', [id]);

    // Then delete the session
    const query = 'DELETE FROM sessions WHERE id = $1';
    await db.query(query, [id]);
  }

  static async getActiveSessionCount(instructorId) {
    const query = `
      SELECT COUNT(*) as count
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1 AND s.status = 'active'
    `;

    const result = await db.query(query, [instructorId]);
    return parseInt(result.rows[0].count);
  }

  static async getSessionStats(sessionId) {
    const query = `
      SELECT
        COUNT(DISTINCT student_id) as unique_participants,
        COUNT(*) as total_interactions,
        COUNT(CASE WHEN interaction_type = 'manual_entry' THEN 1 END) as manual_entries,
        COUNT(CASE WHEN interaction_type = 'chat' THEN 1 END) as chat_messages,
        COUNT(CASE WHEN interaction_type = 'reaction' THEN 1 END) as reactions,
        COUNT(CASE WHEN interaction_type = 'mic_toggle' THEN 1 END) as mic_toggles,
        COUNT(CASE WHEN interaction_type = 'camera_toggle' THEN 1 END) as camera_toggles
      FROM participation_logs
      WHERE session_id = $1
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows[0];
  }
}

module.exports = Session;