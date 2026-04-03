const db = require('../config/database');

class ParticipationLog {
  static getMicStartFilterSql(alias = 'pl') {
    return `NOT (
      ${alias}.interaction_type = 'mic_toggle'
      AND (
        COALESCE(${alias}.additional_data->>'speakingAction', '') = 'start'
        OR COALESCE(${alias}.additional_data->>'isMuted', '') = 'false'
      )
    )`;
  }

  static async create(logData) {
    const {
      session_id,
      student_id,
      interaction_type,
      interaction_value,
      timestamp,
      additional_data
    } = logData;

    const query = `
      INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp, additional_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      session_id,
      student_id,
      interaction_type,
      interaction_value,
      timestamp || null,
      additional_data ? JSON.stringify(additional_data) : null
    ]);

    return result.rows[0];
  }

  static async findBySessionId(sessionId, options = {}) {
    const { limit = 100, offset = 0, interaction_type = null } = options;

    let query = `
      SELECT
        pl.*,
        s.full_name,
        s.student_id,
        COALESCE(s.full_name, pl.additional_data->>'participant_name') as student_name,
        COALESCE(pl.additional_data->>'participant_name', s.full_name) as participant_name
      FROM participation_logs pl
      LEFT JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
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

  static async findBySessionIdWithPagination(sessionId, page = 1, limit = 50, interaction_type = null) {
    const offset = (page - 1) * limit;

    // Get total count
    const countParams = [sessionId];
    let countQuery = `
      SELECT COUNT(*) as total
      FROM participation_logs pl
      WHERE pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
    `;

    if (interaction_type) {
      countQuery += ' AND interaction_type = $2';
      countParams.push(interaction_type);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    let dataQuery = `
      SELECT
        pl.*,
        s.full_name,
        s.student_id,
        COALESCE(s.full_name, pl.additional_data->>'participant_name') as student_name,
        COALESCE(pl.additional_data->>'participant_name', s.full_name) as participant_name
      FROM participation_logs pl
      LEFT JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
    `;

    const dataParams = [sessionId];

    if (interaction_type) {
      dataQuery += ' AND pl.interaction_type = $2';
      dataParams.push(interaction_type);
    }

    dataQuery += `
      ORDER BY pl.timestamp DESC
      LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}
    `;

    dataParams.push(limit, offset);

    const dataResult = await db.query(dataQuery, dataParams);

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
      FROM participation_logs pl
      WHERE pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
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
        s.full_name,
        s.student_id,
        COUNT(pl.id) as total_interactions,
        COUNT(CASE WHEN pl.interaction_type = 'manual_entry' THEN 1 END) as manual_entries,
        COUNT(CASE WHEN pl.interaction_type = 'chat' THEN 1 END) as chat_messages,
        COUNT(CASE WHEN pl.interaction_type = 'reaction' THEN 1 END) as reactions,
        MAX(pl.timestamp) as last_interaction
      FROM students s
      LEFT JOIN participation_logs pl ON s.id = pl.student_id
        AND pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
      WHERE s.class_id = (SELECT class_id FROM sessions WHERE id = $1)
      GROUP BY s.id, s.full_name, s.student_id
      ORDER BY s.full_name
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
      SELECT 
        pl.*, 
        COALESCE(s.full_name, pl.additional_data->>'participant_name') as full_name,
        s.student_id,
        COALESCE(s.full_name, pl.additional_data->>'participant_name') as student_name
      FROM participation_logs pl
      LEFT JOIN students s ON pl.student_id = s.id
      WHERE pl.session_id = $1
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
        AND pl.timestamp >= NOW() - INTERVAL '1 minute' * $2
      ORDER BY pl.timestamp DESC
      LIMIT 100
    `;

    const result = await db.query(query, [sessionId, minutes]);
    return result.rows;
  }

  static async findBySourceEventId(sessionId, sourceEventId) {
    if (!sourceEventId) {
      return null;
    }

    const query = `
      SELECT *
      FROM participation_logs
      WHERE session_id = $1
        AND additional_data->>'source_event_id' = $2
      LIMIT 1
    `;

    const result = await db.query(query, [sessionId, sourceEventId]);
    return result.rows[0] || null;
  }

  static async findMostRecentMicUnmute(sessionId, participantName, beforeTimestamp) {
    if (!sessionId || !participantName) {
      return null;
    }

    const query = `
      SELECT *
      FROM participation_logs
      WHERE session_id = $1
        AND interaction_type = 'mic_toggle'
        AND COALESCE(additional_data->>'participant_name', '') ILIKE $2
        AND (additional_data->>'isMuted')::text = 'false'
        AND timestamp < $3
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await db.query(query, [
      sessionId,
      participantName,
      beforeTimestamp || new Date().toISOString()
    ]);

    return result.rows[0] || null;
  }

  static async getClassStudentCount(classId) {
    const query = 'SELECT COUNT(*) as total_students FROM students WHERE class_id = $1 AND deleted_at IS NULL';
    const result = await db.query(query, [classId]);
    return result.rows[0].total_students;
  }
}

module.exports = ParticipationLog;