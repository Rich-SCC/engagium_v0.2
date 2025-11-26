/**
 * Google Meet Content Script
 * Tracks attendance and participation in Google Meet meetings
 * 
 * DOM Selectors (as of Nov 2025 - may need updates):
 * - Meeting ID: Found in URL (meet.google.com/xxx-xxxx-xxx)
 * - Participant list: Right sidebar when "People" button clicked
 * - Participant items: Individual participant containers
 * - Chat panel: Right sidebar when "Chat" button clicked
 */

import { MESSAGE_TYPES } from '../utils/constants.js';
import { now } from '../utils/date-utils.js';

console.log('[GoogleMeet] Content script loaded');

// ============================================================================
// Configuration & State
// ============================================================================

const CONFIG = {
  // DOM Selectors (Google Meet UI - subject to change)
  SELECTORS: {
    // Participant panel
    participantPanel: '[data-participant-id]',
    participantItem: '[data-participant-id]',
    participantName: '[data-self-name], [data-requested-participant-id]',
    
    // Buttons to open panels
    peopleButton: 'button[aria-label*="Show everyone"], button[aria-label*="People"]',
    chatButton: 'button[aria-label*="Chat"]',
    
    // Chat messages
    chatPanel: '[data-message-text]',
    chatMessage: '[data-message-text]',
    chatSender: '[data-sender-name]',
    
    // Meeting info
    meetingTitle: 'h1, [role="heading"]',
  },
  
  // Polling intervals
  PARTICIPANT_CHECK_INTERVAL: 2000, // 2 seconds
  CHAT_CHECK_INTERVAL: 1000, // 1 second
  
  // Debounce delays
  PARTICIPANT_UPDATE_DEBOUNCE: 500, // 0.5 seconds
};

const state = {
  meetingId: null,
  isTracking: false,
  participants: new Map(), // participantId -> { name, email, joinedAt, leftAt }
  lastChatMessageCount: 0,
  participantObserver: null,
  chatObserver: null,
  previousMeetingId: null, // For platform switch detection
};

// ============================================================================
// Initialization
// ============================================================================

function init() {
  console.log('[GoogleMeet] Initializing...');
  
  // Extract meeting ID from URL
  state.meetingId = extractMeetingId();
  
  if (!state.meetingId) {
    console.warn('[GoogleMeet] Could not extract meeting ID from URL');
    return;
  }
  
  console.log('[GoogleMeet] Meeting ID:', state.meetingId);
  
  // Notify background of meeting detection
  sendMessage(MESSAGE_TYPES.MEETING_DETECTED, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    meetingUrl: window.location.href
  });
  
  // Wait for DOM to be ready, then start tracking
  waitForElement(CONFIG.SELECTORS.peopleButton, () => {
    console.log('[GoogleMeet] Meeting UI ready');
    startTracking();
  });
  
  // Inject tracking indicator
  injectTrackingIndicator();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  
  // Monitor URL changes for platform switches (professor switches meeting links mid-session)
  monitorURLChanges();
}

/**
 * Monitor URL changes to detect platform switches
 * (Professor switches to different Google Meet link mid-session)
 */
function monitorURLChanges() {
  let lastUrl = window.location.href;
  
  // Use MutationObserver to detect URL changes in SPA
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleURLChange();
    }
  }).observe(document.querySelector('title'), {
    childList: true,
    subtree: true
  });
  
  // Also listen to popstate (back/forward navigation)
  window.addEventListener('popstate', handleURLChange);
  
  // And pushState/replaceState (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleURLChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleURLChange();
  };
}

/**
 * Handle URL change (potential platform switch)
 */
