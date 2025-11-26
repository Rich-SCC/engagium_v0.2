const db = require('../config/database');

class ParticipationLog {
  static async create(logData) {
    const { session_id, student_id, interaction_type, interaction_value, additional_data } = logData;

    const query = `
      INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, additional_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [
      session_id,
      student_id,
      interaction_type,
      interaction_value,
      additional_data ? JSON.stringify(additional_data) : null
    ]);

    return result.rows[0];
  }

  static async findBySessionId(sessionId, options = {}) {
    const { limit = 100, offset = 0, interaction_type = null } = options;

    let query = `
      SELECT pl.*, s.first_name, s.last_name, s.student_id
      FROM participation_logs pl
      JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
    `;

    const params = [sessionId];

    if (interaction_type) {
      query += ' AND pl.interaction_type = $2';
      params.push(interaction_type);
    }

    query += ' ORDER BY pl.timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findBySessionIdWithPagination(sessionId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM participation_logs WHERE session_id = $1';
    const countResult = await db.query(countQuery, [sessionId]);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT pl.*, s.first_name, s.last_name, s.student_id
      FROM participation_logs pl
      JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
      ORDER BY pl.timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const dataResult = await db.query(dataQuery, [sessionId, limit, offset]);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findByStudentId(studentId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const query = `
      SELECT pl.*, s.title as session_title, c.name as class_name
      FROM participation_logs pl
      JOIN sessions s ON pl.session_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN students st ON pl.student_id = st.id
      WHERE pl.student_id = $1
      ORDER BY pl.timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [studentId, limit, offset]);
    return result.rows;
  }

  static async getSessionInteractionSummary(sessionId) {
    const query = `
      SELECT
        interaction_type,
        COUNT(*) as count,
        COUNT(DISTINCT student_id) as unique_students
      FROM participation_logs
      WHERE session_id = $1
      GROUP BY interaction_type
      ORDER BY count DESC
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  static async getStudentSessionSummary(sessionId) {
    const query = `
      SELECT
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.student_id,
        COUNT(pl.id) as total_interactions,
        COUNT(CASE WHEN pl.interaction_type = 'manual_entry' THEN 1 END) as manual_entries,
        COUNT(CASE WHEN pl.interaction_type = 'chat' THEN 1 END) as chat_messages,
        COUNT(CASE WHEN pl.interaction_type = 'reaction' THEN 1 END) as reactions,
        MAX(pl.timestamp) as last_interaction
      FROM students s
      LEFT JOIN participation_logs pl ON s.id = pl.student_id AND pl.session_id = $1
      WHERE s.class_id = (SELECT class_id FROM sessions WHERE id = $1)
      GROUP BY s.id, s.first_name, s.last_name, s.student_id
      ORDER BY s.last_name, s.first_name
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  static async deleteBySessionId(sessionId) {
    const query = 'DELETE FROM participation_logs WHERE session_id = $1';
    const result = await db.query(query, [sessionId]);
    return result.rowCount;
  }

  static async getRecentActivity(sessionId, minutes = 5) {
    const query = `
      SELECT pl.*, s.first_name, s.last_name, s.student_id
      FROM participation_logs pl
      JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
        AND pl.timestamp >= NOW() - INTERVAL '${minutes} minutes'
      ORDER BY pl.timestamp DESC
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  static async getClassStudentCount(classId) {
    const query = 'SELECT COUNT(*) as total_students FROM students WHERE class_id = $1';
    const result = await db.query(query, [classId]);
    return result.rows[0].total_students;
  }
}

module.exports = ParticipationLog;