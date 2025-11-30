/**
 * People Panel Controller for Google Meet
 * 
 * PRIMARY SOURCE for participant detection:
 * - Complete list of all participants (not affected by video grid layout)
 * - Mic muted status
 * - Raised hands section
 * - Reliable for all view modes
 * 
 * Based on GOOGLE_MEET_DOM_REFERENCE.md (November 2025)
 * Uses ARIA-based accessibility selectors
 */

import { EVENT_TYPES, SELECTORS } from './config.js';
import { queueEvent, sendImmediate } from './event-emitter.js';

// Selectors based on current Google Meet DOM structure
const PANEL_SELECTORS = {
  // Side panel container
  sidePanel: '[role="complementary"][aria-label="Side panel"]',
  
  // People panel heading
  peopleHeading: 'h2:has-text("People")',
  
  // Participants list
  participantsList: '[role="list"][aria-label="Participants"]',
  
  // Individual participant
  participantItem: '[role="listitem"]',
  
  // Raised hands section
  raisedHandsRegion: '[role="region"][aria-label="Raised hands"]',
  raisedHandsList: '[role="list"][aria-label*="raised hand"]',
  
  // Button to open People panel
  peopleButton: 'button[aria-label*="people"], button[aria-label*="People"]',
  
  // Panel tabs
  panelTabs: '[role="tablist"]',
  peopleTab: '[role="tab"][aria-label*="People"]'
};

// Cache for known participants (to detect changes)
let knownParticipants = new Map();
let panelObserver = null;
let isObserving = false;

/**
 * Check if People Panel is currently open
 * @returns {boolean} True if panel is open
 */
export function isPeoplePanelOpen() {
  const sidePanel = document.querySelector(PANEL_SELECTORS.sidePanel);
  if (!sidePanel) return false;
  
  // Check if the panel contains the People heading or Participants list
  const hasPeopleContent = sidePanel.querySelector(PANEL_SELECTORS.participantsList) ||
    Array.from(sidePanel.querySelectorAll('h2')).some(h => 
      h.textContent?.toLowerCase().includes('people')
    );
  
  return !!hasPeopleContent;
}

/**
 * Try to open the People Panel
 * @returns {Promise<boolean>} True if panel was opened successfully
 */
export async function openPeoplePanel() {
  // If already open, return true
  if (isPeoplePanelOpen()) {
    console.log('[PeoplePanel] Already open');
    return true;
  }
  
  // Try to find and click the People button
  const peopleButton = findPeopleButton();
  
  if (peopleButton) {
    console.log('[PeoplePanel] Clicking People button');
    peopleButton.click();
    
    // Wait for panel to open
    return await waitForPanelOpen(3000);
  }
  
  console.warn('[PeoplePanel] Could not find People button');
  return false;
}

/**
 * Find the People button in the control bar or panel tabs
 * @returns {Element|null} The People button element
 */
function findPeopleButton() {
  // Try aria-label based selector
  let button = document.querySelector('button[aria-label*="people" i]');
  if (button) return button;
  
  // Try finding by visible text
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const text = btn.textContent?.toLowerCase() || '';
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    
    if (text.includes('people') || ariaLabel.includes('people')) {
      return btn;
    }
  }
  
  // Try tab button if side panel is open with different tab
  const peopleTab = document.querySelector('[role="tab"][aria-label*="People" i]');
  if (peopleTab && !peopleTab.getAttribute('aria-selected')?.includes('true')) {
    return peopleTab;
  }
  
  return null;
}

/**
 * Wait for the People Panel to open
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} True if panel opened
 */
