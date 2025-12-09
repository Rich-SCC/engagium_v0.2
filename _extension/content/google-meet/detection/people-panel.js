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

import { EVENT_TYPES, SELECTORS } from '../core/config.js';
import { queueEvent, sendImmediate } from '../core/event-emitter.js';
import { debounce, findPeopleButton } from '../core/utils.js';
import { now } from '../../../utils/date-utils.js';

// Cache for known participants (to detect changes)
let knownParticipants = new Map();
let panelObserver = null;
let isObserving = false;

/**
 * Check if People Panel is currently open
 * @returns {boolean} True if panel is open
 */
export function isPeoplePanelOpen() {
  // FIRST: Check the People button's aria-expanded attribute (most reliable)
  const peopleButton = findPeopleButton();
  if (peopleButton) {
    const ariaExpanded = peopleButton.getAttribute('aria-expanded');
    if (ariaExpanded === 'true') {
      console.log('[PeoplePanel] ✓ Detected as OPEN via button aria-expanded=true');
      return true;
    } else if (ariaExpanded === 'false') {
      console.log('[PeoplePanel] ✗ Detected as CLOSED via button aria-expanded=false');
      return false;
    }
    // If aria-expanded is not set, fall through to DOM checks
  }
  
  // SECOND: Find side panel with aria-label="Side panel" (Google Meet's actual structure)
  const sidePanels = document.querySelectorAll('aside[aria-label="Side panel"]');
  
  console.log('[PeoplePanel] Checking if open - found', sidePanels.length, 'side panels');
  
  if (sidePanels.length === 0) {
    console.log('[PeoplePanel] ✗ No side panels found');
    return false;
  }
  
  // Check each side panel to find the one with People content
  for (const panel of sidePanels) {
    // Check if panel is visible
    if (panel.offsetParent === null) {
      continue; // Skip hidden panels
    }
    
    // Check for "People" heading (h2 level=2)
    const headings = panel.querySelectorAll('h2, h3, [role="heading"]');
    const hasPeopleHeading = Array.from(headings).some(h => 
      h.textContent?.toLowerCase().includes('people')
    );
    
    // Check for Participants list (case-insensitive)
    const lists = panel.querySelectorAll('[role="list"]');
    const hasParticipantsList = Array.from(lists).some(list => {
      const ariaLabel = list.getAttribute('aria-label') || '';
      return ariaLabel.toLowerCase().includes('participant');
    });
    
    // Check for "In the meeting" or "Contributors" text
    const textElements = panel.querySelectorAll('h3, button, div');
    const hasInMeetingContent = Array.from(textElements).some(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('in the meeting') || 
             text.includes('contributors') ||
             text.includes('in call');
    });
    
    // Check for specific list items that look like participants
    const listItems = panel.querySelectorAll('[role="listitem"]');
    const hasListItems = listItems.length > 0;
    
    // Always log what we're checking
    console.log('[PeoplePanel] Panel check:', {
      hasPeopleHeading,
      hasParticipantsList,
      hasInMeetingContent,
      hasListItems,
      listItemCount: listItems.length,
      headingCount: headings.length,
      listsCount: lists.length,
      visible: panel.offsetParent !== null
    });
    
    // If any of these checks pass, the People panel is open
    if (hasPeopleHeading || hasParticipantsList || hasInMeetingContent || hasListItems) {
      console.log('[PeoplePanel] ✓ Detected as OPEN');
      return true;
    }
  }
  
  console.log('[PeoplePanel] ✗ Not detected as open');
  return false;
}

/**
 * Try to open the People Panel
 * @returns {Promise<boolean>} True if panel was opened successfully
 */
export async function openPeoplePanel() {
  // Check if already open BEFORE attempting to click
  if (isPeoplePanelOpen()) {
    console.log('[PeoplePanel] Already open, no action needed');
    return true;
  }
  
  // Try to find and click the People button
  const peopleButton = findPeopleButton();
  
  if (!peopleButton) {
    console.warn('[PeoplePanel] Could not find People button');
    return false;
  }
  
  console.log('[PeoplePanel] Opening People panel...');
  peopleButton.click();
  
  // Wait for panel to open (with animation delay)
  await new Promise(resolve => setTimeout(resolve, 300));
  return await waitForPanelOpen(5000);
}

