require('../setup');
const Session = require('../../models/Session');

// Mock the database
jest.mock('../../config/database');
const db = require('../../config/database');

describe('Session Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const sessionData = {
        class_id: 1,
        title: 'Week 1 Lecture',
        meeting_link: 'https://meet.example.com/test'
      };

      const mockSession = {
        id: 1,
        ...sessionData,
        status: 'scheduled',
        started_at: null,
        ended_at: null,
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockSession] });

      const result = await Session.create(sessionData);

      expect(result).toEqual(mockSession);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        [sessionData.class_id, sessionData.title, sessionData.meeting_link]
      );
    });
  });

  describe('findByInstructorId', () => {
    it('should find all sessions for an instructor', async () => {
      const mockSessions = [
        {
          id: 1,
          class_id: 1,
          title: 'Session 1',
          class_name: 'CS 101',
          subject: 'Computer Science',
          status: 'scheduled'
        },
        {
          id: 2,
          class_id: 1,
          title: 'Session 2',
          class_name: 'CS 101',
          subject: 'Computer Science',
          status: 'active'
        }
      ];

      db.query.mockResolvedValue({ rows: mockSessions });

      const result = await Session.findByInstructorId(1);

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN classes'),
        [1]
      );
    });
  });

  describe('findById', () => {
    it('should find session by id with class info', async () => {
      const mockSession = {
        id: 1,
        class_id: 1,
        title: 'Week 1 Lecture',
        class_name: 'CS 101',
        subject: 'Computer Science',
        instructor_id: 1,
        status: 'scheduled'
      };

      db.query.mockResolvedValue({ rows: [mockSession] });

      const result = await Session.findById(1);

      expect(result).toEqual(mockSession);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN classes'),
        [1]
      );
    });

    it('should return undefined if session not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Session.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByClassId', () => {
    it('should find all sessions for a class', async () => {
      const mockSessions = [
        { id: 1, class_id: 1, title: 'Session 1', status: 'ended' },
        { id: 2, class_id: 1, title: 'Session 2', status: 'active' }
      ];

      db.query.mockResolvedValue({ rows: mockSessions });

      const result = await Session.findByClassId(1);

      expect(result).toEqual(mockSessions);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE class_id = $1'),
        [1]
      );
    });
  });

  describe('update', () => {
    it('should update session information', async () => {
      const updateData = {
        title: 'Updated Title',
        meeting_link: 'https://meet.example.com/updated'
      };

      const mockUpdatedSession = {
        id: 1,
        class_id: 1,
        ...updateData,
        status: 'scheduled'
      };

      db.query.mockResolvedValue({ rows: [mockUpdatedSession] });

      const result = await Session.update(1, updateData);

      expect(result).toEqual(mockUpdatedSession);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        [updateData.title, updateData.meeting_link, 1]
      );
    });
  });

  describe('start', () => {
    it('should start a scheduled session', async () => {
      const mockStartedSession = {
        id: 1,
        class_id: 1,
        title: 'Session 1',
        status: 'active',
        started_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockStartedSession] });

      const result = await Session.start(1);

      expect(result).toEqual(mockStartedSession);
      expect(result.status).toBe('active');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        [1]
      );
    });
  });

  describe('end', () => {
    it('should end an active session', async () => {
      const mockEndedSession = {
        id: 1,
        class_id: 1,
        title: 'Session 1',
        status: 'ended',
        ended_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockEndedSession] });

      const result = await Session.end(1);

      expect(result).toEqual(mockEndedSession);
      expect(result.status).toBe('ended');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'ended'"),
        [1]
      );
    });
  });

  describe('delete', () => {
    it('should delete session and its participation logs', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await Session.delete(1);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM participation_logs WHERE session_id = $1',
        [1]
      );
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM sessions WHERE id = $1',
        [1]
      );
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return count of active sessions for instructor', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '2' }] });

      const result = await Session.getActiveSessionCount(1);

      expect(result).toBe(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        [1]
      );
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const mockStats = {
        unique_participants: '15',
        total_interactions: '120',
        manual_entries: '10',
        chat_messages: '50',
        reactions: '40',
        mic_toggles: '10',
        camera_toggles: '10'
      };

      db.query.mockResolvedValue({ rows: [mockStats] });

      const result = await Session.getSessionStats(1);

      expect(result).toEqual(mockStats);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT student_id)'),
        [1]
      );
    });
  });
});
