const Session = require('../models/Session');
const Class = require('../models/Class');
const Student = require('../models/Student');
const ParticipationLog = require('../models/ParticipationLog');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceInterval = require('../models/AttendanceInterval');
const { normalizeMeetingLink } = require('../utils/urlUtils');

// Tracks active speaking windows keyed by "sessionId:participantName".
const activeMicWindows = new Map();

const buildMicWindowKey = (sessionId, participantName) => {
  if (!sessionId || !participantName) return null;
  return `${sessionId}:${String(participantName).trim().toLowerCase()}`;
};

const toFiniteTimestamp = (value) => {
  const date = new Date(value);
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : null;
};

const computeSpeakingDurationSeconds = (startedAt, endedAt) => {
  const startMs = toFiniteTimestamp(startedAt);
  const endMs = toFiniteTimestamp(endedAt);
  if (startMs === null || endMs === null || endMs < startMs) {
    return null;
  }

  return Math.max(0, Math.round((endMs - startMs) / 1000));
};

const formatSpeakingDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins}m`;
  }

  return `${mins}m ${secs}s`;
};

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

// Get active sessions for current instructor
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.findActiveByInstructorId(req.user.id);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
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

    // Can only update scheduled sessions (not active or ended)
    if (existingSession.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update session that has already started'
      });
    }

    // Validation - at least one field must be provided
    if (!title && !meeting_link) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (title or meeting_link) must be provided'
      });
    }

    // Normalize meeting link if provided
    const normalizedLink = meeting_link ? normalizeMeetingLink(meeting_link) : undefined;

    const updatedSession = await Session.update(id, {
      title,
      meeting_link: normalizedLink
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

    // Delete the session (cascades to participation logs and attendance records)
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

    console.log('[API] getSessionWithAttendance called for session:', id);
    
    const session = await Session.findWithAttendance(id);

    console.log('[API] Session found:', !!session);
    console.log('[API] Attendance records:', session?.attendance?.length || 0);

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

    // Normalize the meeting link to ensure consistent format
    const normalizedLink = normalizeMeetingLink(meeting_link);

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
      meeting_link: normalizedLink,
      started_at
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

    // Close all open attendance intervals with the session end time
    await AttendanceInterval.closeAllOpenIntervals(id, ended_at);

    // Recalculate total durations for all participants and update attendance records
    const summary = await AttendanceInterval.getSessionAttendanceSummary(id);
    for (const participant of summary) {
      await AttendanceRecord.updateDuration(
        id, 
        participant.participant_name, 
        participant.total_duration_minutes, 
        ended_at
      );
    }

    // Mark students who are in the class roster but didn't attend as absent
    await AttendanceRecord.markAbsentStudents(id, session.class_id);

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

// Handle live events from extension (real-time participant updates)
const handleLiveEvent = async (req, res) => {
  try {
    const { eventType, sessionId, data, timestamp } = req.body;

    console.log('\n========================================');
    console.log('[LiveEvent] 📥 RECEIVED FROM EXTENSION');
    console.log('========================================');
    console.log('[LiveEvent] Event Type:', eventType);
    console.log('[LiveEvent] Session ID:', sessionId);
    console.log('[LiveEvent] Timestamp:', timestamp || new Date().toISOString());
    console.log('[LiveEvent] Data:', JSON.stringify(data, null, 2));
    console.log('========================================\n');

    if (!eventType || !sessionId) {
      console.error('[LiveEvent] ❌ Missing required fields: eventType or sessionId');
      return res.status(400).json({
        success: false,
        error: 'eventType and sessionId are required'
      });
    }

    // Verify session exists and user has access
    const session = await Session.findById(sessionId);
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

    // Get the io instance. Persistence must not depend on broadcast availability.
    const io = global.io || req.app.get('io');
    const canBroadcast = Boolean(io);

    if (!canBroadcast) {
      console.warn('[LiveEvent] ⚠️ Socket.io not available - will persist event without broadcast');
    } else {
      console.log('[LiveEvent] ✅ Socket.io available, preparing to broadcast...');
    }

    // Broadcast event to session room and instructor room
    const eventData = {
      ...data,
      sessionId,
      timestamp: timestamp || new Date().toISOString()
    };

    // Map extension event types to frontend event types
    switch (eventType) {
      case 'participant:joined':
        {
          const participantName =
            data.participant?.name ||
            data.participant_name ||
            data.studentName ||
            data.participantId;
          const joinedAt = data.participant?.joinedAt || data.joinedAt || data.joined_at || eventData.timestamp;

          // Persist join event so live feed survives reload and is visible across devices.
          if (participantName) {
            const hasOpenInterval = await AttendanceInterval.hasOpenInterval(sessionId, participantName);

            if (!hasOpenInterval) {
              await AttendanceRecord.upsertFromParticipant(sessionId, participantName, null);
              await AttendanceInterval.create({
                session_id: sessionId,
                student_id: null,
                participant_name: participantName,
                joined_at: joinedAt
              });
            }
          }

        console.log('[LiveEvent] 📤 Broadcasting participant:joined to:', {
          sessionRoom: `session:${sessionId}`,
          instructorRoom: `instructor_${req.user.id}`,
          participantName
        });
        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit('participant:joined', {
            session_id: sessionId,
            participant_name: participantName,
            student_id: null,
            joined_at: joinedAt,
            is_matched: false,
            participant: data.participant,
            timestamp: eventData.timestamp
          });
          io.to(`instructor_${req.user.id}`).emit('attendance:updated', {
            session_id: sessionId,
            student_name: participantName || 'Unknown',
            action: 'joined',
            timestamp: eventData.timestamp
          });
        }
        console.log('[LiveEvent] ✅ Broadcasted participant:joined');
        break;
        }

      case 'participant:left':
        {
          const participantName =
            data.participant_name ||
            data.participantId ||
            data.participant?.name ||
            data.studentName;
          const leftAt = data.leftAt || data.left_at || eventData.timestamp;

          let totalDurationMinutes = null;

          // Persist leave event and recalculate cumulative duration for reload-safe history.
          if (participantName) {
            const closedInterval = await AttendanceInterval.closeInterval(sessionId, participantName, leftAt);

            if (closedInterval) {
              const durationData = await AttendanceInterval.calculateTotalDuration(sessionId, participantName);
              totalDurationMinutes = durationData?.total_minutes || 0;

              await AttendanceRecord.updateDuration(
                sessionId,
                participantName,
                totalDurationMinutes,
                leftAt
              );
            }
          }

        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit('participant:left', {
            session_id: sessionId,
            participant_name: participantName,
            left_at: leftAt,
            total_duration_minutes: totalDurationMinutes,
            participantId: data.participantId,
            leftAt: leftAt,
            timestamp: eventData.timestamp
          });
        }
        break;
        }

      case 'attendance:update':
        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit('attendance:updated', {
            session_id: sessionId,
            student_id: data.studentId,
            student_name: data.studentName,
            status: data.status,
            joined_at: data.joinedAt,
            left_at: data.leftAt,
            timestamp: eventData.timestamp
          });
          io.to(`instructor_${req.user.id}`).emit('attendance:updated', {
            session_id: sessionId,
            student_name: data.studentName,
            action: data.status,
            timestamp: eventData.timestamp
          });
        }
        break;

      case 'participation:logged':
        {
        const participantName =
          data.metadata?.participant_name ||
          data.studentName ||
          data.student_name ||
          'Unknown participant';

        const isMatched = Boolean(data.studentId);
        const sourceEventId = data.metadata?.source_event_id || null;
        const normalizedMetadata = {
          ...(data.metadata || {}),
          participant_name: participantName,
          participant_id: data.metadata?.participant_id || null,
          source: data.metadata?.source || 'extension',
          is_matched: Boolean(data.studentId)
        };

        if (data.interactionType === 'mic_toggle') {
          const eventTimestamp = eventData.timestamp;
          const micWindowKey = buildMicWindowKey(sessionId, participantName);
          const isMuted = typeof normalizedMetadata.isMuted === 'boolean'
            ? normalizedMetadata.isMuted
            : null;

          if (isMuted === false && micWindowKey) {
            activeMicWindows.set(micWindowKey, {
              startedAt: eventTimestamp,
              sourceEventId
            });
            normalizedMetadata.speakingAction = 'start';
            normalizedMetadata.speakingStartedAt = eventTimestamp;
          }

          if (isMuted === true) {
            let speakingStartedAt = null;

            if (micWindowKey && activeMicWindows.has(micWindowKey)) {
              speakingStartedAt = activeMicWindows.get(micWindowKey).startedAt;
              activeMicWindows.delete(micWindowKey);
            }

            if (!speakingStartedAt) {
              const previousUnmute = await ParticipationLog.findMostRecentMicUnmute(sessionId, participantName, eventTimestamp);
              if (previousUnmute) {
                speakingStartedAt = previousUnmute.timestamp;
              }
            }

            if (speakingStartedAt) {
              const speakingDurationSeconds = computeSpeakingDurationSeconds(speakingStartedAt, eventTimestamp);
              if (Number.isFinite(speakingDurationSeconds)) {
                normalizedMetadata.speakingAction = 'stop';
                normalizedMetadata.speakingStartedAt = speakingStartedAt;
                normalizedMetadata.speakingEndedAt = eventTimestamp;
                normalizedMetadata.speakingDurationSeconds = speakingDurationSeconds;
                normalizedMetadata.speakingDurationLabel = formatSpeakingDuration(speakingDurationSeconds);
              }
            }
          }
        }

        // Idempotency guard: skip duplicate inserts from retries/reconnects.
        if (sourceEventId) {
          const existing = await ParticipationLog.findBySourceEventId(sessionId, sourceEventId);
          if (existing) {
            return res.json({
              success: true,
              broadcasted: false,
              deduped: true,
              eventType
            });
          }
        }

        const interactionValue = data.interactionValue || (
          data.interactionType === 'mic_toggle'
            ? (data.metadata?.isMuted ? 'muted' : 'unmuted')
            : data.interactionType === 'reaction'
              ? data.metadata?.reaction || 'unknown'
              : data.interactionType === 'chat'
                ? 'activity'
                : data.interactionType === 'camera_toggle'
                  ? 'camera_toggle'
                  : null
        );

        const log = await ParticipationLog.create({
          session_id: sessionId,
          student_id: data.studentId || null,
          interaction_type: data.interactionType,
          interaction_value: interactionValue,
          timestamp: eventData.timestamp,
          additional_data: {
            ...normalizedMetadata,
            source_event_id: sourceEventId
          }
        });
        
        const socketPayload = {
          id: log.id,
          session_id: sessionId,
          student_id: data.studentId || null,
          student_name: data.studentName || participantName,
          participant_name: participantName,
          is_matched: isMatched,
          interaction_type: data.interactionType,
          metadata: {
            ...normalizedMetadata,
            source_event_id: sourceEventId
          },
          timestamp: eventData.timestamp
        };

        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit('participation:logged', socketPayload);
          io.to(`instructor_${req.user.id}`).emit('participation:logged', socketPayload);
        }
        break;
        }

      case 'chat:message':
        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit('chat:message', {
            session_id: sessionId,
            sender: data.sender,
            message: data.message,
            timestamp: eventData.timestamp
          });
        }
        break;

      case 'session:extension_connected':
        if (canBroadcast) {
          io.to(`instructor_${req.user.id}`).emit('session:extension_connected', {
            session_id: sessionId,
            timestamp: eventData.timestamp
          });
        }
        console.log(`[LiveEvent] Extension connected to session ${sessionId}`);
        break;

      case 'session:extension_disconnected':
        if (canBroadcast) {
          io.to(`instructor_${req.user.id}`).emit('session:extension_disconnected', {
            session_id: sessionId,
            timestamp: eventData.timestamp
          });
        }
        console.log(`[LiveEvent] Extension disconnected from session ${sessionId}`);
        break;

      default:
        console.log('[LiveEvent] 📤 Broadcasting unknown event type:', eventType);
        // Forward unknown events as-is
        if (canBroadcast) {
          io.to(`session:${sessionId}`).emit(eventType, eventData);
        }
    }

    res.json({
      success: true,
      broadcasted: canBroadcast,
      eventType
    });

  } catch (error) {
    console.error('Handle live event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process live event'
    });
  }
};

// Record participant join (extension calls this when participant detected)
const recordParticipantJoin = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { participant_name, joined_at, student_id = null } = req.body;

    if (!participant_name) {
      return res.status(400).json({
        success: false,
        error: 'participant_name is required'
      });
    }

    // Verify session exists and user has access
    const session = await Session.findById(sessionId);
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

    // Try to auto-match to student if not provided
    let matchedStudentId = student_id;
    if (!matchedStudentId) {
      const matchedStudent = await Student.findByClassIdAndName(session.class_id, participant_name);
      if (matchedStudent) {
        matchedStudentId = matchedStudent.id;
      }
    }

    // Create or update attendance record
    await AttendanceRecord.upsertFromParticipant(sessionId, participant_name, matchedStudentId);

    // Create attendance interval for this join
    const interval = await AttendanceInterval.create({
      session_id: sessionId,
      student_id: matchedStudentId,
      participant_name,
      joined_at: joined_at || new Date()
    });

    // Emit socket event for real-time updates
    const io = global.io || req.app.get('io');
    if (io) {
      console.log('[API] 📤 Emitting participant:joined to rooms:', {
        sessionRoom: `session:${sessionId}`,
        instructorRoom: `instructor_${req.user.id}`
      });
      
      io.to(`session:${sessionId}`).emit('participant:joined', {
        session_id: sessionId,
        participant_name,
        student_id: matchedStudentId,
        joined_at: interval.joined_at,
        is_matched: !!matchedStudentId
      });
      
      io.to(`instructor_${req.user.id}`).emit('participant:joined', {
        session_id: sessionId,
        participant_name,
        student_id: matchedStudentId,
        joined_at: interval.joined_at,
        is_matched: !!matchedStudentId
      });
    }

    res.json({
      success: true,
      data: {
        interval,
        is_matched: !!matchedStudentId,
        student_id: matchedStudentId
      }
    });
  } catch (error) {
    console.error('Record participant join error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record participant join'
    });
  }
};

// Record participant leave (extension calls this when participant leaves)
const recordParticipantLeave = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { participant_name, left_at } = req.body;

    console.log('\\n========================================');
    console.log('[API] 📤 recordParticipantLeave called');
    console.log('========================================');
    console.log('[API] Session ID:', sessionId);
    console.log('[API] Participant:', participant_name);
    console.log('[API] Left at:', left_at);
    console.log('[API] User:', req.user.id);
    console.log('========================================\\n');

    if (!participant_name) {
      return res.status(400).json({
        success: false,
        error: 'participant_name is required'
      });
    }

    // Verify session exists and user has access
    const session = await Session.findById(sessionId);
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

    // Close the open interval for this participant
    const interval = await AttendanceInterval.closeInterval(sessionId, participant_name, left_at || new Date());

    if (!interval) {
      return res.status(404).json({
        success: false,
        error: 'No open interval found for this participant'
      });
    }

    // Calculate updated total duration
    const durationData = await AttendanceInterval.calculateTotalDuration(sessionId, participant_name);
    const totalDuration = durationData?.total_minutes || 0;
    
    console.log('[API] Duration calculation:', {
      totalMinutes: totalDuration,
      intervalCount: durationData?.interval_count,
      firstJoined: durationData?.first_joined_at,
      lastLeft: durationData?.last_left_at
    });
    
    // Update the attendance record with new duration
    await AttendanceRecord.updateDuration(sessionId, participant_name, totalDuration, left_at || new Date());

    // Emit socket event for real-time updates
    const io = global.io || req.app.get('io');
    if (io) {
      console.log('[API] 📤 Emitting participant:left to rooms:', {
        sessionRoom: `session:${sessionId}`,
        instructorRoom: `instructor_${req.user.id}`,
        participant: participant_name,
        duration: totalDuration
      });
      
      io.to(`session:${sessionId}`).emit('participant:left', {
        session_id: sessionId,
        participant_name,
        left_at: interval.left_at,
        total_duration_minutes: totalDuration
      });
      
      io.to(`instructor_${req.user.id}`).emit('participant:left', {
        session_id: sessionId,
        participant_name,
        left_at: interval.left_at,
        total_duration_minutes: totalDuration
      });
      
      console.log('[API] ✅ Broadcasted participant:left successfully');
    }

    res.json({
      success: true,
      data: {
        interval,
        total_duration_minutes: totalDuration
      }
    });
  } catch (error) {
    console.error('Record participant leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record participant leave'
    });
  }
};

// Get full attendance data with intervals
const getSessionAttendanceWithIntervals = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    // Verify session exists and user has access
    const session = await Session.findById(sessionId);
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

    // Get attendance records with intervals
    const attendance = await AttendanceRecord.findBySessionIdWithIntervals(sessionId);
    const summary = await AttendanceRecord.getSessionSummary(sessionId);

    res.json({
      success: true,
      data: {
        session,
        attendance,
        summary
      }
    });
  } catch (error) {
    console.error('Get session attendance with intervals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attendance data'
    });
  }
};

// Link an unmatched participant to a student (creates student if needed)
const linkParticipantToStudent = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { participant_name, student_id, create_student = false } = req.body;

    console.log('[API] linkParticipantToStudent called:', {
      sessionId,
      participant_name,
      student_id,
      create_student
    });

    if (!participant_name) {
      return res.status(400).json({
        success: false,
        error: 'participant_name is required'
      });
    }

    // Verify session exists and user has access
    const session = await Session.findById(sessionId);
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

    let targetStudentId = student_id;
    let createdNew = false;
    let studentRecord = null;

    // Create new student from participant if requested
    if (create_student && !student_id) {
      console.log('[API] Creating student from participant:', participant_name);
      
      const result = await Student.createFromParticipant(session.class_id, participant_name);
      
      // Handle the return structure: { created: boolean, student: object }
      studentRecord = result.student || result;
      createdNew = result.created !== false; // true if newly created
      targetStudentId = studentRecord.id;
      
      console.log('[API] Student result:', {
        created: createdNew,
        studentId: targetStudentId,
        studentName: studentRecord.full_name
      });
    }

    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        error: 'Either student_id or create_student must be provided'
      });
    }

    // Link attendance record to student
    console.log('[API] Linking attendance record:', {
      sessionId,
      participant_name,
      targetStudentId
    });
    
    const attendanceRecord = await AttendanceRecord.linkToStudent(sessionId, participant_name, targetStudentId);
    
    if (!attendanceRecord) {
      console.warn('[API] No attendance record found for participant:', participant_name);
    }

    // Link all intervals to student
    console.log('[API] Linking intervals to student');
    await AttendanceInterval.linkToStudent(sessionId, participant_name, targetStudentId);

    // Get the student info if not already fetched
    if (!studentRecord) {
      studentRecord = await Student.findById(targetStudentId);
    }

    const message = create_student && createdNew
      ? `Created student "${participant_name}" and linked attendance`
      : `Linked attendance to student "${studentRecord.full_name}"`;

    console.log('[API] ✅ Successfully linked participant to student:', message);

    res.json({
      success: true,
      data: {
        attendance_record: attendanceRecord,
        student: studentRecord,
        created_new: createdNew
      },
      message
    });
  } catch (error) {
    console.error('[API] Link participant to student error:', error);
    console.error('[API] Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to link participant to student'
    });
  }
};

module.exports = {
  getSessions,
  getActiveSessions,
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
  endSessionWithTimestamp, // PRIMARY session end method (from extension)
  handleLiveEvent, // Real-time events from extension
  recordParticipantJoin,
  recordParticipantLeave,
  getSessionAttendanceWithIntervals,
  linkParticipantToStudent
};