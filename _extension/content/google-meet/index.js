/**
 * Google Meet Content Script - Main Entry Point
 * Coordinates core tracking for Google Meet (Join/Leave only)
 * 
 * Updated December 2025: Now uses centralized DOM and Panel managers
 * 
 * Module Structure:
 * - dom/dom-manager.js: Centralized DOM queries with caching
 * - dom/panel-manager.js: Smart panel state management
 * - core/config.js: DOM selectors and timing configuration
 * - core/state.js: State management factory
 * - core/utils.js: Shared utility functions
 * - core/event-emitter.js: Batching and deduplication for events
 * - detection/url-monitor.js: URL change detection for platform switches
 * - detection/meeting-exit-detector.js: Meeting exit/end detection via DOM monitoring
 * - detection/participant-detector.js: Participant join/leave monitoring
 * - ui/tracking-indicator.js: Visual UI overlay
 * - ui/meeting-notifications.js: User prompts and notifications
 * 
 * Removed modules (see __documentation/Extension/PLANNED_FEATURES.md):
 * - chat-monitor.js, hand-raise-detector.js, reaction-detector.js,
 * - media-state-detector.js, screen-share-detector.js
 */

import { CONFIG } from './core/config.js';
import { createState, resetParticipationState, disconnectObservers } from './core/state.js';
import { log, warn, sendMessage, findPeopleButton, findJoinButton } from './core/utils.js';
import { clearEventQueue } from './core/event-emitter.js';
import { extractMeetingId, monitorURLChanges } from './detection/url-monitor.js';
import { monitorMeetingExit, stopMeetingExitMonitoring } from './detection/meeting-exit-detector.js';
import { 
  startParticipantMonitoring, 
  stopParticipantMonitoring, 
  scanParticipants 
} from './detection/participant-detector.js';
import { injectTrackingIndicator, updateIndicator } from './ui/tracking-indicator.js';
import { 
  showJoinNowPrompt, 
  showTrackingReminder, 
  showRetroactiveCaptureNotification,
  dismissAllNotifications 
} from './ui/meeting-notifications.js';
import { MESSAGE_TYPES, STORAGE_KEYS, PLATFORMS } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';
import { initDOMManager, stopDOMManager } from './dom/dom-manager.js';
import { initPanelManager, resetPanelState } from './dom/panel-manager.js';

// Create state instance
const state = createState();

// Tracking reminder timeout ID
let trackingReminderTimeout = null;

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  log('Initializing with optimized DOM management...');
  
  // Initialize centralized DOM and Panel managers
  initDOMManager();
  initPanelManager();
  
  // Extract meeting ID from URL
  state.meetingId = extractMeetingId();
  
  if (!state.meetingId) {
    log('Not on a meeting page (landing, settings, etc.) - skipping initialization');
    return;
  }
  
  log('Meeting ID:', state.meetingId);
  
  // Notify background of meeting detection
  sendMessage(MESSAGE_TYPES.MEETING_DETECTED, {
    platform: PLATFORMS.GOOGLE_MEET,
    meetingId: state.meetingId,
    meetingUrl: window.location.href
  });
  
  // Inject tracking indicator (shows idle until tracking starts)
  injectTrackingIndicator();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  
  // Monitor URL changes for navigation away (not refresh)
  monitorURLChanges(state, handleMeetingLeft, handlePlatformSwitch);
  
  // Monitor for leave button click and check for refresh
  await monitorMeetingExit(state, handleMeetingEnded);
  
  // Set up tracking reminder (shows after 60s if not tracking)
  setupTrackingReminder();
  
  // Set up cleanup on page unload (send participant left events)
  // Note: This does NOT end the session, just marks participants as left
  window.addEventListener('beforeunload', handlePageUnload);
}

// ============================================================================
// Tracking Control
// ============================================================================

