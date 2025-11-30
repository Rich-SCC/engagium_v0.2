/**
 * Google Meet Content Script - Utility Functions
 * Shared utility functions for the content script modules
 */

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
 * Creates a simple hash from a string (for generating stable IDs)
 * @param {string} str - String to hash
 * @returns {string} Base36 hash string
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generates a stable participant ID from a DOM element
 * @param {Element} element - DOM element to generate ID from
 * @returns {string} Generated participant ID
 */
export function generateParticipantId(element) {
  const text = element.textContent || '';
  return `gmeet-${hashString(text)}`;
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
 * @param {Function} [onError] - Optional error callback
 */
export function sendMessage(type, data, onError) {
  chrome.runtime.sendMessage({ type, ...data }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[GoogleMeet] Error sending message:', chrome.runtime.lastError);
      if (onError) onError(chrome.runtime.lastError);
      return;
    }
    
    if (response && !response.success) {
      console.error('[GoogleMeet] Background error:', response.error);
      if (onError) onError(response.error);
    }
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