/**
 * Close the People Panel if it's currently open
 * @returns {Promise<boolean>} True if panel was closed successfully
 */
export async function closePeoplePanel() {
  // Check if panel is open
  if (!isPeoplePanelOpen()) {
    console.log('[PeoplePanel] Already closed, no action needed');
    return true;
  }
  
  // Try to find and click the People button to close it
  const peopleButton = findPeopleButton();
  
  if (!peopleButton) {
    console.warn('[PeoplePanel] Could not find People button to close');
    return false;
  }
  
  console.log('[PeoplePanel] Closing People panel...');
  peopleButton.click();
  
  // Wait for panel to close (with animation delay)
  await new Promise(resolve => setTimeout(resolve, 300));
  return await waitForPanelClose(2000);
}

/**
 * Wait for the People Panel to open
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} True if panel opened
 */
function waitForPanelOpen(timeout = 5000) {
  return new Promise((resolve) => {
    console.log('[PeoplePanel] Waiting for panel to appear...');
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (isPeoplePanelOpen()) {
        console.log(`[PeoplePanel] Panel detected as open after ${elapsed}ms`);
        clearInterval(checkInterval);
        resolve(true);
      } else if (elapsed > timeout) {
        console.warn(`[PeoplePanel] Timeout waiting for panel after ${elapsed}ms`);
        
        // DOM SNAPSHOT for debugging
        console.group('[PeoplePanel] DOM Snapshot');
        console.log('=== Full body innerHTML (first 5000 chars) ===');
        console.log(document.body.innerHTML.substring(0, 5000));
        console.log('\n=== All elements with role="complementary" ===');
        const complementary = document.querySelectorAll('[role="complementary"]');
        console.log('Count:', complementary.length);
        complementary.forEach((el, i) => {
          console.log(`Panel ${i}:`, {
            visible: el.offsetParent !== null,
            innerHTML: el.innerHTML.substring(0, 500),
            ariaLabel: el.getAttribute('aria-label'),
            classes: el.className
          });
        });
        console.log('\n=== All side panels (alternative selectors) ===');
        const sidePanels = document.querySelectorAll('aside, [role="dialog"], [role="region"]');
        console.log('Count:', sidePanels.length);
        sidePanels.forEach((el, i) => {
          if (el.textContent?.toLowerCase().includes('people') || 
              el.textContent?.toLowerCase().includes('participant')) {
            console.log(`Potential panel ${i}:`, {
              tagName: el.tagName,
              role: el.getAttribute('role'),
              ariaLabel: el.getAttribute('aria-label'),
              visible: el.offsetParent !== null,
              innerHTML: el.innerHTML.substring(0, 500)
            });
          }
        });
        console.log('\n=== People button state ===');
        const peopleButton = findPeopleButton();
        if (peopleButton) {
          console.log({
            text: peopleButton.textContent,
            ariaLabel: peopleButton.getAttribute('aria-label'),
            ariaPressed: peopleButton.getAttribute('aria-pressed'),
            ariaExpanded: peopleButton.getAttribute('aria-expanded'),
            disabled: peopleButton.disabled
          });
        } else {
          console.log('People button not found');
        }
        console.groupEnd();
        
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Wait for the People Panel to close
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} True if panel closed
 */
function waitForPanelClose(timeout = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (!isPeoplePanelOpen()) {
        console.log(`[PeoplePanel] Panel detected as closed after ${Date.now() - startTime}ms`);
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
    const sidePanel = document.querySelector('aside[aria-label="Side panel"]');
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
          timestamp: now(),
          source: 'people_panel'
        });
      }
      
      for (const participant of changes.left) {
        sendImmediate(EVENT_TYPES.PARTICIPANT_LEFT, {
          name: participant.name,
          timestamp: now(),
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
            timestamp: now()
          });
        }
      }
      updateParticipantSnapshot();
    }
  }, 500)); // Increased debounce from 250ms to 500ms
  
  // Try to observe just the side panel instead of entire body
  const sidePanel = document.querySelector('aside[aria-label="Side panel"]');
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
