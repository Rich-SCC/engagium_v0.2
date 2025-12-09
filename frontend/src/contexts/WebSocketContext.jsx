import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { sessionsAPI, participationAPI } from '../services/api';

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
  const [isLoadingActiveSessions, setIsLoadingActiveSessions] = useState(false);
  const [isLoadingRecentEvents, setIsLoadingRecentEvents] = useState(false);

  // Fetch active sessions from the backend
  const fetchActiveSessions = useCallback(async () => {
    if (!user || !token) return;
    
    setIsLoadingActiveSessions(true);
    try {
      const response = await sessionsAPI.getActive();
      if (response.success && response.data) {
        // Transform to match the expected format
        const sessions = response.data.map(session => ({
          session_id: session.id,
          class_id: session.class_id,
          class_name: session.class_name,
          subject: session.subject,
          meeting_link: session.meeting_link,
          started_at: session.started_at
        }));
        setActiveSessions(sessions);
        console.log('[WebSocket] ✅ Loaded active sessions from server:', sessions.length, 'sessions');
      }
    } catch (error) {
      console.error('[WebSocket] ❌ Failed to fetch active sessions:', error);
    } finally {
      setIsLoadingActiveSessions(false);
    }
  }, [user, token]);

  // Fetch recent events for all active sessions
  const fetchRecentEvents = useCallback(async (sessions) => {
    if (!user || !token || !sessions || sessions.length === 0) return;
    
    setIsLoadingRecentEvents(true);
    console.log('[WebSocket] 📥 Fetching recent events for', sessions.length, 'active sessions...');
    
    try {
      const allEvents = [];
      
      for (const session of sessions) {
        try {
          // Fetch last 30 minutes of activity for each active session
          const response = await participationAPI.getRecentActivity(session.session_id, 30);
          if (response.success && response.data) {
            const events = response.data.map(log => ({
              id: `participation-${log.id || Date.now()}-${Math.random()}`,
              type: 'participation',
              session_id: session.session_id,
              student_name: log.student_name || log.full_name,
              interaction_type: log.interaction_type,
              timestamp: log.timestamp,
              message: `${log.student_name || log.full_name} - ${log.interaction_type}`
            }));
            allEvents.push(...events);
            console.log('[WebSocket] ✅ Loaded', events.length, 'events for session', session.session_id);
          }
        } catch (sessionError) {
          console.warn('[WebSocket] ⚠️ Failed to fetch events for session', session.session_id, sessionError);
        }
      }
      
      // Sort by timestamp descending and limit to 50
      allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedEvents = allEvents.slice(0, 50);
      
      setRecentEvents(limitedEvents);
      console.log('[WebSocket] ✅ Total recent events loaded:', limitedEvents.length);
    } catch (error) {
      console.error('[WebSocket] ❌ Failed to fetch recent events:', error);
    } finally {
      setIsLoadingRecentEvents(false);
    }
  }, [user, token]);

  // Fetch active sessions on mount when user is authenticated
  useEffect(() => {
    if (user && token) {
      fetchActiveSessions().then(() => {
        // Fetch recent events after we have active sessions
      });
    }
  }, [user, token, fetchActiveSessions]);

  // Fetch recent events when active sessions change
  useEffect(() => {
    if (activeSessions.length > 0 && !isLoadingActiveSessions) {
      fetchRecentEvents(activeSessions);
    }
  }, [activeSessions, isLoadingActiveSessions, fetchRecentEvents]);

  useEffect(() => {
    if (!user || !token) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setActiveSessions([]);
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
      console.log('[WebSocket] ✅ Connected to server');
      console.log('[WebSocket] Socket ID:', newSocket.id);
      setIsConnected(true);
      
      // Join instructor-specific room
      console.log('[WebSocket] 📤 Joining instructor room for user:', user.id);
      newSocket.emit('join_instructor_room', { user_id: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] ❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] ❌ Connection error:', error.message);
      setIsConnected(false);
    });

    // Session event handlers
    newSocket.on('session:started', (data) => {
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: session:started');
      console.log('========================================');
      console.log('[WebSocket] Data:', JSON.stringify(data, null, 2));
      console.log('========================================\\n');
      
      setActiveSessions(prev => {
        // Avoid duplicates
        if (prev.some(s => s.session_id === data.session_id)) {
          console.log('[WebSocket] ⚠️ Session already exists, skipping duplicate');
          return prev;
        }
        console.log('[WebSocket] ✅ Adding new active session');
        return [...prev, data];
      });
      
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
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: session:ended');
      console.log('========================================');
      console.log('[WebSocket] Data:', JSON.stringify(data, null, 2));
      console.log('========================================\\n');
      
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
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: participation:logged');
      console.log('========================================');
      console.log('[WebSocket] Session ID:', data.session_id);
      console.log('[WebSocket] Student:', data.student_name);
      console.log('[WebSocket] Type:', data.interaction_type);
      console.log('[WebSocket] Timestamp:', data.timestamp);
      console.log('[WebSocket] Full Data:', JSON.stringify(data, null, 2));
      console.log('========================================\\n');
      
      setRecentEvents(prev => [{
        id: `participation-${Date.now()}-${Math.random()}`,
        type: 'participation',
        session_id: data.session_id,
        student_name: data.student_name,
        interaction_type: data.interaction_type,
        timestamp: data.timestamp,
        message: `${data.student_name} - ${data.interaction_type}`
      }, ...prev].slice(0, 50));
      
      console.log('[WebSocket] ✅ Added participation event to feed');
    });

    newSocket.on('attendance:updated', (data) => {
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: attendance:updated');
      console.log('========================================');
      console.log('[WebSocket] Session ID:', data.session_id);
      console.log('[WebSocket] Student:', data.student_name);
      console.log('[WebSocket] Action:', data.action);
      console.log('[WebSocket] Timestamp:', data.timestamp);
      console.log('========================================\\n');
      
      setRecentEvents(prev => [{
        id: `attendance-${Date.now()}-${Math.random()}`,
        type: 'attendance',
        session_id: data.session_id,
        student_name: data.student_name,
        action: data.action,
        timestamp: data.timestamp,
        message: `${data.student_name} ${data.action}`
      }, ...prev].slice(0, 50));
      
      console.log('[WebSocket] ✅ Added attendance event to feed');
    });

    newSocket.on('participant:joined', (data) => {
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: participant:joined');
      console.log('========================================');
      console.log('[WebSocket] Session ID:', data.session_id);
      console.log('[WebSocket] Participant:', data.participant_name);
      console.log('[WebSocket] Matched:', data.is_matched);
      console.log('[WebSocket] Student ID:', data.student_id);
      console.log('[WebSocket] Joined at:', data.joined_at);
      console.log('[WebSocket] Full Data:', JSON.stringify(data, null, 2));
      console.log('========================================\\n');
      
      setRecentEvents(prev => [{
        id: `participant-join-${Date.now()}-${Math.random()}`,
        type: 'participant_joined',
        session_id: data.session_id,
        participant_name: data.participant_name,
        student_id: data.student_id,
        is_matched: data.is_matched,
        timestamp: data.joined_at,
        message: `${data.participant_name} joined${data.is_matched ? '' : ' (unmatched)'}`
      }, ...prev].slice(0, 50));
      
      console.log('[WebSocket] ✅ Added participant join event to feed');
    });

    newSocket.on('participant:left', (data) => {
      console.log('\\n========================================');
      console.log('[WebSocket] 📥 RECEIVED: participant:left');
      console.log('========================================');
      console.log('[WebSocket] Session ID:', data.session_id);
      console.log('[WebSocket] Participant:', data.participant_name);
      console.log('[WebSocket] Left at:', data.left_at);
      console.log('[WebSocket] Duration (min):', data.total_duration_minutes);
      console.log('[WebSocket] Full Data:', JSON.stringify(data, null, 2));
      console.log('========================================\\n');
      
      setRecentEvents(prev => [{
        id: `participant-left-${Date.now()}-${Math.random()}`,
        type: 'participant_left',
        session_id: data.session_id,
        participant_name: data.participant_name,
        duration: data.total_duration_minutes,
        timestamp: data.left_at,
        message: `${data.participant_name} left (${Math.round(data.total_duration_minutes || 0)}min)`
      }, ...prev].slice(0, 50));
      
      console.log('[WebSocket] ✅ Added participant left event to feed');
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
    isLoadingActiveSessions,
    isLoadingRecentEvents,
    refreshActiveSessions: fetchActiveSessions,
    refreshRecentEvents: () => fetchRecentEvents(activeSessions),
    clearEvents: () => setRecentEvents([])
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
