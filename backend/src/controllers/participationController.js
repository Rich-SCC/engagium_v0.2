const ParticipationLog = require('../models/ParticipationLog');
const Session = require('../models/Session');
const Student = require('../models/Student');
const db = require('../config/database');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeUuidList = (values) => [...new Set(
  values
    .map((value) => String(value || '').trim())
    .filter((value) => UUID_REGEX.test(value))
)];

// Get all participation logs for a session
const getParticipationLogs = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50, interaction_type } = req.query;

    // First get the session to check access
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    let result;
    if (page && limit) {
      // Paginated results
      result = await ParticipationLog.findBySessionIdWithPagination(
        sessionId,
        parseInt(page),
        parseInt(limit),
        interaction_type || null
      );
    } else {
      // Simple results
      const logs = await ParticipationLog.findBySessionId(sessionId, {
        interaction_type,
        limit: parseInt(limit) || 100
      });
      result = { data: logs };
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get participation logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get participation logs for multiple sessions in one request (analytics optimization)
const getBulkParticipationLogs = async (req, res) => {
  try {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionIds must be a non-empty array'
      });
    }

    const normalizedSessionIds = normalizeUuidList(sessionIds);

    if (normalizedSessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionIds must contain valid UUIDs'
      });
    }

    const accessQuery = `
      SELECT s.id
      FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = ANY($1)
        AND c.instructor_id = $2
    `;
    const accessResult = await db.query(accessQuery, [normalizedSessionIds, req.user.id]);
    const allowedSessionIds = accessResult.rows.map((row) => String(row.id));

    if (allowedSessionIds.length !== normalizedSessionIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Access denied for one or more sessions'
      });
    }

    const logsQuery = `
      SELECT
        pl.*,
        COALESCE(pl.student_id, ar.student_id) as student_id,
        s.full_name,
        s.student_id as student_number,
        COALESCE(s.full_name, pl.additional_data->>'participant_name') as student_name,
        COALESCE(pl.additional_data->>'participant_name', s.full_name) as participant_name
      FROM participation_logs pl
      LEFT JOIN attendance_records ar
        ON ar.session_id = pl.session_id
       AND LOWER(ar.participant_name) = LOWER(COALESCE(pl.additional_data->>'participant_name', ''))
      LEFT JOIN students s ON s.id = COALESCE(pl.student_id, ar.student_id)
      WHERE pl.session_id = ANY($1)
        AND ${ParticipationLog.getMicStartFilterSql('pl')}
      ORDER BY pl.session_id ASC, pl.timestamp DESC
    `;

    const logsResult = await db.query(logsQuery, [allowedSessionIds]);

    const grouped = allowedSessionIds.reduce((accumulator, sessionId) => {
      accumulator[sessionId] = [];
      return accumulator;
    }, {});

    logsResult.rows.forEach((row) => {
      const sessionId = String(row.session_id);
      if (!grouped[sessionId]) {
        grouped[sessionId] = [];
      }
      grouped[sessionId].push(row);
    });

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Get bulk participation logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
// Add manual participation entry
const addParticipationLog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id, interaction_type, interaction_value, additional_data } = req.body;

    // First get the session to check access and status
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only add participation logs to active sessions'
      });
    }

    // Validation
    if (!student_id || !interaction_type) {
      return res.status(400).json({
        success: false,
        error: 'Student ID and interaction type are required'
      });
    }

    // Verify student exists and belongs to the session's class
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    if (student.class_id !== session.class_id) {
      return res.status(400).json({
        success: false,
        error: 'Student does not belong to this session\'s class'
      });
    }

    // Validate interaction type
    const validTypes = ['manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle', 'hand_raise'];
    if (!validTypes.includes(interaction_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interaction type'
      });
    }

    const log = await ParticipationLog.create({
      session_id: sessionId,
      student_id,
      interaction_type,
      interaction_value,
      additional_data
    });

    // Get full log data with student info for socket emission
    const fullLog = await ParticipationLog.findBySessionId(sessionId, { limit: 1 });
    const logWithStudent = fullLog[0];

    // Emit socket event for real-time updates
    req.app.get('io')?.emit('participation:added', {
      sessionId,
      log: logWithStudent
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Participation log added successfully'
    });
  } catch (error) {
    console.error('Add participation log error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get session summary with participation statistics
const getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // First get the session to check access
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get session statistics
    const stats = await Session.getSessionStats(sessionId);

    // Get total students in the class
    stats.total_students = await ParticipationLog.getClassStudentCount(session.class_id);

    // Get interaction summary
    const interactionSummary = await ParticipationLog.getSessionInteractionSummary(sessionId);

    // Get student summary
    const studentSummary = await ParticipationLog.getStudentSessionSummary(sessionId);

    res.json({
      success: true,
      data: {
        session,
        stats,
        interactionSummary,
        studentSummary
      }
    });
  } catch (error) {
    console.error('Get session summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get recent activity for live dashboard
const getRecentActivity = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { minutes = 5 } = req.query;

    // First get the session to check access
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const recentActivity = await ParticipationLog.getRecentActivity(
      sessionId,
      parseInt(minutes)
    );

    res.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Add bulk participation logs (for future automation features)
const addBulkParticipationLogs = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { logs } = req.body;

    // First get the session to check access and status
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only add participation logs to active sessions'
      });
    }

    // Validation
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Logs array is required and cannot be empty'
      });
    }

    const results = [];
    const errors = [];
    const emittedLogs = [];

    for (const logData of logs) {
      try {
        const { student_id, interaction_type, interaction_value, additional_data } = logData;

        // Validate required fields
        if (!student_id || !interaction_type) {
          errors.push({
            data: logData,
            error: 'Student ID and interaction type are required'
          });
          continue;
        }

        // Verify student belongs to session's class
        const student = await Student.findById(student_id);
        if (!student || student.class_id !== session.class_id) {
          errors.push({
            data: logData,
            error: 'Invalid student or student does not belong to this session\'s class'
          });
          continue;
        }

        // Validate interaction type
        const validTypes = ['manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle', 'hand_raise'];
        if (!validTypes.includes(interaction_type)) {
          errors.push({
            data: logData,
            error: 'Invalid interaction type'
          });
          continue;
        }

        const log = await ParticipationLog.create({
          session_id: sessionId,
          student_id,
          interaction_type,
          interaction_value,
          additional_data
        });

        results.push(log);
        emittedLogs.push({
          session_id: sessionId,
          student_id,
          student_name: student.full_name,
          participant_name: additional_data?.participant_name || student.full_name,
          is_matched: true,
          interaction_type,
          metadata: additional_data || {},
          timestamp: log.timestamp || new Date().toISOString()
        });
      } catch (error) {
        errors.push({
          data: logData,
          error: error.message
        });
      }
    }

    // Emit socket event for bulk updates
    if (results.length > 0) {
      const io = req.app.get('io');

      io?.emit('participation:bulk_added', {
        sessionId,
        count: results.length
      });

      // Also emit normalized realtime events so the live feed updates immediately.
      if (io) {
        emittedLogs.forEach((event) => {
          io.to(`session:${sessionId}`).emit('participation:logged', event);
          io.to(`instructor_${req.user.id}`).emit('participation:logged', event);
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        added: results.length,
        failed: errors.length,
        errors,
        results
      },
      message: `Added ${results.length} participation logs successfully`
    });
  } catch (error) {
    console.error('Add bulk participation logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getParticipationLogs,
  getBulkParticipationLogs,
  addParticipationLog,
  getSessionSummary,
  getRecentActivity,
  addBulkParticipationLogs
};