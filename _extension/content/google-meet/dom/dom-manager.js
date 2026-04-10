/**
 * DOM Manager for Google Meet
 * 
 * Centralizes all DOM queries with intelligent caching to minimize
 * redundant DOM traversals and improve performance.
 * 
 * Features:
 * - Cached element references with smart invalidation
 * - Normalized UI capability detection
 * - Automatic cache clearing on DOM mutations
 * - Single source of truth for all DOM queries
 */

import { CONFIG } from '../core/config.js';

// Cache for DOM elements with timestamps
const cache = {
  peopleButton: { element: null, timestamp: 0 },
  chatButton: { element: null, timestamp: 0 },
  joinButton: { element: null, timestamp: 0 },
  sidePanel: { element: null, timestamp: 0 },
  participantsList: { element: null, timestamp: 0 },
  chatPanel: { element: null, timestamp: 0 }
};

// Cache TTL in milliseconds (invalidate after 5 seconds)
const CACHE_TTL = 5000;

// Normalized panel behavior modes
export const PANEL_BEHAVIOR = {
  PERSISTENT_DATA: 'persistent-data',
  TOGGLE_DATA: 'toggle-data'
};

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
  cache.chatButton.timestamp = 0;
  cache.joinButton.timestamp = 0;
  cache.sidePanel.timestamp = 0;
  cache.participantsList.timestamp = 0;
  cache.chatPanel.timestamp = 0;
}

/**
 * Clear all cached elements
 */
function clearCache() {
  cache.peopleButton = { element: null, timestamp: 0 };
  cache.chatButton = { element: null, timestamp: 0 };
  cache.joinButton = { element: null, timestamp: 0 };
  cache.sidePanel = { element: null, timestamp: 0 };
  cache.participantsList = { element: null, timestamp: 0 };
  cache.chatPanel = { element: null, timestamp: 0 };
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
 * Build a normalized text label for an element, including aria-labelledby text.
 * @param {Element} element - Element to extract text from
 * @returns {string} Lower-cased normalized text
 */
function getNormalizedLabelText(element) {
  if (!element) return '';

  const parts = [];
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) parts.push(ariaLabel);

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelledText = labelledBy
      .split(/\s+/)
      .map(id => document.getElementById(id)?.textContent || '')
      .join(' ');
    if (labelledText) parts.push(labelledText);
  }

  const textContent = element.textContent;
  if (textContent) parts.push(textContent);

  return parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Check if an element is visible in layout.
 * @param {Element} element - Element to test
 * @returns {boolean} True when visible
 */
function isElementVisible(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.bottom < 0 || rect.right < 0) return false;
  if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false;
  return true;
}

/**
 * Finds the Chat button in Google Meet.
 * Uses selector priority plus semantic scoring to avoid wrong controls.
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} The Chat button element or null
 */
export function findChatButton(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.chatButton)) {
    return cache.chatButton.element;
  }

  let button = null;

  // Preferred selector from captured UI state.
  button = document.querySelector('button[jsname="A5il2e"][aria-controls="ME4pNd"]');

  // Fallback: chat-labelled action button tied to side panel.
  if (!button) {
    button = document.querySelector('button[aria-label*="chat" i][aria-controls="ME4pNd"]');
  }

  // Scored fallback for variant UIs.
  if (!button) {
    const candidates = Array.from(document.querySelectorAll('button,[role="button"]'))
      .filter(isElementVisible)
      .filter(candidate => candidate.getAttribute('role') !== 'switch')
      .map(candidate => {
        const labelText = getNormalizedLabelText(candidate);
        const rect = candidate.getBoundingClientRect();
        let score = 0;

        // Negative scoring to avoid Meeting details button
        if (labelText.includes('detail') || labelText.includes('info')) {
          score -= 10;
        }

        if (candidate.getAttribute('aria-controls') === 'ME4pNd') score += 5;
        if (candidate.getAttribute('data-panel-id') === '2') score += 5;
        if (candidate.getAttribute('jsname') === 'A5il2e') score += 6;
        if (labelText.includes('chat')) score += 4;
        if (labelText.includes('message')) score += 3;
        if (candidate.tagName.toLowerCase() === 'button') score += 1;
        if (rect.top > window.innerHeight * 0.65) score += 1;

        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0 && candidates[0].score >= 5) {
      button = candidates[0].candidate;
    }
  }

  cache.chatButton = {
    element: button,
    timestamp: button ? Date.now() : 0
  };

  return button;
}

/**
 * Finds the People button in Google Meet
 * Uses normalized selector fallbacks with caching
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} The People button element or null
 */
