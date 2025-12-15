/**
 * Panel Manager for Google Meet
 * 
 * Manages the People Panel state intelligently to prevent unnecessary
 * open/close operations. Implements smart batching and state tracking.
 * 
 * Features:
 * - Tracks panel state to avoid redundant operations
 * - Batches multiple requests to minimize panel toggles
 * - Manages panel lifecycle (open -> use -> close)
 * - Prevents closing if user manually opened panel
 */

import { findPeopleButton, isPeoplePanelOpen as checkPanelOpen, detectUIVersion, findCloseButton } from './dom-manager.js';
import { sleep } from '../core/utils.js';

// Panel state tracking
let panelState = {
  isOpen: false,
  wasOpenedByUser: false, // Track if user opened it (don't close)
  isOperationInProgress: false,
  pendingOperations: [],
  lastStateCheck: 0
};

// Debounce timer for state checks
const STATE_CHECK_DEBOUNCE = 50;

/**
 * Initialize panel manager
 */
export function initPanelManager() {
  // Set up initial state
  updatePanelState();
  console.log('[PanelManager] Initialized');
}

/**
 * Update internal panel state by checking DOM
 * Uses debouncing to avoid excessive checks
 */
function updatePanelState() {
  const now = Date.now();
  if (now - panelState.lastStateCheck < STATE_CHECK_DEBOUNCE) {
    return;
  }
  
  const wasOpen = panelState.isOpen;
  panelState.isOpen = checkPanelOpen();
  panelState.lastStateCheck = now;
  
  // If panel opened and we didn't do it, user must have opened it
  if (panelState.isOpen && !wasOpen && !panelState.isOperationInProgress) {
    panelState.wasOpenedByUser = true;
    console.log('[PanelManager] Panel opened by user - will not auto-close');
  }
  
  // If panel closed and we didn't do it, user must have closed it
  if (!panelState.isOpen && wasOpen && !panelState.isOperationInProgress) {
    panelState.wasOpenedByUser = false;
  }
}

/**
 * Check if panel is currently open
 * @returns {boolean} True if open
 */
export function isPeoplePanelOpen() {
  updatePanelState();
  return panelState.isOpen;
}

/**
 * Check if we should auto-close the panel
 * Don't close if user opened it manually
 * @returns {boolean} True if we can auto-close
 */
function shouldAutoClose() {
  return !panelState.wasOpenedByUser;
}

/**
 * Open the People Panel
 * @param {boolean} force - Force open even if already open
 * @returns {Promise<boolean>} True if opened successfully
 */
export async function openPeoplePanel(force = false) {
  updatePanelState();
  
  // Already open - no action needed
  if (panelState.isOpen && !force) {
    console.log('[PanelManager] Panel already open');
    return true;
  }
  
  // Mark operation in progress
  panelState.isOperationInProgress = true;
  
  try {
    const peopleButton = findPeopleButton();
    
    if (!peopleButton) {
      console.warn('[PanelManager] Cannot open - People button not found');
      return false;
    }
    
    const uiVersion = detectUIVersion();
    console.log(`[PanelManager] Opening panel (UI: ${uiVersion})...`);
    
    peopleButton.click();
    
    // Wait for panel to open
    const success = await waitForPanelState(true, 5000);
    
    if (success) {
      panelState.isOpen = true;
      panelState.wasOpenedByUser = false; // We opened it, not the user
      console.log('[PanelManager] Panel opened successfully');
    } else {
      console.warn('[PanelManager] Failed to open panel (timeout)');
    }
    
    return success;
  } finally {
    panelState.isOperationInProgress = false;
  }
}

/**
 * Close the People Panel
 * Only closes if we opened it (not if user opened it)
 * @param {boolean} force - Force close even if user opened it
 * @returns {Promise<boolean>} True if closed successfully
 */
export async function closePeoplePanel(force = false) {
  updatePanelState();
  
  // Already closed
  if (!panelState.isOpen) {
    console.log('[PanelManager] Panel already closed');
    return true;
  }
  
  // Don't close if user opened it (unless forced)
  if (!force && !shouldAutoClose()) {
    console.log('[PanelManager] Not closing - user opened panel manually');
    return false;
  }
  
  // Mark operation in progress
  panelState.isOperationInProgress = true;
  
  try {
    const uiVersion = detectUIVersion();
    
    // NEW UI: Use the Close button inside the panel
    if (uiVersion === 'new') {
      const closeButton = findCloseButton();
      
      if (!closeButton) {
        console.warn('[PanelManager] Cannot close - Close button not found (new UI)');
        return false;
      }
      
      console.log('[PanelManager] Closing panel (new UI - using Close button)...');
      closeButton.click();
    } else {
      // OLD UI: Toggle the People button
      const peopleButton = findPeopleButton();
      
      if (!peopleButton) {
        console.warn('[PanelManager] Cannot close - People button not found');
        return false;
      }
      
      console.log('[PanelManager] Closing panel (old UI - toggling People button)...');
      peopleButton.click();
    }
    
    // Wait for panel to close
    const success = await waitForPanelState(false, 2000);
    
    if (success) {
      panelState.isOpen = false;
      panelState.wasOpenedByUser = false;
      console.log('[PanelManager] Panel closed successfully');
    } else {
      console.warn('[PanelManager] Failed to close panel (timeout)');
    }
    
    return success;
  } finally {
    panelState.isOperationInProgress = false;
  }
}

