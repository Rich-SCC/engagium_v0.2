const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { getJwtSecret } = require('../config/jwt');

// Store for active sessions and connections
const activeSessions = new Map(); // sessionId -> Set of socket ids
const socketSessions = new Map(); // socketId -> session data

const userCanAccessSession = async (user, sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    return { allowed: false, reason: 'Session not found' };
  }

  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (String(session.instructor_id) !== String(user.id)) {
    return { allowed: false, reason: 'Access denied to this session' };
  }

  return { allowed: true };
};

const socketHandler = (io) => {
  const logSocketError = (context, error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`${context}:`, error);
      return;
    }

    const message = error?.message || 'Unknown socket error';
    console.error(`${context}: ${message}`);
  };

  // Store io instance globally and on app for controllers to access
  global.io = io;
  if (global.app) {
    global.app.set('io', io);
  }

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔌 ========================================`);
      console.log(`🔌 User connected: ${socket.user.email}`);
      console.log(`🔌 Socket ID: ${socket.id}`);
      console.log(`🔌 ========================================\n`);
    }

    // Join instructor-specific room (for receiving events from extension)
    socket.on('join_instructor_room', (data) => {
      const roomName = `instructor_${socket.user.id}`;
      socket.join(roomName);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 ========================================`);
        console.log(`📱 User ${socket.user.email} joined instructor room`);
        console.log(`📱 Room Name: ${roomName}`);
        console.log(`📱 Room Members: ${io.sockets.adapter.rooms.get(roomName)?.size || 0}`);
        console.log(`📱 ========================================\n`);
      }
    });

    // Join session room
    socket.on('join:session', async (data) => {
      try {
        const { sessionId } = data;

        if (!sessionId) {
          socket.emit('error', { message: 'Session ID required' });
          return;
        }

        const access = await userCanAccessSession(socket.user, sessionId);
        if (!access.allowed) {
          socket.emit('error', { message: access.reason });
          return;
        }

        // Join the session room
        socket.join(`session:${sessionId}`);

        // Track the connection
        if (!activeSessions.has(sessionId)) {
          activeSessions.set(sessionId, new Set());
        }
        activeSessions.get(sessionId).add(socket.id);

        // Store session info for this socket
        socketSessions.set(socket.id, {
          sessionId,
          userId: socket.user.id
        });

        socket.emit('session:joined', { sessionId });
        if (process.env.NODE_ENV !== 'production') {
          console.log(`📱 User ${socket.user.email} joined session ${sessionId}`);
        }

        // Notify others in the session about the new participant
        socket.to(`session:${sessionId}`).emit('user:joined', {
          user: {
            id: socket.user.id,
            email: socket.user.email,
            first_name: socket.user.first_name,
            last_name: socket.user.last_name
          }
        });

      } catch (error) {
        logSocketError('Join session error', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Leave session room
    socket.on('leave:session', (data) => {
      try {
        const { sessionId } = data;

        if (!sessionId) {
          socket.emit('error', { message: 'Session ID required' });
          return;
        }

        leaveSession(socket, sessionId);

      } catch (error) {
        logSocketError('Leave session error', error);
        socket.emit('error', { message: 'Failed to leave session' });
      }
    });

    // Send live participation updates
    socket.on('participation:update', (data) => {
      try {
        const sessionData = socketSessions.get(socket.id);

        if (!sessionData) {
          socket.emit('error', { message: 'Not in any session' });
          return;
        }

        const { sessionId } = sessionData;

        // Broadcast to all other users in the session
        socket.to(`session:${sessionId}`).emit('participation:live_update', {
          ...data,
          timestamp: new Date().toISOString(),
          userId: socket.user.id
        });

      } catch (error) {
        logSocketError('Participation update error', error);
        socket.emit('error', { message: 'Failed to send update' });
      }
    });

    // Request session status
    socket.on('session:status', (data) => {
      try {
        const sessionData = socketSessions.get(socket.id);

        if (!sessionData) {
          socket.emit('error', { message: 'Not in any session' });
          return;
        }

        const { sessionId } = sessionData;
        const activeConnections = activeSessions.get(sessionId)?.size || 0;

        socket.emit('session:status_response', {
          sessionId,
          activeConnections,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logSocketError('Session status error', error);
        socket.emit('error', { message: 'Failed to get session status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔌 User disconnected: ${socket.user.email} (${socket.id})`);
      }

      const sessionData = socketSessions.get(socket.id);
      if (sessionData) {
        leaveSession(socket, sessionData.sessionId);

        // Notify others in the session about the user leaving
        socket.to(`session:${sessionData.sessionId}`).emit('user:left', {
          user: {
            id: socket.user.id,
            email: socket.user.email,
            first_name: socket.user.first_name,
            last_name: socket.user.last_name
          }
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logSocketError(`Socket error for ${socket.user.email}`, error);
    });
  });

  // Helper function to leave a session
  function leaveSession(socket, sessionId) {
    socket.leave(`session:${sessionId}`);

    // Remove from tracking
    if (activeSessions.has(sessionId)) {
      activeSessions.get(sessionId).delete(socket.id);
      if (activeSessions.get(sessionId).size === 0) {
        activeSessions.delete(sessionId);
      }
    }

    socketSessions.delete(socket.id);

    socket.emit('session:left', { sessionId });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 User ${socket.user.email} left session ${sessionId}`);
    }
  }

  // Make helper functions available for external use
  io.getActiveSessions = () => activeSessions;
  io.getSessionConnections = (sessionId) => activeSessions.get(sessionId)?.size || 0;

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔌 Socket.io handler initialized');
  }
};

module.exports = socketHandler;