export function findPeopleButton(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.peopleButton)) {
    return cache.peopleButton.element;
  }
  
  let button = null;

  // Preferred selector for newer Meet UI badge control.
  button = document.querySelector('[role="button"][jsname="ocqpFe"][aria-haspopup="dialog"]');

  // Fallback: any labelled-by role button whose label resolves to "People".
  if (!button) {
    const labelledRoleButtons = document.querySelectorAll('[role="button"][aria-labelledby]');
    for (const candidate of labelledRoleButtons) {
      const labelText = getNormalizedLabelText(candidate);
      if (!labelText.includes('people')) continue;
      if (!isElementVisible(candidate)) continue;
      if (candidate.getAttribute('aria-haspopup') === 'dialog') {
        button = candidate;
        break;
      }
      if (!button) {
        button = candidate;
      }
    }
  }

  // Fallback: hidden label pattern (<span id="*-nav9Xe">People</span>) and closest role button.
  if (!button) {
    const labels = document.querySelectorAll('span[id$="-nav9Xe"]');
    for (const label of labels) {
      const labelText = label.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
      if (labelText !== 'people') continue;

      const candidate = label.closest('[role="button"],button');
      if (candidate && isElementVisible(candidate)) {
        button = candidate;
        break;
      }
    }
  }
  
  // Fallback: direct button with aria-label containing "People"
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
      const labelText = getNormalizedLabelText(divBtn);
      if (labelText.includes('people') && isElementVisible(divBtn)) {
        button = divBtn;
        break;
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
 * Finds the Close button in the People Panel
 * Some panel variants expose a dedicated in-panel close control.
 * @returns {Element|null} The Close button element or null
 */
export function findCloseButton() {
  // Find the side panel first
  const sidePanel = findSidePanel();
  if (!sidePanel) return null;
  
  // Look for Close button inside the panel
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
 * Finds the active chat panel container when chat is open.
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Element|null} Chat panel container or null
 */
export function findChatPanel(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.chatPanel)) {
    return cache.chatPanel.element;
  }

  let panel = null;
  const sidePanel = findSidePanel(forceRefresh);

  if (sidePanel && isElementVisible(sidePanel)) {
    const hasMessageTextbox = sidePanel.querySelector(
      '[role="textbox"][aria-label*="message" i], textarea[aria-label*="message" i], input[placeholder*="message" i]'
    ) !== null;

    const headingText = sidePanel.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
    const hasChatHeading = headingText.includes('in-call messages') || headingText.includes('messages');

    if (hasMessageTextbox && hasChatHeading) {
      panel = sidePanel;
    }
  }

  cache.chatPanel = {
    element: panel,
    timestamp: panel ? Date.now() : 0
  };

  return panel;
}

/**
 * Checks whether chat panel is currently open.
 * @returns {boolean} True if chat panel is open
 */
export function isChatPanelOpen() {
  return findChatPanel() !== null;
}

/**
 * Finds message textbox in open chat panel.
 * @returns {Element|null} Chat textbox element or null
 */
export function findChatTextbox() {
  const chatPanel = findChatPanel();
  if (!chatPanel) return null;

  return chatPanel.querySelector('[role="textbox"][aria-label*="message" i], textarea[aria-label*="message" i]');
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
  const panelBehavior = detectPeoplePanelBehavior();
  
  // Persistent-data panels keep participant data in DOM even when visually closed.
  // For this mode, visibility must be checked explicitly.
  if (panelBehavior === PANEL_BEHAVIOR.PERSISTENT_DATA) {
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
  
  // First check the People button's aria-expanded attribute.
  const peopleButton = findPeopleButton();
  if (peopleButton) {
    const ariaExpanded = peopleButton.getAttribute('aria-expanded');
    if (ariaExpanded === 'true') {
      return true;
    } else if (ariaExpanded === 'false') {
      return false;
    }
  }
  
  // Check for panel by ID with participant list
  const panelById = document.querySelector('#ME4pNd');
  if (panelById && panelById.offsetParent !== null) {
    const participantsList = panelById.querySelector('[role="list"][aria-label="Participants"]');
    if (participantsList) {
      return true;
    }
  }
  
  // Find side panel with People content
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
 * Check if participant data is accessible without panel visibility
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
 * Detect normalized panel behavior.
 * @returns {string} PANEL_BEHAVIOR value
 */
export function detectPeoplePanelBehavior() {
  // Heuristic 1: Newer Meet role-button badge control with dialog semantics.
  const peopleButton = findPeopleButton();
  if (peopleButton && peopleButton.getAttribute('aria-haspopup') === 'dialog' && peopleButton.getAttribute('role') === 'button') {
    return PANEL_BEHAVIOR.PERSISTENT_DATA;
  }

  // Heuristic 2: In-panel close control indicates persistent-data behavior.
  if (findCloseButton()) {
    return PANEL_BEHAVIOR.PERSISTENT_DATA;
  }

  return PANEL_BEHAVIOR.TOGGLE_DATA;
}

/**
 * Compatibility wrapper for legacy callers.
 * @returns {string} 'new' or 'old'
 */
export function detectUIVersion() {
  const behavior = detectPeoplePanelBehavior();
  return behavior === PANEL_BEHAVIOR.PERSISTENT_DATA ? 'new' : 'old';
}
