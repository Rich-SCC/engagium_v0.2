/**
 * Background Handler - Event Handler
 * Handles participation events (chat, reactions, mic/camera toggles)
 */

import { v4 as uuidv4 } from 'uuid';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { getParticipantsBySession, createEvent } from '../../utils/storage.js';
import { now } from '../../utils/date-utils.js';
import { socketClient } from '../socket-client.js';

/**
 * Event type mapping from message types to storage types
 */
const EVENT_TYPE_MAP = {
  [MESSAGE_TYPES.CHAT_MESSAGE]: 'chat',
  [MESSAGE_TYPES.REACTION]: 'reaction',
  [MESSAGE_TYPES.HAND_RAISE]: 'hand_raise',
  [MESSAGE_TYPES.MIC_TOGGLE]: 'mic_on',
  [MESSAGE_TYPES.CAMERA_TOGGLE]: 'camera_on',
  [MESSAGE_TYPES.PLATFORM_SWITCH]: 'platform_switch'
};

/**
 * Handles a participation event from the content script
 * @param {Object} session - Active session object
 * @param {Object} data - Event data from content script
 * @returns {Promise<Object|null>} Created event record or null
 */
export async function handleParticipationEvent(session, data) {
  const participants = await getParticipantsBySession(session.id);
  const participant = participants.find(
    p => p.platform_participant_id === data.participantId
  );

  if (!participant) {
    console.warn('[EventHandler] Participant not found for event:', data.participantId);
    return null;
  }

  const eventType = mapEventType(data.type);
  const eventData = extractEventData(data);

  const event = {
    id: uuidv4(),
    session_id: session.id,
    participant_id: participant.id,
    event_type: eventType,
    event_data: eventData,
    timestamp: data.timestamp || now()
  };

  await createEvent(event);

  // Emit real-time events via WebSocket
  await emitParticipationEvents(participant, event, eventType, data);

  console.log('[EventHandler] Event recorded:', {
    type: eventType,
    participant: participant.name
  });

  return event;
}

/**
 * Maps a message type to an event type
 * @param {string} messageType - MESSAGE_TYPES constant
 * @returns {string} Event type for storage
 */
export function mapEventType(messageType) {
  return EVENT_TYPE_MAP[messageType] || 'other';
}

/**
 * Extracts relevant event data from the raw message
 * @param {Object} data - Raw event data
 * @returns {Object} Cleaned event data for storage
 */
export function extractEventData(data) {
  const {
    type,
    platform,
    meetingId,
    participantId,
    participantName,
    timestamp,
    ...rest
  } = data;

  return {
    platform,
    meeting_id: meetingId,
    participant_name: participantName,
    ...rest
  };
}

/**
 * Emits participation events via WebSocket
 * @param {Object} participant - Participant record
 * @param {Object} event - Event record
 * @param {string} eventType - Event type
 * @param {Object} data - Original event data
 */
async function emitParticipationEvents(participant, event, eventType, data) {
  if (!socketClient.isSessionConnected()) return;

  try {
    // Chat messages get their own emit
    if (eventType === 'chat') {
      await socketClient.emitChatMessage({
        sender: participant.matched_student_name || participant.name,
        message: data.message,
        timestamp: event.timestamp
      });
    }
    
    // All events also emit as participation
    await socketClient.emitParticipation({
      studentId: participant.matched_student_id,
      studentName: participant.matched_student_name || participant.name,
      type: eventType,
      metadata: event.event_data
    });
  } catch (wsError) {
    console.warn('[EventHandler] WebSocket emit failed:', wsError);
  }
}

/**
 * Handles a platform switch event (professor changes meeting mid-session)
 * @param {Object} session - Active session object
 * @param {Object} data - Platform switch data
 * @returns {Promise<Object>} Created event record
 */
export async function handlePlatformSwitch(session, data) {
  const event = {
    id: uuidv4(),
    session_id: session.id,
    participant_id: null, // Platform switch is session-level, not participant-level
    event_type: 'platform_switch',
    event_data: {
      from_platform: data.platform,
      from_meeting_id: data.old_meeting_id,
      to_meeting_id: data.new_meeting_id,
      timestamp: data.timestamp
    },
    timestamp: data.timestamp || now()
  };

  await createEvent(event);

  console.log('[EventHandler] Platform switch recorded:', {
    from: data.old_meeting_id,
    to: data.new_meeting_id
  });

  return event;
}
