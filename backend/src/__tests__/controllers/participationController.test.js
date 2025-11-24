require('../setup');
const {
  getParticipationLogs,
  addParticipationLog,
  getSessionSummary,
  getRecentActivity,
  addBulkParticipationLogs
} = require('../../controllers/participationController');
const ParticipationLog = require('../../models/ParticipationLog');
const Session = require('../../models/Session');
const Student = require('../../models/Student');

// Mock dependencies
jest.mock('../../models/ParticipationLog');
jest.mock('../../models/Session');
jest.mock('../../models/Student');

describe('ParticipationController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
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

  describe('getParticipationLogs', () => {
    it('should return participation logs for a session', async () => {
      req.params.sessionId = '1';
      req.query = { page: '1', limit: '50' };

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      const mockLogs = {
        data: [
          { id: 1, interaction_type: 'chat', first_name: 'John' },
          { id: 2, interaction_type: 'reaction', first_name: 'Jane' }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2
        }
      };

      Session.findById.mockResolvedValue(mockSession);
      ParticipationLog.findBySessionIdWithPagination.mockResolvedValue(mockLogs);

      await getParticipationLogs(req, res);

      expect(Session.findById).toHaveBeenCalledWith('1');
      expect(ParticipationLog.findBySessionIdWithPagination).toHaveBeenCalledWith('1', 1, 50);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs
      });
    });

    it('should return 404 if session not found', async () => {
      req.params.sessionId = '999';

      Session.findById.mockResolvedValue(null);

      await getParticipationLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
    });

    it('should return 403 if user does not have access', async () => {
      req.params.sessionId = '1';
      req.user = { id: 2, role: 'instructor' };

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      Session.findById.mockResolvedValue(mockSession);

      await getParticipationLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('addParticipationLog', () => {
    it('should add participation log successfully', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 1,
        interaction_type: 'chat',
        interaction_value: 1,
        additional_data: { message: 'Test' }
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const mockStudent = {
        id: 1,
        class_id: 1
      };

      const mockLog = {
        id: 1,
        session_id: 1,
        ...req.body
      };

      const mockLogWithStudent = {
        ...mockLog,
        first_name: 'John',
        last_name: 'Doe'
      };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(mockSession);
      Student.findById.mockResolvedValue(mockStudent);
      ParticipationLog.create.mockResolvedValue(mockLog);
      ParticipationLog.findBySessionId.mockResolvedValue([mockLogWithStudent]);

      await addParticipationLog(req, res);

      expect(ParticipationLog.create).toHaveBeenCalledWith({
        session_id: '1',
        ...req.body
      });
      expect(mockIo.emit).toHaveBeenCalledWith('participation:added', {
        sessionId: '1',
        log: mockLogWithStudent
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLog,
        message: 'Participation log added successfully'
      });
    });

    it('should return 400 if session is not active', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 1,
        interaction_type: 'chat'
      };

      const mockSession = {
        id: 1,
        instructor_id: 1,
        status: 'scheduled'
      };

      Session.findById.mockResolvedValue(mockSession);

      await addParticipationLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Can only add participation logs to active sessions'
      });
    });

    it('should return 400 if required fields missing', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 1
        // Missing interaction_type
      };

      const mockSession = {
        id: 1,
        instructor_id: 1,
        status: 'active'
      };

      Session.findById.mockResolvedValue(mockSession);

      await addParticipationLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Student ID and interaction type are required'
      });
    });

    it('should return 404 if student not found', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 999,
        interaction_type: 'chat'
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      Session.findById.mockResolvedValue(mockSession);
      Student.findById.mockResolvedValue(null);

      await addParticipationLog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Student not found'
      });
    });

    it('should return 400 if student not in session class', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 1,
        interaction_type: 'chat'
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const mockStudent = {
        id: 1,
        class_id: 2 // Different class
      };

      Session.findById.mockResolvedValue(mockSession);
      Student.findById.mockResolvedValue(mockStudent);

      await addParticipationLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Student does not belong to this session\'s class'
      });
    });

    it('should return 400 for invalid interaction type', async () => {
      req.params.sessionId = '1';
      req.body = {
        student_id: 1,
        interaction_type: 'invalid_type'
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const mockStudent = {
        id: 1,
        class_id: 1
      };

      Session.findById.mockResolvedValue(mockSession);
      Student.findById.mockResolvedValue(mockStudent);

      await addParticipationLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid interaction type'
      });
    });
  });

  describe('getSessionSummary', () => {
    it('should return session summary with statistics', async () => {
      req.params.sessionId = '1';

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      const mockStats = {
        unique_participants: '15',
        total_interactions: '120'
      };

      const mockInteractionSummary = [
        { interaction_type: 'chat', count: '50' },
        { interaction_type: 'reaction', count: '40' }
      ];

      const mockStudentSummary = [
        { student_id: 1, total_interactions: '25' },
        { student_id: 2, total_interactions: '30' }
      ];

      Session.findById.mockResolvedValue(mockSession);
      Session.getSessionStats.mockResolvedValue(mockStats);
      ParticipationLog.getSessionInteractionSummary.mockResolvedValue(mockInteractionSummary);
      ParticipationLog.getStudentSessionSummary.mockResolvedValue(mockStudentSummary);

      await getSessionSummary(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          session: mockSession,
          stats: mockStats,
          interactionSummary: mockInteractionSummary,
          studentSummary: mockStudentSummary
        }
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity for session', async () => {
      req.params.sessionId = '1';
      req.query.minutes = '10';

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      const mockActivity = [
        { id: 1, interaction_type: 'chat', timestamp: new Date() },
        { id: 2, interaction_type: 'reaction', timestamp: new Date() }
      ];

      Session.findById.mockResolvedValue(mockSession);
      ParticipationLog.getRecentActivity.mockResolvedValue(mockActivity);

      await getRecentActivity(req, res);

      expect(ParticipationLog.getRecentActivity).toHaveBeenCalledWith('1', 10);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockActivity
      });
    });

    it('should use default 5 minutes if not specified', async () => {
      req.params.sessionId = '1';
      req.query = {};

      const mockSession = {
        id: 1,
        instructor_id: 1
      };

      Session.findById.mockResolvedValue(mockSession);
      ParticipationLog.getRecentActivity.mockResolvedValue([]);

      await getRecentActivity(req, res);

      expect(ParticipationLog.getRecentActivity).toHaveBeenCalledWith('1', 5);
    });
  });

  describe('addBulkParticipationLogs', () => {
    it('should add multiple participation logs successfully', async () => {
      req.params.sessionId = '1';
      req.body = {
        logs: [
          { student_id: 1, interaction_type: 'chat', interaction_value: 1 },
          { student_id: 2, interaction_type: 'reaction', interaction_value: 1 }
        ]
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const mockStudent1 = { id: 1, class_id: 1 };
      const mockStudent2 = { id: 2, class_id: 1 };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(mockSession);
      Student.findById
        .mockResolvedValueOnce(mockStudent1)
        .mockResolvedValueOnce(mockStudent2);
      ParticipationLog.create
        .mockResolvedValueOnce({ id: 1, ...req.body.logs[0] })
        .mockResolvedValueOnce({ id: 2, ...req.body.logs[1] });

      await addBulkParticipationLogs(req, res);

      expect(ParticipationLog.create).toHaveBeenCalledTimes(2);
      expect(mockIo.emit).toHaveBeenCalledWith('participation:bulk_added', {
        sessionId: '1',
        count: 2
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          added: 2,
          failed: 0,
          errors: [],
          results: expect.any(Array)
        },
        message: 'Added 2 participation logs successfully'
      });
    });

    it('should return 400 if logs array is empty', async () => {
      req.params.sessionId = '1';
      req.body = {
        logs: []
      };

      const mockSession = {
        id: 1,
        instructor_id: 1,
        status: 'active'
      };

      Session.findById.mockResolvedValue(mockSession);

      await addBulkParticipationLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Logs array is required and cannot be empty'
      });
    });

    it('should handle partial failures in bulk creation', async () => {
      req.params.sessionId = '1';
      req.body = {
        logs: [
          { student_id: 1, interaction_type: 'chat', interaction_value: 1 },
          { student_id: 999, interaction_type: 'chat', interaction_value: 1 }, // Invalid student
          { student_id: 2, interaction_type: 'reaction', interaction_value: 1 }
        ]
      };

      const mockSession = {
        id: 1,
        class_id: 1,
        instructor_id: 1,
        status: 'active'
      };

      const mockStudent1 = { id: 1, class_id: 1 };
      const mockStudent2 = { id: 2, class_id: 1 };

      const mockIo = { emit: jest.fn() };
      req.app.get.mockReturnValue(mockIo);

      Session.findById.mockResolvedValue(mockSession);
      Student.findById
        .mockResolvedValueOnce(mockStudent1)
        .mockResolvedValueOnce(null) // Invalid student
        .mockResolvedValueOnce(mockStudent2);
      ParticipationLog.create
        .mockResolvedValueOnce({ id: 1, ...req.body.logs[0] })
        .mockResolvedValueOnce({ id: 3, ...req.body.logs[2] });

      await addBulkParticipationLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          added: 2,
          failed: 1,
          errors: expect.arrayContaining([
            expect.objectContaining({
              error: expect.stringContaining('Invalid student')
            })
          ]),
          results: expect.any(Array)
        },
        message: 'Added 2 participation logs successfully'
      });
    });
  });
});
