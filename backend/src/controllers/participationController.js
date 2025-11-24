const ParticipationLog = require('../models/ParticipationLog');
const Session = require('../models/Session');
const Student = require('../models/Student');

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
        parseInt(limit)
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
    const validTypes = ['manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle'];
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
        const validTypes = ['manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle'];
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
      } catch (error) {
        errors.push({
          data: logData,
          error: error.message
        });
      }
    }

    // Emit socket event for bulk updates
    if (results.length > 0) {
      req.app.get('io')?.emit('participation:bulk_added', {
        sessionId,
        count: results.length
      });
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
  addParticipationLog,
  getSessionSummary,
  getRecentActivity,
  addBulkParticipationLogs
};