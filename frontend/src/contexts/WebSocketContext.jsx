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

// Map interaction types from database to event types for display
const mapInteractionTypeToEventType = (interactionType) => {
  const typeMap = {
    'chat': 'chat',
    'reaction': 'reaction',
    'hand_raise': 'hand_raise',
    'mic_toggle': 'mic_toggle',
    'camera_toggle': 'camera_toggle',
    'join': 'participant_joined',
    'leave': 'participant_left',
    'manual_entry': 'participation'
  };
  return typeMap[interactionType] || 'participation';
};

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoadingActiveSessions, setIsLoadingActiveSessions] = useState(false);
  const [isLoadingRecentEvents, setIsLoadingRecentEvents] = useState(false);
  const [attendedStudents, setAttendedStudents] = useState(new Set()); // Track students who have already been marked as "attended"

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

  // Format event message consistently with real-time events
  const formatEventMessage = (log) => {
    const name = log.student_name || log.full_name;
    const type = log.interaction_type;
    
    switch (type) {
      case 'join':
        // Default to "joined" - will be changed to "attended" for first joins
        return `${name} joined`;
      case 'leave':
        return `${name} left`;
      case 'chat':
        return `${name} sent a message`;
      case 'hand_raise':
        return `${name} raised hand`;
      case 'reaction':
        return `${name} reacted`;
      case 'mic_toggle':
        return `${name} toggled mic`;
      case 'camera_toggle':
        return `${name} toggled camera`;
      default:
        return `${name} - ${type}`;
    }
  };

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
              type: mapInteractionTypeToEventType(log.interaction_type),
              session_id: session.session_id,
              student_name: log.student_name || log.full_name,
              interaction_type: log.interaction_type,
              timestamp: log.timestamp,
              message: formatEventMessage(log)
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
      
      // Process events to identify first joins vs rejoins
      // Sort by timestamp ASCENDING to process oldest first
      const sortedByTime = [...limitedEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const firstJoins = new Set(); // Track students who have had their first join
      
      // Go through events chronologically and mark first joins
      sortedByTime.forEach(event => {
        if (event.interaction_type === 'join') {
          const key = `${event.session_id}:${event.student_name}`;
          if (!firstJoins.has(key)) {
            // This is the first join - mark it as "attendance" type
            event.type = 'attendance';
            event.message = `${event.student_name} attended`;
            firstJoins.add(key);
          } else {
            // This is a rejoin - keep it as "participant_joined"
            event.type = 'participant_joined';
            event.message = `${event.student_name} joined`;
          }
        }
      });
      
      // Update attendedStudents set for tracking future real-time events
      setAttendedStudents(firstJoins);
      console.log('[WebSocket] 📝 Tracked', firstJoins.size, 'students with existing attendance');
      
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
      
      // Clear attended students for this session
      setAttendedStudents(prev => {
        const newSet = new Set(prev);
        // Remove all entries for this session
        for (const key of newSet) {
          if (key.startsWith(`${data.session_id}:`)) {
            newSet.delete(key);
          }
        }
        return newSet;
      });
      
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
      
      // Skip join/leave events as they're handled by participant:joined/left
      if (data.interaction_type === 'join' || data.interaction_type === 'leave') {
        console.log('[WebSocket] ⏭️ Skipping join/leave event (handled by participant events)');
        return;
      }
      
      const formatMessage = (type, name) => {
        switch (type) {
          case 'chat': return `${name} sent a message`;
          case 'hand_raise': return `${name} raised hand`;
          case 'reaction': return `${name} reacted`;
          case 'mic_toggle': return `${name} toggled mic`;
          case 'camera_toggle': return `${name} toggled camera`;
          default: return `${name} - ${type}`;
        }
      };
      
      setRecentEvents(prev => [{
        id: `participation-${Date.now()}-${Math.random()}`,
        type: mapInteractionTypeToEventType(data.interaction_type),
        session_id: data.session_id,
        student_name: data.student_name,
        interaction_type: data.interaction_type,
        timestamp: data.timestamp,
        message: formatMessage(data.interaction_type, data.student_name)
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
      
      // Create unique key for this student in this session
      const studentSessionKey = `${data.session_id}:${data.student_name}`;
      
      // Check if this is the FIRST time we're seeing attendance for this student in this session
      setAttendedStudents(prev => {
        const isFirstAttendance = !prev.has(studentSessionKey);
        console.log('[WebSocket] 🎯 Is first attendance?', isFirstAttendance, 'for', data.student_name);
        console.log('[WebSocket] 🔍 Current attendedStudents:', Array.from(prev));
        
        if (isFirstAttendance) {
          // Only replace participant:joined with "attended" on FIRST attendance
          setRecentEvents(prevEvents => {
            const fiveSecondsAgo = new Date(Date.now() - 5000);
            
            console.log('[WebSocket] 🔍 Looking through', prevEvents.length, 'events');
            
            const filtered = prevEvents.filter(event => {
              const isParticipantJoined = event.type === 'participant_joined';
              const isSameName = event.participant_name === data.student_name;
              const isSameSession = event.session_id === data.session_id;
              const isRecent = new Date(event.timestamp) > fiveSecondsAgo;
              
              if (isParticipantJoined && isSameName && isSameSession && isRecent) {
                console.log('[WebSocket] 🔄 REPLACING participant:joined with attendance for', data.student_name);
                return false;
              }
              return true;
            });
            
            console.log('[WebSocket] 📊 Filtered out', prevEvents.length - filtered.length, 'events');
            
            return [{
              id: `attendance-${Date.now()}-${Math.random()}`,
              type: 'attendance',
              session_id: data.session_id,
              student_name: data.student_name,
              action: data.action,
              interaction_type: 'join',
              timestamp: data.timestamp,
              message: `${data.student_name} attended`
            }, ...filtered].slice(0, 50);
          });
          
          // Mark this student as having attended
          const newSet = new Set(prev);
          newSet.add(studentSessionKey);
          console.log('[WebSocket] ✅ Added to attendedStudents:', studentSessionKey);
          return newSet;
        } else {
          // This is a rejoin - DON'T add another attendance event, the participant:joined will show
          console.log('[WebSocket] ⏭️ Skipping attendance event (rejoin) for', data.student_name);
          return prev;
        }
      });
      
      console.log('[WebSocket] ✅ Processed attendance event');
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
        interaction_type: 'join',
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
        interaction_type: 'leave',
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
