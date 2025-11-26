import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    if (!user || !token) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket server
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      
      // Join instructor-specific room
      newSocket.emit('join_instructor_room', { user_id: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      setIsConnected(false);
    });

    // Session event handlers
    newSocket.on('session:started', (data) => {
      console.log('[WebSocket] Session started:', data);
      setActiveSessions(prev => [...prev, data]);
      
      // Add to recent events feed
      setRecentEvents(prev => [{
        id: `session-start-${Date.now()}`,
        type: 'session_started',
        session_id: data.session_id,
        class_name: data.class_name,
        timestamp: data.started_at || new Date().toISOString(),
        message: `Session started for ${data.class_name}`
      }, ...prev].slice(0, 50)); // Keep last 50 events
    });

    newSocket.on('session:ended', (data) => {
      console.log('[WebSocket] Session ended:', data);
      setActiveSessions(prev => prev.filter(s => s.session_id !== data.session_id));
      
      setRecentEvents(prev => [{
        id: `session-end-${Date.now()}`,
        type: 'session_ended',
        session_id: data.session_id,
        timestamp: data.ended_at || new Date().toISOString(),
        message: `Session ended`
      }, ...prev].slice(0, 50));
    });

    newSocket.on('participation:logged', (data) => {
      console.log('[WebSocket] Participation logged:', data);
      
      setRecentEvents(prev => [{
        id: `participation-${Date.now()}-${Math.random()}`,
        type: 'participation',
        session_id: data.session_id,
        student_name: data.student_name,
        interaction_type: data.interaction_type,
        timestamp: data.timestamp,
        message: `${data.student_name} - ${data.interaction_type}`
      }, ...prev].slice(0, 50));
    });

    newSocket.on('attendance:updated', (data) => {
      console.log('[WebSocket] Attendance updated:', data);
      
      setRecentEvents(prev => [{
        id: `attendance-${Date.now()}-${Math.random()}`,
        type: 'attendance',
        session_id: data.session_id,
        student_name: data.student_name,
        action: data.action,
        timestamp: data.timestamp,
        message: `${data.student_name} ${data.action}`
      }, ...prev].slice(0, 50));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const value = {
    socket,
    isConnected,
    activeSessions,
    recentEvents,
    clearEvents: () => setRecentEvents([])
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
