require('../setup');
const Class = require('../../models/Class');

// Mock the database
jest.mock('../../config/database');
const db = require('../../config/database');

describe('Class Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const classData = {
        instructor_id: 1,
        name: 'Computer Science 101',
        subject: 'Computer Science',
        section: 'A',
        description: 'Introduction to CS'
      };

      const mockClass = {
        id: 1,
        ...classData,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockClass] });

      const result = await Class.create(classData);

      expect(result).toEqual(mockClass);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO classes'),
        [classData.instructor_id, classData.name, classData.subject, classData.section, classData.description]
      );
    });
  });

  describe('findByInstructorId', () => {
    it('should find all classes for an instructor with student count', async () => {
      const mockClasses = [
        {
          id: 1,
          instructor_id: 1,
          name: 'CS 101',
          student_count: '5',
          created_at: new Date()
        },
        {
          id: 2,
          instructor_id: 1,
          name: 'CS 102',
          student_count: '10',
          created_at: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockClasses });

      const result = await Class.findByInstructorId(1);

      expect(result).toEqual(mockClasses);
      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN students'),
        [1]
      );
    });

    it('should return empty array if no classes found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Class.findByInstructorId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find class by id with instructor info', async () => {
      const mockClass = {
        id: 1,
        instructor_id: 1,
        name: 'CS 101',
        subject: 'Computer Science',
        instructor_first_name: 'John',
        instructor_last_name: 'Doe',
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockClass] });

      const result = await Class.findById(1);

      expect(result).toEqual(mockClass);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN users'),
        [1]
      );
    });

    it('should return undefined if class not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Class.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update class information', async () => {
      const updateData = {
        name: 'Updated Class Name',
        subject: 'Updated Subject',
        section: 'B',
        description: 'Updated description'
      };

      const mockUpdatedClass = {
        id: 1,
        instructor_id: 1,
        ...updateData,
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUpdatedClass] });

      const result = await Class.update(1, updateData);

      expect(result).toEqual(mockUpdatedClass);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE classes'),
        [updateData.name, updateData.subject, updateData.section, updateData.description, 1]
      );
    });
  });

  describe('delete', () => {
    it('should delete class when no sessions exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await Class.delete(1);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT COUNT'),
        [1]
      );
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM classes WHERE id = $1',
        [1]
      );
    });

    it('should throw error when class has existing sessions', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '3' }] });

      await expect(Class.delete(1)).rejects.toThrow('Cannot delete class with existing sessions');
    });
  });

  describe('getStudentCount', () => {
    it('should return student count for a class', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '15' }] });

      const result = await Class.getStudentCount(1);

      expect(result).toBe(15);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
        [1]
      );
    });

    it('should return 0 when no students in class', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await Class.getStudentCount(1);

      expect(result).toBe(0);
    });
  });
});
