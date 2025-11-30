/**
 * Google Meet Content Script - Screen Share Detector
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. Toast notification: "[Name] is presenting"
 * 2. People Panel: Separate "presentation" entry appears
 * 3. Shows popup notification to professor to manually unpin
 * 
 * NOTE: Auto-unpin is not reliable due to Google Meet's two-step process
 * (Show my screen anyway → tile appears → then need to unpin)
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG } from './config.js';
import { log } from './utils.js';
import { queueEvent } from './event-emitter.js';
import { findParticipantIdByName } from './participant-detector.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let screenShareObserver = null;
let currentPresenter = null;
let notificationElement = null;

// Notification styling
const NOTIFICATION_STYLES = `
  .engagium-screenshare-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    font-size: 14px;
    max-width: 320px;
    animation: engagium-slide-in 0.3s ease-out;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .engagium-screenshare-notification.hiding {
    animation: engagium-slide-out 0.3s ease-in forwards;
  }
  
  @keyframes engagium-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes engagium-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .engagium-notification-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
  }
  
  .engagium-notification-icon {
    font-size: 20px;
  }
  
  .engagium-notification-title {
    font-size: 15px;
  }
  
  .engagium-notification-body {
    font-size: 13px;
    opacity: 0.9;
    line-height: 1.4;
  }
  
  .engagium-notification-presenter {
    font-weight: 600;
    color: #fff;
  }
  
  .engagium-notification-tip {
    background: rgba(255, 255, 255, 0.15);
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.4;
  }
  
  .engagium-notification-tip strong {
    display: block;
    margin-bottom: 4px;
  }
  
  .engagium-notification-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .engagium-notification-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    transition: background 0.2s;
  }
  
  .engagium-notification-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .engagium-notification-btn.primary {
    background: white;
    color: #1a73e8;
    font-weight: 500;
  }
  
  .engagium-notification-btn.primary:hover {
    background: #f1f3f4;
  }
`;

/**
 * Starts monitoring screen sharing
 * @param {Object} state - State object
 */
export function startScreenShareMonitoring(state) {
  log('Starting screen share monitoring (ARIA-based)...');
  
  // Inject notification styles
  injectStyles();
  
  // Set up toast observer for presentation notifications
  screenShareObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const text = node.textContent?.trim() || '';
        
        // Check for presentation start: "[Name] is presenting"
        if (text.includes(CONFIG.PATTERNS.presenting)) {
          const name = text.replace(CONFIG.PATTERNS.presenting, '').trim();
          handlePresentationStart(name, state);
        }
        
        // Check for presentation end: "[Name] stopped presenting"
        if (text.includes('stopped presenting')) {
          handlePresentationEnd(state);
        }
      }
    }
  });
  
  screenShareObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check People Panel for presentation entry
  checkForExistingPresentation(state);
  
  log('Screen share observer active');
}

/**
 * Stops screen share monitoring
 */
export function stopScreenShareMonitoring() {
  if (screenShareObserver) {
    screenShareObserver.disconnect();
    screenShareObserver = null;
  }
  hideNotification();
  currentPresenter = null;
  log('Screen share monitoring stopped');
}

/**
 * Injects notification CSS styles into the page
 */
