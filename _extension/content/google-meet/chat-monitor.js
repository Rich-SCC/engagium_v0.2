/**
 * Google Meet Content Script - Chat Monitor
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. Chat panel with heading "In-call messages" 
 * 2. Message structure: Sender name, timestamp, message text
 * 3. Note: Chat only detectable when panel is open
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG, isValidParticipantName } from './config.js';
import { log, warn } from './utils.js';
import { queueEvent } from './event-emitter.js';
import { findParticipantIdByName } from './participant-detector.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let chatContainerObserver = null;
let bodyObserver = null;
let processedMessages = new Set(); // Track processed messages to avoid duplicates

/**
 * Starts monitoring chat messages
 * @param {Object} state - State object
 */
export function startChatMonitoring(state) {
  log('Starting chat monitoring (ARIA-based)...');
  log('Note: Chat messages only detected when Chat panel is open');
  
  // Clear processed messages
  processedMessages.clear();
  
  // Initialize existing messages as processed (don't send events for old messages)
  initializeExistingMessages();
  
  // Try to set up observer on chat container
  if (!setupChatObserver(state)) {
    // Chat panel not open yet - watch for it to appear
    setupChatPanelWatcher(state);
  }
}

/**
 * Stops monitoring chat messages
 * @param {Object} state - State object
 */
export function stopChatMonitoring(state) {
  if (chatContainerObserver) {
    chatContainerObserver.disconnect();
    chatContainerObserver = null;
  }
  if (bodyObserver) {
    bodyObserver.disconnect();
    bodyObserver = null;
  }
  processedMessages.clear();
  log('Chat monitoring stopped');
}

/**
 * Mark existing messages as processed so we don't send events for them
 */
function initializeExistingMessages() {
  const messages = findAllChatMessages();
  messages.forEach((messageData, index) => {
    const messageId = generateMessageId(messageData, index);
    processedMessages.add(messageId);
  });
  log('Initialized', processedMessages.size, 'existing chat messages');
}

/**
 * Finds the chat panel by looking for "In-call messages" heading
 * @returns {Element|null} Chat container or null
 */
function findChatContainer() {
  // Look for the chat panel heading
  const headings = document.querySelectorAll('[role="heading"]');
  
  for (const heading of headings) {
    const text = heading.textContent?.trim().toLowerCase() || '';
    if (text.includes('in-call messages') || text.includes('chat')) {
      // Found the heading, get the parent panel
      let parent = heading.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        if (parent.querySelector('[role="list"]') || 
            parent.querySelectorAll('[role="listitem"]').length > 0) {
          log('Found chat container via heading');
          return parent;
        }
        parent = parent.parentElement;
      }
    }
  }
  
  // Alternative: Look for complementary role (side panel)
  const sidePanel = document.querySelector(CONFIG.SELECTORS.sidePanel);
  if (sidePanel) {
    // Check if this is the chat panel by looking for message-like content
    const hasMessages = sidePanel.querySelector('[role="list"]') ||
                        sidePanel.textContent?.includes('Send a message');
    if (hasMessages) {
      // Verify it's not the People panel
      const isPeoplePanel = sidePanel.querySelector('list[aria-label="Participants"]') ||
                            sidePanel.textContent?.includes('Contributors');
      if (!isPeoplePanel) {
        log('Found chat container via side panel');
        return sidePanel;
      }
    }
  }
  
  return null;
}

/**
 * Finds all chat messages from the current DOM
 * @returns {Array<{sender: string, message: string, timestamp: string}>} Message data
 */
function findAllChatMessages() {
  const container = findChatContainer();
  if (!container) return [];
  
  const messages = [];
  
  // Chat messages appear as structured elements with sender, time, message
  // Look for patterns in the accessibility tree
  const items = container.querySelectorAll('[role="listitem"], [role="generic"]');
  
  for (const item of items) {
    const messageData = extractChatData(item);
    if (messageData && messageData.message) {
      messages.push(messageData);
    }
  }
  
  return messages;
}

/**
 * Generates a unique ID for a message
 * @param {Object} messageData - { sender, message, timestamp }
 * @param {number} index - Index fallback
 * @returns {string} Message ID
 */
function generateMessageId(messageData, index) {
  const sender = messageData.sender || '';
  const msg = messageData.message?.slice(0, 50) || '';
  const time = messageData.timestamp || '';
  return `${sender}-${msg}-${time}-${index}`.replace(/\s+/g, '_');
}

/**
 * Sets up MutationObserver for chat panel
 * @param {Object} state - State object
 * @returns {boolean} true if observer was set up successfully
 */
function setupChatObserver(state) {
  const chatContainer = findChatContainer();
  
  if (!chatContainer) {
    return false;
  }
  
  // Disconnect existing observer if any
  if (chatContainerObserver) {
    chatContainerObserver.disconnect();
  }
  
  chatContainerObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    // Check if any mutation added new elements
    let hadAdditions = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hadAdditions = true;
        break;
      }
      if (mutation.type === 'characterData') {
        hadAdditions = true;
        break;
      }
    }
    
    if (hadAdditions) {
      // Debounce processing
      clearTimeout(state._chatProcessTimeout);
      state._chatProcessTimeout = setTimeout(() => {
        processNewChatMessages(state);
      }, 100);
    }
  });
  
  chatContainerObserver.observe(chatContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  log('Chat observer active on container');
  return true;
}

