const Session = require('../models/Session');
const Class = require('../models/Class');
const Student = require('../models/Student');

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

// Create new session
const createSession = async (req, res) => {
  try {
    const { class_id, title, meeting_link } = req.body;

    // Validation
    if (!class_id || !title) {
      return res.status(400).json({
        success: false,
        error: 'Class ID and title are required'
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

    const session = await Session.create({
      class_id,
      title,
      meeting_link
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, meeting_link } = req.body;

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

    // Can only update scheduled sessions
    if (existingSession.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update session that has already started'
      });
    }

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const updatedSession = await Session.update(id, {
      title,
      meeting_link
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
const startSession = async (req, res) => {
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

    // Check if session can be started
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Session can only be started if it is in scheduled status'
      });
    }

    const startedSession = await Session.start(id);

    // Emit socket event for real-time updates
    req.app.get('io')?.emit('session:started', {
      sessionId: startedSession.id,
      classId: startedSession.class_id,
      title: startedSession.title,
      startedAt: startedSession.started_at
    });

    res.json({
      success: true,
      data: startedSession,
      message: 'Session started successfully'
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
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

module.exports = {
  getSessions,
  getSession,
  createSession,
  updateSession,
  startSession,
  endSession,
  deleteSession,
  getSessionStats,
  getSessionStudents
};