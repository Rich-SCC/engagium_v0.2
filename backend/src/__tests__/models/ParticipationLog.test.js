require('../setup');
const ParticipationLog = require('../../models/ParticipationLog');

// Mock the database
jest.mock('../../config/database');
const db = require('../../config/database');

describe('ParticipationLog Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new participation log', async () => {
      const logData = {
        session_id: 1,
        student_id: 1,
        interaction_type: 'chat',
        interaction_value: 1,
        additional_data: { message: 'Test message' }
      };

      const mockLog = {
        id: 1,
        ...logData,
        timestamp: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockLog] });

      const result = await ParticipationLog.create(logData);

      expect(result).toEqual(mockLog);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO participation_logs'),
        expect.arrayContaining([
          logData.session_id,
          logData.student_id,
          logData.interaction_type,
          logData.interaction_value,
          JSON.stringify(logData.additional_data)
        ])
      );
    });

    it('should handle null additional_data', async () => {
      const logData = {
        session_id: 1,
        student_id: 1,
        interaction_type: 'reaction',
        interaction_value: 1,
        additional_data: null
      };

      const mockLog = { id: 1, ...logData, timestamp: new Date() };
      db.query.mockResolvedValue({ rows: [mockLog] });

      await ParticipationLog.create(logData);

      expect(db.query.mock.calls[0][1][4]).toBeNull();
    });
  });

  describe('findBySessionId', () => {
    it('should find logs by session ID with student info', async () => {
      const mockLogs = [
        {
          id: 1,
          session_id: 1,
          student_id: 1,
          interaction_type: 'chat',
          first_name: 'John',
          last_name: 'Doe',
          student_id: 'STU001',
          timestamp: new Date()
        },
        {
          id: 2,
          session_id: 1,
          student_id: 2,
          interaction_type: 'reaction',
          first_name: 'Jane',
          last_name: 'Smith',
          student_id: 'STU002',
          timestamp: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockLogs });

      const result = await ParticipationLog.findBySessionId(1);

      expect(result).toEqual(mockLogs);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN students'),
        expect.arrayContaining([1, 100, 0])
      );
    });

    it('should filter by interaction type', async () => {
      const mockLogs = [
        {
          id: 1,
          session_id: 1,
          interaction_type: 'chat',
          first_name: 'John',
          last_name: 'Doe'
        }
      ];

      db.query.mockResolvedValue({ rows: mockLogs });

      const result = await ParticipationLog.findBySessionId(1, { interaction_type: 'chat' });

      expect(result).toEqual(mockLogs);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('interaction_type = $2'),
        expect.arrayContaining([1, 'chat'])
      );
    });

    it('should handle pagination options', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ParticipationLog.findBySessionId(1, { limit: 50, offset: 100 });

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 50, 100])
      );
    });
  });

  describe('findBySessionIdWithPagination', () => {
    it('should return paginated results with metadata', async () => {
      const mockLogs = [
        { id: 1, session_id: 1, interaction_type: 'chat', first_name: 'John', last_name: 'Doe' }
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })
        .mockResolvedValueOnce({ rows: mockLogs });

      const result = await ParticipationLog.findBySessionIdWithPagination(1, 2, 50);

      expect(result.data).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 50,
        total: 100,
        totalPages: 2
      });
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should calculate correct offset for pages', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })
        .mockResolvedValueOnce({ rows: [] });

      await ParticipationLog.findBySessionIdWithPagination(1, 3, 25);

      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        [1, 25, 50] // offset = (3-1) * 25 = 50
      );
    });
  });

  describe('findByStudentId', () => {
    it('should find logs by student ID with session info', async () => {
      const mockLogs = [
        {
          id: 1,
          student_id: 1,
          session_title: 'Week 1 Lecture',
          class_name: 'CS 101',
          interaction_type: 'chat',
          timestamp: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockLogs });

      const result = await ParticipationLog.findByStudentId(1);

      expect(result).toEqual(mockLogs);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN sessions'),
        expect.arrayContaining([1, 100, 0])
      );
    });
  });

  describe('getSessionInteractionSummary', () => {
    it('should return interaction summary by type', async () => {
      const mockSummary = [
        { interaction_type: 'chat', count: '50', unique_students: '15' },
        { interaction_type: 'reaction', count: '30', unique_students: '12' },
        { interaction_type: 'manual_entry', count: '10', unique_students: '8' }
      ];

      db.query.mockResolvedValue({ rows: mockSummary });

      const result = await ParticipationLog.getSessionInteractionSummary(1);

      expect(result).toEqual(mockSummary);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY interaction_type'),
        [1]
      );
    });
  });

  describe('getStudentSessionSummary', () => {
    it('should return per-student summary for session', async () => {
      const mockSummary = [
        {
          student_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          student_id: 'STU001',
          total_interactions: '25',
          manual_entries: '5',
          chat_messages: '15',
          reactions: '5',
          last_interaction: new Date()
        },
        {
          student_id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          student_id: 'STU002',
          total_interactions: '30',
          manual_entries: '8',
          chat_messages: '18',
          reactions: '4',
          last_interaction: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockSummary });

      const result = await ParticipationLog.getStudentSessionSummary(1);

      expect(result).toEqual(mockSummary);
      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN participation_logs'),
        [1]
      );
    });
  });

  describe('deleteBySessionId', () => {
    it('should delete all logs for a session', async () => {
      db.query.mockResolvedValue({ rowCount: 45 });

      const result = await ParticipationLog.deleteBySessionId(1);

      expect(result).toBe(45);
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM participation_logs WHERE session_id = $1',
        [1]
      );
    });

    it('should return 0 when no logs deleted', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const result = await ParticipationLog.deleteBySessionId(999);

      expect(result).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('should return activity from last 5 minutes by default', async () => {
      const mockActivity = [
        {
          id: 1,
          session_id: 1,
          interaction_type: 'chat',
          first_name: 'John',
          last_name: 'Doe',
          timestamp: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockActivity });

      const result = await ParticipationLog.getRecentActivity(1);

      expect(result).toEqual(mockActivity);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '5 minutes'"),
        [1]
      );
    });

    it('should accept custom time window', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ParticipationLog.getRecentActivity(1, 10);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '10 minutes'"),
        [1]
      );
    });
  });
});
