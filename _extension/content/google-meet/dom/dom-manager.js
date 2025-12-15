/**
 * DOM Manager for Google Meet
 * 
 * Centralizes all DOM queries with intelligent caching to minimize
 * redundant DOM traversals and improve performance.
 * 
 * Features:
 * - Cached element references with smart invalidation
 * - Supports both old and new Google Meet UI versions
 * - Automatic cache clearing on DOM mutations
 * - Single source of truth for all DOM queries
 */

import { CONFIG } from '../core/config.js';

// Cache for DOM elements with timestamps
const cache = {
  peopleButton: { element: null, timestamp: 0 },
  joinButton: { element: null, timestamp: 0 },
  sidePanel: { element: null, timestamp: 0 },
  participantsList: { element: null, timestamp: 0 }
};

// Cache TTL in milliseconds (invalidate after 5 seconds)
const CACHE_TTL = 5000;

// Observer to detect DOM changes and invalidate cache
let mutationObserver = null;
let lastMutationTime = 0;

/**
 * Initialize DOM manager and set up cache invalidation
 */
export function initDOMManager() {
  // Set up mutation observer to invalidate cache on DOM changes
  mutationObserver = new MutationObserver(() => {
    lastMutationTime = Date.now();
    // Invalidate all cached elements after a mutation
    // We use a short debounce to avoid clearing too frequently
    setTimeout(() => {
      if (Date.now() - lastMutationTime > 100) {
        invalidateCache();
      }
    }, 100);
  });
  
  // Observe only the main meeting container for performance
  const bodyObserverConfig = {
    childList: true,
    subtree: true,
    // Only watch for structural changes, not attributes
    attributes: false
  };
  
  mutationObserver.observe(document.body, bodyObserverConfig);
  console.log('[DOMManager] Initialized with cache invalidation');
}

/**
 * Stop DOM manager and cleanup observers
 */
export function stopDOMManager() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  clearCache();
  console.log('[DOMManager] Stopped');
}

/**
 * Invalidate all cached elements
 */
function invalidateCache() {
  cache.peopleButton.timestamp = 0;
  cache.joinButton.timestamp = 0;
  cache.sidePanel.timestamp = 0;
  cache.participantsList.timestamp = 0;
}

/**
 * Clear all cached elements
 */
function clearCache() {
  cache.peopleButton = { element: null, timestamp: 0 };
  cache.joinButton = { element: null, timestamp: 0 };
  cache.sidePanel = { element: null, timestamp: 0 };
  cache.participantsList = { element: null, timestamp: 0 };
}

/**
 * Force refresh a specific cache entry
 * @param {string} key - Cache key to refresh
 */
export function refreshCache(key) {
  if (cache[key]) {
    cache[key].timestamp = 0;
  }
}

/**
 * Check if cached element is still valid
 * @param {Object} cacheEntry - Cache entry to check
 * @returns {boolean} True if valid
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry.element) return false;
  if (Date.now() - cacheEntry.timestamp > CACHE_TTL) return false;
  // Verify element is still in DOM
  if (!document.body.contains(cacheEntry.element)) return false;
  return true;
}

/**
 * Finds the People button in Google Meet
 * Supports both old and new UI with caching
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} The People button element or null
 */
export function findPeopleButton(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.peopleButton)) {
    return cache.peopleButton.element;
  }
  
  let button = null;
  
  // NEW UI: Try finding by the specific ID and its parent button
  const newUiLabel = document.querySelector('#DPUxh-nav9Xe[aria-label="People"]');
  if (newUiLabel) {
    const newUiButton = newUiLabel.closest('[role="button"][aria-labelledby="DPUxh-nav9Xe"]');
    if (newUiButton) {
      button = newUiButton;
    }
  }
  
  // OLD UI: Try direct button with aria-label containing "People"
  if (!button) {
    button = document.querySelector('button[aria-label*="People"]');
  }
  
  // Fallback: case-insensitive search
  if (!button) {
    button = document.querySelector('button[aria-label*="people" i]');
  }
  
  // Fallback: Search by text content
  if (!button) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (text.includes('people') || ariaLabel.includes('people')) {
        button = btn;
        break;
      }
    }
  }
  
  // Fallback: div with role="button" and aria-labelledby
  if (!button) {
    const divButtons = document.querySelectorAll('div[role="button"][aria-labelledby]');
    for (const divBtn of divButtons) {
      const labelId = divBtn.getAttribute('aria-labelledby');
      if (labelId) {
        const label = document.getElementById(labelId);
        if (label && label.getAttribute('aria-label')?.toLowerCase().includes('people')) {
          button = divBtn;
          break;
        }
      }
    }
  }
  
  // Fallback: Try tab button
  if (!button) {
    const peopleTab = document.querySelector('[role="tab"][aria-label*="People" i]');
    if (peopleTab && !peopleTab.getAttribute('aria-selected')?.includes('true')) {
      button = peopleTab;
    }
  }
  
  // Update cache
  cache.peopleButton = {
    element: button,
    timestamp: button ? Date.now() : 0
  };
  
  return button;
}

/**
 * Finds the Join button in Google Meet waiting room
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} The Join button element or null
 */
export function findJoinButton(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.joinButton)) {
    return cache.joinButton.element;
  }
  
  const button = 
    document.querySelector('button[jsname="Qx7Oae"]') || 
    document.querySelector('button[aria-label*="Join"]') ||
    document.querySelector('button[aria-label*="join"]');
  
  // Update cache
  cache.joinButton = {
    element: button,
    timestamp: button ? Date.now() : 0
  };
  
  return button;
}

/**
 * Finds the Close button in the People Panel (new UI)
 * This button is inside the panel and used to close it in new UI
 * @returns {Element|null} The Close button element or null
 */
