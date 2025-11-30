/**
 * Google Meet Content Script - Hand Raise Detector
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. People Panel "Raised hands" section (region with list of raised hands)
 * 2. Toast notifications for timestamps ("[Name] has raised a hand")
 * 3. Video tile icons (front_hand icon text)
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG, cleanParticipantName, isValidParticipantName } from './config.js';
import { log } from './utils.js';
import { queueEvent } from './event-emitter.js';
import { findParticipantById, findParticipantIdByName } from './participant-detector.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let handRaiseObserver = null;
let toastObserver = null;
const raisedHands = new Map();  // name -> { id, timestamp }

/**
 * Starts monitoring hand raises
 * @param {Object} state - State object
 */
export function startHandRaiseMonitoring(state) {
  log('Starting hand raise monitoring (ARIA-based)...');
  
  // Initial scan for currently raised hands
  scanRaisedHandsSection(state);
  
  // Set up toast observer for hand raise notifications (provides timestamps)
  setupHandRaiseToastObserver(state);
  
  // Set up observer on People Panel for raised hands section
  setupRaisedHandsObserver(state);
}

/**
 * Stops hand raise monitoring
 */
export function stopHandRaiseMonitoring() {
  if (handRaiseObserver) {
    handRaiseObserver.disconnect();
    handRaiseObserver = null;
  }
  if (toastObserver) {
    toastObserver.disconnect();
    toastObserver = null;
  }
  raisedHands.clear();
  log('Hand raise monitoring stopped');
}

/**
 * Sets up toast observer specifically for hand raise notifications
 * @param {Object} state - State object
 */
function setupHandRaiseToastObserver(state) {
  toastObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const text = node.textContent?.trim() || '';
        
        // Check for hand raise notification: "[Name] has raised a hand"
        if (text.includes(CONFIG.PATTERNS.raisedHand)) {
          const name = text.replace(CONFIG.PATTERNS.raisedHand, '').trim();
          
          if (name && !raisedHands.has(name)) {
            log('Toast: Hand raised by:', name);
            
            const participantId = findParticipantIdByName(state, name);
            const timestamp = now();
            
            raisedHands.set(name, { id: participantId, timestamp });
            
            emitHandRaise(name, participantId, state, timestamp);
          }
        }
      }
    }
  });
  
  toastObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  log('Hand raise toast observer active');
}

/**
 * Sets up observer on the Raised Hands section in People Panel
 * @param {Object} state - State object
 */
function setupRaisedHandsObserver(state) {
  handRaiseObserver = new MutationObserver(() => {
    if (!state.isTracking) return;
    
    // Debounce
    clearTimeout(state._handRaiseScanTimeout);
    state._handRaiseScanTimeout = setTimeout(() => {
      scanRaisedHandsSection(state);
    }, 200);
  });
  
  // Observe the entire side panel for changes
  const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
  if (sidePanel) {
    handRaiseObserver.observe(sidePanel, {
      childList: true,
      subtree: true
    });
    log('Raised hands section observer active');
  } else {
    // Watch for side panel to appear
    const bodyObserver = new MutationObserver(() => {
      const panel = document.querySelector(CONFIG.SELECTORS.sidePanel);
      if (panel) {
        handRaiseObserver.observe(panel, {
          childList: true,
          subtree: true
        });
        bodyObserver.disconnect();
        log('Side panel found, raised hands observer attached');
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }
}

/**
 * Scans the Raised Hands section in People Panel
 * @param {Object} state - State object
 */
function scanRaisedHandsSection(state) {
  // Find the raised hands region
  const raisedHandsRegion = document.querySelector(CONFIG.SELECTORS.raisedHandsRegion);
  
  if (!raisedHandsRegion) {
    // No raised hands section means no hands currently raised
    // Check if any previously raised hands are now lowered
    checkForLoweredHands(state);
    return;
  }
  
  // Get all listitems in the raised hands section
  const handItems = raisedHandsRegion.querySelectorAll('[role="listitem"]');
  const currentlyRaised = new Set();
  
  for (const item of handItems) {
    const name = item.getAttribute('aria-label') || 
                 extractNameFromListitem(item);
    
    if (!name) continue;
    
    currentlyRaised.add(name);
    
    // New hand raise (not already tracked)
    if (!raisedHands.has(name)) {
      const participantId = findParticipantIdByName(state, name);
      const timestamp = now();
      
      raisedHands.set(name, { id: participantId, timestamp });
      
      log('Hand raised (from panel):', name);
      emitHandRaise(name, participantId, state, timestamp);
    }
  }
  
  // Check for hands that were lowered
  for (const [name, data] of raisedHands.entries()) {
    if (!currentlyRaised.has(name)) {
      log('Hand lowered:', name);
      raisedHands.delete(name);
      // Optional: emit hand lowered event if needed
    }
  }
}

/**
 * Checks if previously raised hands are now lowered
 * Called when no raised hands section exists
 * @param {Object} state - State object
 */
function checkForLoweredHands(state) {
  if (raisedHands.size > 0) {
    log('All hands lowered');
    raisedHands.clear();
  }
}

/**
 * Extracts name from a listitem element
 * @param {Element} item - Listitem element
 * @returns {string|null} Name or null
 */
function extractNameFromListitem(item) {
  // First try aria-label which is the cleanest source
  const ariaLabel = item.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.length > 1 && ariaLabel.length < 100) {
    const name = cleanParticipantName(ariaLabel);
    if (isValidParticipantName(name)) {
      return name;
    }
  }
  
  // Fallback: Look for first generic text that's a name
  const generics = item.querySelectorAll('[role="generic"]');
  for (const g of generics) {
    // Skip if this generic contains buttons (it's a container)
    if (g.querySelector('button')) continue;
    
    const text = cleanParticipantName(g.textContent?.trim());
    if (isValidParticipantName(text)) {
      return text;
    }
  }
  return null;
}

/**
 * Emits a hand raise event
 * @param {string} name - Participant name
 * @param {string|null} participantId - Participant ID
 * @param {Object} state - State object
 * @param {string} timestamp - ISO timestamp
 */
function emitHandRaise(name, participantId, state, timestamp) {
  queueEvent(MESSAGE_TYPES.HAND_RAISE, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    participantId: participantId || name,
    participantName: name,
    timestamp: timestamp
  });
}

/**
 * Gets list of currently raised hands
 * @returns {Map} Map of name -> { id, timestamp }
 */
export function getRaisedHands() {
  return new Map(raisedHands);
}

/**
 * Checks if a specific participant has hand raised
 * @param {string} name - Participant name
 * @returns {boolean} True if hand is raised
 */
export function isHandRaised(name) {
  return raisedHands.has(name);
}

/**
 * Legacy function for compatibility - now triggers a scan
 * @param {Object} state - State object
 */
export function scanRaisedHands(state) {
  scanRaisedHandsSection(state);
}
