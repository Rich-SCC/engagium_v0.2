const db = require('../config/database');

class AttendanceRecord {
  // Create attendance record for a participant
  // participant_name is always required; student_id is optional (null if unmatched)
  static async create(attendanceData) {
    const { 
      session_id, 
      student_id = null, 
      participant_name, 
      status = 'present',
      total_duration_minutes = 0,
      first_joined_at = null,
      last_left_at = null
    } = attendanceData;

    const query = `
      INSERT INTO attendance_records (
        session_id, student_id, participant_name, status, 
        total_duration_minutes, first_joined_at, last_left_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (session_id, participant_name)
      DO UPDATE SET
        student_id = COALESCE(EXCLUDED.student_id, attendance_records.student_id),
        status = EXCLUDED.status,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        first_joined_at = COALESCE(attendance_records.first_joined_at, EXCLUDED.first_joined_at),
        last_left_at = EXCLUDED.last_left_at,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [
      session_id,
      student_id,
      participant_name,
      status,
      total_duration_minutes,
      first_joined_at,
      last_left_at
    ]);

    return result.rows[0];
  }

  // Create or update from participant detection (extension calls this)
  static async upsertFromParticipant(sessionId, participantName, studentId = null) {
    const now = new Date();
    
    const query = `
      INSERT INTO attendance_records (
        session_id, student_id, participant_name, status, first_joined_at
      )
      VALUES ($1, $2, $3, 'present', $4)
      ON CONFLICT (session_id, participant_name)
      DO UPDATE SET
        student_id = COALESCE(EXCLUDED.student_id, attendance_records.student_id),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [sessionId, studentId, participantName, now]);
    return result.rows[0];
  }

  // Bulk create/update attendance records (from extension sync)
  static async bulkUpsert(attendanceArray) {
    if (!attendanceArray || attendanceArray.length === 0) {
      return [];
    }

    const results = [];
    for (const record of attendanceArray) {
      const result = await this.create(record);
      results.push(result);
    }
    return results;
  }

  // Link attendance record to a student (when user clicks "Add to Roster")
  static async linkToStudent(sessionId, participantName, studentId) {
    const query = `
      UPDATE attendance_records
      SET student_id = $1, updated_at = NOW()
      WHERE session_id = $2 AND participant_name = $3
      RETURNING *
    `;

    const result = await db.query(query, [studentId, sessionId, participantName]);
    return result.rows[0];
  }

  // Update duration and timing for a participant
  static async updateDuration(sessionId, participantName, totalMinutes, lastLeftAt) {
    const query = `
      UPDATE attendance_records
      SET total_duration_minutes = $1,
          last_left_at = $2,
          updated_at = NOW()
      WHERE session_id = $3 AND participant_name = $4
      RETURNING *
    `;

    const result = await db.query(query, [totalMinutes, lastLeftAt, sessionId, participantName]);
    return result.rows[0];
  }

  // Find attendance records by session (with student info if linked)
  static async findBySessionId(sessionId) {
    const query = `
      SELECT 
        ar.*,
        s.full_name as student_name,
        s.student_id as student_number
      FROM attendance_records ar
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = $1
      ORDER BY ar.participant_name ASC
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  // Find attendance records by session with intervals
  static async findBySessionIdWithIntervals(sessionId) {
    const recordsQuery = `
      SELECT 
        ar.*,
        s.full_name as student_name,
        s.student_id as student_number
      FROM attendance_records ar
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = $1
      ORDER BY ar.participant_name ASC
    `;

    const intervalsQuery = `
      SELECT * FROM attendance_intervals
      WHERE session_id = $1
      ORDER BY participant_name ASC, joined_at ASC
    `;

    const [recordsResult, intervalsResult] = await Promise.all([
      db.query(recordsQuery, [sessionId]),
      db.query(intervalsQuery, [sessionId])
    ]);

    // Group intervals by participant_name
    const intervalsByParticipant = {};
    for (const interval of intervalsResult.rows) {
      if (!intervalsByParticipant[interval.participant_name]) {
        intervalsByParticipant[interval.participant_name] = [];
      }
      intervalsByParticipant[interval.participant_name].push(interval);
    }

    // Attach intervals to records
    return recordsResult.rows.map(record => ({
      ...record,
      intervals: intervalsByParticipant[record.participant_name] || []
    }));
  }

  // Get unmatched participants (those without student_id)
  static async findUnmatchedBySessionId(sessionId) {
    const query = `
      SELECT ar.*
      FROM attendance_records ar
      WHERE ar.session_id = $1 AND ar.student_id IS NULL
      ORDER BY ar.participant_name ASC
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  // Get matched participants (those with student_id)
  static async findMatchedBySessionId(sessionId) {
    const query = `
      SELECT 
        ar.*,
        s.full_name as student_name,
        s.student_id as student_number
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = $1
      ORDER BY s.full_name ASC
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  // Find attendance records by student
  static async findByStudentId(studentId, options = {}) {
    const { limit = 50 } = options;

    const query = `
      SELECT 
        ar.*,
        ses.title as session_title,
        ses.started_at,
        ses.ended_at,
        c.name as class_name
      FROM attendance_records ar
      JOIN sessions ses ON ar.session_id = ses.id
      JOIN classes c ON ses.class_id = c.id
      WHERE ar.student_id = $1
      ORDER BY ses.started_at DESC NULLS LAST
      LIMIT $2
    `;

    const result = await db.query(query, [studentId, limit]);
    return result.rows;
  }

  // Get attendance statistics for a student (updated for new schema)
  static async getStudentStats(studentId) {
    const query = `
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        ROUND(
          (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_rate,
        COALESCE(SUM(total_duration_minutes), 0) as total_minutes_attended,
        ROUND(AVG(total_duration_minutes), 2) as avg_minutes_per_session
      FROM attendance_records
      WHERE student_id = $1
    `;

    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  // Get attendance statistics for a class (updated for new schema)
  static async getClassStats(classId, options = {}) {
    const { startDate, endDate } = options;

    let query = `
      SELECT
        COUNT(DISTINCT ar.session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ar.student_id IS NOT NULL THEN ar.student_id END) as total_matched_students,
        COUNT(DISTINCT ar.participant_name) as total_participants,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as total_present,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as total_absent,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as total_late,
        ROUND(
          (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as overall_attendance_rate,
        COALESCE(SUM(ar.total_duration_minutes), 0) as total_class_minutes,
        ROUND(AVG(ar.total_duration_minutes), 2) as avg_duration_per_participant
      FROM attendance_records ar
      JOIN sessions s ON ar.session_id = s.id
      WHERE s.class_id = $1
    `;

    const params = [classId];

    if (startDate) {
      params.push(startDate);
      query += ` AND s.started_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND s.started_at <= $${params.length}`;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Get attendance trends over time for a class (updated for new schema)
  static async getAttendanceTrends(classId, options = {}) {
    const { startDate, endDate, limit = 10 } = options;

    let query = `
      SELECT
        s.id as session_id,
        s.title,
        s.started_at,
        s.ended_at,
        COUNT(*) as total_participants,
        COUNT(CASE WHEN ar.student_id IS NOT NULL THEN 1 END) as matched_participants,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
        ROUND(
          (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_rate,
        COALESCE(SUM(ar.total_duration_minutes), 0) as total_minutes,
        ROUND(AVG(ar.total_duration_minutes), 2) as avg_minutes_per_participant
      FROM sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE s.class_id = $1
    `;

    const params = [classId];

    if (startDate) {
      params.push(startDate);
      query += ` AND s.started_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND s.started_at <= $${params.length}`;
    }

    query += `
      GROUP BY s.id, s.title, s.started_at, s.ended_at
      ORDER BY s.started_at DESC NULLS LAST
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  // Update attendance record
  static async update(id, updates) {
    const { status, total_duration_minutes, first_joined_at, last_left_at, student_id } = updates;

    const query = `
      UPDATE attendance_records
      SET status = COALESCE($1, status),
          total_duration_minutes = COALESCE($2, total_duration_minutes),
          first_joined_at = COALESCE($3, first_joined_at),
          last_left_at = COALESCE($4, last_left_at),
          student_id = COALESCE($5, student_id),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const result = await db.query(query, [
      status, 
      total_duration_minutes, 
      first_joined_at, 
      last_left_at, 
      student_id,
      id
    ]);
    return result.rows[0];
  }

  // Find by ID
  static async findById(id) {
    const query = `
      SELECT 
        ar.*,
        s.full_name as student_name,
        s.student_id as student_number
      FROM attendance_records ar
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE ar.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Find by session and participant name
  static async findBySessionAndParticipant(sessionId, participantName) {
    const query = `
      SELECT 
        ar.*,
        s.full_name as student_name,
        s.student_id as student_number
      FROM attendance_records ar
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = $1 AND ar.participant_name = $2
    `;

    const result = await db.query(query, [sessionId, participantName]);
    return result.rows[0];
  }

  // Delete attendance record
  static async delete(id) {
    const query = 'DELETE FROM attendance_records WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Delete all attendance records for a session
  static async deleteBySessionId(sessionId) {
    const query = 'DELETE FROM attendance_records WHERE session_id = $1';
    await db.query(query, [sessionId]);
  }

  // Mark students as absent who are in the roster but not in attendance
  static async markAbsentStudents(sessionId, classId) {
    // Get students who are in the class but don't have an attendance record
    // Check both student_id AND participant_name to avoid duplicate key errors
    const query = `
      INSERT INTO attendance_records (session_id, student_id, participant_name, status)
      SELECT $1, s.id, s.full_name, 'absent'
      FROM students s
      WHERE s.class_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM attendance_records ar 
          WHERE ar.session_id = $1 
            AND (ar.student_id = s.id OR ar.participant_name = s.full_name)
        )
      RETURNING *
    `;

    const result = await db.query(query, [sessionId, classId]);
    return result.rows;
  }

  // Get session summary with all participants grouped by status
  static async getSessionSummary(sessionId) {
    const query = `
      SELECT
        COUNT(*) as total_participants,
        COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as matched_count,
        COUNT(CASE WHEN student_id IS NULL THEN 1 END) as unmatched_count,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COALESCE(SUM(total_duration_minutes), 0) as total_minutes,
        ROUND(AVG(total_duration_minutes), 2) as avg_minutes_per_participant
      FROM attendance_records
      WHERE session_id = $1
    `;

    const result = await db.query(query, [sessionId]);
    return result.rows[0];
  }
}

module.exports = AttendanceRecord;
