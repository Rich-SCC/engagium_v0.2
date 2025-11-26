require('../setup');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../../controllers/notificationController');
const Notification = require('../../models/Notification');

// Mock dependencies
jest.mock('../../models/Notification');

describe('NotificationController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123', role: 'instructor' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getNotifications', () => {
    it('should return all notifications for user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-123',
          type: 'auth_expiry',
          title: 'Token Expiring Soon',
          message: 'Your authentication will expire in 24 hours',
          read: false,
          created_at: new Date()
        },
        {
          id: 'notif-2',
          user_id: 'user-123',
          type: 'sync_failure',
          title: 'Extension Sync Failed',
          message: 'Failed to sync participation data',
          read: true,
          created_at: new Date()
        }
      ];

      Notification.findByUserId.mockResolvedValue(mockNotifications);

      await getNotifications(req, res);

      expect(Notification.findByUserId).toHaveBeenCalledWith('user-123', false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications
      });
    });

    it('should filter unread notifications when query param set', async () => {
      req.query.unread = 'true';

      const mockUnreadNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-123',
          type: 'auth_expiry',
          title: 'Token Expiring Soon',
          message: 'Your authentication will expire in 24 hours',
          read: false,
          created_at: new Date()
        }
      ];

      Notification.findByUserId.mockResolvedValue(mockUnreadNotifications);

      await getNotifications(req, res);

      expect(Notification.findByUserId).toHaveBeenCalledWith('user-123', true);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUnreadNotifications
      });
    });

    it('should handle errors', async () => {
      Notification.findByUserId.mockRejectedValue(new Error('Database error'));

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch notifications'
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      Notification.getUnreadCount.mockResolvedValue(5);

      await getUnreadCount(req, res);

      expect(Notification.getUnreadCount).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 5 }
      });
    });

    it('should handle errors', async () => {
      Notification.getUnreadCount.mockRejectedValue(new Error('Database error'));

      await getUnreadCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch unread count'
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      req.params.id = 'notif-1';

      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-123',
        read: false
      };

      const updatedNotification = {
        ...mockNotification,
        read: true
      };

      Notification.findById.mockResolvedValue(mockNotification);
      Notification.markAsRead.mockResolvedValue(updatedNotification);

      await markAsRead(req, res);

      expect(Notification.findById).toHaveBeenCalledWith('notif-1');
      expect(Notification.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedNotification
      });
    });

    it('should return 404 if notification not found', async () => {
      req.params.id = 'notif-999';

      Notification.findById.mockResolvedValue(null);

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found'
      });
    });

    it('should return 403 if notification belongs to another user', async () => {
      req.params.id = 'notif-1';

      const mockNotification = {
        id: 'notif-1',
        user_id: 'other-user',
        read: false
      };

      Notification.findById.mockResolvedValue(mockNotification);

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'notif-1';

      Notification.findById.mockRejectedValue(new Error('Database error'));

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update notification'
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      Notification.markAllAsRead.mockResolvedValue([{}, {}, {}]); // Returns array of updated notifications

      await markAllAsRead(req, res);

      expect(Notification.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 3 }
      });
    });

    it('should handle errors', async () => {
      Notification.markAllAsRead.mockRejectedValue(new Error('Database error'));

      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update notifications'
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      req.params.id = 'notif-1';

      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-123'
      };

      Notification.findById.mockResolvedValue(mockNotification);
      Notification.delete.mockResolvedValue(true);

      await deleteNotification(req, res);

      expect(Notification.findById).toHaveBeenCalledWith('notif-1');
      expect(Notification.delete).toHaveBeenCalledWith('notif-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted'
      });
    });

    it('should return 404 if notification not found', async () => {
      req.params.id = 'notif-999';

      Notification.findById.mockResolvedValue(null);

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found'
      });
    });

    it('should return 403 if notification belongs to another user', async () => {
      req.params.id = 'notif-1';

      const mockNotification = {
        id: 'notif-1',
        user_id: 'other-user'
      };

      Notification.findById.mockResolvedValue(mockNotification);

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'notif-1';

      Notification.findById.mockRejectedValue(new Error('Database error'));

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete notification'
      });
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      req.body = {
        user_id: 'user-123',
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday',
        action_url: '/settings'
      };

      const mockNotification = {
        id: 'notif-1',
        ...req.body,
        read: false,
        created_at: new Date()
      };

      Notification.create.mockResolvedValue(mockNotification);

      await createNotification(req, res);

      expect(Notification.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification
      });
    });

    it('should return 400 if required fields missing', async () => {
      req.body = {
        type: 'system'
        // Missing user_id, title and message
      };

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields'
      });
    });

    it('should handle errors', async () => {
      req.body = {
        user_id: 'user-123',
        type: 'system',
        title: 'Test',
        message: 'Test message'
      };

      Notification.create.mockRejectedValue(new Error('Database error'));

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create notification'
      });
    });
  });
});
