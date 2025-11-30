/**
 * Google Meet Content Script - State Management
 * Factory function for creating isolated state instances (enables testing)
 */

/**
 * Creates a new state instance for tracking meeting data
 * @returns {Object} State object with all tracking properties
 */
export function createState() {
  return {
    // Meeting identification
    meetingId: null,
    previousMeetingId: null, // For platform switch detection
    
    // Tracking status
    isTracking: false,
    
    // Participants: Map of participantId -> { name, email, joinedAt, leftAt }
    participants: new Map(),
    
    // Chat tracking
    lastChatMessageCount: 0,
    
    // Observers for cleanup
    participantObserver: null,
    chatObserver: null,
    participationObserver: null,
    
    // Participation event deduplication
    raisedHands: new Set(),           // participant IDs with raised hands
    lastReactions: new Map(),          // participantId -> { reaction, timestamp }
    micStates: new Map(),              // participantId -> boolean (true = on)
    cameraStates: new Map()            // participantId -> boolean (true = on)
  };
}

/**
 * Resets participation-specific state while preserving meeting info
 * @param {Object} state - State object to reset
 */
export function resetParticipationState(state) {
  state.raisedHands.clear();
  state.lastReactions.clear();
  state.micStates.clear();
  state.cameraStates.clear();
}

/**
 * Clears all participants from state
 * @param {Object} state - State object to clear
 */
export function clearParticipants(state) {
  state.participants.clear();
}

/**
 * Disconnects all observers
 * @param {Object} state - State object containing observers
 */
export function disconnectObservers(state) {
  if (state.participantObserver) {
    state.participantObserver.disconnect();
    state.participantObserver = null;
  }
  if (state.chatObserver) {
    state.chatObserver.disconnect();
    state.chatObserver = null;
  }
  if (state.participationObserver) {
    state.participationObserver.disconnect();
    state.participationObserver = null;
  }
}
