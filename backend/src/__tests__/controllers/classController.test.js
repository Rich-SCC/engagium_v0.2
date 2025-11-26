require('../setup');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStats
} = require('../../controllers/classController');
const Class = require('../../models/Class');

// Mock dependencies
jest.mock('../../models/Class');

describe('ClassController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'instructor' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getClasses', () => {
    it('should return all classes for instructor', async () => {
      const mockClasses = [
        { id: 1, name: 'CS 101', instructor_id: 1, student_count: '10' },
        { id: 2, name: 'CS 102', instructor_id: 1, student_count: '15' }
      ];

      Class.findByInstructorId.mockResolvedValue(mockClasses);
      req.query = { include_archived: 'false' };

      await getClasses(req, res);

      expect(Class.findByInstructorId).toHaveBeenCalledWith(1, false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClasses
      });
    });

    it('should handle errors', async () => {
      Class.findByInstructorId.mockRejectedValue(new Error('Database error'));

      await getClasses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('getClass', () => {
    it('should return class by id', async () => {
      req.params.id = '1';

      const mockClass = {
        id: 1,
        name: 'CS 101',
        instructor_id: 1,
        instructor_first_name: 'John',
        instructor_last_name: 'Doe'
      };

      Class.findById.mockResolvedValue(mockClass);

      await getClass(req, res);

      expect(Class.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClass
      });
    });

    it('should return 404 if class not found', async () => {
      req.params.id = '999';

      Class.findById.mockResolvedValue(null);

      await getClass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params.id = '1';
      req.user = { id: 2, role: 'instructor' };

      const mockClass = {
        id: 1,
        name: 'CS 101',
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(mockClass);

      await getClass(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });

    it('should allow admin to access any class', async () => {
      req.params.id = '1';
      req.user = { id: 2, role: 'admin' };

      const mockClass = {
        id: 1,
        name: 'CS 101',
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(mockClass);

      await getClass(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClass
      });
    });
  });

  describe('createClass', () => {
    it('should create a new class', async () => {
      req.body = {
        name: 'CS 101',
        subject: 'Computer Science',
        section: 'A',
        description: 'Introduction to CS'
      };

      const mockClass = {
        id: 1,
        instructor_id: 1,
        ...req.body
      };

      Class.create.mockResolvedValue(mockClass);

      await createClass(req, res);

      expect(Class.create).toHaveBeenCalledWith({
        instructor_id: 1,
        ...req.body
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClass
      });
    });

    it('should return 400 if name is missing', async () => {
      req.body = {
        subject: 'Computer Science',
        section: 'A'
      };

      await createClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class name is required'
      });
      expect(Class.create).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = {
        name: 'CS 101'
      };

      Class.create.mockRejectedValue(new Error('Database error'));

      await createClass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('updateClass', () => {
    it('should update class successfully', async () => {
      req.params.id = '1';
      req.body = {
        name: 'Updated CS 101',
        subject: 'Computer Science',
        section: 'B',
        description: 'Updated description'
      };

      const existingClass = {
        id: 1,
        name: 'CS 101',
        instructor_id: 1
      };

      const updatedClass = {
        id: 1,
        instructor_id: 1,
        ...req.body
      };

      Class.findById.mockResolvedValue(existingClass);
      Class.update.mockResolvedValue(updatedClass);

      await updateClass(req, res);

      expect(Class.findById).toHaveBeenCalledWith('1');
      expect(Class.update).toHaveBeenCalledWith('1', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedClass
      });
    });

    it('should return 404 if class not found', async () => {
      req.params.id = '999';
      req.body = { name: 'Updated Class' };

      Class.findById.mockResolvedValue(null);

      await updateClass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params.id = '1';
      req.user = { id: 2, role: 'instructor' };
      req.body = { name: 'Updated Class' };

      const existingClass = {
        id: 1,
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(existingClass);

      await updateClass(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });

    it('should return 400 if name is missing', async () => {
      req.params.id = '1';
      req.body = { subject: 'Computer Science' };

      const existingClass = {
        id: 1,
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(existingClass);

      await updateClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class name is required'
      });
    });
  });

  describe('deleteClass', () => {
    it('should delete class successfully', async () => {
      req.params.id = '1';

      const existingClass = {
        id: 1,
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(existingClass);
      Class.delete.mockResolvedValue();

      await deleteClass(req, res);

      expect(Class.findById).toHaveBeenCalledWith('1');
      expect(Class.delete).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Class deleted successfully'
      });
    });

    it('should return 404 if class not found', async () => {
      req.params.id = '999';

      Class.findById.mockResolvedValue(null);

      await deleteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params.id = '1';
      req.user = { id: 2, role: 'instructor' };

      const existingClass = {
        id: 1,
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(existingClass);

      await deleteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });

    it('should return 400 when class has existing sessions', async () => {
      req.params.id = '1';

      const existingClass = {
        id: 1,
        instructor_id: 1
      };

      Class.findById.mockResolvedValue(existingClass);
      Class.delete.mockRejectedValue(new Error('Cannot delete class with existing sessions'));

      await deleteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete class with existing sessions'
      });
    });
  });

  describe('getClassStats', () => {
    it('should return class statistics', async () => {
      const mockClasses = [
        { id: 1, name: 'CS 101', student_count: '10' },
        { id: 2, name: 'CS 102', student_count: '15' },
        { id: 3, name: 'CS 103', student_count: '20' }
      ];

      Class.findByInstructorId.mockResolvedValue(mockClasses);

      await getClassStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalClasses: 3,
          totalStudents: 45,
          recentClasses: mockClasses.slice(0, 5)
        }
      });
    });
  });
});
