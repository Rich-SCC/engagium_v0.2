require('../setup');
const Student = require('../../models/Student');

// Mock the database
jest.mock('../../config/database');
const db = require('../../config/database');

describe('Student Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      const studentData = {
        class_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        student_id: 'STU001'
      };

      const mockStudent = {
        id: 1,
        ...studentData,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockStudent] });

      const result = await Student.create(studentData);

      expect(result).toEqual(mockStudent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO students'),
        [studentData.class_id, studentData.first_name, studentData.last_name, studentData.email, studentData.student_id]
      );
    });

    it('should throw error when student ID already exists in class', async () => {
      const studentData = {
        class_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        student_id: 'STU001'
      };

      const dbError = new Error('Duplicate key');
      dbError.code = '23505';
      db.query.mockRejectedValue(dbError);

      await expect(Student.create(studentData)).rejects.toThrow('Student ID already exists in this class');
    });
  });

  describe('findByClassId', () => {
    it('should find all students in a class ordered by name', async () => {
      const mockStudents = [
        {
          id: 1,
          class_id: 1,
          first_name: 'Alice',
          last_name: 'Anderson',
          email: 'alice@example.com',
          student_id: 'STU001'
        },
        {
          id: 2,
          class_id: 1,
          first_name: 'Bob',
          last_name: 'Brown',
          email: 'bob@example.com',
          student_id: 'STU002'
        }
      ];

      db.query.mockResolvedValue({ rows: mockStudents });

      const result = await Student.findByClassId(1);

      expect(result).toEqual(mockStudents);
      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY last_name, first_name'),
        [1]
      );
    });

    it('should return empty array if no students found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Student.findByClassId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find student by id with class info', async () => {
      const mockStudent = {
        id: 1,
        class_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        student_id: 'STU001',
        class_name: 'CS 101',
        subject: 'Computer Science'
      };

      db.query.mockResolvedValue({ rows: [mockStudent] });

      const result = await Student.findById(1);

      expect(result).toEqual(mockStudent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN classes'),
        [1]
      );
    });

    it('should return undefined if student not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Student.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update student information', async () => {
      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        student_id: 'STU999'
      };

      const mockUpdatedStudent = {
        id: 1,
        class_id: 1,
        ...updateData,
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockUpdatedStudent] });

      const result = await Student.update(1, updateData);

      expect(result).toEqual(mockUpdatedStudent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE students'),
        [updateData.first_name, updateData.last_name, updateData.email, updateData.student_id, 1]
      );
    });

    it('should throw error when updating to duplicate student ID', async () => {
      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        student_id: 'STU001'
      };

      const dbError = new Error('Duplicate key');
      dbError.code = '23505';
      db.query.mockRejectedValue(dbError);

      await expect(Student.update(1, updateData)).rejects.toThrow('Student ID already exists in this class');
    });
  });

  describe('delete', () => {
    it('should delete student when no participation logs exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await Student.delete(1);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT COUNT'),
        [1]
      );
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM students WHERE id = $1',
        [1]
      );
    });

    it('should throw error when student has participation logs', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '5' }] });

      await expect(Student.delete(1)).rejects.toThrow('Cannot delete student with participation logs');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple students and return results', async () => {
      const studentsData = [
        {
          class_id: 1,
          first_name: 'Alice',
          last_name: 'Anderson',
          email: 'alice@example.com',
          student_id: 'STU001'
        },
        {
          class_id: 1,
          first_name: 'Bob',
          last_name: 'Brown',
          email: 'bob@example.com',
          student_id: 'STU002'
        }
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, ...studentsData[0] }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, ...studentsData[1] }] });

      const results = await Student.bulkCreate(studentsData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle partial failures in bulk create', async () => {
      const studentsData = [
        {
          class_id: 1,
          first_name: 'Alice',
          last_name: 'Anderson',
          email: 'alice@example.com',
          student_id: 'STU001'
        },
        {
          class_id: 1,
          first_name: 'Bob',
          last_name: 'Brown',
          email: 'bob@example.com',
          student_id: 'STU001' // Duplicate
        }
      ];

      const dbError = new Error('Duplicate key');
      dbError.code = '23505';

      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, ...studentsData[0] }] })
        .mockRejectedValueOnce(dbError);

      const results = await Student.bulkCreate(studentsData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Student ID already exists in this class');
    });
  });

  describe('findByClassIdAndStudentId', () => {
    it('should find student by class ID and student ID', async () => {
      const mockStudent = {
        id: 1,
        class_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        student_id: 'STU001'
      };

      db.query.mockResolvedValue({ rows: [mockStudent] });

      const result = await Student.findByClassIdAndStudentId(1, 'STU001');

      expect(result).toEqual(mockStudent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE class_id = $1 AND student_id = $2'),
        [1, 'STU001']
      );
    });

    it('should return undefined if student not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Student.findByClassIdAndStudentId(1, 'NOTFOUND');

      expect(result).toBeUndefined();
    });
  });
});
