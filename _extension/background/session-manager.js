/**
 * Session Manager
 * Manages active tracking sessions with attendance interval tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SESSION_STATUS, 
  MESSAGE_TYPES,
  ATTENDANCE_STATUS 
} from '../utils/constants.js';
import {
  createSession,
  getSession,
  updateSession,
  getActiveSessions,
  createParticipant,
  updateParticipant,
  getParticipantsBySession,
  createEvent,
  createAttendanceInterval,
  closeAttendanceInterval,
  getOpenIntervals,
  closeAllOpenIntervals
} from '../utils/storage.js';
import { now } from '../utils/date-utils.js';
import { matchParticipant } from '../utils/student-matcher.js';
import { 
  startSessionFromMeeting, 
  endSessionWithTimestamp,
  recordParticipantJoin,
  recordParticipantLeave
} from './api-client.js';
import { socketClient } from './socket-client.js';
import { debug } from '../utils/debug-logger.js';

class SessionManager {
  constructor() {
    this.activeSessionId = null;
    this.studentRoster = [];
  }

  /**
   * Start a new tracking session from extension meeting detection
   * Calls backend API to create session
   * @param {Object} sessionData - { class_id, meeting_id, meeting_platform }
   * @returns {Promise<Object>} Created session
   */
  async startSession(sessionData) {
    // Check if already tracking
    const activeSessions = await getActiveSessions();
    if (activeSessions.length > 0) {
      throw new Error('A session is already active. Please end it first.');
    }

    try {
      // Call backend API to create session
      const response = await startSessionFromMeeting({
        class_id: sessionData.class_id,
        meeting_id: sessionData.meeting_id,
        platform: sessionData.meeting_platform
      });

      console.log('[SessionManager] API response:', JSON.stringify(response));

      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to start session');
      }

      // Backend returns { success: true, data: session } (session object directly in data)
      const backendSession = response.data;
      
      console.log('[SessionManager] Backend session:', JSON.stringify(backendSession));
      
      if (!backendSession || !backendSession.id) {
        console.error('[SessionManager] Invalid response structure:', response);
        throw new Error('Invalid session response from server - missing session ID');
      }

      // Store session locally for offline sync
      const session = {
        id: backendSession.id,
        class_id: sessionData.class_id,
        class_name: sessionData.class_name || 'Unknown Class',
        meeting_id: sessionData.meeting_id,
        meeting_platform: sessionData.meeting_platform,
        started_at: backendSession.started_at || now(),
        ended_at: null,
        status: SESSION_STATUS.ACTIVE,
        backend_id: backendSession.id // Store for reference
      };

      await createSession(session);
      this.activeSessionId = session.id;

      // Connect to WebSocket for real-time updates
      try {
        await socketClient.connect(backendSession.id);
        console.log('[SessionManager] WebSocket connected for session:', backendSession.id);
      } catch (wsError) {
        console.warn('[SessionManager] WebSocket connection failed (will sync offline):', wsError);
      }

      console.log('[SessionManager] Session started:', session.id, '(backend:', backendSession.id, ')');
      return session;

    } catch (error) {
      console.error('[SessionManager] Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End the active session
   * Closes all open intervals and calls backend API with ended_at timestamp
   * @param {string} sessionId 
   * @returns {Promise<Object>} Updated session
   */
  async endSession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === SESSION_STATUS.ENDED) {
      throw new Error('Session already ended');
    }

    const endedAt = now();

    try {
      // Disconnect WebSocket first
      try {
        await socketClient.disconnect();
        console.log('[SessionManager] WebSocket disconnected');
      } catch (wsError) {
        console.warn('[SessionManager] WebSocket disconnect failed:', wsError);
      }

      // Close all open attendance intervals locally
      const closedCount = await closeAllOpenIntervals(sessionId, endedAt);
      console.log(`[SessionManager] Closed ${closedCount} open attendance intervals`);

      // Call backend API to end session (this will also close intervals server-side)
      if (session.backend_id) {
        await endSessionWithTimestamp(session.backend_id, endedAt);
      }

      // Update local session
      const updatedSession = await updateSession(sessionId, {
        ended_at: endedAt,
        status: SESSION_STATUS.ENDED
      });

      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }

      console.log('[SessionManager] Session ended:', sessionId);
      return updatedSession;

    } catch (error) {
      console.error('[SessionManager] Failed to end session:', error);
      
      // Still close intervals and mark as ended locally even if API call fails
      await closeAllOpenIntervals(sessionId, endedAt);
      
      const updatedSession = await updateSession(sessionId, {
        ended_at: endedAt,
        status: SESSION_STATUS.ENDED
      });
      
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }
      
      throw error;
    }
  }

  /**
   * Get current active session
   * @returns {Promise<Object|null>}
   */
  async getActiveSession() {
    if (this.activeSessionId) {
      return await getSession(this.activeSessionId);
    }

    const activeSessions = await getActiveSessions();
    if (activeSessions.length > 0) {
      this.activeSessionId = activeSessions[0].id;
      return activeSessions[0];
    }

    return null;
  }

  /**
   * Set student roster for matching
   * @param {Array} roster - Array of { id, name, email }
   */
  setStudentRoster(roster) {
    this.studentRoster = roster;
    console.log('[SessionManager] Roster loaded:', roster.length, 'students');
  }

  /**
   * Handle participant joined event
   * Creates an attendance interval for tracking duration
   * @param {Object} data - { platform, meeting_id, participant, name, timestamp, source }
   */
  async handleParticipantJoined(data) {
    const session = await this.getActiveSession();
    if (!session) {
      // Don't log every time - this can happen frequently when no session
      return;
    }

    // Get participant name - support both old and new format
    const participantName = data.name || data.participant?.name;
    const joinedAt = data.timestamp || data.participant?.joinedAt || now();
    
    if (!participantName) {
      console.warn('[SessionManager] No participant name in join event:', data);
      return;
    }

    // Check if already has an open interval (rejoining quickly)
    const openIntervals = await getOpenIntervals(session.id);
    const existingOpen = openIntervals.find(i => i.participant_name === participantName);
    
    if (existingOpen) {
      // Silently skip - this is expected with multiple event sources
      return;
    }

    debug.receive('background', 'PARTICIPANT_JOINED', { name: participantName });

    // Match to student roster
    const match = this.studentRoster.length > 0
      ? matchParticipant({ name: participantName }, this.studentRoster)
      : null;

    // Create local attendance interval
    const interval = {
      id: uuidv4(),
      session_id: session.id,
      participant_name: participantName,
      student_id: match ? match.student.id : null,
      joined_at: joinedAt,
      left_at: null // Open interval
    };

    await createAttendanceInterval(interval);
    
    // Also track in participants for backwards compatibility
    const participants = await getParticipantsBySession(session.id);
    const existingParticipant = participants.find(p => p.name === participantName);
    
    if (!existingParticipant) {
      // Create participant record
      await createParticipant({
        id: uuidv4(),
        session_id: session.id,
        platform_participant_id: data.participant?.id || participantName,
        name: participantName,
        email: null, // No longer available from Google Meet
        matched_student_id: match ? match.student.id : null,
        matched_student_name: match ? match.student.name : null,
        match_confidence: match ? match.score : 0,
        match_method: match ? match.method : null,
        joined_at: joinedAt,
        left_at: null
      });
    } else if (existingParticipant.left_at) {
      // Participant rejoining - update left_at to null
      await updateParticipant(existingParticipant.id, {
        left_at: null
      });
    }

    debug.success('background', 'PARTICIPANT_TRACKED', { 
      name: participantName, 
      matched: !!match, 
      matchedTo: match?.student?.name 
    });

    // Call backend API to record the join
    if (session.backend_id) {
      try {
        await recordParticipantJoin(session.backend_id, {
          participant_name: participantName,
          joined_at: joinedAt,
          student_id: match?.student?.id || null
        });
        debug.success('background', 'JOIN_SYNCED_TO_BACKEND', { name: participantName });
      } catch (apiError) {
        console.warn('[SessionManager] Failed to sync join to backend:', apiError);
        debug.error('background', 'JOIN_SYNC_FAILED', { error: apiError.message });
        // Continue - will be synced later
      }
    }

    // Emit real-time event via WebSocket
    if (socketClient.isSessionConnected()) {
      try {
        await socketClient.emitParticipantJoined({
          id: data.participant?.id || participantName,
          name: participantName,
          joinedAt: joinedAt,
          isMatched: !!match,
          studentId: match?.student?.id,
          studentName: match?.student?.name
        });
      } catch (wsError) {
        // Silent fail for WebSocket - non-critical
      }
    }

    debug.success('background', 'PARTICIPANT_TRACKED', { 
      name: participantName,
      matched: !!match
    });

    return interval;
  }

  /**
   * Handle participant left event
   * Closes the open attendance interval
   * @param {Object} data - { platform, meeting_id, participant_id, left_at, name, timestamp }
   */
  async handleParticipantLeft(data) {
    const session = await this.getActiveSession();
    if (!session) return;

    // Get participant name - support both old and new format
    const participantName = data.name || data.participantId;
    const leftAt = data.timestamp || data.leftAt || now();
    
    if (!participantName) {
      return; // Silent skip - malformed event
    }

    // Close local attendance interval
    const closedInterval = await closeAttendanceInterval(session.id, participantName, leftAt);
    
    if (!closedInterval) {
      // No open interval - might have already been closed or never opened
      // This is expected when receiving duplicate leave events
      return;
    }

    // Update participant record
    const participants = await getParticipantsBySession(session.id);
    const participant = participants.find(p => p.name === participantName);

    if (participant) {
      await updateParticipant(participant.id, {
        left_at: leftAt
      });
    }

    // Call backend API to record the leave
    if (session.backend_id) {
      try {
        await recordParticipantLeave(session.backend_id, {
          participant_name: participantName,
          left_at: leftAt
        });
        debug.success('background', 'LEAVE_SYNCED_TO_BACKEND', { name: participantName });
      } catch (apiError) {
        console.warn('[SessionManager] Failed to sync leave to backend:', apiError);
        debug.error('background', 'LEAVE_SYNC_FAILED', { error: apiError.message });
        // Continue - will be synced later
      }
    }

    // Emit real-time event via WebSocket
    if (socketClient.isSessionConnected()) {
      try {
        await socketClient.emitParticipantLeft(participantName, leftAt);
      } catch (wsError) {
        console.warn('[SessionManager] WebSocket emit failed:', wsError);
      }
    }

    console.log('[SessionManager] Participant left:', participantName);
  }

  /**
   * Handle participation event (chat, reaction, etc.)
   * @param {Object} data - { type, platform, meeting_id, participant_id, ... }
   */
  async handleParticipationEvent(data) {
    console.log('[SessionManager] handleParticipationEvent called with type:', data.type);
    debug.receive('background', 'PARTICIPATION_EVENT', { type: data.type, data });
    
    const session = await this.getActiveSession();
    if (!session) {
      debug.warn('background', 'NO_ACTIVE_SESSION', 'Participation event ignored - no active session');
      return;
    }

    const participants = await getParticipantsBySession(session.id);
    const participant = participants.find(
      p => p.platform_participant_id === data.participantId
    );

    if (!participant) {
      console.warn('[SessionManager] Participant not found for event:', data.participantId, 'type:', data.type);
      debug.warn('background', 'PARTICIPANT_NOT_FOUND', { participantId: data.participantId, type: data.type });
      return;
    }

    const eventType = this.mapEventType(data.type);
    const event = {
      id: uuidv4(),
      session_id: session.id,
      participant_id: participant.id,
      event_type: eventType,
      event_data: this.extractEventData(data),
      timestamp: data.timestamp || now()
    };

    await createEvent(event);
    debug.success('background', 'EVENT_STORED_LOCALLY', { eventId: event.id, type: eventType });

    // Emit real-time event via WebSocket
    if (socketClient.isSessionConnected()) {
      try {
        // Chat messages get their own emit
        if (eventType === 'chat') {
          await socketClient.emitChatMessage({
            sender: participant.matched_student_name || participant.name,
            message: data.message,
            timestamp: event.timestamp
          });
          debug.send('background', 'CHAT_MESSAGE_EMITTED', { sender: participant.name });
        }
        
        // All events also emit as participation
        await socketClient.emitParticipation({
          studentId: participant.matched_student_id,
          studentName: participant.matched_student_name || participant.name,
          type: eventType,
          metadata: event.event_data
        });
        debug.success('background', 'PARTICIPATION_EMITTED', { type: eventType, student: participant.matched_student_name || participant.name });
      } catch (wsError) {
        console.warn('[SessionManager] WebSocket emit failed:', wsError);
        debug.error('background', 'WEBSOCKET_EMIT_FAILED', { error: wsError.message, type: eventType });
      }
    } else {
      debug.warn('background', 'SOCKET_NOT_CONNECTED', { message: 'Event stored locally but not sent in real-time' });
    }

    console.log('[SessionManager] Event recorded:', {
      type: event.event_type,
      participant: participant.name
    });
  }

  /**
   * Map message type to event type
   * Must match database ENUM: 'manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle', 'platform_switch', 'hand_raise'
   */
  mapEventType(messageType) {
    const mapping = {
      [MESSAGE_TYPES.CHAT_MESSAGE]: 'chat',
      [MESSAGE_TYPES.REACTION]: 'reaction',
      [MESSAGE_TYPES.HAND_RAISE]: 'hand_raise',
      [MESSAGE_TYPES.MIC_TOGGLE]: 'mic_toggle',
      [MESSAGE_TYPES.CAMERA_TOGGLE]: 'camera_toggle',
      [MESSAGE_TYPES.PLATFORM_SWITCH]: 'platform_switch'
    };
    const result = mapping[messageType] || 'manual_entry';
    console.log('[SessionManager] mapEventType:', messageType, '->', result);
    return result;
  }

  /**
   * Extract relevant event data
   */
  extractEventData(data) {
    const { type, message, reaction, ...rest } = data;
    return {
      message,
      reaction,
      ...rest
    };
  }

  /**
   * Manual match participant to student
   * @param {string} participantId 
   * @param {string} studentId 
   */
  async manualMatch(participantId, studentId) {
    const student = this.studentRoster.find(s => s.id === studentId);
    if (!student) {
      throw new Error('Student not found in roster');
    }

    await updateParticipant(participantId, {
      matched_student_id: studentId,
      matched_student_name: student.name,
      match_confidence: 1.0,
      match_method: 'manual'
    });

    console.log('[SessionManager] Manual match:', participantId, '->', studentId);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