export function findCloseButton() {
  // Find the side panel first
  const sidePanel = findSidePanel();
  if (!sidePanel) return null;
  
  // Look for Close button inside the panel
  // New UI: button with aria-label="Close" and close icon
  const closeButtons = sidePanel.querySelectorAll('button[aria-label="Close"], button[aria-label="close" i]');
  
  for (const btn of closeButtons) {
    // Verify it has a close icon to ensure it's the right button
    const closeIcon = btn.querySelector('i[aria-hidden="true"]');
    if (closeIcon && closeIcon.textContent.includes('close')) {
      return btn;
    }
  }
  
  // Fallback: any button with close icon in side panel
  const buttons = sidePanel.querySelectorAll('button');
  for (const btn of buttons) {
    const icon = btn.querySelector('i[aria-hidden="true"]');
    if (icon && icon.textContent.toLowerCase().includes('close')) {
      return btn;
    }
  }
  
  return null;
}

/**
 * Finds the side panel element
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} Side panel element or null
 */
export function findSidePanel(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.sidePanel)) {
    return cache.sidePanel.element;
  }
  
  // Try by ID first (both UIs use this)
  let panel = document.querySelector('#ME4pNd');
  
  // Fallback: aria-label
  if (!panel) {
    const sidePanels = document.querySelectorAll('aside[aria-label="Side panel"]');
    for (const p of sidePanels) {
      if (p.offsetParent !== null) {
        panel = p;
        break;
      }
    }
  }
  
  // Update cache
  cache.sidePanel = {
    element: panel,
    timestamp: panel ? Date.now() : 0
  };
  
  return panel;
}

/**
 * Finds the participants list element
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} Participants list or null
 */
export function findParticipantsList(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.participantsList)) {
    return cache.participantsList.element;
  }
  
  // Try direct selector first
  let list = document.querySelector(CONFIG.SELECTORS.participantsList);
  
  // Fallback: find list inside side panel with listitem children
  if (!list) {
    const sidePanel = findSidePanel();
    if (sidePanel) {
      const lists = sidePanel.querySelectorAll('[role="list"]');
      for (const l of lists) {
        const items = l.querySelectorAll('[role="listitem"]');
        if (items.length > 0) {
          const ariaLabel = l.getAttribute('aria-label') || '';
          // Skip raised hands list
          if (!ariaLabel.toLowerCase().includes('raised hand')) {
            list = l;
            break;
          }
        }
      }
    }
  }
  
  // Update cache
  cache.participantsList = {
    element: list,
    timestamp: list ? Date.now() : 0
  };
  
  return list;
}

/**
 * Check if People Panel is currently open (visually visible)
 * Uses cached button reference if available
 * @returns {boolean} True if panel is visually open
 */
export function isPeoplePanelOpen() {
  const uiVersion = detectUIVersion();
  
  // NEW UI: Check if side panel is VISUALLY visible (offsetParent !== null)
  // Note: participants list persists in DOM even when closed, so we check panel visibility
  if (uiVersion === 'new') {
    const sidePanel = document.querySelector('#ME4pNd, aside[aria-label="Side panel"]');
    if (sidePanel) {
      // Check if panel is visible
      if (sidePanel.offsetParent !== null) {
        // Verify it has participants list to ensure it's the People panel
        const participantsList = sidePanel.querySelector('[role="list"][aria-label="Participants"]');
        return participantsList !== null;
      }
      return false;
    }
  }
  
  // FIRST: Check the People button's aria-expanded attribute (most reliable for old UI)
  const peopleButton = findPeopleButton();
  if (peopleButton) {
    const ariaExpanded = peopleButton.getAttribute('aria-expanded');
    if (ariaExpanded === 'true') {
      return true;
    } else if (ariaExpanded === 'false') {
      return false;
    }
  }
  
  // SECOND: Check for panel by ID with participant list
  const panelById = document.querySelector('#ME4pNd');
  if (panelById && panelById.offsetParent !== null) {
    const participantsList = panelById.querySelector('[role="list"][aria-label="Participants"]');
    if (participantsList) {
      return true;
    }
  }
  
  // THIRD: Find side panel with People content
  const sidePanels = document.querySelectorAll('aside[aria-label="Side panel"]');
  
  if (sidePanels.length === 0) {
    return false;
  }
  
  // Check each side panel
  for (const panel of sidePanels) {
    if (panel.offsetParent === null) continue;
    
    const headings = panel.querySelectorAll('h2, h3, [role="heading"]');
    const hasPeopleHeading = Array.from(headings).some(h => 
      h.textContent?.toLowerCase().includes('people')
    );
    
    const lists = panel.querySelectorAll('[role="list"]');
    const hasParticipantsList = Array.from(lists).some(list => {
      const ariaLabel = list.getAttribute('aria-label') || '';
      return ariaLabel.toLowerCase().includes('participant');
    });
    
    if (hasPeopleHeading || hasParticipantsList) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if participant data is accessible (for new UI)
 * In new UI, data remains in DOM even when panel is visually closed
 * @returns {boolean} True if participant data can be read
 */
export function isParticipantDataAccessible() {
  const participantsList = document.querySelector('[role="list"][aria-label="Participants"]');
  if (participantsList) {
    const items = participantsList.querySelectorAll('[role="listitem"]');
    return items.length > 0;
  }
  return false;
}

/**
 * Detect which UI version is being used
 * @returns {string} 'new' or 'old'
 */
export function detectUIVersion() {
  const newUiLabel = document.querySelector('#DPUxh-nav9Xe[aria-label="People"]');
  return newUiLabel ? 'new' : 'old';
}