/**
 * Watches for chat panel to appear and sets up observer when it does
 * @param {Object} state - State object
 */
function setupChatPanelWatcher(state) {
  warn('Chat container not found - watching for it to appear');
  
  bodyObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    // Check if chat panel appeared
    const chatContainer = findChatContainer();
    
    if (chatContainer) {
      log('Chat panel appeared, setting up observer');
      bodyObserver.disconnect();
      bodyObserver = null;
      initializeExistingMessages();
      setupChatObserver(state);
    }
  });
  
  bodyObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Processes new chat messages when DOM changes detected
 * @param {Object} state - State object
 */
function processNewChatMessages(state) {
  const messages = findAllChatMessages();
  
  messages.forEach((messageData, index) => {
    const messageId = generateMessageId(messageData, index);
    
    // Skip already processed messages
    if (processedMessages.has(messageId)) {
      return;
    }
    
    processedMessages.add(messageId);
    
    if (messageData.message) {
      log('Chat message detected from:', messageData.sender, '- Message:', messageData.message.slice(0, 30));
      
      // Find participant ID by matching name
      const participantId = findParticipantIdByName(state, messageData.sender);
      
      // Send event even if participant not found (might be "You")
      queueEvent(MESSAGE_TYPES.CHAT_MESSAGE, {
        platform: 'google-meet',
        meetingId: state.meetingId,
        participantId: participantId || messageData.sender,
        participantName: messageData.sender,
        message: messageData.message,
        timestamp: now()
      });
    }
  });
}

// List of known UI button/label text to filter out
const CHAT_INVALID_MESSAGES = [
  'more actions',
  'lower',
  'open queue',
  'close',
  'pin message',
  'unpin message',
  'send a message',
  "you can't unmute",
  'meeting host',
  'add people',
  'search for people',
  'contributors',
  'in the meeting',
  'raised hands',
  'lower all hands',
  'front_hand',
  'keep'
];

/**
 * Checks if text looks like a UI button label rather than a chat message
 * @param {string} text - Text to check
 * @returns {boolean} True if it's likely UI text
 */
function isUIText(text) {
  if (!text) return true;
  const lower = text.toLowerCase().trim();
  return CHAT_INVALID_MESSAGES.some(ui => lower === ui || lower.includes(ui));
}

/**
 * Extracts chat data from a message element
 * Chat structure: Sender name, timestamp (like "10:30 am"), message text
 * @param {Element} element - Chat message container
 * @returns {Object|null} Chat data { sender, message, timestamp } or null
 */
export function extractChatData(element) {
  try {
    const textContent = element.textContent?.trim() || '';
    if (!textContent || textContent.length < 2) return null;
    
    // Skip if the entire element looks like UI text
    if (isUIText(textContent)) return null;
    
    // Look for time pattern (e.g., "10:30 am", "2:45 PM")
    const timeMatch = textContent.match(/(\d{1,2}:\d{2}\s*[aApP][mM])/);
    
    if (timeMatch) {
      const timeIndex = textContent.indexOf(timeMatch[1]);
      
      // Sender is before the time
      const sender = textContent.slice(0, timeIndex).trim();
      
      // Message is after the time
      const afterTime = textContent.slice(timeIndex + timeMatch[1].length).trim();
      const message = afterTime;
      
      // Skip if sender or message looks like UI text
      if (isUIText(sender) || isUIText(message)) return null;
      
      if (sender && message && 
          !CONFIG.INVALID_NAMES.includes(sender.toLowerCase()) &&
          sender.length < 100 && message.length > 0) {
        return {
          sender: sender,
          message: message,
          timestamp: timeMatch[1]
        };
      }
    }
    
    // Alternative: Look for structured child elements
    const children = element.querySelectorAll('[role="generic"], span, div');
    if (children.length >= 2) {
      const texts = Array.from(children)
        .map(c => c.textContent?.trim())
        .filter(t => t && t.length > 0 && !isUIText(t));
      
      if (texts.length >= 2) {
        // First text is usually sender, last is message
        const sender = texts[0];
        const message = texts[texts.length - 1];
        
        // Check if second element looks like a timestamp
        const timestamp = texts.find(t => /\d{1,2}:\d{2}/.test(t)) || '';
        
        if (sender !== message && 
            !CONFIG.INVALID_NAMES.includes(sender.toLowerCase()) &&
            sender.length < 100) {
          return { sender, message, timestamp };
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('[GoogleMeet] Error extracting chat data:', err);
    return null;
  }
}

/**
 * Legacy function for compatibility
 * @param {Object} state - State object
 */
export function scanChatMessages(state) {
  processNewChatMessages(state);
}
