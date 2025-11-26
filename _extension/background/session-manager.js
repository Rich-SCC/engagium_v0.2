/**
 * Session Manager
 * Manages active tracking sessions
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
  createEvent
} from '../utils/storage.js';
import { now } from '../utils/date-utils.js';
import { matchParticipant } from '../utils/student-matcher.js';
import { startSessionFromMeeting, endSessionWithTimestamp } from './api-client.js';

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

      if (!response.success) {
        throw new Error(response.message || 'Failed to start session');
      }

      const backendSession = response.data.session;

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

      console.log('[SessionManager] Session started:', session.id, '(backend:', backendSession.id, ')');
      return session;

    } catch (error) {
      console.error('[SessionManager] Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End the active session
   * Calls backend API with ended_at timestamp
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
      // Call backend API to end session
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
      // Still mark as ended locally even if API call fails
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
   * @param {Object} data - { platform, meeting_id, participant }
   */
  async handleParticipantJoined(data) {
    const session = await this.getActiveSession();
    if (!session) {
      console.warn('[SessionManager] No active session for participant join');
      return;
    }

    const { participant } = data;

    // Check if already tracked (rejoining)
    const participants = await getParticipantsBySession(session.id);
    const existing = participants.find(
      p => p.platform_participant_id === participant.id
    );

    if (existing) {
      // Participant rejoined - update left_at to null
      await updateParticipant(existing.id, {
        left_at: null
      });
      console.log('[SessionManager] Participant rejoined:', participant.name);
      return;
    }

    // Match to student roster
    const match = this.studentRoster.length > 0
      ? matchParticipant(participant, this.studentRoster)
      : null;

    // Create new participant record
    const trackedParticipant = {
      id: uuidv4(),
      session_id: session.id,
      platform_participant_id: participant.id,
      name: participant.name,
      email: participant.email || null,
      matched_student_id: match ? match.student.id : null,
      matched_student_name: match ? match.student.name : null,
      match_confidence: match ? match.score : 0,
      match_method: match ? match.method : null,
      joined_at: participant.joinedAt || now(),
      left_at: null
    };

    await createParticipant(trackedParticipant);

    console.log('[SessionManager] Participant tracked:', {
      name: participant.name,
      matched: !!match,
      confidence: match?.score
    });

    return trackedParticipant;
  }

  /**
   * Handle participant left event
   * @param {Object} data - { platform, meeting_id, participant_id, left_at }
   */
  async handleParticipantLeft(data) {
    const session = await this.getActiveSession();
    if (!session) return;

    const participants = await getParticipantsBySession(session.id);
    const participant = participants.find(
      p => p.platform_participant_id === data.participantId
    );

    if (!participant) {
      console.warn('[SessionManager] Participant not found for left event');
      return;
    }

    await updateParticipant(participant.id, {
      left_at: data.leftAt || now()
    });

    console.log('[SessionManager] Participant left:', participant.name);
  }

  /**
   * Handle participation event (chat, reaction, etc.)
   * @param {Object} data - { type, platform, meeting_id, participant_id, ... }
   */
  async handleParticipationEvent(data) {
    const session = await this.getActiveSession();
    if (!session) return;

    const participants = await getParticipantsBySession(session.id);
    const participant = participants.find(
      p => p.platform_participant_id === data.participantId
    );

    if (!participant) {
      console.warn('[SessionManager] Participant not found for event');
      return;
    }

    const event = {
      id: uuidv4(),
      session_id: session.id,
      participant_id: participant.id,
      event_type: this.mapEventType(data.type),
      event_data: this.extractEventData(data),
      timestamp: data.timestamp || now()
    };

    await createEvent(event);

    console.log('[SessionManager] Event recorded:', {
      type: event.event_type,
      participant: participant.name
    });
  }

  /**
   * Map message type to event type
   */
  mapEventType(messageType) {
    const mapping = {
      [MESSAGE_TYPES.CHAT_MESSAGE]: 'chat',
      [MESSAGE_TYPES.REACTION]: 'reaction',
      [MESSAGE_TYPES.HAND_RAISE]: 'hand_raise',
      [MESSAGE_TYPES.MIC_TOGGLE]: 'mic_on',
      [MESSAGE_TYPES.CAMERA_TOGGLE]: 'camera_on',
      [MESSAGE_TYPES.PLATFORM_SWITCH]: 'platform_switch'
    };
    return mapping[messageType] || 'other';
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
