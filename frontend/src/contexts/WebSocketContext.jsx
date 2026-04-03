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
const getEventParticipantName = (event) =>
  event.participant_name || event.student_name || event.full_name || '';

const buildEventCacheKey = (event) => {
  if (event.id || event.event_id) {
    return `id:${event.id || event.event_id}`;
  }

  const sourceEventId = event.source_event_id || event.metadata?.source_event_id;
  if (sourceEventId) {
    return `source:${sourceEventId}`;
  }

  const participantName = getEventParticipantName(event);

  return [
    event.session_id || '',
    event.type || '',
    event.interaction_type || '',
    event.timestamp || '',
    participantName,
    event.message || '',
    event.action || '',
    event.duration ?? ''
  ].join('|');
};

const normalizeRecentEvent = (event) => ({
  ...event,
  id: event.id || event.event_id || event.source_event_id || event.metadata?.source_event_id || event.cacheKey,
  participant_name: event.participant_name || event.student_name || event.full_name,
  cacheKey: event.cacheKey || buildEventCacheKey(event)
});

const dedupeAndSortRecentEvents = (events) => {
  const byKey = new Map();

  events.forEach(event => {
    const normalized = normalizeRecentEvent(event);
    byKey.set(normalized.cacheKey, normalized);
  });

  return Array.from(byKey.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 200);
};

const getAttendanceRecordsFromResponse = (response) => {
  if (!response?.success || !response.data) return [];

  if (Array.isArray(response.data?.attendance)) {
    return response.data.attendance;
  }

  if (Array.isArray(response.data?.data?.attendance)) {
    return response.data.data.attendance;
  }

  return [];
};

const formatSpeakingDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${minutes}m`;
  return `${minutes}m ${secs}s`;
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
    const isMuted = log.additional_data?.isMuted;
    const reaction = log.additional_data?.reaction || log.interaction_value || log.reaction;
    const speakingSeconds = Number(
      log.additional_data?.speakingDurationSeconds || log.additional_data?.duration_seconds || log.duration_seconds
    );
    const speakingLabel = log.additional_data?.speakingDurationLabel || formatSpeakingDuration(speakingSeconds);
    
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
        return reaction ? `${name} reacted ${reaction}` : `${name} reacted`;
      case 'mic_toggle':
        if (log.additional_data?.speakingAction === 'stop' && speakingLabel) {
          return `${name} spoke for ${speakingLabel}`;
        }
        if (log.additional_data?.speakingAction === 'start') {
          return `${name} unmuted mic`;
        }
        if (typeof isMuted === 'boolean') {
          return `${name} mic ${isMuted ? 'off' : 'on'}`;
        }
        return `${name} toggled mic`;
      case 'speaking_session':
        if (speakingLabel) {
          return `${name} spoke for ${speakingLabel}`;
        }
        return `${name} spoke`;
      case 'camera_toggle':
        return `${name} toggled camera`;
      default:
        return `${name} - ${type}`;
    }
  };

  const buildAttendanceEvents = (attendanceRecords, sessionId) => {
    const events = [];
    const seenFirstJoins = new Set();

    const allIntervals = attendanceRecords.flatMap(record =>
      (record.intervals || []).map(interval => ({
        participant_name: record.participant_name || interval.participant_name,
        student_name: record.student_name || interval.student_name,
        session_id: sessionId,
        student_id: record.student_id || interval.student_id,
        joined_at: interval.joined_at,
        left_at: interval.left_at,
        total_duration_minutes: record.total_duration_minutes
      }))
    );

    allIntervals.sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));

    allIntervals.forEach((interval) => {
      const participantName = interval.participant_name || interval.student_name || 'Unknown participant';
      const participantKey = `${sessionId}:${participantName}`;

      if (!seenFirstJoins.has(participantKey)) {
        events.push({
          id: `attendance-${sessionId}-${participantName}-${interval.joined_at}`,
          type: 'attendance',
          session_id: sessionId,
          participant_name: participantName,
          student_name: interval.student_name,
          student_id: interval.student_id,
          interaction_type: 'join',
          timestamp: interval.joined_at,
          message: `${participantName} attended`
        });
        seenFirstJoins.add(participantKey);
      } else {
        events.push({
          id: `participant-join-${sessionId}-${participantName}-${interval.joined_at}`,
          type: 'participant_joined',
          session_id: sessionId,
          participant_name: participantName,
          student_name: interval.student_name,
          student_id: interval.student_id,
          interaction_type: 'join',
          timestamp: interval.joined_at,
          message: `${participantName} joined`
        });
      }

      if (interval.left_at) {
        events.push({
          id: `participant-left-${sessionId}-${participantName}-${interval.left_at}`,
          type: 'participant_left',
          session_id: sessionId,
          participant_name: participantName,
          student_name: interval.student_name,
          student_id: interval.student_id,
          interaction_type: 'leave',
          timestamp: interval.left_at,
          message: `${participantName} left${interval.total_duration_minutes ? ` (${Math.round(interval.total_duration_minutes)}min)` : ''}`
        });
      }
    });

    return { events, seenFirstJoins };
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
          const [participationResponse, attendanceResponse] = await Promise.all([
            participationAPI.getLogs(session.session_id, { page: 1, limit: 200 }).catch(error => {
              console.warn('[WebSocket] ⚠️ Failed to fetch participation logs for session', session.session_id, error);
              return null;
            }),
            sessionsAPI.getAttendanceWithIntervals(session.session_id).catch(error => {
              console.warn('[WebSocket] ⚠️ Failed to fetch attendance intervals for session', session.session_id, error);
              return null;
            })
          ]);

          const attendanceFromIntervals = getAttendanceRecordsFromResponse(attendanceResponse);
          if (attendanceFromIntervals.length > 0) {
            const { events: attendanceEvents, seenFirstJoins } = buildAttendanceEvents(
              attendanceFromIntervals,
              session.session_id
            );
            allEvents.push(...attendanceEvents);
            console.log('[WebSocket] ✅ Loaded', attendanceEvents.length, 'attendance events for session', session.session_id);

            // Preserve attendance state for future live updates
            setAttendedStudents(prev => {
              const next = new Set(prev);
              seenFirstJoins.forEach(key => next.add(key));
              return next;
            });
          }

          // Hydrate participation feed from persisted logs so reload keeps mic/camera/chat/reaction history.
          if (participationResponse?.success && participationResponse.data) {
            const participationRows = Array.isArray(participationResponse.data?.data)
              ? participationResponse.data.data
              : Array.isArray(participationResponse.data)
                ? participationResponse.data
                : [];

            const events = participationRows.map(log => ({
              id: log.id || log.source_event_id || buildEventCacheKey(log),
              type: mapInteractionTypeToEventType(log.interaction_type),
              session_id: session.session_id,
              student_name: log.student_name || log.full_name,
              participant_name: log.student_name || log.full_name,
              source_event_id: log.additional_data?.source_event_id,
              interaction_type: log.interaction_type,
              interaction_value: log.interaction_value,
              additional_data: log.additional_data,
              timestamp: log.timestamp,
              message: formatEventMessage(log)
            }));
            allEvents.push(...events);
            console.log('[WebSocket] ✅ Loaded', events.length, 'participation events for session', session.session_id);
          }
        } catch (sessionError) {
          console.warn('[WebSocket] ⚠️ Failed to fetch events for session', session.session_id, sessionError);
        }
      }
      
      // Sort by timestamp descending and keep a larger cache to avoid dropping participation events
      // when attendance intervals are also loaded on refresh.
      allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedEvents = allEvents.slice(0, 200);

      setRecentEvents(dedupeAndSortRecentEvents(limitedEvents));
    } catch (error) {
      console.error('[WebSocket] ❌ Failed to fetch recent events:', error);
    } finally {
      setIsLoadingRecentEvents(false);
    }
  }, [user, token, fetchActiveSessions]);

  useEffect(() => {
    if (user && token) {
      fetchActiveSessions();
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
        setRecentEvents([]);
        setAttendedStudents(new Set());
      }
      return;
    }

    // Connect to WebSocket server
    const SOCKET_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;
    
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
      setRecentEvents(prev => dedupeAndSortRecentEvents([{
        id: `session-start-${Date.now()}`,
        type: 'session_started',
        session_id: data.session_id,
        class_name: data.class_name,
        timestamp: data.started_at || new Date().toISOString(),
        message: `Session started for ${data.class_name}`
      }, ...prev]));
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
      
      setRecentEvents(prev => prev.filter(event => event.session_id !== data.session_id));
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
      
      // Log specifically for mic toggles
      if (data.interaction_type === 'mic_toggle') {
        console.log('[WebSocket] 🎙️ MIC_TOGGLE RECEIVED!');
        console.log('[WebSocket] Mic Status:', data.metadata?.isMuted ? 'MUTED' : 'UNMUTED');
      }
      
      // Skip join/leave events as they're handled by participant:joined/left
      if (data.interaction_type === 'join' || data.interaction_type === 'leave') {
        console.log('[WebSocket] ⏭️ Skipping join/leave event (handled by participant events)');
        return;
      }
      
      const displayName = data.student_name || data.participant_name || 'Unknown participant';

      const formatMessage = (type, name, matched, metadata, duration_seconds) => {
        const durationLabel = metadata?.speakingDurationLabel || formatSpeakingDuration(
          Number(metadata?.speakingDurationSeconds || duration_seconds)
        );
        const reactionLabel = metadata?.reaction;

        switch (type) {
          case 'chat': return `${name} sent a message`;
          case 'hand_raise': return `${name} raised hand`;
          case 'reaction': return reactionLabel ? `${name} reacted ${reactionLabel}` : `${name} reacted`;
          case 'mic_toggle': {
            const isMuted = metadata && typeof metadata.isMuted === 'boolean'
              ? metadata.isMuted
              : null;
            if (metadata?.speakingAction === 'stop' && durationLabel) {
              return `${name} spoke for ${durationLabel}`;
            }
            if (metadata?.speakingAction === 'start') {
              return `${name} unmuted mic`;
            }
            if (typeof isMuted === 'boolean') {
              return `${name} mic ${isMuted ? 'off' : 'on'}`;
            }
            return `${name} toggled mic`;
          }
          case 'speaking_session': {
            if (durationLabel) {
              return `${name} spoke for ${durationLabel}`;
            }
            return `${name} spoke`;
          }
          case 'camera_toggle': return `${name} toggled camera`;
          default: return `${name} - ${type}`;
        }
      };
      
      setRecentEvents(prev => dedupeAndSortRecentEvents([{
        id: data.id || data.event_id || data.metadata?.source_event_id || buildEventCacheKey(data),
        type: mapInteractionTypeToEventType(data.interaction_type),
        session_id: data.session_id,
        student_name: data.student_name || displayName,
        participant_name: data.participant_name || displayName,
        is_matched: data.is_matched,
        source_event_id: data.metadata?.source_event_id,
        metadata: data.metadata,
        interaction_type: data.interaction_type,
        interaction_value: data.interaction_value,
        timestamp: data.timestamp,
        duration_seconds: data.duration_seconds,
        message: formatMessage(data.interaction_type, displayName, data.is_matched, data.metadata, data.duration_seconds)
      }, ...prev]));
      
      if (data.interaction_type === 'speaking_session') {
        console.log('[WebSocket] 🎙️ SPEAKING_SESSION added to feed!');
        console.log('[WebSocket] Duration:', data.duration_seconds, 'seconds');
      } else if (data.interaction_type === 'mic_toggle') {
        console.log('[WebSocket] 🎙️ MIC_TOGGLE added to feed!');
      } else {
        console.log('[WebSocket] ✅ Added participation event to feed');
      }
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
            
            return dedupeAndSortRecentEvents([{
              id: `attendance-${Date.now()}-${Math.random()}`,
              type: 'attendance',
              session_id: data.session_id,
              student_name: data.student_name,
              action: data.action,
              interaction_type: 'join',
              timestamp: data.timestamp,
              message: `${data.student_name} attended`
            }, ...filtered]);
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
      
      setRecentEvents(prev => dedupeAndSortRecentEvents([{
        id: `participant-join-${Date.now()}-${Math.random()}`,
        type: 'participant_joined',
        session_id: data.session_id,
        participant_name: data.participant_name,
        student_id: data.student_id,
        is_matched: data.is_matched,
        interaction_type: 'join',
        timestamp: data.joined_at,
        message: `${data.participant_name} joined`
      }, ...prev]));
      
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
      
      setRecentEvents(prev => dedupeAndSortRecentEvents([{
        id: `participant-left-${Date.now()}-${Math.random()}`,
        type: 'participant_left',
        session_id: data.session_id,
        participant_name: data.participant_name,
        duration: data.total_duration_minutes,
        interaction_type: 'leave',
        timestamp: data.left_at,
        message: `${data.participant_name} left (${Math.round(data.total_duration_minutes || 0)}min)`
      }, ...prev]));
      
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
