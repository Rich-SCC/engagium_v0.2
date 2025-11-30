/**
 * Google Meet Content Script - Media State Detector
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. MIC STATUS ONLY - Camera status NOT detectable for other participants
 * 2. People Panel: Button "You can't unmute someone else" [disabled] = muted
 * 3. Toast notifications for mic mute/unmute
 * 
 * NOTE: Professor cannot see if students have camera on/off - only mic!
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG } from './config.js';
import { log, warn } from './utils.js';
import { queueEvent } from './event-emitter.js';
import { findParticipantIdByName } from './participant-detector.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let mediaObserver = null;
let toastObserver = null;
let rescanTimeout = null;

/**
 * Starts monitoring media state changes (MIC ONLY)
 * Camera status is NOT detectable for other participants in Google Meet
 * @param {Object} state - State object
 */
export function startMediaStateMonitoring(state) {
  log('Starting media state monitoring (ARIA-based)...');
  log('NOTE: Only mic status is detectable for other participants');
  
  // Initial scan to establish baseline (don't send events)
  initializeMediaStates(state);
  
  // Watch for toast notifications about mic state changes
  setupMicToastObserver(state);
  
  // Set up observer on People Panel for mic button state changes
  setupPeoplePanelObserver(state);
  
  log('Media state observer active (mic only)');
}

/**
 * Stops media state monitoring
 */
export function stopMediaStateMonitoring() {
  if (mediaObserver) {
    mediaObserver.disconnect();
    mediaObserver = null;
  }
  if (toastObserver) {
    toastObserver.disconnect();
    toastObserver = null;
  }
  if (rescanTimeout) {
    clearTimeout(rescanTimeout);
    rescanTimeout = null;
  }
  log('Media state observer stopped');
}

/**
 * Sets up toast observer for mic state changes
 * Pattern: "[Name] muted [Name]" or unmute notifications
 * @param {Object} state - State object
 */
function setupMicToastObserver(state) {
  toastObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const text = node.textContent?.trim() || '';
        
        // Check for mic-related notifications
        if (text.includes('unmuted') || text.includes('muted')) {
          // Try to extract who was muted/unmuted
          processMicToast(text, state);
        }
      }
    }
  });
  
  toastObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Processes a mic-related toast notification
 * @param {string} text - Toast text
 * @param {Object} state - State object
 */
function processMicToast(text, state) {
  // Common patterns:
  // "[Name] muted [Name]" - someone was muted
  // "[Name] unmuted" - someone unmuted themselves
  
  // Extract name from unmute notification
  if (text.includes('unmuted')) {
    // Try to extract the name
    const match = text.match(/^(.+?)\s+unmuted/i);
    if (match) {
      const name = match[1].trim();
      
      const participantId = findParticipantIdByName(state, name);
      const previousState = state.micStates.get(name);
      
      if (previousState === false) {
        log('Mic turned on (from toast):', name);
        state.micStates.set(name, true);
        
        queueEvent(MESSAGE_TYPES.MIC_TOGGLE, {
          platform: 'google-meet',
          meetingId: state.meetingId,
          participantId: participantId || name,
          participantName: name,
          state: 'on',
          timestamp: now()
        });
      }
    }
  }
}

/**
 * Sets up observer on People Panel to detect mic button states
 * @param {Object} state - State object
 */
