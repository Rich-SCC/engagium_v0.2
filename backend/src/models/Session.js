const db = require('../config/database');

class Session {
  static async create(sessionData) {
    const { class_id, title, meeting_link, started_at, additional_data } = sessionData;

    const query = `
      INSERT INTO sessions (class_id, title, meeting_link, started_at, status, additional_data)
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING *
    `;

    const additionalDataJson = additional_data ? JSON.stringify(additional_data) : null;

    const result = await db.query(query, [
      class_id, 
      title, 
      meeting_link,
      started_at || null,
      additionalDataJson
    ]);
    return result.rows[0];
  }

  static async findByInstructorId(instructorId) {
    const query = `
      SELECT s.*, 
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject
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
      SELECT s.*, 
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject, c.instructor_id
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
      query += ` AND started_at >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND started_at <= $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY started_at DESC NULLS LAST, created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, sessionData) {
    const { title, meeting_link, additional_data } = sessionData;

    const query = `
      UPDATE sessions
      SET title = COALESCE($1, title),
          meeting_link = COALESCE($2, meeting_link),
          additional_data = COALESCE($3, additional_data)
      WHERE id = $4
      RETURNING *
    `;

    const additionalDataJson = additional_data ? JSON.stringify(additional_data) : null;

    const result = await db.query(query, [
      title,
      meeting_link,
      additionalDataJson,
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

  static async updateEndTime(id, ended_at) {
    const query = `
      UPDATE sessions
      SET status = 'ended', ended_at = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [ended_at, id]);
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

  static async findActiveByInstructorId(instructorId) {
    const query = `
      SELECT s.*, 
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1 AND s.status = 'active'
      ORDER BY s.started_at DESC
    `;

    const result = await db.query(query, [instructorId]);
    return result.rows;
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
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject,
        c.instructor_id,
        (
          SELECT json_agg(json_build_object(
            'id', ar.id,
            'student_id', ar.student_id,
            'participant_name', ar.participant_name,
            'student_name', st.full_name,
            'full_name', st.full_name,
            'status', ar.status,
            'first_joined_at', ar.first_joined_at,
            'last_left_at', ar.last_left_at,
            'total_duration_minutes', ar.total_duration_minutes,
            'intervals', (
              SELECT json_agg(json_build_object(
                'id', ai.id,
                'joined_at', ai.joined_at,
                'left_at', ai.left_at
              ) ORDER BY ai.joined_at)
              FROM attendance_intervals ai
              WHERE ai.session_id = ar.session_id 
                AND ai.participant_name = ar.participant_name
            )
          ))
          FROM attendance_records ar
          LEFT JOIN students st ON ar.student_id = st.id
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
      SELECT s.*, 
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1
        AND started_at >= $2
        AND started_at <= $3
      ORDER BY started_at ASC
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
        s.description,
        s.started_at,
        s.ended_at,
        s.status,
        c.id as class_id,
        CASE 
          WHEN c.section IS NOT NULL AND c.subject IS NOT NULL THEN c.section || ' ' || c.subject || ' - ' || c.name
          WHEN c.section IS NOT NULL THEN c.section || ' - ' || c.name
          WHEN c.subject IS NOT NULL THEN c.subject || ' - ' || c.name
          ELSE c.name
        END as class_name,
        c.subject
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE c.instructor_id = $1
        AND EXTRACT(YEAR FROM started_at) = $2
        AND EXTRACT(MONTH FROM started_at) = $3
      ORDER BY started_at ASC
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