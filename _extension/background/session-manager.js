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
import { syncQueueManager } from './sync-queue.js';
import { debug } from '../utils/debug-logger.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SessionManager');

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

      logger.log(' API response:', JSON.stringify(response));

      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to start session');
      }

      // Backend returns { success: true, data: session } (session object directly in data)
      const backendSession = response.data;
      
      logger.log(' Backend session:', JSON.stringify(backendSession));
      
      if (!backendSession || !backendSession.id) {
        logger.error(' Invalid response structure:', response);
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
        logger.log(' WebSocket connected for session:', backendSession.id);
      } catch (wsError) {
        logger.warn(' WebSocket connection failed (will sync offline):', wsError);
      }

      logger.log(' Session started:', session.id, '(backend:', backendSession.id, ')');
      return session;

    } catch (error) {
      logger.error(' Failed to start session:', error);
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
      // FIRST: Process pending queue items while session is still active on backend
      logger.log('🔄 Processing pending queue before ending session...');
      await syncQueueManager.processQueue();
      
      // Give queue time to finish processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Close all open attendance intervals locally
      const closedCount = await closeAllOpenIntervals(sessionId, endedAt);
      console.log(`[SessionManager] Closed ${closedCount} open attendance intervals`);

      // Call backend API to end session (this will also close intervals server-side)
      if (session.backend_id) {
        await endSessionWithTimestamp(session.backend_id, endedAt);
      }
      
      // Clear any remaining queue items (these are now stale since session ended)
      await syncQueueManager.onSessionEnd(sessionId);

      // Disconnect WebSocket
      try {
        await socketClient.disconnect();
        logger.log(' WebSocket disconnected');
      } catch (wsError) {
        logger.warn(' WebSocket disconnect failed:', wsError);
      }

      // Update local session
      const updatedSession = await updateSession(sessionId, {
        ended_at: endedAt,
        status: SESSION_STATUS.ENDED
      });

      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }

      logger.log(' Session ended:', sessionId);
      return updatedSession;

    } catch (error) {
      logger.error(' Failed to end session:', error);
      
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
   * Re-matches all existing unmatched participants after roster is loaded
   * @param {Array} roster - Array of { id, name }
   */
  async setStudentRoster(roster) {
    this.studentRoster = roster;
    logger.log(' 📋 Roster set with', roster.length, 'students');
    if (roster.length > 0) {
      logger.log(' Roster sample:', roster.slice(0, 5).map(s => `${s.name} (ID: ${s.id})`));
    } else {
      logger.warn(' ⚠️ WARNING: Empty roster - no students to match against!');
    }
    
    // Re-match existing participants that joined before roster was loaded
    await this.rematchExistingParticipants();
  }
  
  /**
   * Re-match all unmatched participants against the current roster
   * Called after roster is loaded to match participants who joined early
   */
  async rematchExistingParticipants() {
    const session = await this.getActiveSession();
    if (!session || this.studentRoster.length === 0) {
      return;
    }
    
    const participants = await getParticipantsBySession(session.id);
    const unmatchedParticipants = participants.filter(p => !p.matched_student_id);
    
    if (unmatchedParticipants.length === 0) {
      return;
    }
    
    logger.log(' 🔄 Re-matching', unmatchedParticipants.length, 'unmatched participants against roster of', this.studentRoster.length);
    
    for (const participant of unmatchedParticipants) {
      logger.log(' Re-matching:', participant.name);
      const match = matchParticipant({ name: participant.name }, this.studentRoster);
      
      if (match) {
        // Update participant with match info
        await updateParticipant(participant.id, {
          matched_student_id: match.student.id,
          matched_student_name: match.student.name,
          match_confidence: match.score,
          match_method: match.method
        });
        
        logger.log(' Re-matched participant:', participant.name, '->', match.student.name);
        
        // Also update any open attendance intervals for this participant
        const openIntervals = await getOpenIntervals(session.id);
        const participantIntervals = openIntervals.filter(i => i.participant_name === participant.name);
        
        for (const interval of participantIntervals) {
          // Note: We need to add an update function for intervals
          // For now, the backend sync will handle this correctly
          logger.log(' Found open interval for re-matched participant:', interval.id);
        }
      }
    }
  }

  /**
   * Handle participant joined event
   * Creates an attendance interval for tracking duration
   * Handles re-joins by creating new intervals
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
      logger.warn(' No participant name in join event:', data);
      return;
    }

    // Check if already has an open interval (duplicate join event - skip it)
    const openIntervals = await getOpenIntervals(session.id);
    const existingOpen = openIntervals.find(i => i.participant_name === participantName);
    
    if (existingOpen) {
      // Silently skip - this is expected with multiple event sources
      logger.log(' Participant already has open interval, skipping duplicate join:', participantName);
      return;
    }

    debug.receive('background', 'PARTICIPANT_JOINED', { name: participantName });

    // Match to student roster
    logger.log(' 🔍 Attempting to match participant:', participantName);
    logger.log(' Current roster size:', this.studentRoster.length);
    
    const match = this.studentRoster.length > 0
      ? matchParticipant({ name: participantName }, this.studentRoster)
      : null;
    
    if (match) {
      logger.log(' ✅ MATCHED:', participantName, '->', match.student.name, `(confidence: ${(match.score * 100).toFixed(1)}%, method: ${match.method})`);
    } else {
      logger.log(' ❌ NO MATCH found for:', participantName, '(roster size:', this.studentRoster.length + ')');
    }

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
        logger.warn(' Failed to sync join to backend, queueing for retry:', apiError);
        debug.error('background', 'JOIN_SYNC_FAILED', { error: apiError.message });
        
        // Queue for retry
        await syncQueueManager.enqueue('join', session.backend_id, {
          participant_name: participantName,
          joined_at: joinedAt,
          student_id: match?.student?.id || null
        });
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
   * Handles re-leaves by only closing if there's an open interval
   * @param {Object} data - { platform, meeting_id, participant_id, left_at, name, timestamp }
   */
  async handleParticipantLeft(data) {
    const session = await this.getActiveSession();
    if (!session) {
      logger.log(' No active session for leave event');
      return;
    }

    // Get participant name - support both old and new format
    const participantName = data.name || data.participantId;
    const leftAt = data.timestamp || data.leftAt || now();
    
    logger.log(' Processing participant left:', {
      participantName,
      leftAt,
      sessionId: session.id,
      backendId: session.backend_id
    });
    
    if (!participantName) {
      logger.warn(' No participant name in leave event:', data);
      return; // Silent skip - malformed event
    }

    // Close local attendance interval
    const closedInterval = await closeAttendanceInterval(session.id, participantName, leftAt);
    
    if (!closedInterval) {
      // No open interval - might have already been closed or never opened
      // This is expected when receiving duplicate leave events
      logger.log(' No open interval found for participant:', participantName);
      return;
    }
    
    logger.log(' Closed interval for participant:', participantName, 'Duration:', closedInterval.duration_minutes, 'min');

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
        logger.warn(' Failed to sync leave to backend, queueing for retry:', apiError);
        debug.error('background', 'LEAVE_SYNC_FAILED', { error: apiError.message });
        
        // Queue for retry
        await syncQueueManager.enqueue('leave', session.backend_id, {
          participant_name: participantName,
          left_at: leftAt
        });
      }
    }

    // Emit real-time event via WebSocket
    if (socketClient.isSessionConnected()) {
      try {
        await socketClient.emitParticipantLeft(participantName, leftAt);
      } catch (wsError) {
        logger.warn(' WebSocket emit failed:', wsError);
      }
    }

    logger.log(' Participant left:', participantName);
  }

  /**
   * Handle participation event (REMOVED - see PLANNED_FEATURES.md)
   * Kept as stub for backwards compatibility
   * @param {Object} data - { type, platform, meeting_id, participant_id, ... }
   */
  async handleParticipationEvent(data) {
    logger.warn(' handleParticipationEvent called but participation events are disabled');
    debug.warn('background', 'PARTICIPATION_DISABLED', { 
      type: data.type, 
      message: 'Participation events removed - see PLANNED_FEATURES.md' 
    });
    return null;
  }

  /**
   * Map message type to event type (LEGACY - kept for future use)
   * Must match database ENUM: 'manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle', 'platform_switch', 'hand_raise'
   */
  mapEventType(messageType) {
    // Legacy mapping - kept for when participation events are re-enabled
    const mapping = {
      // MESSAGE_TYPES.CHAT_MESSAGE: 'chat', (removed)
      // MESSAGE_TYPES.REACTION: 'reaction', (removed)
      // MESSAGE_TYPES.HAND_RAISE: 'hand_raise', (removed)
      // MESSAGE_TYPES.MIC_TOGGLE: 'mic_toggle', (removed)
      // MESSAGE_TYPES.CAMERA_TOGGLE: 'camera_toggle', (removed)
      [MESSAGE_TYPES.PLATFORM_SWITCH]: 'platform_switch'
    };
    return mapping[messageType] || 'manual_entry';
  }

  /**
   * Extract relevant event data (LEGACY)
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

    logger.log(' Manual match:', participantId, '->', studentId);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