function handleURLChange() {
  const newMeetingId = extractMeetingId();
  
  // No meeting ID means left the meeting
  if (!newMeetingId) {
    if (state.isTracking) {
      console.log('[GoogleMeet] Left meeting');
      stopTracking();
    }
    return;
  }
  
  // If meeting ID changed while tracking, it's a platform switch
  if (state.isTracking && newMeetingId !== state.meetingId) {
    console.log('[GoogleMeet] Platform switch detected:', state.meetingId, '->', newMeetingId);
    
    // Log platform switch event
    sendMessage(MESSAGE_TYPES.PLATFORM_SWITCH, {
      platform: 'google-meet',
      old_meeting_id: state.meetingId,
      new_meeting_id: newMeetingId,
      timestamp: now()
    });
    
    // Update meeting ID and continue tracking
    state.previousMeetingId = state.meetingId;
    state.meetingId = newMeetingId;
    
    // Clear participants (new meeting)
    state.participants.clear();
    
    // Re-scan participants
    setTimeout(() => scanParticipants(), 1000);
  }
}

/**
 * Extract meeting ID from URL
 * Example: meet.google.com/abc-defg-hij -> abc-defg-hij
 */
function extractMeetingId() {
  const match = window.location.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
  return match ? match[1] : null;
}

// ============================================================================
// Tracking Control
// ============================================================================

function startTracking() {
  if (state.isTracking) return;
  
  console.log('[GoogleMeet] Starting tracking...');
  state.isTracking = true;
  
  // Open participant panel (needed to access participant list)
  openParticipantPanel();
  
  // Wait a bit for panel to load
  setTimeout(() => {
    // Start monitoring participants
    startParticipantMonitoring();
    
    // Start monitoring chat (optional)
    startChatMonitoring();
    
    updateIndicator('active');
  }, 1000);
}

function stopTracking() {
  if (!state.isTracking) return;
  
  console.log('[GoogleMeet] Stopping tracking...');
  state.isTracking = false;
  
  // Stop observers
  if (state.participantObserver) {
    state.participantObserver.disconnect();
  }
  if (state.chatObserver) {
    state.chatObserver.disconnect();
  }
  
  updateIndicator('idle');
}

// ============================================================================
// Participant Monitoring
// ============================================================================

function startParticipantMonitoring() {
  console.log('[GoogleMeet] Starting participant monitoring...');
  
  // Initial scan
  scanParticipants();
  
  // Set up polling (fallback if MutationObserver doesn't catch everything)
  setInterval(() => {
    if (state.isTracking) {
      scanParticipants();
    }
  }, CONFIG.PARTICIPANT_CHECK_INTERVAL);
  
  // Set up MutationObserver for real-time updates
  setupParticipantObserver();
}

function setupParticipantObserver() {
  // Find the participant list container
  const participantContainer = document.querySelector('[jsname], [data-panel-id="2"]');
  
  if (!participantContainer) {
    console.warn('[GoogleMeet] Participant container not found');
    return;
  }
  
  state.participantObserver = new MutationObserver(debounce(() => {
    scanParticipants();
  }, CONFIG.PARTICIPANT_UPDATE_DEBOUNCE));
  
  state.participantObserver.observe(participantContainer, {
    childList: true,
    subtree: true
  });
  
  console.log('[GoogleMeet] Participant observer active');
}

function scanParticipants() {
  // Google Meet shows participants in the right panel
  // Selector varies, so we try multiple approaches
  
  const participantElements = findParticipantElements();
  const currentParticipantIds = new Set();
  
  for (const element of participantElements) {
    const participant = extractParticipantData(element);
    
    if (!participant || !participant.id) continue;
    
    currentParticipantIds.add(participant.id);
    
    // Check if new participant
    if (!state.participants.has(participant.id)) {
      console.log('[GoogleMeet] Participant joined:', participant.name);
      
      state.participants.set(participant.id, {
        ...participant,
        joinedAt: now()
      });
      
      // Notify background
      sendMessage(MESSAGE_TYPES.PARTICIPANT_JOINED, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          joinedAt: now()
        }
      });
    }
  }
  
  // Check for participants who left
  for (const [participantId, participant] of state.participants.entries()) {
    if (!currentParticipantIds.has(participantId) && !participant.leftAt) {
      console.log('[GoogleMeet] Participant left:', participant.name);
      
      participant.leftAt = now();
      
      // Notify background
      sendMessage(MESSAGE_TYPES.PARTICIPANT_LEFT, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participantId: participantId,
        leftAt: now()
      });
    }
  }
}

