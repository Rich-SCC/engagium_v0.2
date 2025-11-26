const db = require('../config/database');

class Session {
  static async create(sessionData) {
    const { class_id, title, meeting_link, session_date, session_time, topic, description } = sessionData;

    const query = `
      INSERT INTO sessions (class_id, title, meeting_link, session_date, session_time, topic, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      class_id, 
      title, 
      meeting_link,
      session_date || null,
      session_time || null,
      topic || null,
      description || null
    ]);
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

  static async findByClassId(classId, options = {}) {
    const { startDate, endDate, status } = options;
    
    let query = `
      SELECT * FROM sessions
      WHERE class_id = $1
    `;
    const params = [classId];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND session_date >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND session_date <= $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY session_date DESC, session_time DESC, created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, sessionData) {
    const { title, meeting_link, session_date, session_time, topic, description } = sessionData;

    const query = `
      UPDATE sessions
      SET title = COALESCE($1, title),
          meeting_link = COALESCE($2, meeting_link),
          session_date = COALESCE($3, session_date),
          session_time = COALESCE($4, session_time),
          topic = COALESCE($5, topic),
          description = COALESCE($6, description)
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      meeting_link,
      session_date,
      session_time,
      topic,
      description,
      id
    ]);
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

  static async findWithAttendance(sessionId) {
    const query = `
      SELECT 
        s.*,
        c.name as class_name,
        c.subject,
        c.instructor_id,
        (
          SELECT json_agg(json_build_object(
            'id', ar.id,
            'student_id', ar.student_id,
            'first_name', st.first_name,
            'last_name', st.last_name,
            'email', st.email,
            'status', ar.status,
            'joined_at', ar.joined_at,
            'left_at', ar.left_at
          ))
          FROM attendance_records ar
          JOIN students st ON ar.student_id = st.id
          WHERE ar.session_id = s.id
        ) as attendance
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows[0];
  }

  static async findByDateRange(instructorId, startDate, endDate) {
    const query = `
      SELECT s.*, c.name as class_name, c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1
        AND session_date >= $2
        AND session_date <= $3
      ORDER BY session_date ASC, session_time ASC
    `;

    const result = await db.query(query, [instructorId, startDate, endDate]);
    return result.rows;
  }

  static async getCalendarData(instructorId, year, month) {
    const query = `
      SELECT 
        s.id,
        s.title,
        s.topic,
        s.session_date,
        s.session_time,
        s.status,
        c.id as class_id,
        c.name as class_name,
        c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1
        AND EXTRACT(YEAR FROM session_date) = $2
        AND EXTRACT(MONTH FROM session_date) = $3
      ORDER BY session_date ASC, session_time ASC
    `;

    const result = await db.query(query, [instructorId, year, month]);
    return result.rows;
  }

  static async getAttendanceStats(sessionId) {
    const query = `
      SELECT
        COUNT(*) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        ROUND(
          (COUNT(CASE WHEN status = 'present' THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_rate
      FROM attendance_records
      WHERE session_id = $1
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows[0];
  }
}

module.exports = Session;