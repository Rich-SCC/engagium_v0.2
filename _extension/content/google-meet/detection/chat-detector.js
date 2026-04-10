/**
 * Google Meet Chat Detection Helpers
 *
 * Handles chat-panel priming and toast parsing so participant detection can
 * stay focused on participant lifecycle events.
 */

import { CONFIG } from '../core/config.js';
import { log, warn, sleep, isInvalidParticipant } from '../core/utils.js';
import { findChatButton, findSidePanel } from '../dom/dom-manager.js';

let chatPanelPrimed = false;

/**
 * Wait for Meet controls to stabilize before panel priming.
 * @param {number} timeoutMs - Max wait time
 * @returns {Promise<boolean>} True when controls look ready
 */
export async function waitForPrimingReadiness(timeoutMs = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const chatButton = findChatButton();
    const sidePanel = findSidePanel();

    if (chatButton && sidePanel) {
      return true;
    }

    await sleep(150);
  }

  return false;
}

/**
 * Detect whether side panel currently shows chat content.
 * @returns {boolean}
 */
export function hasChatSurfaceVisible() {
  const sidePanel = findSidePanel();
  if (!sidePanel) return false;

  const hasTextbox = !!sidePanel.querySelector('[role="textbox"][aria-label*="message" i], textarea[aria-label*="message" i]');
  const panelText = (sidePanel.textContent || '').toLowerCase();
  const hasChatHeading = panelText.includes('in-call message') || panelText.includes('in-call messages');

  return hasTextbox || hasChatHeading;
}

/**
 * Wait until chat surface state matches expectation.
 * @param {boolean} shouldBeVisible - Desired visibility state
 * @param {number} timeoutMs - Max time to wait
 * @returns {Promise<boolean>} True when state matches
 */
export async function waitForChatSurface(shouldBeVisible, timeoutMs = 2000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (hasChatSurfaceVisible() === shouldBeVisible) {
      return true;
    }

    await sleep(120);
  }

  return false;
}

/**
 * Opens chat panel once to ensure chat DOM is initialized, then closes it.
 * This runs once during startup and avoids continuous chat-panel polling.
 */
export async function primeChatPanelAccessOnce() {
  if (chatPanelPrimed) {
    return;
  }

  const chatButton = findChatButton();
  if (!chatButton) {
    warn('Chat button not found - skipping chat panel priming');
    return;
  }

  const isOpen = chatButton.getAttribute('aria-pressed') === 'true' ||
    chatButton.getAttribute('aria-expanded') === 'true';

  if (isOpen) {
    chatPanelPrimed = true;
    return;
  }

  try {
    await sleep(350);

    chatButton.click();
    await waitForChatSurface(true, 1800);

    await sleep(450);

    chatButton.click();
    await waitForChatSurface(false, 1800);
    await sleep(200);

    chatPanelPrimed = true;
    log('Chat panel primed (opened once then closed)');
  } catch (error) {
    warn('Failed to prime chat panel:', error?.message || error);
  }
}

/**
 * Check whether toast text indicates chat activity.
 * @param {string} textLower - Lowercased toast text
 * @returns {boolean}
 */
export function isChatToastText(textLower) {
  if (!textLower) return false;

  return textLower.includes(CONFIG.PATTERNS.saysInChat) ||
    textLower.includes('says in the chat') ||
    textLower.includes('wrote in chat');
}

/**
 * Extract chat activity from Meet's structured chat toast card.
 * Some variants do not include explicit text like "says in chat".
 * @param {Element} node - Mutation candidate node
 * @returns {{name: string, source: string, dedupeKey: string}|null}
 */
export function extractChatActivityFromToastNode(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;

  const container =
    node.closest('.BQRwGe.eISbSc') ||
    node.querySelector('.BQRwGe.eISbSc');

  if (!container) return null;

  const senderEl = container.querySelector('.jxbsue, .okf28');
  const sender = senderEl?.textContent?.trim();

  const previewEl = container.querySelector('.huGk4e');
  const previewText = previewEl?.textContent?.trim() || '';
  const hasReplyGlyph = (container.textContent || '').toLowerCase().includes('keyboard_return');

  if (!sender) return null;
  if (!previewText && !hasReplyGlyph) return null;

  return {
    name: sender,
    source: 'chat_dom_toast',
    dedupeKey: `${sender.toLowerCase().trim()}:${normalizeToastTextForDedupe(previewText || container.textContent || '')}`
  };
}

/**
 * Normalize toast text into a stable dedupe signature.
 * @param {string} text - Raw toast text
 * @returns {string}
 */
export function normalizeToastTextForDedupe(text) {
  return (text || '')
    .toLowerCase()
    .replace(/keyboard_return/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/**
 * Check if an element looks like a UI element rather than a participant name.
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function isLikelyUIElement(text) {
  if (!text || text.length < 3) return true;

  const textLower = text.toLowerCase().trim();

  const uiPatterns = [
    /^people\d*$/i,
    /^\d+$/,
    /^[a-z]+\d+$/i,
    /^(chat|activities|details)$/i,
    /^(mute|unmute|camera|settings)$/i,
    /aria-label/i,
    /^tooltip/i,
  ];

  return uiPatterns.some(pattern => pattern.test(textLower));
}

/**
 * Validate that a name extracted from toast is a real participant name.
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid toast name
 */
export function isValidToastName(name) {
  if (!name || name.length < 2) return false;
  if (name.length > 60) return false;

  const nameLower = name.toLowerCase().trim();
  if (nameLower.split(/\s+/).length > 5) return false;

  if (isLikelyUIElement(name)) return false;

  if (/^\d+$/.test(name) || name.length === 1) return false;

  const falsePositives = [
    'people', 'chat', 'activities', 'details',
    'mute', 'unmute', 'camera', 'mic', 'video'
  ];

  if (falsePositives.includes(nameLower)) return false;

  if (!/[a-z]/i.test(name)) return false;

  return true;
}

/**
 * Extracts participant name from toast text
 * @param {string} text - Toast text content
 * @param {string} action - Action keyword (joined/left)
 * @returns {string|null} Participant name
 */
export function extractNameFromToast(text, action) {
  const parts = text.split(new RegExp(`\\s*${action}`, 'i'));
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return null;
}

/**
 * Extract sender name from chat-related toast text variants.
 * @param {string} text - Raw toast text
 * @returns {string|null}
 */
export function extractNameFromChatToast(text) {
  if (!text) return null;

  const variants = [
    'says in chat:?',
    'says in the chat:?',
    'wrote in chat:?'
  ];

  for (const variant of variants) {
    const match = text.match(new RegExp(`^(.*?)\\s+${variant}`, 'i'));
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const fallback = extractNameFromToast(text, CONFIG.PATTERNS.saysInChat);
  return fallback || null;
}