function findParticipantElements() {
  // Google Meet uses various selectors for participants
  // Try multiple approaches
  
  // Approach 1: data-participant-id attribute
  let elements = Array.from(document.querySelectorAll('[data-participant-id]'));
  
  if (elements.length > 0) return elements;
  
  // Approach 2: Look for participant list items
  elements = Array.from(document.querySelectorAll('[data-requested-participant-id]'));
  
  if (elements.length > 0) return elements;
  
  // Approach 3: Look for specific class patterns (fallback)
  elements = Array.from(document.querySelectorAll('[role="listitem"][data-participant-id], [jsname][data-participant-id]'));
  
  return elements;
}

function extractParticipantData(element) {
  try {
    // Extract participant ID
    const id = element.getAttribute('data-participant-id') || 
               element.getAttribute('data-requested-participant-id') ||
               generateParticipantId(element);
    
    // Extract name
    const nameElement = element.querySelector('[data-self-name]') ||
                        element.querySelector('[data-tooltip]') ||
                        element.querySelector('[jsname]');
    
    const name = nameElement?.getAttribute('data-self-name') ||
                 nameElement?.getAttribute('data-tooltip') ||
                 nameElement?.textContent?.trim() ||
                 'Unknown';
    
    // Try to extract email (if visible)
    const emailElement = element.querySelector('[data-email]');
    const email = emailElement?.getAttribute('data-email') || null;
    
    return { id, name, email };
  } catch (error) {
    console.error('[GoogleMeet] Error extracting participant data:', error);
    return null;
  }
}

function generateParticipantId(element) {
  // Generate stable ID based on element content
  const text = element.textContent || '';
  return `gmeet-${hashString(text)}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Chat Monitoring
// ============================================================================

function startChatMonitoring() {
  console.log('[GoogleMeet] Starting chat monitoring...');
  
  // Poll for new chat messages
  setInterval(() => {
    if (state.isTracking) {
      scanChatMessages();
    }
  }, CONFIG.CHAT_CHECK_INTERVAL);
  
  // Set up MutationObserver for real-time chat
  setupChatObserver();
}

function setupChatObserver() {
  // Find chat container
  const chatContainer = document.querySelector('[data-message-text], [jsname="xySENc"]');
  
  if (!chatContainer) {
    console.warn('[GoogleMeet] Chat container not found (may not be open)');
    return;
  }
  
  state.chatObserver = new MutationObserver(() => {
    scanChatMessages();
  });
  
  state.chatObserver.observe(chatContainer, {
    childList: true,
    subtree: true
  });
  
  console.log('[GoogleMeet] Chat observer active');
}

function scanChatMessages() {
  const chatMessages = document.querySelectorAll('[data-message-text]');
  
  if (chatMessages.length === state.lastChatMessageCount) {
    return; // No new messages
  }
  
  // Process only new messages
  for (let i = state.lastChatMessageCount; i < chatMessages.length; i++) {
    const messageElement = chatMessages[i];
    const chatData = extractChatData(messageElement);
    
    if (chatData) {
      console.log('[GoogleMeet] Chat message detected:', chatData.sender);
      
      // Find participant ID by matching name
      const participantId = findParticipantIdByName(chatData.sender);
      
      if (participantId) {
        sendMessage(MESSAGE_TYPES.CHAT_MESSAGE, {
          platform: 'google-meet',
          meetingId: state.meetingId,
          participantId: participantId,
          message: chatData.message,
          timestamp: now()
        });
      }
    }
  }
  
  state.lastChatMessageCount = chatMessages.length;
}

function extractChatData(element) {
  try {
    const senderElement = element.querySelector('[data-sender-name]');
    const messageElement = element.querySelector('[data-message-text]');
    
    const sender = senderElement?.getAttribute('data-sender-name') ||
                   senderElement?.textContent?.trim() ||
                   'Unknown';
    
    const message = messageElement?.textContent?.trim() || '';
    
    return { sender, message };
  } catch (error) {
    console.error('[GoogleMeet] Error extracting chat data:', error);
    return null;
  }
}

function findParticipantIdByName(name) {
  for (const [id, participant] of state.participants.entries()) {
    if (participant.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(participant.name.toLowerCase())) {
      return id;
    }
  }
  return null;
}

// ============================================================================
// UI Injection
// ============================================================================

function injectTrackingIndicator() {
  // Create indicator element
  const indicator = document.createElement('div');
  indicator.id = 'engagium-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #1f2937;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  `;
  
  indicator.innerHTML = `
    <div id="engagium-status-dot" style="
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6b7280;
    "></div>
    <span id="engagium-status-text">Engagium: Idle</span>
  `;
  
  document.body.appendChild(indicator);
  console.log('[GoogleMeet] Tracking indicator injected');
}

