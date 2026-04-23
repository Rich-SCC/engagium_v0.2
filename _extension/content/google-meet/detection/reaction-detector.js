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
  'keep_outline',
  'keep_outlinepin',
  'meeting host',
  'people',
  'chat',
  'details',
  'call controls',
  'tooltip',
  'open queue',
  'lower all',
  'more_vert',
  'send a reaction',
  'contributors'
]);

let reactionObserver = null;
let recentReactionByParticipant = new Map();
let pendingRoots = new Set();
let pendingFlushTimer = null;

/**
 * Start floating reaction monitoring.
 * @param {Object} state - Content script state
 */
export function startReactionMonitoring(state) {
  stopReactionMonitoring();

  reactionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            pendingRoots.add(node);
          }
        }
      }

      if (mutation.type === 'attributes' && mutation.target?.nodeType === Node.ELEMENT_NODE) {
        pendingRoots.add(mutation.target);
      }

      if (mutation.type === 'characterData' && mutation.target?.parentElement) {
        pendingRoots.add(mutation.target.parentElement);
      }
    }

    if (!pendingFlushTimer) {
      pendingFlushTimer = setTimeout(() => {
        pendingFlushTimer = null;
        if (!state.isTracking || pendingRoots.size === 0) return;

        const roots = Array.from(pendingRoots);
        pendingRoots.clear();

        for (const root of roots) {
          processNode(state, root);
        }
      }, SCAN_DEBOUNCE_MS);
    }
  });

  reactionObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
    attributeFilter: ['aria-label', 'alt', 'src']
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

  if (pendingFlushTimer) {
    clearTimeout(pendingFlushTimer);
    pendingFlushTimer = null;
  }

  pendingRoots.clear();

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
    const reaction = normalizeReaction(img.getAttribute('aria-label') || img.getAttribute('alt'));
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

  if (rootNode.tagName === 'IMG' && (rootNode.hasAttribute('aria-label') || rootNode.hasAttribute('alt'))) {
    images.push(rootNode);
  }

  if (rootNode.getAttribute?.('role') === 'img' && rootNode.hasAttribute('aria-label')) {
    images.push(rootNode);
  }

  const descendants = rootNode.querySelectorAll?.('img[aria-label], img[alt], [role="img"][aria-label]') || [];
  descendants.forEach((img) => images.push(img));

  return images.filter((img) => isFloatingReactionBubble(img));
}

/**
 * Determine whether a node belongs to the floating reaction bubble, not the picker UI.
 * @param {Element} node - Candidate node
 * @returns {boolean}
 */
