/**
 * Google Meet Floating Reaction Detection
 *
 * Detects reactions from transient floating emoji nodes. This path is used as
 * a fallback when reaction toast text is unavailable in newer Meet variants.
 */

import { isInvalidParticipant } from '../core/utils.js';
import { queueEvent } from '../core/event-emitter.js';
import { now } from '../../../utils/date-utils.js';
import { MESSAGE_TYPES, PLATFORMS } from '../../../utils/constants.js';
import { CONFIG } from '../core/config.js';

const SCAN_DEBOUNCE_MS = 120;
const NAME_REACTION_DEDUP_MS = 4500;
const ALLOWED_REACTIONS = new Set(CONFIG.REACTIONS || []);
const NOISE_TOKENS = new Set([
  'you',
  'devices',
  'reframe',
  'engagium',
  'meeting host',
  'people',
  'chat',
  'details',
  'call controls',
  'tooltip',
  'open queue',
  'lower all',
  'contributors'
]);

let reactionObserver = null;
let reactionScanTimeout = null;
let pendingReactionRoots = new Set();
let recentReactionByParticipant = new Map();

/**
 * Start floating reaction monitoring.
 * @param {Object} state - Content script state
 */
export function startReactionMonitoring(state) {
  stopReactionMonitoring();

  reactionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        pendingReactionRoots.add(node);
      }
    }

    if (reactionScanTimeout) return;

    reactionScanTimeout = setTimeout(() => {
      reactionScanTimeout = null;

      if (!state.isTracking) {
        pendingReactionRoots.clear();
        return;
      }

      const roots = [...pendingReactionRoots];
      pendingReactionRoots.clear();

      for (const rootNode of roots) {
        processNode(state, rootNode);
      }
    }, SCAN_DEBOUNCE_MS);
  });

  reactionObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Stop reaction monitoring and clear dedupe state.
 */
export function stopReactionMonitoring() {
  if (reactionObserver) {
    reactionObserver.disconnect();
    reactionObserver = null;
  }

  if (reactionScanTimeout) {
    clearTimeout(reactionScanTimeout);
    reactionScanTimeout = null;
  }

  pendingReactionRoots.clear();

  recentReactionByParticipant.clear();
}

/**
 * Process a mutation candidate and emit reaction events.
 * @param {Object} state - Content script state
 * @param {Element} rootNode - Added DOM node
 */
function processNode(state, rootNode) {
  const emojiImages = collectReactionImages(rootNode);
  if (emojiImages.length === 0) {
    return;
  }

  for (const img of emojiImages) {
    const reaction = normalizeReaction(img.getAttribute('aria-label'));
    if (!reaction) continue;

    const participantName = resolveParticipantName(img, state);
    if (!participantName) continue;

    const normalizedName = participantName.toLowerCase().trim();
    const dedupeKey = `${normalizedName}|${reaction}`;
    const lastSeen = recentReactionByParticipant.get(dedupeKey) || 0;
    const nowMs = Date.now();

    if (nowMs - lastSeen < NAME_REACTION_DEDUP_MS) {
      continue;
    }

    recentReactionByParticipant.set(dedupeKey, nowMs);

    queueEvent(MESSAGE_TYPES.REACTION, {
      platform: PLATFORMS.GOOGLE_MEET,
      meetingId: state.meetingId,
      name: participantName,
      reaction,
      source: 'floating_reaction_emoji',
      timestamp: now()
    });
  }

  if (recentReactionByParticipant.size > 300) {
    const cutoff = Date.now() - NAME_REACTION_DEDUP_MS;
    for (const [key, ts] of recentReactionByParticipant.entries()) {
      if (ts < cutoff) {
        recentReactionByParticipant.delete(key);
      }
    }
  }
}

/**
 * Collect candidate emoji images from a node and descendants.
 * @param {Element} rootNode - Mutation candidate
 * @returns {Element[]}
 */
function collectReactionImages(rootNode) {
  const images = [];

  if (rootNode.hasAttribute?.('aria-label')) {
    images.push(rootNode);
  }

  const descendants = rootNode.querySelectorAll?.('img[aria-label], [role="img"][aria-label], [aria-label]') || [];
  descendants.forEach((img) => images.push(img));

  return images;
}

/**
 * Normalize reaction from aria-label and filter unsupported labels.
 * @param {string|null} raw - Raw aria-label value
 * @returns {string|null}
 */
function normalizeReaction(raw) {
  const reaction = (raw || '').trim();
  if (!reaction) return null;

  if (ALLOWED_REACTIONS.has(reaction)) {
    return reaction;
  }

  if (CONFIG.EMOJI_REGEX?.test(reaction)) {
    return reaction;
  }

  return null;
}

/**
 * Resolve participant name from floating reaction context.
 * Prefers known participants in state to avoid UI noise labels.
 * @param {Element} img - Emoji image node
 * @param {Object} state - Content script state
 * @returns {string|null}
 */
function resolveParticipantName(img, state) {
  const knownNames = Array.from(state.participants.values()).map((p) => p.name).filter(Boolean);
  const knownNormalized = new Map(knownNames.map((name) => [name.toLowerCase().trim(), name]));

  const candidates = extractNameCandidates(img);
  if (candidates.length === 0) {
    return null;
  }

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase().trim();
    if (knownNormalized.has(normalized)) {
      return knownNormalized.get(normalized);
    }
  }

  // Fuzzy fallback: candidate contains participant full name or vice versa.
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();
    for (const known of knownNames) {
      const normalizedKnown = known.toLowerCase().trim();
      if (normalizedCandidate.includes(normalizedKnown) || normalizedKnown.includes(normalizedCandidate)) {
        return known;
      }
    }
  }

  return null;
}

/**
 * Extract possible names from nearby context around emoji node.
 * @param {Element} img - Emoji image node
 * @returns {string[]}
 */
function extractNameCandidates(img) {
  const out = [];
  let cursor = img;
  let depth = 0;

  while (cursor && cursor !== document.body && depth < 7) {
    if (cursor.nodeType === Node.ELEMENT_NODE) {
      const ariaLabel = cursor.getAttribute('aria-label');
      addCandidate(out, ariaLabel);

      const text = cursor.textContent;
      addCandidate(out, text);

      const nested = cursor.querySelectorAll('span, div, [role="generic"]');
      for (const node of nested) {
        addCandidate(out, node.textContent);
      }
    }

    cursor = cursor.parentElement;
    depth += 1;
  }

  return [...new Set(out)];
}

/**
 * Add normalized candidate to output list when valid.
 * @param {string[]} target - Candidate list
 * @param {string|null|undefined} rawText - Candidate text
 */
function addCandidate(target, rawText) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) return;
  if (text.length < 2 || text.length > 64) return;
  if (ALLOWED_REACTIONS.has(text)) return;

  const normalized = text.toLowerCase().trim();
  if (NOISE_TOKENS.has(normalized)) return;
  if (!/[a-z]/i.test(text)) return;
  if (normalized.split(/\s+/).length > 4) return;
  if (isInvalidParticipant(text, CONFIG)) return;

  target.push(text);
}
