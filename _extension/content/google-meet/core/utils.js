/**
 * Google Meet Content Script - Utility Functions
 * Shared utility functions for the content script modules
 */

import { hashString as hashStr } from '../../../utils/string-utils.js';

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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
 * Simple sleep/delay helper using Promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a stable participant ID from a DOM element
 * @param {Element} element - DOM element to generate ID from
 * @returns {string} Generated participant ID
 */
export function generateParticipantId(element) {
  const text = element.textContent || '';
  return `gmeet-${hashStr(text)}`;
}

/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector to wait for
 * @param {Function} callback - Callback when element is found
 * @param {number} [timeout=10000] - Timeout in milliseconds
 */
export function waitForElement(selector, callback, timeout = 10000) {
  const startTime = Date.now();
  
  const check = () => {
    const element = document.querySelector(selector);
    
    if (element) {
      callback(element);
    } else if (Date.now() - startTime < timeout) {
      setTimeout(check, 100);
    } else {
      console.warn('[GoogleMeet] Timeout waiting for element:', selector);
    }
  };
  
  check();
}

/**
 * Safely sends a message to the background script
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @returns {Promise} Promise that resolves with the response
 */
export function sendMessage(type, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[GoogleMeet] Error sending message:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      
      if (response && !response.success) {
        console.error('[GoogleMeet] Background error:', response.error);
        reject(new Error(response.error));
        return;
      }
      
      resolve(response);
    });
  });
}

/**
 * Logs a message with the GoogleMeet prefix
 * @param  {...any} args - Arguments to log
 */
export function log(...args) {
  console.log('[GoogleMeet]', ...args);
}

/**
 * Logs a warning with the GoogleMeet prefix
 * @param  {...any} args - Arguments to log
 */
export function warn(...args) {
  console.warn('[GoogleMeet]', ...args);
}

/**
 * Logs an error with the GoogleMeet prefix
 * @param  {...any} args - Arguments to log
 */
export function error(...args) {
  console.error('[GoogleMeet]', ...args);
}

/**
 * Checks if a participant name is invalid (UI element, not a person)
 * Centralized validation logic used across multiple detectors
 * @param {string} name - Participant name to check
 * @param {Object} CONFIG - Config object with INVALID_NAMES
 * @returns {boolean} True if invalid
 */
export function isInvalidParticipant(name, CONFIG) {
  if (!name || typeof name !== 'string') return true;
  
  const lowerName = name.toLowerCase().trim();
  
  // Check against invalid names list
  if (CONFIG && CONFIG.INVALID_NAMES && CONFIG.INVALID_NAMES.includes(lowerName)) {
    return true;
  }
  
  // Too short
  if (name.length < 2) return true;
  
  // Starts with underscore or is all special chars
  if (name.startsWith('_') || /^[^a-zA-Z0-9]+$/.test(name)) return true;
  
  return false;
}

/**
 * Finds the People button in Google Meet
 * Uses multiple selectors and fallback methods for reliability
 * @returns {Element|null} The People button element or null if not found
 */
export function findPeopleButton() {
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
 * Finds the Join button in Google Meet waiting room
 * Uses multiple selectors as fallback
 * @returns {Element|null} The Join button element or null if not found
 */
export function findJoinButton() {
  return document.querySelector('button[jsname="Qx7Oae"]') || // Primary join button
         document.querySelector('button[aria-label*="Join"]') ||
         document.querySelector('button[aria-label*="join"]');
}
