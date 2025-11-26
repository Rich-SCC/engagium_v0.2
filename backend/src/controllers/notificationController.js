const Notification = require('../models/Notification');

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unread === 'true';

    const notifications = await Notification.findByUserId(userId, unreadOnly);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const updated = await Notification.markAsRead(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const updated = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      data: { count: updated.length }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notifications'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await Notification.delete(id);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Create notification (internal use / admin)
exports.createNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, action_url } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Only allow system/operational notification types (NO participation-based notifications)
    const allowedTypes = ['auth_expiry', 'sync_failure', 'extension_update', 'system'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification type. Allowed types: auth_expiry, sync_failure, extension_update, system'
      });
    }

    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
      action_url
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
};
