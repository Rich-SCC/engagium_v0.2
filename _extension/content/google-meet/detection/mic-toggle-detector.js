/**
 * Google Meet Mic Toggle Detection Helpers
 *
 * Centralizes mute state change emission so participant detection modules can
 * share the same event payload logic.
 */

import { queueEvent } from '../core/event-emitter.js';
import { now } from '../../../utils/date-utils.js';
import { MESSAGE_TYPES, PLATFORMS } from '../../../utils/constants.js';

/**
 * Emit mic toggle when mute status changes (with full state context).
 * @param {Object} state - State object
 * @param {Object} participant - Current participant snapshot
 * @param {Object} existing - Previous participant snapshot from state
 */
export function maybeEmitMicToggle(state, participant, existing) {
  if (existing.isMuted === participant.isMuted) {
    return;
  }

  const micState = participant.isMuted ? 'off' : 'on';

  queueEvent(MESSAGE_TYPES.MIC_TOGGLE, {
    platform: PLATFORMS.GOOGLE_MEET,
    meetingId: state.meetingId,
    participantId: participant.id,
    name: participant.name,
    isMuted: participant.isMuted,
    state: micState,
    micState,
    source: 'people_panel',
    timestamp: now()
  });
}

/**
 * Emit mic toggle without state context (for standalone observers like people-panel).
 * @param {string} participantName - Name of the participant
 * @param {boolean} isMuted - Current mute state
 * @param {boolean} wasMuted - Previous mute state
 */
export function emitMicToggleSimple(participantName, isMuted, wasMuted) {
  if (wasMuted === isMuted) {
    return;
  }

  const micState = isMuted ? 'off' : 'on';

  queueEvent(MESSAGE_TYPES.MIC_TOGGLE, {
    name: participantName,
    isMuted,
    state: micState,
    micState,
    source: 'people_panel',
    timestamp: now()
  });
}