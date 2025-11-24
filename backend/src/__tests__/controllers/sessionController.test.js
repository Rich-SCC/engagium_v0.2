require('../setup');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  startSession,
  endSession,
  deleteSession,
  getSessionStats,
  getSessionStudents
} = require('../../controllers/sessionController');
const Session = require('../../models/Session');
const Class = require('../../models/Class');
const Student = require('../../models/Student');

// Mock dependencies
jest.mock('../../models/Session');
jest.mock('../../models/Class');
jest.mock('../../models/Student');

describe('SessionController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: { id: 1, role: 'instructor' },
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
        { id: 1, title: 'Session 1', class_name: 'CS 101', status: 'scheduled' },
        { id: 2, title: 'Session 2', class_name: 'CS 102', status: 'active' }
      ];

      Session.findByInstructorId.mockResolvedValue(mockSessions);

      await getSessions(req, res);

      expect(Session.findByInstructorId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSessions
      });
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      req.params.id = '1';

      const mockSession = {
        id: 1,
        title: 'Week 1 Lecture',
        class_id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(mockSession);

      await getSession(req, res);

      expect(Session.findById).toHaveBeenCalledWith('1');
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

  describe('createSession', () => {
    it('should create a new session', async () => {
      req.body = {
        class_id: 1,
        title: 'Week 1 Lecture',
        meeting_link: 'https://meet.example.com/test'
      };

      const mockClass = {
        id: 1,
        instructor_id: 1
      };

      const mockSession = {
        id: 1,
        ...req.body,
        status: 'scheduled'
      };

      Class.findById.mockResolvedValue(mockClass);
      Session.create.mockResolvedValue(mockSession);

      await createSession(req, res);

      expect(Class.findById).toHaveBeenCalledWith(1);
      expect(Session.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession
      });
    });

    it('should return 400 if required fields missing', async () => {
      req.body = {
        class_id: 1
        // Missing title
      };

      await createSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class ID and title are required'
      });
    });

    it('should return 404 if class not found', async () => {
      req.body = {
        class_id: 999,
        title: 'Test Session'
      };

      Class.findById.mockResolvedValue(null);

      await createSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.body = {
        class_id: 1,
        title: 'Test Session'
      };

      const mockClass = {
        id: 1,
        instructor_id: 2
      };

      Class.findById.mockResolvedValue(mockClass);

      await createSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Title',
        meeting_link: 'https://meet.example.com/updated'
      };

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      const updatedSession = {
        id: 1,
        ...req.body,
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(existingSession);
      Session.update.mockResolvedValue(updatedSession);

      await updateSession(req, res);

      expect(Session.findById).toHaveBeenCalledWith('1');
      expect(Session.update).toHaveBeenCalledWith('1', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedSession
      });
    });

    it('should return 404 if session not found', async () => {
      req.params.id = '999';
      req.body = { title: 'Updated Title' };

      Session.findById.mockResolvedValue(null);

      await updateSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
    });

    it('should return 400 if session has already started', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated Title' };

      const existingSession = {
        id: 1,
        instructor_id: 1,
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

    it('should return 400 if title is missing', async () => {
      req.params.id = '1';
      req.body = { meeting_link: 'https://meet.example.com' };

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(existingSession);

      await updateSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Title is required'
      });
    });
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      const startedSession = {
        id: 1,
        status: 'active',
        started_at: new Date()
      };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(existingSession);
      Session.start.mockResolvedValue(startedSession);

      await startSession(req, res);

      expect(Session.start).toHaveBeenCalledWith('1');
      expect(mockIo.emit).toHaveBeenCalledWith('session:started', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: startedSession,
        message: 'Session started successfully'
      });
    });

    it('should return 400 if session is not scheduled', async () => {
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'active'
      };

      Session.findById.mockResolvedValue(existingSession);

      await startSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session can only be started if it is in scheduled status'
      });
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const endedSession = {
        id: 1,
        status: 'ended',
        ended_at: new Date()
      };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(existingSession);
      Session.end.mockResolvedValue(endedSession);

      await endSession(req, res);

      expect(Session.end).toHaveBeenCalledWith('1');
      expect(mockIo.emit).toHaveBeenCalledWith('session:ended', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: endedSession,
        message: 'Session ended successfully'
      });
    });

    it('should return 400 if session is not active', async () => {
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
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
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(existingSession);
      Session.delete.mockResolvedValue();

      await deleteSession(req, res);

      expect(Session.delete).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session deleted successfully'
      });
    });

    it('should return 400 if session has started or ended', async () => {
      req.params.id = '1';

      const existingSession = {
        id: 1,
        instructor_id: 1,
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
        { id: 1, status: 'scheduled' },
        { id: 2, status: 'active' },
        { id: 3, status: 'active' },
        { id: 4, status: 'ended' },
        { id: 5, status: 'ended' },
        { id: 6, status: 'ended' }
      ];

      Session.findByInstructorId.mockResolvedValue(mockSessions);

      await getSessionStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalSessions: 6,
          activeSessions: 2,
          scheduledSessions: 1,
          completedSessions: 3,
          recentSessions: mockSessions.slice(0, 5)
        }
      });
    });
  });

  describe('getSessionStudents', () => {
    it('should return students in session', async () => {
      req.params.id = '1';

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1
      };

      const mockStudents = [
        { id: 1, first_name: 'John', last_name: 'Doe' },
        { id: 2, first_name: 'Jane', last_name: 'Smith' }
      ];

      Session.findById.mockResolvedValue(mockSession);
      Student.findByClassId.mockResolvedValue(mockStudents);

      await getSessionStudents(req, res);

      expect(Student.findByClassId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStudents
      });
    });
  });
});