function setupPeoplePanelObserver(state) {
  mediaObserver = new MutationObserver(() => {
    if (!state.isTracking) return;
    
    // Debounce the rescan
    clearTimeout(rescanTimeout);
    rescanTimeout = setTimeout(() => {
      scanAllParticipantMicStates(state);
    }, 300);
  });
  
  // Watch the side panel for changes
  const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
  if (sidePanel) {
    mediaObserver.observe(sidePanel, {
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-label', 'aria-disabled'],
      childList: true
    });
  } else {
    // Watch for side panel to appear
    const bodyObserver = new MutationObserver(() => {
      const panel = document.querySelector(CONFIG.SELECTORS.sidePanel);
      if (panel) {
        mediaObserver.observe(panel, {
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'aria-label', 'aria-disabled'],
          childList: true
        });
        bodyObserver.disconnect();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }
}

/**
 * Initializes mic states for all current participants (baseline, no events sent)
 * @param {Object} state - State object
 */
function initializeMediaStates(state) {
  // Use state.participants which is populated by participant-detector
  for (const [id, data] of state.participants.entries()) {
    const name = data.name || id;
    const micState = checkParticipantMicState(name);
    state.micStates.set(name, micState);
  }
  
  log('Initialized mic states for', state.micStates.size, 'participants');
}

/**
 * Scans all participants for mic state changes
 * @param {Object} state - State object
 */
function scanAllParticipantMicStates(state) {
  // Use state.participants which is populated by participant-detector
  for (const [id, data] of state.participants.entries()) {
    const name = data.name || id;
    checkMicStateChange(name, state);
  }
}

/**
 * Checks the mic state for a specific participant
 * Muted = has disabled "unmute" button in People Panel
 * @param {string} name - Participant name
 * @returns {boolean} true if mic is on (unmuted)
 */
function checkParticipantMicState(name) {
  // Find participant in People Panel
  const peoplePanelList = document.querySelector(CONFIG.SELECTORS.peoplePanelList);
  if (!peoplePanelList) return null;
  
  const items = peoplePanelList.querySelectorAll('[role="listitem"]');
  
  for (const item of items) {
    const itemName = item.getAttribute('aria-label') || 
                     extractNameFromListitem(item);
    
    if (itemName === name || itemName?.includes(name)) {
      // Found the participant - check for disabled unmute button
      // Pattern: button "You can't unmute someone else" [disabled]
      const buttons = item.querySelectorAll('button');
      
      for (const button of buttons) {
        const label = button.getAttribute('aria-label') || '';
        
        // Disabled unmute button = muted
        if ((label.includes("unmute") || label.includes("can't unmute")) && 
            button.disabled) {
          return false; // Muted
        }
        
        // Has active mute button = unmuted
        if (label.includes('mute') && !label.includes("unmute") && 
            !label.includes("can't") && !button.disabled) {
          return true; // Unmuted
        }
      }
    }
  }
  
  return null; // Unknown
}

/**
 * Extracts name from a listitem element
 * @param {Element} item - Listitem element
 * @returns {string|null} Name or null
 */
function extractNameFromListitem(item) {
  const generics = item.querySelectorAll('[role="generic"]');
  for (const g of generics) {
    const text = g.textContent?.trim();
    if (text && text.length > 1 && text.length < 100 && 
        !CONFIG.INVALID_NAMES.includes(text.toLowerCase())) {
      return text;
    }
  }
  return null;
}

/**
 * Checks and reports mic state change for a specific participant
 * @param {string} name - Participant name
 * @param {Object} state - State object
 */
function checkMicStateChange(name, state) {
  const currentMicState = checkParticipantMicState(name);
  if (currentMicState === null) return; // Unable to determine
  
  const previousMicState = state.micStates.get(name);
  
  // Only send event if state actually changed from OFF to ON
  if (currentMicState !== previousMicState) {
    state.micStates.set(name, currentMicState);
    
    // Only track mic turning ON (participation event)
    if (currentMicState === true && previousMicState === false) {
      const participantId = findParticipantIdByName(state, name);
      
      log('Mic turned on:', name);
      queueEvent(MESSAGE_TYPES.MIC_TOGGLE, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participantId: participantId || name,
        participantName: name,
        state: 'on',
        timestamp: now()
      });
    }
  }
}

/**
 * Legacy function for compatibility
 * @param {Object} state - State object
 */
export function scanMicCameraStates(state) {
  scanAllParticipantMicStates(state);
}