function waitForPanelOpen(timeout = 3000) {
  return new Promise((resolve) => {
    if (isPeoplePanelOpen()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isPeoplePanelOpen()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Get all current participant names from the People Panel
 * @returns {Array<{name: string, isMuted: boolean, isHost: boolean, isSelf: boolean, isPresenting: boolean}>}
 */
export function getCurrentParticipants() {
  const participants = [];
  
  // Find the participants list
  const participantsList = document.querySelector(PANEL_SELECTORS.participantsList);
  
  if (!participantsList) {
    // Try alternative: find list by looking in side panel
    const sidePanel = document.querySelector(PANEL_SELECTORS.sidePanel);
    if (!sidePanel) {
      console.warn('[PeoplePanel] No side panel found');
      return participants;
    }
    
    // Look for list items in the side panel
    const listItems = sidePanel.querySelectorAll(PANEL_SELECTORS.participantItem);
    return parseParticipantItems(listItems);
  }
  
  const listItems = participantsList.querySelectorAll(PANEL_SELECTORS.participantItem);
  return parseParticipantItems(listItems);
}

/**
 * Parse participant list items into structured data
 * @param {NodeList} listItems - The list item elements
 * @returns {Array<Object>} Parsed participant data
 */
function parseParticipantItems(listItems) {
  const participants = [];
  
  for (const item of listItems) {
    const participant = parseParticipantItem(item);
    if (participant && !participant.isSelf && !participant.isPresenting) {
      participants.push(participant);
    }
  }
  
  return participants;
}

/**
 * Parse a single participant list item
 * @param {Element} item - The listitem element
 * @returns {Object|null} Participant data or null if invalid
 */
function parseParticipantItem(item) {
  // Get name from aria-label or first generic text
  let name = item.getAttribute('aria-label');
  
  if (!name) {
    // Try to find name in nested generics
    const generics = item.querySelectorAll('[role="generic"]');
    for (const g of generics) {
      const text = g.textContent?.trim();
      if (text && !text.includes('(You)') && !text.includes('Meeting host') && 
          !text.includes('presentation') && text.length > 0) {
        name = text;
        break;
      }
    }
  }
  
  if (!name) return null;
  
  const textContent = item.textContent || '';
  
  // Check if this is self
  const isSelf = textContent.includes('(You)');
  
  // Check if host
  const isHost = textContent.includes('Meeting host');
  
  // Check if presenting
  const isPresenting = textContent.includes('presentation');
  
  // Check mute status
  // Muted: has disabled button with "can't unmute"
  // Unmuted: has button with "[Name]'s microphone"
  const disabledMuteButton = item.querySelector('button[disabled]');
  const isMutedByDisabledButton = disabledMuteButton?.textContent?.toLowerCase().includes("can't unmute");
  
  const activeMuteButton = Array.from(item.querySelectorAll('button:not([disabled])')).find(
    btn => btn.textContent?.includes("'s microphone")
  );
  
  // If they have an active mute button, they are unmuted
  // If they have a disabled "can't unmute" button, they are muted
  // Default to muted if we can't determine
  let isMuted = true;
  if (activeMuteButton) {
    isMuted = false;
  } else if (isMutedByDisabledButton) {
    isMuted = true;
  }
  
  return {
    name: name.trim(),
    isMuted,
    isHost,
    isSelf,
    isPresenting
  };
}

/**
 * Get only participant names (excluding self and presentations)
 * @returns {string[]} Array of participant names
 */
export function getCurrentParticipantNames() {
  return getCurrentParticipants().map(p => p.name);
}

/**
 * Get participants with raised hands
 * @returns {Array<{name: string, position: number}>}
 */
export function getRaisedHands() {
  const raisedHands = [];
  
  // Find the raised hands region
  const raisedHandsRegion = document.querySelector(PANEL_SELECTORS.raisedHandsRegion);
  
  if (!raisedHandsRegion) {
    // No raised hands section = no hands raised
    return raisedHands;
  }
  
  // Find list items in the raised hands region
  const listItems = raisedHandsRegion.querySelectorAll(PANEL_SELECTORS.participantItem);
  
  let position = 1;
  for (const item of listItems) {
    const name = item.getAttribute('aria-label') || 
      item.querySelector('[role="generic"]')?.textContent?.trim();
    
    if (name) {
      raisedHands.push({
        name: name.replace(/front_hand/gi, '').trim(),
        position
      });
      position++;
    }
  }
  
  return raisedHands;
}

/**
 * Get the total participant count from the People button badge
 * @returns {number|null} Participant count or null if not found
 */
export function getParticipantCount() {
  // Look for button with participant count
  const buttons = document.querySelectorAll('button');
  
  for (const btn of buttons) {
    const label = btn.getAttribute('aria-label') || '';
    
    // Match patterns like "People - 5 joined" or "Show everyone (5)"
    const countMatch = label.match(/(\d+)\s*(joined|participants?|people)?/i) ||
      btn.textContent?.match(/(\d+)/);
    
    if (label.toLowerCase().includes('people') && countMatch) {
      return parseInt(countMatch[1], 10);
    }
  }
  
  // Fallback: count from panel
  const participants = getCurrentParticipants();
  return participants.length + 1; // +1 for self
}

/**
 * Start observing the People Panel for changes
 * Emits events when participants join, leave, or change status
 */
export function startObserving() {
  if (isObserving) {
    return; // Silent - already observing
  }
  
  // Initial snapshot
  updateParticipantSnapshot();
  
  // Set up mutation observer with longer debounce to reduce calls
  panelObserver = new MutationObserver(debounce(() => {
    const changes = detectChanges();
    
    // Only process if there are meaningful changes
    if (changes.joined.length > 0 || changes.left.length > 0) {
      // Emit events for join/leave only (status changes are less critical)
      for (const participant of changes.joined) {
        sendImmediate(EVENT_TYPES.PARTICIPANT_JOINED, {
          name: participant.name,
          timestamp: new Date().toISOString(),
          source: 'people_panel'
        });
      }
      
      for (const participant of changes.left) {
        sendImmediate(EVENT_TYPES.PARTICIPANT_LEFT, {
          name: participant.name,
          timestamp: new Date().toISOString(),
          source: 'people_panel'
        });
      }
      
      // Update snapshot after processing
      updateParticipantSnapshot();
    }
    
    // Handle mic status changes separately with additional debouncing
    if (changes.statusChanged.length > 0) {
      for (const change of changes.statusChanged) {
        if (change.muteChanged) {
          queueEvent(EVENT_TYPES.MIC_STATUS_CHANGED, {
            name: change.participant.name,
            isMuted: change.participant.isMuted,
            timestamp: new Date().toISOString()
          });
        }
      }
      updateParticipantSnapshot();
    }
  }, 500)); // Increased debounce from 250ms to 500ms
  
  // Try to observe just the side panel instead of entire body
  const sidePanel = document.querySelector(PANEL_SELECTORS.sidePanel);
  if (sidePanel) {
    panelObserver.observe(sidePanel, {
      childList: true,
      subtree: true
      // Removed attributes observer - too noisy
    });
    console.log('[PeoplePanel] Observing side panel');
  } else {
    // Fallback: observe body but only for childList changes
    panelObserver.observe(document.body, {
      childList: true,
      subtree: true
      // No attributes - reduces noise significantly
    });
    console.log('[PeoplePanel] Observing body (side panel not found)');
  }
  
  isObserving = true;
  console.log('[PeoplePanel] Started observing');
}

/**
 * Stop observing the People Panel
 */
export function stopObserving() {
  if (panelObserver) {
    panelObserver.disconnect();
    panelObserver = null;
  }
  
  isObserving = false;
  knownParticipants.clear();
  console.log('[PeoplePanel] Stopped observing');
}

/**
 * Update the snapshot of known participants
 */
function updateParticipantSnapshot() {
  const current = getCurrentParticipants();
  
  knownParticipants.clear();
  for (const p of current) {
    knownParticipants.set(p.name, p);
  }
}

/**
 * Detect changes between current state and known snapshot
 * @returns {{joined: Array, left: Array, statusChanged: Array}}
 */
function detectChanges() {
  const current = getCurrentParticipants();
  const currentNames = new Set(current.map(p => p.name));
  const knownNames = new Set(knownParticipants.keys());
  
  const joined = [];
  const left = [];
  const statusChanged = [];
  
  // Find new participants
  for (const participant of current) {
    if (!knownNames.has(participant.name)) {
      joined.push(participant);
    } else {
      // Check for status changes
      const known = knownParticipants.get(participant.name);
      if (known.isMuted !== participant.isMuted) {
        statusChanged.push({
          participant,
          muteChanged: true,
          wasMuted: known.isMuted
        });
      }
    }
  }
  
  // Find participants who left
  for (const [name, participant] of knownParticipants) {
    if (!currentNames.has(name)) {
      left.push(participant);
    }
  }
  
  return { joined, left, statusChanged };
}

/**
 * Simple debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Force a refresh of participant data
 * @returns {Array} Current participants
 */
export function refreshParticipants() {
  updateParticipantSnapshot();
  return Array.from(knownParticipants.values());
}

// Export for testing
export const _internal = {
  parseParticipantItem,
  parseParticipantItems,
  findPeopleButton,
  detectChanges
};
