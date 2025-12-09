/**
 * Google Meet Content Script - Meeting Exit Detector
 * Monitors ONLY for explicit meeting exit: Leave button click
 * Does NOT monitor UI changes, panel opening, or tab switching
 * Prompts user after page refresh to confirm session status
 */

import { log } from '../core/utils.js';

/**
 * Check if page was refreshed
 * @returns {boolean} True if page was recently refreshed
 */
function wasPageRefreshed() {
  // Navigation type 1 = reload
  if (performance.navigation && performance.navigation.type === 1) {
    return true;
  }
  
  // Check navigation entry (newer API)
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const navEntry = navEntries[0];
    return navEntry.type === 'reload';
  }
  
  return false;
}

/**
 * Show prompt asking user if they want to end the session after refresh
 * @param {Object} state - State object
 * @param {Function} onMeetingEnded - Callback to end the meeting
 */
function promptUserAfterRefresh(state, onMeetingEnded) {
  log('Page was refreshed during active session - prompting user');
  
  // Create a simple overlay prompt
  const overlay = document.createElement('div');
  overlay.id = 'engagium-refresh-prompt';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: 'Google Sans', Roboto, sans-serif;
    min-width: 350px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  overlay.innerHTML = `
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #202124;">
        🎓 Engagium Session Active
      </h3>
      <p style="margin: 0; font-size: 13px; color: #5f6368; line-height: 1.4;">
        You refreshed the page while tracking attendance. Do you want to end the current session?
      </p>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="engagium-keep-session" style="
        padding: 6px 12px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        background: white;
        color: #5f6368;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: 'Google Sans', Roboto, sans-serif;
      ">
        Continue Session
      </button>
      <button id="engagium-end-session" style="
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background: #1a73e8;
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: 'Google Sans', Roboto, sans-serif;
      ">
        End Session
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Handle button clicks
  document.getElementById('engagium-keep-session').addEventListener('click', () => {
    log('User chose to keep session after refresh');
    overlay.style.animation = 'slideIn 0.2s ease-out reverse';
    setTimeout(() => overlay.remove(), 200);
  });
  
  document.getElementById('engagium-end-session').addEventListener('click', () => {
    log('User chose to end session after refresh');
    overlay.style.animation = 'slideIn 0.2s ease-out reverse';
    setTimeout(() => {
      overlay.remove();
      onMeetingEnded();
    }, 200);
  });
  
  // Auto-dismiss after 20 seconds (keep session by default)
  setTimeout(() => {
    if (document.getElementById('engagium-refresh-prompt')) {
      log('Refresh prompt timed out - keeping session');
      overlay.style.animation = 'slideIn 0.2s ease-out reverse';
      setTimeout(() => overlay.remove(), 200);
    }
  }, 20000);
}

/**
 * Sets up monitoring for meeting exit conditions
 * @param {Object} state - State object
 * @param {Function} onMeetingEnded - Callback when meeting is detected as ended
 */
export async function monitorMeetingExit(state, onMeetingEnded) {
  // Check if page was refreshed on initialization
  if (wasPageRefreshed()) {
    log('Page refresh detected - checking for active session');
    
    // Check with background script if there's an active session
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SESSION_STATUS'
      });
      
      if (response && response.success && response.data && response.data.session) {
        const session = response.data.session;
        // Check if this is the same meeting
        if (session.meeting_id === state.meetingId) {
          log('Active session found for this meeting after refresh - showing prompt');
          // Wait for page to fully load, then show prompt
          setTimeout(() => {
            promptUserAfterRefresh(state, onMeetingEnded);
          }, 2000);
        }
      } else {
        log('No active session found after refresh');
      }
    } catch (error) {
      log('Error checking session status:', error);
    }
  }
  
  // Track if we've already triggered exit
  let exitTriggered = false;
  
  const triggerExit = () => {
    if (exitTriggered) return;
    exitTriggered = true;
    log('Meeting exit detected - Leave button clicked');
    onMeetingEnded();
  };
  
  // ONLY monitor for "Leave call" button click - nothing else!
  // This is the most reliable indicator that user intentionally left
  const monitorLeaveButton = () => {
    // Check periodically for the leave button and attach listener
    const checkInterval = setInterval(() => {
      if (exitTriggered) {
        clearInterval(checkInterval);
        return;
      }
      
      // Find the leave/hang up button
      const leaveButton = document.querySelector(
        'button[aria-label*="Leave call"], button[aria-label*="Hang up"], button[data-tooltip*="Leave"], button[data-tooltip*="Hang up"]'
      );
      
      if (leaveButton && !leaveButton._exitListenerAttached) {
        // Mark as attached to avoid duplicate listeners
        leaveButton._exitListenerAttached = true;
        
        leaveButton.addEventListener('click', () => {
          log('Leave call button clicked by user');
          // Small delay to let the click complete
          setTimeout(triggerExit, 200);
        }, { once: true });
        
        log('Leave button listener attached');
      }
    }, 2000); // Check every 2 seconds
    
    // Store for cleanup
    state._exitIntervals = state._exitIntervals || [];
    state._exitIntervals.push(checkInterval);
  };
  
  // Initialize monitor
  monitorLeaveButton();
  
  log('Meeting exit detection active (Leave button only)');
}

/**
 * Cleanup meeting exit monitors
 * @param {Object} state - State object
 */
export function stopMeetingExitMonitoring(state) {
  // Clear intervals
  if (state._exitIntervals) {
    state._exitIntervals.forEach(interval => clearInterval(interval));
    state._exitIntervals = [];
  }
  
  log('Meeting exit monitoring stopped');
}
