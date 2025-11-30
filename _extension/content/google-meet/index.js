/**
 * Google Meet Content Script - Main Entry Point
 * Coordinates all tracking modules for Google Meet
 * 
 * Module Structure:
 * - config.js: DOM selectors and timing configuration
 * - state.js: State management factory
 * - utils.js: Shared utility functions
 * - event-emitter.js: Batching and deduplication for events
 * - url-monitor.js: URL change detection for platform switches
 * - participant-detector.js: Participant list monitoring (async)
 * - chat-monitor.js: Chat message tracking (async)
 * - hand-raise-detector.js: Hand raise detection (async)
 * - reaction-detector.js: Emoji reaction tracking (async)
 * - media-state-detector.js: Mic/camera toggle detection (async)
 * - tracking-indicator.js: Visual UI overlay
 */

import { CONFIG } from './config.js';
import { createState, resetParticipationState, disconnectObservers } from './state.js';
import { log, warn, sendMessage } from './utils.js';
import { clearEventQueue } from './event-emitter.js';
import { extractMeetingId, monitorURLChanges } from './url-monitor.js';
import { 
  startParticipantMonitoring, 
  stopParticipantMonitoring, 
  scanParticipants 
} from './participant-detector.js';
import { startChatMonitoring, stopChatMonitoring } from './chat-monitor.js';
import { startHandRaiseMonitoring, stopHandRaiseMonitoring } from './hand-raise-detector.js';
import { startReactionMonitoring, stopReactionMonitoring } from './reaction-detector.js';
import { startMediaStateMonitoring, stopMediaStateMonitoring } from './media-state-detector.js';
import { startScreenShareMonitoring, stopScreenShareMonitoring } from './screen-share-detector.js';
import { injectTrackingIndicator, updateIndicator } from './tracking-indicator.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

// Create state instance
const state = createState();

// ============================================================================
// Initialization
// ============================================================================

function init() {
  log('Initializing...');
  
  // Extract meeting ID from URL
  state.meetingId = extractMeetingId();
  
  if (!state.meetingId) {
    warn('Could not extract meeting ID from URL');
    return;
  }
  
  log('Meeting ID:', state.meetingId);
  
  // Notify background of meeting detection
  sendMessage(MESSAGE_TYPES.MEETING_DETECTED, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    meetingUrl: window.location.href
  });
  
  // Inject tracking indicator (shows idle until tracking starts)
  injectTrackingIndicator();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  
  // Monitor URL changes for platform switches
  monitorURLChanges(state, handleMeetingLeft, handlePlatformSwitch);
  
  // Set up cleanup on page unload
  window.addEventListener('beforeunload', handlePageUnload);
}

// ============================================================================
// Tracking Control
// ============================================================================

function startTracking() {
  if (state.isTracking) return;
  
  log('Starting tracking...');
  state.isTracking = true;
  
  // Open participant panel (needed to access participant list)
  openParticipantPanel();
  
  // Wait a bit for panel to load, then start all async monitoring
  setTimeout(() => {
    log('Initializing all monitors...');
    
    // All monitors are now async (MutationObserver-based, no polling)
    startParticipantMonitoring(state);
    log('✓ Participant monitoring started');
    
    startChatMonitoring(state);
    log('✓ Chat monitoring started');
    
    startMediaStateMonitoring(state);
    log('✓ Media state monitoring started');
    
    startHandRaiseMonitoring(state);
    log('✓ Hand raise monitoring started');
    
    startReactionMonitoring(state);
    log('✓ Reaction monitoring started');
    
    startScreenShareMonitoring(state);
    log('✓ Screen share monitoring started');
    
    updateIndicator('active', state.participants.size);
    
    // Set up periodic indicator update (just for UI, not for scraping)
    state._indicatorInterval = setInterval(() => {
      if (state.isTracking) {
        updateIndicator('active', state.participants.size);
      }
    }, 5000);
    
    log('All monitors initialized. Ready to track participation.');
  }, 1000);
}

function stopTracking() {
  if (!state.isTracking) return;
  
  log('Stopping tracking...');
  state.isTracking = false;
  
  // Stop all async monitors
  stopParticipantMonitoring(state);
  stopChatMonitoring(state);
  stopMediaStateMonitoring();
  stopHandRaiseMonitoring();
  stopReactionMonitoring();
  stopScreenShareMonitoring();
  
  // Clear event queue
  clearEventQueue();
  
  // Clear indicator interval
  if (state._indicatorInterval) {
    clearInterval(state._indicatorInterval);
    state._indicatorInterval = null;
  }
  
  // Disconnect observers
  disconnectObservers(state);
  
  // Clear participation state
  resetParticipationState(state);
  
  updateIndicator('idle');
}

// ============================================================================
// UI Helpers
// ============================================================================

function openParticipantPanel() {
  const peopleButton = document.querySelector(CONFIG.SELECTORS.peopleButton);
  
  if (peopleButton) {
    const isOpen = peopleButton.getAttribute('aria-pressed') === 'true';
    
    if (!isOpen) {
      log('Opening participant panel...');
      peopleButton.click();
      
      // Close panel after 2 seconds to not clutter the UI
      setTimeout(() => {
        closeParticipantPanel();
      }, 2000);
    }
  } else {
    warn('Could not find People button');
  }
}

function closeParticipantPanel() {
  const peopleButton = document.querySelector(CONFIG.SELECTORS.peopleButton);
  
  if (peopleButton) {
    const isOpen = peopleButton.getAttribute('aria-pressed') === 'true';
    
    if (isOpen) {
      log('Closing participant panel...');
      peopleButton.click();
    }
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleBackgroundMessage(message, sender, sendResponse) {
  log('Message from background:', message.type);
  
  switch (message.type) {
    case MESSAGE_TYPES.SESSION_STARTED:
      startTracking();
      sendResponse({ success: true });
      break;
      
    case MESSAGE_TYPES.SESSION_ENDED:
      stopTracking();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep channel open for async response
}

function handleMeetingLeft() {
  stopTracking();
}

function handlePlatformSwitch(newMeetingId) {
  // Re-scan participants after a short delay
  setTimeout(() => scanParticipants(state), 1000);
}

function handlePageUnload() {
  if (state.isTracking) {
    // Notify all participants as left
    for (const [participantId, participant] of state.participants.entries()) {
      if (!participant.leftAt) {
        sendMessage(MESSAGE_TYPES.PARTICIPANT_LEFT, {
          platform: 'google-meet',
          meetingId: state.meetingId,
          participantId: participantId,
          leftAt: now()
        });
      }
    }
    
    // Notify meeting left
    sendMessage(MESSAGE_TYPES.MEETING_LEFT, {
      platform: 'google-meet',
      meetingId: state.meetingId
    });
  }
}

// ============================================================================
// Start
// ============================================================================

log('Content script loaded');

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
