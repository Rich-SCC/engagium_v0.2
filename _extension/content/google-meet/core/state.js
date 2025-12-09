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
    
    // Participants: Map of participantId -> { name, joinedAt, leftAt }
    participants: new Map(),
    
    // Observers for cleanup
    participantObserver: null
  };
}

/**
 * Clears all participants from state
 * @param {Object} state - State object to clear
 */
export function clearParticipants(state) {
  state.participants.clear();
}

/**
 * Resets participation state (legacy - kept for compatibility)
 * @param {Object} state - State object to reset
 */
export function resetParticipationState(state) {
  // No-op: participation events removed (see PLANNED_FEATURES.md)
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
}