// Helper to check if user is in waiting room
function isInWaitingRoom() {
  // Check for waiting room specific text (STRONGEST indicator)
  const bodyText = document.body.textContent || '';
  const hasWaitingText = bodyText.includes('Waiting for the host to let you in') ||
                         bodyText.includes('Asking to join');
  
  // If we see waiting text, definitely in waiting room
  if (hasWaitingText) {
    log('Waiting room detected: waiting text found');
    return true;
  }
  
  // Look for specific join buttons
  const joinButtonByJsname = findJoinButton();
  const joinButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = (btn.textContent || '').trim().toLowerCase();
    // Only match very specific join button patterns
    return label.includes('ask to join') || text === 'ask to join' || text === 'join now';
  });
  
  // Check for "People" button - this exists when you're IN the meeting
  const peopleButton = findPeopleButton();
  
  // If we have People button, we're definitely IN the meeting (not waiting room)
  if (peopleButton) {
    return false;
  }
  
  // Only consider it waiting room if we have join buttons AND no People button
  // (Without People button confirmation, we're probably in meeting)
  const inWaitingRoom = (joinButtonByJsname || joinButtons.length > 0);
  
  if (inWaitingRoom) {
    log('Waiting room detected:', {
      joinButtonByJsname: !!joinButtonByJsname,
      joinButtons: joinButtons.length,
      noPeopleButton: !peopleButton
    });
  }
  
  return inWaitingRoom;
}

// Setup tracking reminder (shows after 60 seconds if not tracking)
async function setupTrackingReminder() {
  const storage = await chrome.storage.local.get([STORAGE_KEYS.SHOW_TRACKING_REMINDER]);
  const showReminder = storage[STORAGE_KEYS.SHOW_TRACKING_REMINDER] !== undefined ? storage[STORAGE_KEYS.SHOW_TRACKING_REMINDER] : true;
  if (!showReminder) return;
  
  // Clear any existing reminder
  if (trackingReminderTimeout) {
    clearTimeout(trackingReminderTimeout);
  }
  
  // Set 60-second timeout
  trackingReminderTimeout = setTimeout(async () => {
    // Only show if user hasn't started tracking yet
    if (!state.isTracking && !isInWaitingRoom()) {
      log('Showing tracking reminder after 60 seconds');
      
      // Show reminder with callback to open popup
      showTrackingReminder(state.classInfo, () => {
        log('User clicked Start Tracking from reminder');
        
        // Re-send meeting detection to ensure background has current state
        sendMessage(MESSAGE_TYPES.MEETING_DETECTED, {
          platform: PLATFORMS.GOOGLE_MEET,
          meetingId: state.meetingId,
          meetingUrl: window.location.href
        }).then(() => {
          // Wait a bit for background to process, then open popup
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: 'OPEN_POPUP_FROM_REMINDER'
            });
          }, 200);
        });
      });
    }
  }, 60000); // 60 seconds
}

function startTracking() {
  if (state.isTracking) return;
  
  log('Starting tracking...');
  state.isTracking = true;
  
  // Clear tracking reminder if it was active
  if (trackingReminderTimeout) {
    clearTimeout(trackingReminderTimeout);
    trackingReminderTimeout = null;
  }
  
  // Wait a bit for panel to load, then start all async monitoring
  setTimeout(async () => {
    // Check if still in waiting room
    const storage = await chrome.storage.local.get([STORAGE_KEYS.SHOW_JOIN_PROMPT]);
    const showJoinPrompt = storage[STORAGE_KEYS.SHOW_JOIN_PROMPT] || false;
    
    if (isInWaitingRoom()) {
      log('User is in waiting room - showing prompt and postponing full tracking');
      if (showJoinPrompt) {
        showJoinNowPrompt(state.classInfo);
      }
      
      // Set up a watcher to detect when they join the main meeting
      const joinWatcher = setInterval(async () => {
        if (!isInWaitingRoom() && state.isTracking) {
          clearInterval(joinWatcher);
          log('User joined main meeting - waiting for UI to load...');
          await waitForMeetingUI();
          log('Meeting UI loaded - starting full tracking');
          initializeAllMonitors();
        } else if (!state.isTracking) {
          // Tracking was stopped while waiting
          clearInterval(joinWatcher);
        }
      }, 1000);
      
      return;
    }
    
    // User is already in main meeting, wait for UI to load
    await waitForMeetingUI();
    initializeAllMonitors();
  }, 1000);
  
  // Helper function to wait for meeting UI to be ready
  async function waitForMeetingUI() {
    return new Promise((resolve) => {
      const maxAttempts = 30; // 30 seconds max wait
      let attempts = 0;
      
      const checkUI = setInterval(() => {
        attempts++;
        
        // Check if People button is available (indicates UI is loaded)
        const peopleButton = findPeopleButton();
        
        if (peopleButton) {
          log('Meeting UI ready - People button found');
          clearInterval(checkUI);
          resolve();
        } else if (attempts >= maxAttempts) {
          log('Timeout waiting for meeting UI - proceeding anyway');
          clearInterval(checkUI);
          resolve();
        }
      }, 1000);
    });
  }
  
  // Helper function to initialize all monitors
  async function initializeAllMonitors() {
    log('Initializing participant monitoring...');
    
    // Start participant join/leave monitoring
    // This will handle opening/closing the panel internally
    startParticipantMonitoring(state);
    log('✓ Participant monitoring started');
    
    updateIndicator('active', state.participants.size);
    
    // Set up periodic indicator update (just for UI)
    state._indicatorInterval = setInterval(() => {
      if (state.isTracking) {
        updateIndicator('active', state.participants.size);
      }
    }, 5000);
    
    log('All monitors initialized. Ready to track participation.');
  }
}

