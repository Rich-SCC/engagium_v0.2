/**
 * Google Meet Content Script - Participant Detector
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. PRIMARY: People Panel (list[aria-label="Participants"])
 *    - Contains ALL participants regardless of video grid layout
 *    - Shows mic muted status via disabled "unmute" button
 * 
 * 2. SECONDARY: Toast notifications for join/leave timestamps
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG, cleanParticipantName, isValidParticipantName } from './config.js';
import { generateParticipantId, log, warn } from './utils.js';
import { sendImmediate } from './event-emitter.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let peoplePanelObserver = null;
let toastObserver = null;
let panelWatcher = null;

/**
 * Starts monitoring participants using People Panel + Toast notifications
 * @param {Object} state - State object
 */
export function startParticipantMonitoring(state) {
  log('Starting participant monitoring (ARIA-based)...');
  
  // Initial scan of existing participants
  scanCurrentParticipants(state);
  
  // Set up toast observer for join/leave events (provides timestamps)
  setupToastObserver(state);
  
  // Set up People Panel observer (primary source)
  if (!setupPeoplePanelObserver(state)) {
    // Panel not found yet, watch for it
    setupPanelWatcher(state);
  }
}

/**
 * Stops monitoring participants
 * @param {Object} state - State object
 */
export function stopParticipantMonitoring(state) {
  if (peoplePanelObserver) {
    peoplePanelObserver.disconnect();
    peoplePanelObserver = null;
  }
  if (toastObserver) {
    toastObserver.disconnect();
    toastObserver = null;
  }
  if (panelWatcher) {
    panelWatcher.disconnect();
    panelWatcher = null;
  }
  log('Participant monitoring stopped');
}

/**
 * Sets up toast observer for join/leave notifications
 * Toasts provide exact timestamps for events
 * @param {Object} state - State object
 */
function setupToastObserver(state) {
  toastObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const text = node.textContent?.trim() || '';
        const textLower = text.toLowerCase();
        
        // Check for join notification
        if (textLower.includes(CONFIG.PATTERNS.joined)) {
          const name = extractNameFromToast(text, CONFIG.PATTERNS.joined);
          if (name && !isInvalidParticipant(name)) {
            log('Toast: Participant joined:', name);
            // Delay to let DOM update, then rescan
            setTimeout(() => rescanAndDetectNew(state), 300);
          }
        }
        
        // Check for leave notification
        if (textLower.includes(CONFIG.PATTERNS.left)) {
          const name = extractNameFromToast(text, CONFIG.PATTERNS.left);
          if (name && !isInvalidParticipant(name)) {
            log('Toast: Participant left:', name);
            setTimeout(() => detectLeftParticipants(state), 300);
          }
        }
      }
    }
  });
  
  toastObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  log('Toast observer active for join/leave notifications');
}

/**
 * Extracts participant name from toast text
 * @param {string} text - Toast text content
 * @param {string} action - Action keyword (joined/left)
 * @returns {string|null} Participant name
 */
function extractNameFromToast(text, action) {
  // Toast format: "[Name] joined" or "[Name] left"
  const parts = text.split(new RegExp(`\\s*${action}`, 'i'));
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return null;
}

/**
 * Sets up observer on People Panel for participant changes
 * @param {Object} state - State object
 * @returns {boolean} True if observer was set up successfully
 */
function setupPeoplePanelObserver(state) {
  // Find the participants list in the People Panel
  const participantsList = findParticipantsList();
  
  if (!participantsList) {
    warn('Participants list not found - People Panel may be closed');
    return false;
  }
  
  peoplePanelObserver = new MutationObserver(() => {
    if (!state.isTracking) return;
    
    // Debounce the rescan
    clearTimeout(state._panelRescanTimeout);
    state._panelRescanTimeout = setTimeout(() => {
      rescanAndDetectNew(state);
      detectLeftParticipants(state);
    }, CONFIG.DEBOUNCE.PANEL_SCAN);
  });
  
  // Observe the side panel for changes
  const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
  if (sidePanel) {
    peoplePanelObserver.observe(sidePanel, {
      childList: true,
      subtree: true
    });
    log('People Panel observer active');
    return true;
  }
  
  return false;
}

/**
 * Watches for People Panel to appear and sets up observer
 * @param {Object} state - State object
 */
