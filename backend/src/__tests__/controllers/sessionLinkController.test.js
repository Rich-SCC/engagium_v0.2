require('../setup');
const {
  getClassLinks,
  addClassLink,
  updateClassLink,
  deleteClassLink
} = require('../../controllers/classController');
const Class = require('../../models/Class');
const SessionLink = require('../../models/SessionLink');

// Mock dependencies
jest.mock('../../models/Class');
jest.mock('../../models/SessionLink');

describe('SessionLink Management', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: { id: 1, role: 'instructor' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getClassLinks', () => {
    it('should return all links for a class', async () => {
      req.params = { id: '1' };
      
      const mockClass = { id: 1, instructor_id: 1, name: 'CS 101' };
      const mockLinks = [
        { id: 1, class_id: 1, link_url: 'https://zoom.us/j/123', link_type: 'zoom', is_primary: true },
        { id: 2, class_id: 1, link_url: 'https://meet.google.com/abc', link_type: 'meet', is_primary: false }
      ];

      Class.findById.mockResolvedValue(mockClass);
      SessionLink.findByClassId.mockResolvedValue(mockLinks);

      await getClassLinks(req, res);

      expect(SessionLink.findByClassId).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLinks
      });
    });

    it('should return 404 if class not found', async () => {
      req.params = { id: '999' };
      Class.findById.mockResolvedValue(null);

      await getClassLinks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Class not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params = { id: '1' };
      const mockClass = { id: 1, instructor_id: 2, name: 'CS 101' };
      Class.findById.mockResolvedValue(mockClass);

      await getClassLinks(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('addClassLink', () => {
    it('should add a new session link', async () => {
      req.params = { id: '1' };
      req.body = {
        link_url: 'https://zoom.us/j/123456789',
        link_type: 'zoom',
        label: 'Main Zoom Room',
        zoom_meeting_id: '123 456 789',
        zoom_passcode: 'abc123',
        is_primary: true
      };

      const mockClass = { id: 1, instructor_id: 1, name: 'CS 101' };
      const mockLink = { id: 1, class_id: 1, ...req.body };

      Class.findById.mockResolvedValue(mockClass);
      SessionLink.create.mockResolvedValue(mockLink);

      await addClassLink(req, res);

      expect(SessionLink.create).toHaveBeenCalledWith({
        class_id: '1',
        ...req.body
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLink
      });
    });

    it('should return 400 if link_url is missing', async () => {
      req.params = { id: '1' };
      req.body = { link_type: 'zoom' };

      await addClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Link URL is required'
      });
    });

    it('should allow admin to add link to any class', async () => {
      req.user = { id: 2, role: 'admin' };
      req.params = { id: '1' };
      req.body = {
        link_url: 'https://meet.google.com/xyz',
        link_type: 'meet'
      };

      const mockClass = { id: 1, instructor_id: 1, name: 'CS 101' };
      const mockLink = { id: 1, class_id: 1, ...req.body };

      Class.findById.mockResolvedValue(mockClass);
      SessionLink.create.mockResolvedValue(mockLink);

      await addClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLink
      });
    });
  });

  describe('updateClassLink', () => {
    it('should update a session link', async () => {
      req.params = { linkId: '1' };
      req.body = {
        link_url: 'https://zoom.us/j/987654321',
        link_type: 'zoom',
        label: 'Updated Zoom Room',
        is_primary: false
      };

      const mockLink = { id: 1, class_id: 1, link_url: 'https://zoom.us/j/123' };
      const mockClass = { id: 1, instructor_id: 1, name: 'CS 101' };
      const mockUpdatedLink = { id: 1, class_id: 1, ...req.body };

      SessionLink.findById.mockResolvedValue(mockLink);
      Class.findById.mockResolvedValue(mockClass);
      SessionLink.update.mockResolvedValue(mockUpdatedLink);

      await updateClassLink(req, res);

      expect(SessionLink.update).toHaveBeenCalledWith('1', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedLink
      });
    });

    it('should return 404 if link not found', async () => {
      req.params = { linkId: '999' };
      req.body = { link_url: 'https://zoom.us/j/123' };

      SessionLink.findById.mockResolvedValue(null);

      await updateClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Link not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params = { linkId: '1' };
      req.body = { link_url: 'https://zoom.us/j/123' };

      const mockLink = { id: 1, class_id: 1 };
      const mockClass = { id: 1, instructor_id: 2, name: 'CS 101' };

      SessionLink.findById.mockResolvedValue(mockLink);
      Class.findById.mockResolvedValue(mockClass);

      await updateClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });

  describe('deleteClassLink', () => {
    it('should delete a session link', async () => {
      req.params = { linkId: '1' };

      const mockLink = { id: 1, class_id: 1 };
      const mockClass = { id: 1, instructor_id: 1, name: 'CS 101' };

      SessionLink.findById.mockResolvedValue(mockLink);
      Class.findById.mockResolvedValue(mockClass);
      SessionLink.delete.mockResolvedValue();

      await deleteClassLink(req, res);

      expect(SessionLink.delete).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Link deleted successfully'
      });
    });

    it('should return 404 if link not found', async () => {
      req.params = { linkId: '999' };

      SessionLink.findById.mockResolvedValue(null);

      await deleteClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Link not found'
      });
    });

    it('should return 403 if user does not own class', async () => {
      req.params = { linkId: '1' };

      const mockLink = { id: 1, class_id: 1 };
      const mockClass = { id: 1, instructor_id: 2, name: 'CS 101' };

      SessionLink.findById.mockResolvedValue(mockLink);
      Class.findById.mockResolvedValue(mockClass);

      await deleteClassLink(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });
  });
});
