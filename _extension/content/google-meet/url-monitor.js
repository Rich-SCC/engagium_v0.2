/**
 * Google Meet Content Script - URL Monitor
 * Monitors URL changes for meeting detection and platform switching
 */

import { CONFIG } from './config.js';
import { clearParticipants } from './state.js';
import { log, sendMessage } from './utils.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

/**
 * Extracts meeting ID from the current URL
 * @returns {string|null} Meeting ID or null if not found
 */
export function extractMeetingId() {
  const match = window.location.pathname.match(CONFIG.MEETING_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Sets up URL monitoring for platform switches
 * @param {Object} state - State object
 * @param {Function} onMeetingLeft - Callback when meeting is left
 * @param {Function} onPlatformSwitch - Callback when platform is switched
 */
export function monitorURLChanges(state, onMeetingLeft, onPlatformSwitch) {
  let lastUrl = window.location.href;
  
  const handleURLChange = () => {
    processURLChange(state, onMeetingLeft, onPlatformSwitch);
  };
  
  // Use MutationObserver to detect URL changes in SPA
  const titleElement = document.querySelector('title');
  if (titleElement) {
    new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handleURLChange();
      }
    }).observe(titleElement, {
      childList: true,
      subtree: true
    });
  }
  
  // Listen to popstate (back/forward navigation)
  window.addEventListener('popstate', handleURLChange);
  
  // Intercept pushState/replaceState (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleURLChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleURLChange();
  };
}

/**
 * Processes a URL change to detect meeting changes
 * @param {Object} state - State object
 * @param {Function} onMeetingLeft - Callback when meeting is left
 * @param {Function} onPlatformSwitch - Callback when platform is switched
 */
function processURLChange(state, onMeetingLeft, onPlatformSwitch) {
  const newMeetingId = extractMeetingId();
  
  // No meeting ID means left the meeting
  if (!newMeetingId) {
    if (state.isTracking) {
      log('Left meeting');
      onMeetingLeft();
    }
    return;
  }
  
  // If meeting ID changed while tracking, it's a platform switch
  if (state.isTracking && newMeetingId !== state.meetingId) {
    log('Platform switch detected:', state.meetingId, '->', newMeetingId);
    
    // Log platform switch event
    sendMessage(MESSAGE_TYPES.PLATFORM_SWITCH, {
      platform: 'google-meet',
      old_meeting_id: state.meetingId,
      new_meeting_id: newMeetingId,
      timestamp: now()
    });
    
    // Update meeting ID and continue tracking
    state.previousMeetingId = state.meetingId;
    state.meetingId = newMeetingId;
    
    // Clear participants (new meeting)
    clearParticipants(state);
    
    // Notify callback
    onPlatformSwitch(newMeetingId);
  }
}