function setupPanelWatcher(state) {
  panelWatcher = new MutationObserver(() => {
    if (setupPeoplePanelObserver(state)) {
      panelWatcher.disconnect();
      panelWatcher = null;
      log('People Panel found, observer attached');
      // Rescan after panel appears
      scanCurrentParticipants(state);
    }
  });
  
  panelWatcher.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Finds the participants list element
 * @returns {Element|null} Participants list or null
 */
function findParticipantsList() {
  // Try direct selector first
  let list = document.querySelector(CONFIG.SELECTORS.participantsList);
  if (list) return list;
  
  // Fallback: find list inside side panel with listitem children
  const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
  if (sidePanel) {
    const lists = sidePanel.querySelectorAll('[role="list"]');
    for (const l of lists) {
      // Check if this list has listitems that look like participants
      const items = l.querySelectorAll('[role="listitem"]');
      if (items.length > 0) {
        const ariaLabel = l.getAttribute('aria-label') || '';
        // Skip if it's explicitly the raised hands list
        if (!ariaLabel.toLowerCase().includes('raised hand')) {
          return l;
        }
      }
    }
  }
  
  return null;
}

/**
 * Scans current participants in the People Panel
 * @param {Object} state - State object
 */
function scanCurrentParticipants(state) {
  const participants = extractAllParticipants();
  
  for (const participant of participants) {
    if (!participant.id || isInvalidParticipant(participant.name)) continue;
    
    // Skip self
    if (participant.isSelf) continue;
    
    // Skip presentations
    if (participant.isPresentation) continue;
    
    if (!state.participants.has(participant.id)) {
      state.participants.set(participant.id, {
        ...participant,
        joinedAt: now(),
        leftAt: null
      });
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          isMuted: participant.isMuted,
          joinedAt: now()
        }
      });
    } else {
      // Update mic status for existing participant
      const existing = state.participants.get(participant.id);
      existing.isMuted = participant.isMuted;
    }
  }
  
  log('Initial scan:', state.participants.size, 'participants');
}

// Export for compatibility
export { scanCurrentParticipants as scanParticipants };

/**
 * Rescans participants and detects new ones
 * @param {Object} state - State object
 */
function rescanAndDetectNew(state) {
  const participants = extractAllParticipants();
  
  for (const participant of participants) {
    if (!participant.id || isInvalidParticipant(participant.name)) continue;
    if (participant.isSelf || participant.isPresentation) continue;
    
    if (!state.participants.has(participant.id)) {
      log('New participant detected:', participant.name);
      
      state.participants.set(participant.id, {
        ...participant,
        joinedAt: now(),
        leftAt: null
      });
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          isMuted: participant.isMuted,
          joinedAt: now()
        }
      });
    } else {
      // Update mic status
      const existing = state.participants.get(participant.id);
      existing.isMuted = participant.isMuted;
    }
  }
}

/**
 * Detects participants who have left
 * @param {Object} state - State object
 */
function detectLeftParticipants(state) {
  const currentNames = new Set();
  const participants = extractAllParticipants();
  
  for (const p of participants) {
    if (!p.isSelf && !p.isPresentation) {
      currentNames.add(p.name);
    }
  }
  
  // Check which tracked participants are no longer present
  for (const [participantId, participant] of state.participants.entries()) {
    if (participant.leftAt) continue; // Already marked as left
    
    if (!currentNames.has(participant.name)) {
      log('Participant left:', participant.name);
      participant.leftAt = now();
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_LEFT, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participantId: participantId,
        leftAt: now()
      });
    }
  }
}

/**
 * Extracts all participants from the People Panel
 * @returns {Object[]} Array of participant objects
 */
function extractAllParticipants() {
  const participants = [];
  const list = findParticipantsList();
  
  if (!list) {
    // Fallback: try to find any listitems in side panel
    const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
    if (!sidePanel) return participants;
    
    const items = sidePanel.querySelectorAll('[role="listitem"]');
    items.forEach(item => {
      const p = extractParticipantFromListitem(item);
      if (p) participants.push(p);
    });
    return participants;
  }
  
  const items = list.querySelectorAll('[role="listitem"]');
  items.forEach(item => {
    const p = extractParticipantFromListitem(item);
    if (p) participants.push(p);
  });
  
  return participants;
}

/**
 * Extracts participant data from a listitem element
 * @param {Element} listitem - Listitem DOM element
 * @returns {Object|null} Participant data or null
 */