function injectStyles() {
  if (document.getElementById('engagium-screenshare-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'engagium-screenshare-styles';
  styleEl.textContent = NOTIFICATION_STYLES;
  document.head.appendChild(styleEl);
}

/**
 * Checks if there's already an active presentation when monitoring starts
 * @param {Object} state - State object
 */
function checkForExistingPresentation(state) {
  // Look for presentation entry in People Panel
  const peoplePanelList = document.querySelector(CONFIG.SELECTORS.peoplePanelList);
  if (!peoplePanelList) return;
  
  const items = peoplePanelList.querySelectorAll('[role="listitem"]');
  
  for (const item of items) {
    const label = (item.getAttribute('aria-label') || '').toLowerCase();
    const text = (item.textContent || '').toLowerCase();
    
    if (label.includes('presentation') || text.includes('presentation')) {
      // Found active presentation
      log('Detected existing presentation on page load');
      // Try to find presenter name from nearby elements
      const presenterName = extractPresenterName(item);
      if (presenterName) {
        handlePresentationStart(presenterName, state);
      }
      break;
    }
  }
}

/**
 * Extracts presenter name from a presentation listitem
 * @param {Element} item - Listitem element
 * @returns {string|null} Presenter name or null
 */
function extractPresenterName(item) {
  // The presentation entry might have the presenter's name
  const generics = item.querySelectorAll('[role="generic"]');
  for (const g of generics) {
    const text = g.textContent?.trim();
    if (text && text.length > 1 && text.length < 100 && 
        !text.toLowerCase().includes('presentation') &&
        !CONFIG.INVALID_NAMES.includes(text.toLowerCase())) {
      return text;
    }
  }
  return null;
}

/**
 * Handles when a presentation starts
 * @param {string} presenterName - Name of the presenter
 * @param {Object} state - State object
 */
function handlePresentationStart(presenterName, state) {
  if (currentPresenter === presenterName) return; // Already showing
  
  currentPresenter = presenterName;
  log('Presentation started by:', presenterName);
  
  // Emit screen share event
  const participantId = findParticipantIdByName(state, presenterName);
  queueEvent(MESSAGE_TYPES.SCREEN_SHARE, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    participantId: participantId || presenterName,
    participantName: presenterName,
    action: 'start',
    timestamp: now()
  });
  
  // Show notification popup
  showNotification(presenterName);
}

/**
 * Handles when a presentation ends
 * @param {Object} state - State object
 */
function handlePresentationEnd(state) {
  if (!currentPresenter) return;
  
  log('Presentation ended');
  
  // Emit screen share end event
  queueEvent(MESSAGE_TYPES.SCREEN_SHARE, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    participantId: currentPresenter,
    participantName: currentPresenter,
    action: 'stop',
    timestamp: now()
  });
  
  hideNotification();
  currentPresenter = null;
}

/**
 * Shows the notification popup to the professor
 * @param {string} presenterName - Name of the presenter
 */
function showNotification(presenterName) {
  // Remove existing notification if any
  hideNotification(false);
  
  notificationElement = document.createElement('div');
  notificationElement.className = 'engagium-screenshare-notification';
  notificationElement.innerHTML = `
    <div class="engagium-notification-header">
      <span class="engagium-notification-icon">🖥️</span>
      <span class="engagium-notification-title">Screen Share Detected</span>
    </div>
    <div class="engagium-notification-body">
      <span class="engagium-notification-presenter">${escapeHtml(presenterName)}</span> is now presenting.
    </div>
    <div class="engagium-notification-tip">
      <strong>💡 Tip:</strong>
      To see all participants while someone presents, click "Unpin" on the presentation tile or use the grid view.
    </div>
    <div class="engagium-notification-actions">
      <button class="engagium-notification-btn" data-action="dismiss">Dismiss</button>
      <button class="engagium-notification-btn primary" data-action="got-it">Got it</button>
    </div>
  `;
  
  // Add event listeners
  notificationElement.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => hideNotification());
  });
  
  document.body.appendChild(notificationElement);
  
  // Auto-hide after 15 seconds
  setTimeout(() => {
    if (notificationElement && notificationElement.isConnected) {
      hideNotification();
    }
  }, 15000);
}

/**
 * Hides the notification popup
 * @param {boolean} animate - Whether to animate the hide
 */
function hideNotification(animate = true) {
  if (!notificationElement) return;
  
  if (animate) {
    notificationElement.classList.add('hiding');
    setTimeout(() => {
      notificationElement?.remove();
      notificationElement = null;
    }, 300);
  } else {
    notificationElement.remove();
    notificationElement = null;
  }
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Gets current presenter name if someone is presenting
 * @returns {string|null} Presenter name or null
 */
export function getCurrentPresenter() {
  return currentPresenter;
}

/**
 * Checks if someone is currently presenting
 * @returns {boolean} True if presentation is active
 */
export function isPresenting() {
  return currentPresenter !== null;
}
