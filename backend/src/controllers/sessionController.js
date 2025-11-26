const Session = require('../models/Session');
const Class = require('../models/Class');
const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');

// Get all sessions for current instructor
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.findByInstructorId(req.user.id);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get single session with details
const getSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

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

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new session - DEPRECATED
// Use startSessionFromMeeting instead - sessions must be created via extension
// This function is kept for backward compatibility but is not exposed via routes
const createSession = async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Manual session creation is deprecated. Use the browser extension to start tracking sessions.',
    migration_info: 'POST /api/sessions/start-from-meeting is the current method'
  });
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, meeting_link, additional_data } = req.body;

    // First get the session to check access
    const existingSession = await Session.findById(id);

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (existingSession.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Can only update scheduled sessions (not active or ended)
    if (existingSession.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update session that has already started'
      });
    }

    // Validation - at least one field must be provided
    if (!title && !meeting_link && !additional_data) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (title, meeting_link, or additional_data) must be provided'
      });
    }

    const updatedSession = await Session.update(id, {
      title,
      meeting_link,
      additional_data
    });

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Start session
// DEPRECATED: Manual session start is no longer supported
// Sessions are automatically started when the extension detects a Google Meet session
const startSession = async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Manual session start is deprecated',
    message: 'Sessions are now automatically started by the browser extension when a Google Meet session is detected. Please use the extension to track sessions.',
    migration: 'Use the startSessionFromMeeting endpoint which is triggered automatically by the extension'
  });
};

// End session
const endSession = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the session to check access
    const session = await Session.findById(id);

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

    // Check if session can be ended
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Session can only be ended if it is currently active'
      });
    }

    const endedSession = await Session.end(id);

    // Emit socket event for real-time updates
    req.app.get('io')?.emit('session:ended', {
      sessionId: endedSession.id,
      classId: endedSession.class_id,
      title: endedSession.title,
      endedAt: endedSession.ended_at
    });

    res.json({
      success: true,
      data: endedSession,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the session to check access
    const existingSession = await Session.findById(id);

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user has access to this session
    if (existingSession.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Can only delete scheduled sessions
    if (existingSession.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete session that has started or ended'
      });
    }

    await Session.delete(id);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const sessions = await Session.findByInstructorId(req.user.id);
    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
      completedSessions: sessions.filter(s => s.status === 'ended').length,
      recentSessions: sessions.slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get students in a session
const getSessionStudents = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the session to check access
    const session = await Session.findById(id);

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

    const students = await Student.findByClassId(session.class_id);

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get session students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get session with full attendance data
const getSessionWithAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findWithAttendance(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check access
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session with attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Bulk submit attendance (from extension)
const submitBulkAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body;

    // Validate input
    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        error: 'Attendance array is required'
      });
    }

    // Get session and verify access
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Add session_id to each record
    const attendanceWithSessionId = attendance.map(record => ({
      ...record,
      session_id: id
    }));

    // Bulk upsert attendance records
    const records = await AttendanceRecord.bulkUpsert(attendanceWithSessionId);

    res.json({
      success: true,
      data: records,
      message: `${records.length} attendance records processed`
    });
  } catch (error) {
    console.error('Submit bulk attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get attendance records for a session
const getSessionAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get session and verify access
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const attendance = await AttendanceRecord.findBySessionId(id);

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get attendance statistics for a session
const getAttendanceStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Get session and verify access
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const stats = await Session.getAttendanceStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get sessions by date range (for calendar)
const getSessionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const sessions = await Session.findByDateRange(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get calendar data for a specific month
const getCalendarData = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }

    const sessions = await Session.getCalendarData(
      req.user.id,
      parseInt(year),
      parseInt(month)
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get sessions for a specific class
const getClassSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const sessions = await Session.findByClassId(classId, {
      startDate,
      endDate,
      status
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get class sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Start session from meeting (Extension-triggered)
const startSessionFromMeeting = async (req, res) => {
  try {
    const { class_id, meeting_link, started_at, title } = req.body;

    // Validation
    if (!class_id || !meeting_link || !started_at) {
      return res.status(400).json({
        success: false,
        error: 'class_id, meeting_link, and started_at are required'
      });
    }

    // Verify class exists and user has access
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Auto-generate title if not provided
    const sessionTitle = title || `${classData.name} - ${new Date(started_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`;

    const session = await Session.create({
      class_id,
      title: sessionTitle,
      meeting_link,
      started_at,
      additional_data: null
    });

    // Emit socket event for real-time dashboard
    if (global.io) {
      global.io.to(`instructor_${req.user.id}`).emit('session:started', {
        session_id: session.id,
        class_id: session.class_id,
        class_name: classData.name,
        started_at: session.started_at
      });
    }

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Start session from meeting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
};

// End session with timestamp
const endSessionWithTimestamp = async (req, res) => {
  try {
    const { id } = req.params;
    const { ended_at } = req.body;

    if (!ended_at) {
      return res.status(400).json({
        success: false,
        error: 'ended_at is required'
      });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check access
    if (session.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedSession = await Session.updateEndTime(id, ended_at);

    // Emit socket event
    if (global.io) {
      global.io.to(`instructor_${req.user.id}`).emit('session:ended', {
        session_id: updatedSession.id,
        ended_at: updatedSession.ended_at
      });
    }

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
};

module.exports = {
  getSessions,
  getSession,
  // createSession - DEPRECATED: Use startSessionFromMeeting instead
  // startSession - DEPRECATED: Sessions auto-start via extension
  updateSession,
  endSession,
  deleteSession,
  getSessionStats,
  getSessionStudents,
  getSessionWithAttendance,
  submitBulkAttendance,
  getSessionAttendance,
  getAttendanceStats,
  getSessionsByDateRange,
  getCalendarData,
  getClassSessions,
  startSessionFromMeeting, // PRIMARY session creation method
  endSessionWithTimestamp // PRIMARY session end method (from extension)
};