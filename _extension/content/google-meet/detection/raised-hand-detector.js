/**
 * Google Meet Raised Hand Detection
 *
 * Detects raised-hand changes from the People panel (no toast dependency).
 * Uses mutation observation with debounce and per-participant dedupe.
 */

import { debounce, isInvalidParticipant } from '../core/utils.js';
import { now } from '../../../utils/date-utils.js';
import { queueEvent } from '../core/event-emitter.js';
import { MESSAGE_TYPES, PLATFORMS } from '../../../utils/constants.js';
import { findSidePanel } from '../dom/dom-manager.js';
import { CONFIG } from '../core/config.js';

const SCAN_DEBOUNCE_MS = 250;
const HAND_RAISE_DEDUP_MS = 8000;

let raisedHandsObserver = null;
let sidePanelWatcher = null;
let currentRaisedHands = new Map(); // normalized name -> { name, position }
let recentRaiseEvents = new Map(); // normalized name -> timestamp

/**
 * Start raised-hand monitoring.
 * @param {Object} state - Content script state
 */
export function startRaisedHandMonitoring(state) {
  stopRaisedHandMonitoring();

  const sidePanel = findSidePanel();
  if (sidePanel) {
    attachRaisedHandsObserver(state, sidePanel);
    return;
  }

  // Wait for side panel to become available.
  sidePanelWatcher = new MutationObserver(() => {
    if (!state.isTracking) return;

    const panel = findSidePanel();
    if (!panel) return;

    sidePanelWatcher.disconnect();
    sidePanelWatcher = null;
    attachRaisedHandsObserver(state, panel);
  });

  sidePanelWatcher.observe(document.body, { childList: true, subtree: true });
}

/**
 * Stop raised-hand monitoring and clear local caches.
 */
export function stopRaisedHandMonitoring() {
  if (raisedHandsObserver) {
    raisedHandsObserver.disconnect();
    raisedHandsObserver = null;
  }

  if (sidePanelWatcher) {
    sidePanelWatcher.disconnect();
    sidePanelWatcher = null;
  }

  currentRaisedHands.clear();
  recentRaiseEvents.clear();
}

/**
 * Attach mutation observer to side panel and run initial scan.
 * @param {Object} state - Content script state
 * @param {Element} sidePanel - Side panel root element
 */
function attachRaisedHandsObserver(state, sidePanel) {
  const debouncedScan = debounce(() => {
    if (!state.isTracking) return;
    scanRaisedHands(state);
  }, SCAN_DEBOUNCE_MS);

  raisedHandsObserver = new MutationObserver(() => {
    debouncedScan();
  });

  raisedHandsObserver.observe(sidePanel, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label']
  });

  // Prime state without emitting historical raises.
  const initial = collectRaisedHands();
  currentRaisedHands = initial;
}

/**
 * Scan raised-hands region and emit raised transitions.
 * @param {Object} state - Content script state
 */
function scanRaisedHands(state) {
  const nextRaisedHands = collectRaisedHands();
  const timestamp = Date.now();

  for (const [normalizedName, info] of nextRaisedHands.entries()) {
    if (currentRaisedHands.has(normalizedName)) continue;

    const lastSeen = recentRaiseEvents.get(normalizedName) || 0;
    if (timestamp - lastSeen < HAND_RAISE_DEDUP_MS) {
      continue;
    }

    recentRaiseEvents.set(normalizedName, timestamp);

    queueEvent(MESSAGE_TYPES.HAND_RAISE, {
      platform: PLATFORMS.GOOGLE_MEET,
      meetingId: state.meetingId,
      name: info.name,
      handState: 'raised',
      queuePosition: info.position,
      source: 'people_panel',
      timestamp: now()
    });
  }

  currentRaisedHands = nextRaisedHands;

  // Prevent unbounded growth in long sessions.
  if (recentRaiseEvents.size > 200) {
    const cutoff = timestamp - HAND_RAISE_DEDUP_MS;
    for (const [name, seenAt] of recentRaiseEvents.entries()) {
      if (seenAt < cutoff) {
        recentRaiseEvents.delete(name);
      }
    }
  }
}

/**
 * Collect current raised-hands list from side panel.
 * @returns {Map<string, {name: string, position: number}>}
 */
function collectRaisedHands() {
  const raisedMap = new Map();
  const sidePanel = findSidePanel();
  if (!sidePanel) {
    return raisedMap;
  }

  const raisedRegion =
    sidePanel.querySelector('[role="region"][aria-label="Raised hands"]') ||
    sidePanel.querySelector('[role="region"][aria-label*="Raised hands" i]');

  if (!raisedRegion) {
    return raisedMap;
  }

  const items = raisedRegion.querySelectorAll('[role="listitem"]');
  let position = 1;

  for (const item of items) {
    const extractedName = extractRaisedHandName(item);
    if (!extractedName || isInvalidParticipant(extractedName, CONFIG)) {
      continue;
    }

    const normalizedName = extractedName.toLowerCase().trim();
    if (raisedMap.has(normalizedName)) {
      continue;
    }

    raisedMap.set(normalizedName, {
      name: extractedName,
      position
    });
    position += 1;
  }

  return raisedMap;
}

/**
 * Extract participant name from raised-hands list item.
 * @param {Element} item - Raised hand listitem
 * @returns {string|null}
 */
function extractRaisedHandName(item) {
  const ariaLabel = item.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }

  const genericNodes = item.querySelectorAll('[role="generic"], span, div');
  for (const node of genericNodes) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (text.toLowerCase() === 'front_hand') continue;
    if (text.toLowerCase().startsWith('lower')) continue;
    if (text.length < 2) continue;
    return text;
  }

  return null;
}