function stopTracking() {
  if (!state.isTracking) return;
  
  log('Stopping tracking...');
  state.isTracking = false;
  
  // Clear tracking reminder if it was active
  if (trackingReminderTimeout) {
    clearTimeout(trackingReminderTimeout);
    trackingReminderTimeout = null;
  }
  
  // Dismiss any active notifications
  dismissAllNotifications();
  
  // Stop participant monitoring
  stopParticipantMonitoring(state);
  stopMeetingExitMonitoring(state);
  
  // Stop DOM manager
  stopDOMManager();
  
  // Reset panel state
  resetPanelState();
  
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
  const peopleButton = findPeopleButton();
  
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
  const peopleButton = findPeopleButton();
  
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

function handleMeetingEnded() {
  // This is called by the meeting exit detector when leave button is clicked
  // OR when user clicks "End Session" after page refresh
  log('Meeting ended - user clicked leave button or chose to end session after refresh');
  
  // Always send meeting left message to background - it will check if there's an active session
  // This is important for the refresh case where state.isTracking may be false but session exists
  sendMessage(MESSAGE_TYPES.MEETING_LEFT, {
    platform: PLATFORMS.GOOGLE_MEET,
    meetingId: state.meetingId
  });
  
  // If we're actively tracking in this content script instance, send participant left events
  if (state.isTracking) {
    // Notify all participants as left
    for (const [participantId, participant] of state.participants.entries()) {
      if (!participant.leftAt) {
        sendMessage(MESSAGE_TYPES.PARTICIPANT_LEFT, {
          platform: PLATFORMS.GOOGLE_MEET,
          meetingId: state.meetingId,
          participantId: participantId,
          leftAt: now()
        });
      }
    }
    
    stopTracking();
  }
}

function handlePlatformSwitch(newMeetingId) {
  // Re-scan participants after a short delay
  setTimeout(() => scanParticipants(state), 1000);
}

function handlePageUnload(event) {
  if (!state.isTracking) return;
  
  // Check if this is a page refresh or actual navigation away/close
  // Performance navigation API tells us the navigation type
  const navType = performance.getEntriesByType('navigation')[0]?.type;
  
  // Only send participant left events, but DON'T send MEETING_LEFT on refresh
  // The tab close/navigation handlers in the background script will handle that
  log('Page unload detected');
  
  // Mark all participants as left
  for (const [participantId, participant] of state.participants.entries()) {
    if (!participant.leftAt) {
      sendMessage(MESSAGE_TYPES.PARTICIPANT_LEFT, {
        platform: PLATFORMS.GOOGLE_MEET,
        meetingId: state.meetingId,
        participantId: participantId,
        leftAt: now()
      });
    }
  }
  
  // DO NOT send MEETING_LEFT here - it will be handled by:
  // 1. Tab close listener in background script
  // 2. Tab navigation listener in background script  
  // 3. Leave button click handler
  // This prevents ending the session on refresh
  
  log('Participant left events sent (session not ended - tab handlers will decide)');
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
