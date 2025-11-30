const db = require('../config/database');

class AttendanceInterval {
  /**
   * Create a new attendance interval (when participant joins)
   */
  static async create(intervalData) {
    const { session_id, student_id, participant_name, joined_at } = intervalData;

    const query = `
      INSERT INTO attendance_intervals (session_id, student_id, participant_name, joined_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(query, [
      session_id,
      student_id || null,
      participant_name,
      joined_at || new Date().toISOString()
    ]);

    return result.rows[0];
  }

  /**
   * Close an open interval (when participant leaves)
   * Finds the most recent open interval for this participant and sets left_at
   */
  static async closeInterval(sessionId, participantName, leftAt) {
    const query = `
      UPDATE attendance_intervals
      SET left_at = $1
      WHERE id = (
        SELECT id FROM attendance_intervals
        WHERE session_id = $2 
        AND LOWER(participant_name) = LOWER($3)
        AND left_at IS NULL
        ORDER BY joined_at DESC
        LIMIT 1
      )
      RETURNING *
    `;

    const result = await db.query(query, [
      leftAt || new Date().toISOString(),
      sessionId,
      participantName
    ]);

    return result.rows[0];
  }

  /**
   * Close all open intervals for a session (when session ends)
   * Sets left_at to the provided endedAt time
   */
  static async closeAllOpenIntervals(sessionId, endedAt) {
    const query = `
      UPDATE attendance_intervals
      SET left_at = $1
      WHERE session_id = $2 AND left_at IS NULL
      RETURNING *
    `;

    const result = await db.query(query, [
      endedAt || new Date().toISOString(),
      sessionId
    ]);

    return result.rows;
  }

  /**
   * Get all intervals for a session
   */
  static async findBySessionId(sessionId) {
    const query = `
      SELECT ai.*, s.full_name as student_name
      FROM attendance_intervals ai
      LEFT JOIN students s ON ai.student_id = s.id
      WHERE ai.session_id = $1
      ORDER BY ai.participant_name, ai.joined_at
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get all intervals for a specific participant in a session
   */
  static async findBySessionAndParticipant(sessionId, participantName) {
    const query = `
      SELECT * FROM attendance_intervals
      WHERE session_id = $1 AND LOWER(participant_name) = LOWER($2)
      ORDER BY joined_at
    `;

    const result = await db.query(query, [sessionId, participantName]);
    return result.rows;
  }

  /**
   * Calculate total duration in minutes for a participant in a session
   * Returns sum of all (left_at - joined_at) intervals
   */
  static async calculateTotalDuration(sessionId, participantName) {
    const query = `
      SELECT 
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (COALESCE(left_at, NOW()) - joined_at)) / 60
          ), 
          0
        )::INTEGER as total_minutes,
        MIN(joined_at) as first_joined_at,
        MAX(COALESCE(left_at, NOW())) as last_left_at,
        COUNT(*) as interval_count
      FROM attendance_intervals
      WHERE session_id = $1 AND LOWER(participant_name) = LOWER($2)
    `;

    const result = await db.query(query, [sessionId, participantName]);
    return result.rows[0];
  }

  /**
   * Get attendance summary for all participants in a session
   * Groups by participant and calculates total duration
   */
  static async getSessionAttendanceSummary(sessionId) {
    const query = `
      SELECT 
        ai.participant_name,
        ai.student_id,
        s.full_name as student_name,
        MIN(ai.joined_at) as first_joined_at,
        MAX(COALESCE(ai.left_at, NOW())) as last_left_at,
        COUNT(*) as interval_count,
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (COALESCE(ai.left_at, NOW()) - ai.joined_at)) / 60
          ), 
          0
        )::INTEGER as total_duration_minutes
      FROM attendance_intervals ai
      LEFT JOIN students s ON ai.student_id = s.id
      WHERE ai.session_id = $1
      GROUP BY ai.participant_name, ai.student_id, s.full_name
      ORDER BY ai.participant_name
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Link existing intervals to a student (when creating student from participant)
   */
  static async linkToStudent(sessionId, participantName, studentId) {
    const query = `
      UPDATE attendance_intervals
      SET student_id = $1
      WHERE session_id = $2 AND LOWER(participant_name) = LOWER($3)
      RETURNING *
    `;

    const result = await db.query(query, [studentId, sessionId, participantName]);
    
    // Also update attendance_records if exists
    const updateRecords = `
      UPDATE attendance_records
      SET student_id = $1
      WHERE session_id = $2 AND LOWER(participant_name) = LOWER($3)
    `;
    await db.query(updateRecords, [studentId, sessionId, participantName]);

    return result.rows;
  }

  /**
   * Check if participant has an open interval (currently in meeting)
   */
  static async hasOpenInterval(sessionId, participantName) {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM attendance_intervals
        WHERE session_id = $1 
        AND LOWER(participant_name) = LOWER($2)
        AND left_at IS NULL
      ) as is_present
    `;

    const result = await db.query(query, [sessionId, participantName]);
    return result.rows[0].is_present;
  }

  /**
   * Get list of currently present participants (have open intervals)
   */
  static async getCurrentlyPresent(sessionId) {
    const query = `
      SELECT DISTINCT ai.participant_name, ai.student_id, s.full_name as student_name, ai.joined_at
      FROM attendance_intervals ai
      LEFT JOIN students s ON ai.student_id = s.id
      WHERE ai.session_id = $1 AND ai.left_at IS NULL
      ORDER BY ai.participant_name
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Delete all intervals for a session
   */
  static async deleteBySessionId(sessionId) {
    const query = 'DELETE FROM attendance_intervals WHERE session_id = $1';
    await db.query(query, [sessionId]);
  }

  /**
   * Bulk create intervals (for batch submission from extension)
   */
  static async bulkCreate(intervals) {
    if (!intervals || intervals.length === 0) {
      return [];
    }

    const values = [];
    const placeholders = [];
    
    intervals.forEach((interval, index) => {
      const offset = index * 5;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      );
      values.push(
        interval.session_id,
        interval.student_id || null,
        interval.participant_name,
        interval.joined_at,
        interval.left_at || null
      );
    });

    const query = `
      INSERT INTO attendance_intervals (session_id, student_id, participant_name, joined_at, left_at)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = AttendanceInterval;