function extractParticipantFromListitem(listitem) {
  try {
    // Get name from aria-label of the listitem (cleanest source)
    let name = cleanParticipantName(listitem.getAttribute('aria-label') || '');
    
    // If no aria-label or it was cleaned to empty, try to find text content
    if (!name || !isValidParticipantName(name)) {
      name = '';
      // Look for the first generic element that contains just a name (not buttons)
      const textElements = listitem.querySelectorAll('[role="generic"]');
      for (const el of textElements) {
        // Skip elements that contain buttons (they're containers)
        if (el.querySelector('button')) continue;
        
        const text = cleanParticipantName(el.textContent?.trim());
        if (isValidParticipantName(text) && !isInvalidParticipant(text)) {
          name = text;
          break;
        }
      }
    }
    
    if (!name || name.length < 2) return null;
    
    // Check if this is self
    const isSelf = listitem.textContent?.includes(CONFIG.PATTERNS.selfIndicator) || false;
    
    // Check if this is a presentation entry
    const isPresentation = listitem.textContent?.toLowerCase().includes(
      CONFIG.PATTERNS.presentationIndicator
    ) || false;
    
    // Check if muted (has disabled button with "unmute" text)
    const muteButton = listitem.querySelector('button[disabled]');
    const isMuted = muteButton?.textContent?.toLowerCase().includes(CONFIG.PATTERNS.cantUnmute) || 
                    muteButton?.getAttribute('aria-label')?.toLowerCase().includes(CONFIG.PATTERNS.cantUnmute) ||
                    false;
    
    // Check if host
    const isHost = listitem.textContent?.includes(CONFIG.PATTERNS.hostIndicator) || false;
    
    // Generate stable ID from name
    const id = generateParticipantId({ textContent: name });
    
    return {
      id,
      name,
      email: null, // Not available in new DOM structure
      isSelf,
      isPresentation,
      isMuted,
      isHost
    };
  } catch (err) {
    console.error('[GoogleMeet] Error extracting participant data:', err);
    return null;
  }
}

/**
 * Finds all participant elements in DOM (legacy compatibility + video tiles)
 * @returns {Element[]} Array of participant elements
 */
export function findParticipantElements() {
  const elements = [];
  
  // From People Panel (primary)
  const list = findParticipantsList();
  if (list) {
    elements.push(...list.querySelectorAll('[role="listitem"]'));
  }
  
  return elements;
}

/**
 * Extracts participant data from a DOM element (legacy compatibility)
 * @param {Element} element - Participant DOM element
 * @returns {Object|null} Participant data or null
 */
export function extractParticipantData(element) {
  // Null check
  if (!element) {
    return null;
  }
  
  // If it's a listitem, use the new extraction
  if (element.getAttribute('role') === 'listitem') {
    return extractParticipantFromListitem(element);
  }
  
  // Fallback for video tile elements
  try {
    let name = 'Unknown';
    
    // Try to find name in tooltips or text
    const tooltip = element.querySelector('[role="tooltip"]');
    if (tooltip) {
      name = tooltip.textContent?.trim() || name;
    }
    
    // Try generic elements with text
    if (name === 'Unknown') {
      const generics = element.querySelectorAll('[role="generic"]');
      for (const g of generics) {
        const text = g.textContent?.trim();
        if (text && text.length > 1 && text.length < 100 && !isInvalidParticipant(text)) {
          name = text;
          break;
        }
      }
    }
    
    if (name === 'Unknown' || isInvalidParticipant(name)) return null;
    
    const id = generateParticipantId({ textContent: name });
    return { id, name, email: null };
  } catch (err) {
    console.error('[GoogleMeet] Error extracting participant data:', err);
    return null;
  }
}

/**
 * Checks if a participant name is invalid (UI element, not a person)
 * @param {string} name - Participant name to check
 * @returns {boolean} True if invalid
 */
function isInvalidParticipant(name) {
  if (!name || typeof name !== 'string') return true;
  
  const lowerName = name.toLowerCase().trim();
  
  // Check against invalid names list
  if (CONFIG.INVALID_NAMES.includes(lowerName)) return true;
  
  // Too short
  if (name.length < 2) return true;
  
  // Starts with underscore or is all special chars
  if (name.startsWith('_') || /^[^a-zA-Z0-9]+$/.test(name)) return true;
  
  return false;
}

/**
 * Finds a participant by ID in the state
 * @param {Object} state - State object
 * @param {string} participantId - Participant ID to find
 * @returns {Object|null} Participant data or null
 */
export function findParticipantById(state, participantId) {
  if (state.participants.has(participantId)) {
    return state.participants.get(participantId);
  }
  
  // Try to find by name match
  for (const [id, participant] of state.participants.entries()) {
    if (participant.name === participantId || id === participantId) {
      return participant;
    }
  }
  
  return null;
}

/**
 * Finds a participant ID by name
 * @param {Object} state - State object
 * @param {string} name - Name to search for
 * @returns {string|null} Participant ID or null
 */
export function findParticipantIdByName(state, name) {
  if (!name) return null;
  
  const nameLower = name.toLowerCase();
  
  for (const [id, participant] of state.participants.entries()) {
    if (participant.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(participant.name.toLowerCase())) {
      return id;
    }
  }
  return null;
}

/**
 * Gets current mic status for all participants
 * @param {Object} state - State object
 * @returns {Map} Map of participantId -> isMuted
 */
export function getParticipantMicStatus(state) {
  const micStatus = new Map();
  const participants = extractAllParticipants();
  
  for (const p of participants) {
    if (!p.isSelf && !p.isPresentation) {
      micStatus.set(p.id, p.isMuted);
    }
  }
  
  return micStatus;
}
