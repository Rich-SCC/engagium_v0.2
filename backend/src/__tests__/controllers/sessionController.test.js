require('../setup');
const {
  getSessions,
  getSession,
  updateSession,
  endSession,
  deleteSession,
  getSessionStats,
  getSessionStudents,
  startSessionFromMeeting,
  endSessionWithTimestamp
} = require('../../controllers/sessionController');
const Session = require('../../models/Session');
const Class = require('../../models/Class');
const Student = require('../../models/Student');

// Mock dependencies
jest.mock('../../models/Session');
jest.mock('../../models/Class');
jest.mock('../../models/Student');

// Mock global.io for socket events
global.io = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
};

describe('SessionController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset global.io mock
    global.io.to.mockReturnThis();
    global.io.emit.mockClear();

    req = {
      body: {},
      params: {},
      user: { id: 'user-123', role: 'instructor' },
      app: {
        get: jest.fn()
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getSessions', () => {
    it('should return all sessions for instructor', async () => {
      const mockSessions = [
        { id: 'session-1', title: 'CS 101 - Nov 26, 10:00 AM', class_name: 'CS 101', status: 'active' },
        { id: 'session-2', title: 'CS 102 - Nov 25, 2:00 PM', class_name: 'CS 102', status: 'ended' }
      ];

      Session.findByInstructorId.mockResolvedValue(mockSessions);

      await getSessions(req, res);

      expect(Session.findByInstructorId).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSessions
      });
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      req.params.id = 'session-1';

      const mockSession = {
        id: 'session-1',
        title: 'CS 101 - Nov 26, 10:00 AM',
        class_id: 'class-1',
        instructor_id: 'user-123',
        status: 'active'
      };

      Session.findById.mockResolvedValue(mockSession);

      await getSession(req, res);

      expect(Session.findById).toHaveBeenCalledWith('session-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession
      });
    });

    it('should return 404 if session not found', async () => {
      req.params.id = '999';

      Session.findById.mockResolvedValue(null);

      await getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
    });

    it('should return 403 if user does not have access', async () => {
      req.params.id = '1';
      req.user = { id: 2, role: 'instructor' };

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      Session.findById.mockResolvedValue(mockSession);

      await getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('startSessionFromMeeting (NEW - Extension-triggered)', () => {
    it('should create and start session from meeting', async () => {
      const startedAt = new Date('2025-11-26T10:00:00Z');
      req.body = {
        class_id: 'class-1',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt.toISOString(),
        title: 'CS 101 - Nov 26, 10:00 AM'
      };

      const mockClass = {
        id: 'class-1',
        name: 'CS 101',
        instructor_id: 'user-123'
      };

      const mockSession = {
        id: 'session-1',
        class_id: 'class-1',
        title: 'CS 101 - Nov 26, 10:00 AM',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt,
        status: 'active'
      };

      Class.findById.mockResolvedValue(mockClass);
      Session.create.mockResolvedValue(mockSession);

      await startSessionFromMeeting(req, res);

      expect(Class.findById).toHaveBeenCalledWith('class-1');
      expect(Session.create).toHaveBeenCalledWith({
        class_id: 'class-1',
        title: 'CS 101 - Nov 26, 10:00 AM',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt.toISOString(),
        additional_data: null
      });
      expect(global.io.to).toHaveBeenCalledWith('instructor_user-123');
      expect(global.io.emit).toHaveBeenCalledWith('session:started', {
        session_id: 'session-1',
        class_id: 'class-1',
        class_name: 'CS 101',
        started_at: startedAt
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession
      });
    });

    it('should auto-generate title if not provided', async () => {
      const startedAt = new Date('2025-11-26T10:00:00Z');
      req.body = {
        class_id: 'class-1',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt.toISOString()
        // No title provided
      };

      const mockClass = {
        id: 'class-1',
        name: 'CS 101',
        instructor_id: 'user-123'
      };

      const mockSession = {
        id: 'session-1',
        class_id: 'class-1',
        title: 'CS 101 - Nov 26, 10:00 AM', // Auto-generated
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt,
        status: 'active'
      };

      Class.findById.mockResolvedValue(mockClass);
      Session.create.mockResolvedValue(mockSession);

      await startSessionFromMeeting(req, res);

      expect(Session.create).toHaveBeenCalledWith(expect.objectContaining({
        class_id: 'class-1',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: startedAt.toISOString()
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if required fields missing', async () => {
      req.body = {
        class_id: 'class-1'
        // Missing meeting_link and started_at
      };

      await startSessionFromMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'class_id, meeting_link, and started_at are required'
      });
    });

    it('should return 404 if class not found', async () => {
      req.body = {
        class_id: 'class-999',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: new Date().toISOString()
      };

      Class.findById.mockResolvedValue(null);

      await startSessionFromMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.body = {
        class_id: 'class-1',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        started_at: new Date().toISOString()
      };

      const mockClass = {
        id: 'class-1',
        name: 'CS 101',
        instructor_id: 'other-user'
      };

      Class.findById.mockResolvedValue(mockClass);

      await startSessionFromMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('updateSession', () => {
    it('should update session title (post-session only)', async () => {
      req.params.id = 'session-1';
      req.body = {
        title: 'Updated Title'
      };

      const existingSession = {
        id: 'session-1',
        instructor_id: 'user-123',
        status: 'scheduled'
      };

      const updatedSession = {
        ...existingSession,
        title: 'Updated Title'
      };

      Session.findById.mockResolvedValue(existingSession);
      Session.update.mockResolvedValue(updatedSession);

      await updateSession(req, res);

      expect(Session.findById).toHaveBeenCalledWith('session-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedSession
      });
    });

    it('should return 404 if session not found', async () => {
      req.params.id = 'session-999';
      req.body = { title: 'Updated Title' };

      Session.findById.mockResolvedValue(null);

      await updateSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
    });

    it('should return 400 if session is still active', async () => {
      req.params.id = 'session-1';
      req.body = { title: 'Updated Title' };

      const existingSession = {
        id: 'session-1',
        instructor_id: 'user-123',
        status: 'active'
      };

      Session.findById.mockResolvedValue(existingSession);

      await updateSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot update session that has already started'
      });
    });
  });

  describe('endSessionWithTimestamp (Extension ends session)', () => {
    it('should end session with provided timestamp', async () => {
      req.params.id = 'session-1';
      const endedAt = new Date('2025-11-26T11:00:00Z');
      req.body = {
        ended_at: endedAt.toISOString()
      };

      const existingSession = {
        id: 'session-1',
        class_id: 'class-1',
        instructor_id: 'user-123',
        status: 'active'
      };

      const endedSession = {
        ...existingSession,
        status: 'ended',
        ended_at: endedAt
      };

      Session.findById.mockResolvedValue(existingSession);
      Session.updateEndTime.mockResolvedValue(endedSession);

      await endSessionWithTimestamp(req, res);

      expect(Session.updateEndTime).toHaveBeenCalledWith('session-1', endedAt.toISOString());
      expect(global.io.to).toHaveBeenCalledWith('instructor_user-123');
      expect(global.io.emit).toHaveBeenCalledWith('session:ended', {
        session_id: 'session-1',
        ended_at: endedAt
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: endedSession
      });
    });

    it('should return 400 if ended_at not provided', async () => {
      req.params.id = 'session-1';
      req.body = {};

      await endSessionWithTimestamp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ended_at is required'
      });
    });

    it('should return 404 if session not found', async () => {
      req.params.id = 'session-999';
      req.body = {
        ended_at: new Date().toISOString()
      };

      Session.findById.mockResolvedValue(null);

      await endSessionWithTimestamp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
    });
  });

  describe('endSession (Legacy manual end)', () => {
    it('should end session successfully', async () => {
      req.params.id = 'session-1';

      const existingSession = {
        id: 'session-1',
        class_id: 'class-1',
        instructor_id: 'user-123',
        status: 'active'
      };

      const endedSession = {
        ...existingSession,
        status: 'ended',
        ended_at: new Date()
      };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(existingSession);
      Session.end.mockResolvedValue(endedSession);

      await endSession(req, res);

      expect(Session.end).toHaveBeenCalledWith('session-1');
      expect(mockIo.emit).toHaveBeenCalledWith('session:ended', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: endedSession,
        message: 'Session ended successfully'
      });
    });

    it('should return 400 if session is not active', async () => {
      req.params.id = 'session-1';

      const existingSession = {
        id: 'session-1',
        instructor_id: 'user-123',
        status: 'ended'
      };

      Session.findById.mockResolvedValue(existingSession);

      await endSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session can only be ended if it is currently active'
      });
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      req.params.id = 'session-1';

      const existingSession = {
        id: 'session-1',
        instructor_id: 'user-123',
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(existingSession);
      Session.delete.mockResolvedValue();

      await deleteSession(req, res);

      expect(Session.delete).toHaveBeenCalledWith('session-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session deleted successfully'
      });
    });

    it('should return 400 if session is still active', async () => {
      req.params.id = 'session-1';

      const existingSession = {
        id: 'session-1',
        instructor_id: 'user-123',
        status: 'active'
      };

      Session.findById.mockResolvedValue(existingSession);

      await deleteSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete session that has started or ended'
      });
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const mockSessions = [
        { id: 'session-1', status: 'active' },
        { id: 'session-2', status: 'active' },
        { id: 'session-3', status: 'ended' },
        { id: 'session-4', status: 'ended' },
        { id: 'session-5', status: 'ended' }
      ];

      Session.findByInstructorId.mockResolvedValue(mockSessions);

      await getSessionStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalSessions: 5,
          activeSessions: 2,
          scheduledSessions: 0,
          completedSessions: 3,
          recentSessions: mockSessions.slice(0, 5)
        }
      });
    });
  });

  describe('getSessionStudents', () => {
    it('should return students in session', async () => {
      req.params.id = 'session-1';

      const mockSession = {
        id: 'session-1',
        class_id: 'class-1',
        instructor_id: 'user-123'
      };

      const mockStudents = [
        { id: 'student-1', first_name: 'John', last_name: 'Doe' },
        { id: 'student-2', first_name: 'Jane', last_name: 'Smith' }
      ];

      Session.findById.mockResolvedValue(mockSession);
      Student.findByClassId.mockResolvedValue(mockStudents);

      await getSessionStudents(req, res);

      expect(Student.findByClassId).toHaveBeenCalledWith('class-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStudents
      });
    });
  });
});