/**
 * Wait for panel to reach desired state
 * @param {boolean} shouldBeOpen - Expected state
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if state reached
 */
async function waitForPanelState(shouldBeOpen, timeout) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    updatePanelState();
    
    if (panelState.isOpen === shouldBeOpen) {
      return true;
    }
    
    await sleep(100);
  }
  
  return false;
}

/**
 * Execute an operation with the panel open
 * Handles opening, executing, and closing intelligently
 * 
 * @param {Function} operation - Async function to execute
 * @param {string} reason - Reason for operation (for logging)
 * @returns {Promise<any>} Result of operation
 */
export async function withPanelOpen(operation, reason = 'operation') {
  console.log(`[PanelManager] Starting operation: ${reason}`);
  
  const uiVersion = detectUIVersion();
  updatePanelState();
  const wasAlreadyOpen = panelState.isOpen;
  const wasOpenedByUser = panelState.wasOpenedByUser;
  
  try {
    // 1. OPEN: Ensure panel is open
    const opened = await openPeoplePanel();
    if (!opened) {
      console.warn(`[PanelManager] Failed to open panel for: ${reason}`);
      return null;
    }
    
    // Small delay for DOM stability
    await sleep(100);
    
    // 2. EXECUTE: Run the operation
    const result = await operation();
    
    // 3. CLOSE: Handle differently for new vs old UI
    if (!wasAlreadyOpen && !wasOpenedByUser) {
      if (uiVersion === 'new') {
        // NEW UI: Data persists, just close visually (don't wait for timeout)
        await sleep(100); // Brief delay for operation completion
        const closeButton = findCloseButton();
        if (closeButton) {
          closeButton.click();
          console.log(`[PanelManager] Closed panel visually (new UI - data persists)`);
          // Update state immediately - don't wait for visual confirmation
          panelState.isOpen = false;
          panelState.wasOpenedByUser = false;
        }
      } else {
        // OLD UI: Normal close with wait
        await sleep(300);
        await closePeoplePanel();
        console.log(`[PanelManager] Closed panel after: ${reason}`);
      }
    } else if (wasAlreadyOpen) {
      console.log(`[PanelManager] Keeping panel open (was already open)`);
    }
    
    return result;
  } catch (error) {
    console.error(`[PanelManager] Error during operation '${reason}':`, error);
    
    // Cleanup: close panel if we opened it
    if (!wasAlreadyOpen && !wasOpenedByUser) {
      if (uiVersion === 'new') {
        const closeButton = findCloseButton();
        if (closeButton) closeButton.click();
        panelState.isOpen = false;
      } else {
        await closePeoplePanel().catch(() => {});
      }
    }
    
    throw error;
  }
}

/**
 * Queue multiple operations to execute together
 * Batches operations to minimize panel toggles
 * 
 * @param {Array<{operation: Function, reason: string}>} operations - Operations to batch
 * @returns {Promise<Array>} Results of all operations
 */
export async function batchOperations(operations) {
  if (operations.length === 0) return [];
  
  console.log(`[PanelManager] Batching ${operations.length} operations`);
  
  return withPanelOpen(async () => {
    const results = [];
    
    for (const { operation, reason } of operations) {
      console.log(`[PanelManager] Executing batched: ${reason}`);
      try {
        const result = await operation();
        results.push({ success: true, result, reason });
      } catch (error) {
        console.error(`[PanelManager] Batched operation failed: ${reason}`, error);
        results.push({ success: false, error, reason });
      }
      
      // Small delay between operations
      await sleep(50);
    }
    
    return results;
  }, `batch of ${operations.length} operations`);
}

/**
 * Reset panel state tracking
 * Useful when meeting context changes
 */
export function resetPanelState() {
  panelState = {
    isOpen: false,
    wasOpenedByUser: false,
    isOperationInProgress: false,
    pendingOperations: [],
    lastStateCheck: 0
  };
  console.log('[PanelManager] State reset');
}
