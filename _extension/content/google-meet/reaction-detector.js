/**
 * Google Meet Content Script - Reaction Detector
 * Updated November 2025 for new ARIA-based DOM structure
 * 
 * Detection Strategy:
 * 1. Toast notifications: "[Name] reacted with [emoji description]"
 * 2. Reaction overlays on video tiles (img elements with emoji alt text)
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG } from './config.js';
import { log } from './utils.js';
import { queueEvent } from './event-emitter.js';
import { findParticipantIdByName } from './participant-detector.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';
import { now } from '../../utils/date-utils.js';

let reactionObserver = null;

// Deduplication tracking
const recentReactions = new Map();  // name:emoji -> timestamp
const REACTION_DEDUP_MS = 3000;

// Common Google Meet reaction emoji names (from alt text)
const EMOJI_MAP = {
  'thumbs up': '👍',
  'thumbs_up': '👍',
  'clapping hands': '👏',
  'clapping_hands': '👏',
  'face with tears of joy': '😂',
  'tears_of_joy': '😂',
  'open mouth': '😮',
  'surprised': '😮',
  'face screaming in fear': '😱',
  'heart': '❤️',
  'red heart': '❤️',
  'thinking face': '🤔',
  'thinking': '🤔',
  'party popper': '🎉',
  'tada': '🎉'
};

/**
 * Starts monitoring reactions
 * @param {Object} state - State object
 */
export function startReactionMonitoring(state) {
  log('Starting reaction monitoring (ARIA-based)...');
  
  // Reactions appear as toast notifications and as overlays on video tiles
  reactionObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        // Check for reaction toast notifications
        checkForReactionToast(node, state);
        
        // Check for reaction overlay images
        checkForReactionImage(node, state);
      }
    }
  });
  
  reactionObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  log('Reaction observer active');
}

/**
 * Stops reaction monitoring
 */
export function stopReactionMonitoring() {
  if (reactionObserver) {
    reactionObserver.disconnect();
    reactionObserver = null;
  }
  recentReactions.clear();
  log('Reaction monitoring stopped');
}

/**
 * Checks if a node is a reaction toast notification
 * Toast pattern: "[Name] reacted with [emoji description]"
 * @param {Node} node - DOM node to check
 * @param {Object} state - State object
 */
function checkForReactionToast(node, state) {
  const text = node.textContent?.trim() || '';
  
  // Check for reaction notification pattern
  if (text.includes(' reacted with ')) {
    // Parse "[Name] reacted with [emoji description]"
    const match = text.match(/^(.+?)\s+reacted with\s+(.+)$/i);
    if (match) {
      const name = match[1].trim();
      const emojiDesc = match[2].trim();
      
      processReaction(name, emojiDesc, state);
    }
  }
}

/**
 * Checks if a node contains reaction image overlays
 * Reaction images appear as img elements with alt text like "thumbs up"
 * @param {Node} node - DOM node to check
 * @param {Object} state - State object
 */
function checkForReactionImage(node, state) {
  // Check for img elements with emoji alt text
  const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll?.('img') || [];
  
  for (const img of images) {
    const alt = img.getAttribute('alt')?.toLowerCase() || '';
    
    // Check if alt text matches known emoji descriptions
    for (const [desc, emoji] of Object.entries(EMOJI_MAP)) {
      if (alt.includes(desc)) {
        // Try to find participant name from sibling/parent elements
        const name = extractNameFromReactionContext(img);
        if (name) {
          processReaction(name, alt, state);
        }
        break;
      }
    }
  }
}

/**
 * Extracts participant name from the context around a reaction image
 * @param {Element} img - The reaction image element
 * @returns {string|null} Participant name or null
 */
function extractNameFromReactionContext(img) {
  // Look for aria-label on parent containers
  let parent = img.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const ariaLabel = parent.getAttribute('aria-label');
    if (ariaLabel) {
      // Extract name from aria-label (often contains participant name)
      const name = ariaLabel.split(',')[0].trim();
      if (name && !CONFIG.INVALID_NAMES.includes(name.toLowerCase())) {
        return name;
      }
    }
    parent = parent.parentElement;
  }
  
  // Look for nearby text content that could be a name
  const container = img.closest('[role="listitem"]') || 
                    img.closest('[class*="participant"]') ||
                    img.parentElement?.parentElement;
  if (container) {
    const textNodes = container.querySelectorAll('[role="generic"], span, div');
    for (const node of textNodes) {
      const text = node.textContent?.trim();
      if (text && text.length > 1 && text.length < 50 && 
          !CONFIG.INVALID_NAMES.includes(text.toLowerCase()) &&
          !text.includes('reacted')) {
        return text;
      }
    }
  }
  
  return null;
}

/**
 * Processes a detected reaction
 * @param {string} name - Participant name
 * @param {string} emojiDesc - Emoji description or emoji itself
 * @param {Object} state - State object
 */
function processReaction(name, emojiDesc, state) {
  if (!name) return;
  
  // Convert description to emoji if needed
  const emoji = EMOJI_MAP[emojiDesc.toLowerCase()] || emojiDesc;
  
  // Local deduplication
  const key = `${name}:${emoji}`;
  const lastTime = recentReactions.get(key);
  const nowTs = Date.now();
  
  if (lastTime && (nowTs - lastTime) < REACTION_DEDUP_MS) {
    return;
  }
  recentReactions.set(key, nowTs);
  
  // Cleanup old entries
  if (recentReactions.size > 100) {
    const cutoff = nowTs - REACTION_DEDUP_MS;
    for (const [k, t] of recentReactions.entries()) {
      if (t < cutoff) recentReactions.delete(k);
    }
  }
  
  const participantId = findParticipantIdByName(state, name);
  const timestamp = now();
  
  log('Reaction:', name, emoji);
  
  queueEvent(MESSAGE_TYPES.REACTION, {
    platform: 'google-meet',
    meetingId: state.meetingId,
    participantId: participantId || name,
    participantName: name,
    reaction: emoji,
    timestamp: timestamp
  });
}

/**
 * Legacy function for compatibility - now a no-op
 * @param {Object} state - State object
 */
export function scanReactions(state) {
  // No-op: Reactions are tracked via MutationObserver
}
