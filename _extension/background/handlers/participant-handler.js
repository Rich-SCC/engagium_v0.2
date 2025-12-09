/**
 * Background Handler - Participant Handler
 * Handles participant join/leave events from content scripts
 */

import { v4 as uuidv4 } from 'uuid';
import {
  getParticipantsBySession,
  createParticipant,
  updateParticipant
} from '../../utils/storage.js';
import { now } from '../../utils/date-utils.js';
import { matchParticipant } from '../../utils/student-matcher.js';
import { socketClient } from '../socket-client.js';

/**
 * Handles a participant joining the meeting
 * @param {Object} session - Active session object
 * @param {Array} studentRoster - Student roster for matching
 * @param {Object} data - { platform, meeting_id, participant }
 * @returns {Promise<Object|null>} Created participant record or null
 */
export async function handleParticipantJoined(session, studentRoster, data) {
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
    console.log('[ParticipantHandler] Participant rejoined:', participant.name);
    return null;
  }

  // Match to student roster
  const match = studentRoster.length > 0
    ? matchParticipant(participant, studentRoster)
    : null;

  // Create new participant record
  const trackedParticipant = {
    id: uuidv4(),
    session_id: session.id,
    platform_participant_id: participant.id,
    name: participant.name,
    matched_student_id: match ? match.student.id : null,
    matched_student_name: match ? match.student.name : null,
    match_confidence: match ? match.score : 0,
    match_method: match ? match.method : null,
    joined_at: participant.joinedAt || now(),
    left_at: null
  };

  await createParticipant(trackedParticipant);

  // Emit real-time event via WebSocket
  await emitParticipantJoinedEvents(trackedParticipant, match);

  console.log('[ParticipantHandler] Participant tracked:', {
    name: participant.name,
    matched: !!match,
    confidence: match?.score
  });

  return trackedParticipant;
}

/**
 * Handles a participant leaving the meeting
 * @param {Object} session - Active session object
 * @param {Object} data - { platform, meeting_id, participantId, leftAt }
 * @returns {Promise<void>}
 */
export async function handleParticipantLeft(session, data) {
  const participants = await getParticipantsBySession(session.id);
  const participant = participants.find(
    p => p.platform_participant_id === data.participantId
  );

  if (!participant) {
    console.warn('[ParticipantHandler] Participant not found for left event');
    return;
  }

  const leftAt = data.leftAt || now();
  await updateParticipant(participant.id, {
    left_at: leftAt
  });

  // Emit real-time event via WebSocket
  await emitParticipantLeftEvents(participant, leftAt);

  console.log('[ParticipantHandler] Participant left:', participant.name);
}

/**
 * Manually matches a participant to a student
 * @param {string} participantId - Local participant ID
 * @param {string} studentId - Student ID from roster
 * @param {Array} studentRoster - Student roster for lookup
 * @returns {Promise<void>}
 */
export async function manualMatchParticipant(participantId, studentId, studentRoster) {
  const student = studentRoster.find(s => s.id === studentId);
  if (!student) {
    throw new Error('Student not found in roster');
  }

  await updateParticipant(participantId, {
    matched_student_id: studentId,
    matched_student_name: student.name,
    match_confidence: 1.0,
    match_method: 'manual'
  });

  console.log('[ParticipantHandler] Manual match:', participantId, '->', studentId);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Emits participant joined events to WebSocket
 * @param {Object} trackedParticipant - Tracked participant record
 * @param {Object|null} match - Match result from student matcher
 */
async function emitParticipantJoinedEvents(trackedParticipant, match) {
  if (!socketClient.isSessionConnected()) return;

  try {
    await socketClient.emitParticipantJoined({
      id: trackedParticipant.platform_participant_id,
      name: trackedParticipant.name,
      joinedAt: trackedParticipant.joined_at
    });

    // If matched to student, also emit attendance update
    if (match) {
      await socketClient.emitAttendanceUpdate({
        studentId: match.student.id,
        studentName: match.student.name,
        status: 'present',
        joinedAt: trackedParticipant.joined_at,
        leftAt: null
      });
    }
  } catch (wsError) {
    console.warn('[ParticipantHandler] WebSocket emit failed:', wsError);
  }
}

/**
 * Emits participant left events to WebSocket
 * @param {Object} participant - Participant record
 * @param {string} leftAt - ISO timestamp of when they left
 */
async function emitParticipantLeftEvents(participant, leftAt) {
  if (!socketClient.isSessionConnected()) return;

  try {
    await socketClient.emitParticipantLeft(participant.platform_participant_id, leftAt);
    
    // If matched to student, also emit attendance update
    if (participant.matched_student_id) {
      await socketClient.emitAttendanceUpdate({
        studentId: participant.matched_student_id,
        studentName: participant.matched_student_name,
        status: 'left',
        joinedAt: participant.joined_at,
        leftAt: leftAt
      });
    }
  } catch (wsError) {
    console.warn('[ParticipantHandler] WebSocket emit failed:', wsError);
  }
}
