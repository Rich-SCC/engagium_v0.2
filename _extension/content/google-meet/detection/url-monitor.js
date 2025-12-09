/**
 * Google Meet Content Script - URL Monitor
 * Monitors URL changes for meeting detection and platform switching
 * Does NOT aggressively detect refresh - only navigation away from meeting
 */

import { CONFIG } from '../core/config.js';
import { PLATFORMS } from '../../../utils/constants.js';
import { clearParticipants } from '../core/state.js';
import { log, warn, sendMessage } from '../core/utils.js';
import { MESSAGE_TYPES } from '../../../utils/constants.js';
import { now } from '../../../utils/date-utils.js';

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
 * Does NOT monitor for refresh - user can refresh freely without ending session
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
  
  log('URL monitoring active (navigation only, not refresh)');
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
      platform: PLATFORMS.GOOGLE_MEET,
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