function updateIndicator(status) {
  const dot = document.getElementById('engagium-status-dot');
  const text = document.getElementById('engagium-status-text');
  
  if (!dot || !text) return;
  
  if (status === 'active') {
    dot.style.background = '#10b981'; // Green
    text.textContent = `Engagium: Tracking (${state.participants.size})`;
  } else {
    dot.style.background = '#6b7280'; // Gray
    text.textContent = 'Engagium: Idle';
  }
}

// ============================================================================
// UI Helpers
// ============================================================================

function openParticipantPanel() {
  const peopleButton = document.querySelector(CONFIG.SELECTORS.peopleButton);
  
  if (peopleButton) {
    // Check if already open (aria-pressed="true")
    const isOpen = peopleButton.getAttribute('aria-pressed') === 'true';
    
    if (!isOpen) {
      console.log('[GoogleMeet] Opening participant panel...');
      peopleButton.click();
    }
  } else {
    console.warn('[GoogleMeet] Could not find People button');
  }
}

// ============================================================================
// Communication
// ============================================================================

function sendMessage(type, data) {
  chrome.runtime.sendMessage({ type, ...data }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[GoogleMeet] Error sending message:', chrome.runtime.lastError);
      return;
    }
    
    if (response && !response.success) {
      console.error('[GoogleMeet] Background error:', response.error);
    }
  });
}

function handleBackgroundMessage(message, sender, sendResponse) {
  console.log('[GoogleMeet] Message from background:', message.type);
  
  switch (message.type) {
    case MESSAGE_TYPES.SESSION_STARTED:
      startTracking();
      sendResponse({ success: true });
      break;
      
    case MESSAGE_TYPES.SESSION_ENDED:
      stopTracking();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep channel open for async response
}

// ============================================================================
// Utility Functions
// ============================================================================

function waitForElement(selector, callback, timeout = 10000) {
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

// ============================================================================
// Cleanup on Page Unload
// ============================================================================

window.addEventListener('beforeunload', () => {
  if (state.isTracking) {
    // Notify all participants as left
    for (const [participantId, participant] of state.participants.entries()) {
      if (!participant.leftAt) {
        sendMessage(MESSAGE_TYPES.PARTICIPANT_LEFT, {
          platform: 'google-meet',
          meetingId: state.meetingId,
          participantId: participantId,
          leftAt: now()
        });
      }
    }
    
    // Notify meeting left
    sendMessage(MESSAGE_TYPES.MEETING_LEFT, {
      platform: 'google-meet',
      meetingId: state.meetingId
    });
  }
});

// ============================================================================
// Start
// ============================================================================

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
