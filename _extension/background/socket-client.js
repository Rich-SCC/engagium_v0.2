/**
 * WebSocket Client for Engagium Extension
 * 
 * Manages real-time connection to backend for live session updates.
 * Connection is ONLY active during live tracking sessions.
 */

import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants.js';
import { debug } from '../utils/debug-logger.js';
import { getAuthToken } from '../utils/auth.js';
import { now } from '../utils/date-utils.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Socket');

// Socket.io client for service workers (using polling since WebSocket isn't available in service workers)
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketClient {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.pendingEvents = [];
  }

  /**
   * Connect to WebSocket server for a specific session
   * @param {string} sessionId - The backend session ID
   * @returns {Promise<boolean>}
   */
  async connect(sessionId) {
    if (this.isConnected && this.sessionId === sessionId) {
      logger.log(' Already connected to session:', sessionId);
      return true;
    }

    // Disconnect from any existing session first
    if (this.isConnected) {
      await this.disconnect();
    }

    this.sessionId = sessionId;

    try {
      // Get auth token
      const token = await getAuthToken();

      if (!token) {
        logger.error(' No auth token available');
        return false;
      }

      // For service workers, we use Server-Sent Events (SSE) or polling
      // since native WebSocket isn't reliably available
      // We'll use a hybrid approach: POST events to a REST endpoint
      // and the backend will broadcast via Socket.io to frontend
      
      logger.log(' Connecting to session:', sessionId);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Notify backend that extension is now tracking this session
      await this._sendEvent('session:extension_connected', {
        sessionId: this.sessionId,
        timestamp: now()
      });

      // Flush any pending events
      await this._flushPendingEvents();

      logger.log(' Connected to session:', sessionId);
      return true;

    } catch (error) {
      logger.error(' Connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      // Notify backend that extension is disconnecting
      await this._sendEvent('session:extension_disconnected', {
        sessionId: this.sessionId,
        timestamp: now()
      });
    } catch (error) {
      logger.error(' Error sending disconnect event:', error);
    }

    this.isConnected = false;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    logger.log(' Disconnected');
  }

  /**
   * Emit a participant joined event
   * @param {Object} participant - { id, name, joinedAt }
   */
  async emitParticipantJoined(participant) {
    await this._sendEvent('participant:joined', {
      sessionId: this.sessionId,
      participant: {
        id: participant.id,
        name: participant.name,
        joinedAt: participant.joinedAt || now()
      }
    });
  }

  /**
   * Emit a participant left event
   * @param {string} participantId 
   * @param {string} leftAt 
   */
  async emitParticipantLeft(participantId, leftAt) {
    await this._sendEvent('participant:left', {
      sessionId: this.sessionId,
      participantId,
      leftAt: leftAt || now()
    });
  }

  /**
   * Emit a chat message event
   * @param {Object} chatData - { sender, message, timestamp }
   */
  async emitChatMessage(chatData) {
    await this._sendEvent('chat:message', {
      sessionId: this.sessionId,
      sender: chatData.sender,
      message: chatData.message,
      timestamp: chatData.timestamp || new Date().toISOString()
    });
  }

  /**
   * Emit attendance update (participant matched to student)
   * @param {Object} attendanceData - { studentId, studentName, status, joinedAt, leftAt }
   */
  async emitAttendanceUpdate(attendanceData) {
    await this._sendEvent('attendance:update', {
      sessionId: this.sessionId,
      studentId: attendanceData.studentId,
      studentName: attendanceData.studentName,
      status: attendanceData.status,
      joinedAt: attendanceData.joinedAt,
      leftAt: attendanceData.leftAt
    });
  }

  /**
   * Emit participation event (raised hand, reaction, etc.)
   * @param {Object} participationData - { studentId, studentName, type, metadata }
   */
  async emitParticipation(participationData) {
    await this._sendEvent('participation:logged', {
      sessionId: this.sessionId,
      studentId: participationData.studentId,
      studentName: participationData.studentName,
      interactionType: participationData.type,
      metadata: participationData.metadata || {},
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send event to backend via REST API
   * Backend will then broadcast via Socket.io to frontend
   * @param {string} eventType 
   * @param {Object} data 
   */
  async _sendEvent(eventType, data) {
    if (!this.sessionId && eventType !== 'session:extension_connected') {
      logger.warn(' No session connected, queuing event:', eventType);
      this.pendingEvents.push({ eventType, data, timestamp: Date.now() });
      return;
    }

    console.log('\n========================================');
    logger.log(' 📤 SENDING EVENT TO BACKEND');
    console.log('========================================');
    logger.log(' Event Type:', eventType);
    logger.log(' Session ID:', this.sessionId);
    logger.log(' Data:', JSON.stringify(data, null, 2));
    console.log('========================================\n');

    // Debug log - outgoing API call
    debug.send('socket', eventType, { sessionId: this.sessionId, data });

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
      const token = result[STORAGE_KEYS.AUTH_TOKEN];

      if (!token) {
        logger.error(' ❌ No auth token for event:', eventType);
        debug.error('socket', eventType, 'No auth token available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/sessions/live-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': token
        },
        body: JSON.stringify({
          eventType,
          sessionId: this.sessionId,
          data,
          timestamp: now()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(' ❌ Event send failed:', response.status, errorText);
        debug.error('socket', eventType, { status: response.status, error: errorText });
        
        // Queue for retry if it's a transient error
        if (response.status >= 500) {
          this.pendingEvents.push({ eventType, data, timestamp: Date.now() });
        }
        return;
      }

      const responseData = await response.json();
      logger.log(' ✅ Event sent successfully:', eventType);
      logger.log(' Backend response:', responseData);
      debug.success('socket', `${eventType}_RESPONSE`, responseData);

    } catch (error) {
      logger.error(' ❌ Error sending event:', error);
      debug.error('socket', eventType, { error: error.message, stack: error.stack });
      // Queue for retry
      this.pendingEvents.push({ eventType, data, timestamp: Date.now() });
    }
  }

  /**
   * Flush pending events (called after reconnect)
   */
  async _flushPendingEvents() {
    if (this.pendingEvents.length === 0) return;

    logger.log(' Flushing', this.pendingEvents.length, 'pending events');
    
    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const event of events) {
      // Only send events from last 5 minutes
      if (Date.now() - event.timestamp < 5 * 60 * 1000) {
        await this._sendEvent(event.eventType, event.data);
      }
    }
  }

  /**
   * Check if connected to a session
   */
  isSessionConnected() {
    return this.isConnected && this.sessionId !== null;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    return this.sessionId;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
export default socketClient;