function isFloatingReactionBubble(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  // Real invoked reactions in this Meet variant render inside html-blob wrappers.
  if (!node.closest('html-blob')) {
    return false;
  }

  // Exclude the reaction chooser UI and similar control buttons.
  if (node.closest('button')) {
    return false;
  }

  const rawLabel = (node.getAttribute?.('aria-label') || node.getAttribute?.('alt') || '').trim();
  if (rawLabel === 'Send a reaction') {
    return false;
  }

  return true;
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

  const emojiMatch = reaction.match(CONFIG.EMOJI_REGEX || /[\u{1F300}-\u{1FAFF}]/u);
  if (emojiMatch?.[0]) {
    return emojiMatch[0];
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

  // Fallback: use the first clean participant-like label near the floating bubble.
  for (const candidate of candidates) {
    const cleaned = cleanCandidateName(candidate);
    if (isLikelyParticipantCandidate(cleaned)) {
      return cleaned;
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
      addCandidate(out, cursor.getAttribute('title'));
      const ariaLabel = cursor.getAttribute('aria-label');
      addCandidate(out, ariaLabel);

      const labelledBy = cursor.getAttribute('aria-labelledby');
      if (labelledBy) {
        for (const id of labelledBy.split(/\s+/)) {
          addReferencedCandidates(out, id);
        }
      }

      const describedBy = cursor.getAttribute('aria-describedby');
      if (describedBy) {
        for (const id of describedBy.split(/\s+/)) {
          addReferencedCandidates(out, id);
        }
      }

      const text = cursor.textContent;
      addCandidate(out, text);

      const nested = cursor.querySelectorAll('span, div, [role="generic"]');
      for (const node of nested) {
        addCandidate(out, node.textContent);
        addCandidate(out, node.getAttribute?.('title'));
        const nodeLabelledBy = node.getAttribute?.('aria-labelledby');
        if (nodeLabelledBy) {
          for (const id of nodeLabelledBy.split(/\s+/)) {
            addReferencedCandidates(out, id);
          }
        }
      }

      addSiblingCandidates(out, cursor.previousElementSibling);
      addSiblingCandidates(out, cursor.nextElementSibling);
    }

    cursor = cursor.parentElement;
    depth += 1;
  }

  return [...new Set(out)];
}

/**
 * Add candidate text from an aria-referenced element.
 * @param {string[]} target - Candidate list
 * @param {string} id - Referenced element id
 */
function addReferencedCandidates(target, id) {
  if (!id) return;

  const ref = document.getElementById(id);
  if (!ref) return;

  addCandidate(target, ref.getAttribute('aria-label'));
  addCandidate(target, ref.getAttribute('title'));
  addCandidate(target, ref.textContent);
}

/**
 * Add candidate text from a sibling subtree.
 * @param {string[]} target - Candidate list
 * @param {Element|null} sibling - Adjacent element
 */
function addSiblingCandidates(target, sibling) {
  if (!sibling || sibling.nodeType !== Node.ELEMENT_NODE) return;

  addCandidate(target, sibling.getAttribute('aria-label'));
  addCandidate(target, sibling.getAttribute('title'));
  addCandidate(target, sibling.textContent);

  const referenced = sibling.getAttribute('aria-labelledby');
  if (referenced) {
    for (const id of referenced.split(/\s+/)) {
      addReferencedCandidates(target, id);
    }
  }
}

/**
 * Add normalized candidate to output list when valid.
 * @param {string[]} target - Candidate list
 * @param {string|null|undefined} rawText - Candidate text
 */
function addCandidate(target, rawText) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) return;
  if (text.length < 2 || text.length > 120) return;
  if (ALLOWED_REACTIONS.has(text)) return;

  const normalized = text.toLowerCase().trim();
  if (NOISE_TOKENS.has(normalized)) return;
  if (normalized === 'send a reaction') return;
  if (!/[\p{L}]/u.test(text)) return;
  if (normalized.split(/\s+/).length > 12) return;
  if (isInvalidParticipant(text, CONFIG)) return;

  target.push(text);
}

/**
 * Clean noisy suffixes from a candidate label.
 * @param {string} text - Raw candidate text
 * @returns {string}
 */
function cleanCandidateName(text) {
  return (text || '')
    .replace(/\s*You can't unmute someone else.*$/i, '')
    .replace(/\s*Send a reaction.*$/i, '')
    .replace(/\s*More options for .*$/i, '')
    .replace(/\s*Pin .* to your main screen.*$/i, '')
    .replace(/\s*Open queue.*$/i, '')
    .replace(/\s*Lower all hands.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine if a cleaned label looks like a participant name.
 * @param {string} text - Cleaned candidate text
 * @returns {boolean}
 */
function isLikelyParticipantCandidate(text) {
  if (!text) return false;
  if (ALLOWED_REACTIONS.has(text)) return false;
  if (isInvalidParticipant(text, CONFIG)) return false;

  const lower = text.toLowerCase().trim();
  if (NOISE_TOKENS.has(lower)) return false;
  if (lower === 'send a reaction') return false;
  if (lower.startsWith('keep_outline')) return false;
  if (lower.includes('meeting host')) return false;
  if (lower.includes('you can\'t unmute')) return false;
  if (lower.includes('more options for')) return false;
  if (lower.includes('reacted')) return false;

  return true;
}
