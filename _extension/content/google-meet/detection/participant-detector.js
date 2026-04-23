/**
 * Google Meet Content Script - Participant Detector
 * Updated December 2025 with centralized DOM management
 * 
 * Detection Strategy:
 * 1. PRIMARY: People Panel (list[aria-label="Participants"])
 *    - Contains ALL participants regardless of video grid layout
 *    - Shows mic muted status via disabled "unmute" button
 * 
 * 2. SECONDARY: Toast notifications for join/leave timestamps
 * 
 * Optimizations:
 * - Uses centralized DOM manager for cached element queries
 * - Uses panel manager to prevent unnecessary open/close operations
 * - Batches multiple detection requests to minimize panel toggles
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

import { CONFIG, cleanParticipantName, isValidParticipantName } from '../core/config.js';
import { generateParticipantId, log, warn, sleep, isInvalidParticipant } from '../core/utils.js';
import { queueEvent, sendImmediate } from '../core/event-emitter.js';
import { MESSAGE_TYPES, PLATFORMS } from '../../../utils/constants.js';
import { now } from '../../../utils/date-utils.js';
import { withPanelOpen } from '../dom/panel-manager.js';
import { findParticipantsList, detectPeoplePanelBehavior, findSidePanel } from '../dom/dom-manager.js';
import {
  waitForPrimingReadiness,
  primeChatPanelAccessOnce,
  isChatToastText,
  extractChatActivityFromToastNode,
  normalizeToastTextForDedupe,
  isValidToastName,
  isLikelyUIElement,
  extractNameFromToast,
  extractNameFromChatToast
} from './chat-detector.js';
import { maybeEmitMicToggle } from './mic-toggle-detector.js';
import { startRaisedHandMonitoring, stopRaisedHandMonitoring } from './raised-hand-detector.js';
import { startReactionMonitoring, stopReactionMonitoring } from './reaction-detector.js';
import { showRetroactiveCaptureNotification } from '../ui/meeting-notifications.js';

let peoplePanelObserver = null;
let toastObserver = null;
let panelWatcher = null;
let passiveScanInterval = null;
let recentToasts = new Map(); // Track recent toasts to prevent duplicates
let reactionDebounceByParticipant = new Map(); // participant name (lowercase) -> timestamp
let pendingScans = []; // Queue for batching scan requests
let scanTimeout = null;

/**
 * CENTRALIZED WORKFLOW: open → scan → send → close
 * Uses panel manager for intelligent state management
 * @param {Object} state - State object
 * @param {Function} scanFunction - Function to call for scanning (receives state)
 * @param {string} reason - Reason for workflow (for logging)
 */
async function executeDetectionWorkflow(state, scanFunction, reason) {
  log(`Detection workflow: ${reason}`);
  
  return withPanelOpen(async () => {
    // Small delay to ensure DOM is ready
    await sleep(50);
    
    // Execute scan steps; supports async workflows for startup prep actions.
    await Promise.resolve(scanFunction(state));
    
    return true;
  }, reason);
}

/**
 * Batch multiple scan requests together to prevent rapid panel toggles
 * @param {Object} state - State object
 * @param {Function} scanFunction - Scan function to queue
 * @param {string} reason - Reason for scan
 */
function queueScan(state, scanFunction, reason) {
  // Add to pending queue
  pendingScans.push({ state, scanFunction, reason });
  
  // Clear existing timeout
  if (scanTimeout) {
    clearTimeout(scanTimeout);
  }
  
  // Execute all pending scans after a short delay
  scanTimeout = setTimeout(async () => {
    if (pendingScans.length === 0) return;
    
    const scans = [...pendingScans];
    pendingScans = [];
    
    log(`Executing ${scans.length} batched scans`);

    // In persistent-data mode, once the panel has been opened at least once,
    // participant list data remains readable even when visually closed.
    if (canScanWithoutOpeningPanel()) {
      for (const { state, scanFunction, reason } of scans) {
        log(`  - ${reason} (passive)`);
        scanFunction(state);
      }
      return;
    }

    // Toggle-data fallback: execute with panel open.
    await withPanelOpen(async () => {
      await sleep(50); // DOM stability
      
      for (const { state, scanFunction, reason } of scans) {
        log(`  - ${reason}`);
        scanFunction(state);
        await sleep(20); // Small delay between scans
      }
    }, `batch of ${scans.length} scans`);
  }, 200); // 200ms debounce
}

/**
 * Determine whether scans can run without opening the people panel.
 * @returns {boolean}
 */
function canScanWithoutOpeningPanel() {
  // If participants list remains in DOM, we can read it passively without forcing panel open.
  return !!findParticipantsList();
}

/**
 * Start passive participant/mic scans.
 * @param {Object} state - State object
 */
function startPassiveScanLoop(state) {
  if (passiveScanInterval) {
    clearInterval(passiveScanInterval);
  }

  passiveScanInterval = setInterval(() => {
    if (!state.isTracking) {
      return;
    }

    const passiveReadable = canScanWithoutOpeningPanel();

    // Always run periodic participant/mic scan.
    // If passive-readable, this does not toggle panel.
    // If not passive-readable, queueScan falls back to panel-managed workflow.
    queueScan(
      state,
      rescanAndDetectNew,
      passiveReadable
        ? 'passive scan - new participants and mic changes'
        : 'periodic scan - new participants and mic changes'
    );

    // Leave detection is safer when panel data is passively readable.
    if (passiveReadable) {
      queueScan(state, detectLeftParticipants, 'passive scan - detect leaves');
    }
  }, 5000);
}

/**
 * Starts monitoring participants using People Panel + Toast notifications
 * @param {Object} state - State object
 */
export function startParticipantMonitoring(state) {
  log('Starting participant monitoring (optimized with centralized DOM)...');
  
  // Detect normalized panel behavior mode
  const panelBehavior = detectPeoplePanelBehavior();
  log(`Detected panel behavior mode: ${panelBehavior}`);
  
  // Initial scan using centralized workflow
  // The UI should already be ready from the caller's waitForMeetingUI check
  executeDetectionWorkflow(state, async (state) => {
    scanCurrentParticipants(state);

    // Show retroactive capture notification if participants were found
    const participantCount = state.participants.size;
    if (participantCount > 0) {
      log(`Retroactively captured ${participantCount} participants already in meeting`);
      showRetroactiveCaptureNotification(participantCount);
    }
  }, 'initial scan').then(async () => {
    // Give Meet a moment to settle after the People panel lifecycle before touching Chat.
    await sleep(250);

    const readyForPrime = await waitForPrimingReadiness();
    if (!readyForPrime) {
      warn('Skipping chat priming - Meet UI not fully ready yet');
    } else {
      await primeChatPanelAccessOnce();
    }

    // Set up People Panel observer (primary source)
    if (!setupPeoplePanelObserver(state)) {
      // Panel not found yet, watch for it
      setupPanelWatcher(state);
    }

    // Start periodic scanning for mic/participant changes.
    startPassiveScanLoop(state);

    // Toasts are required for chat activity and reaction events in all panel modes.
    // Join/leave handlers inside the observer still use mode-aware scan behavior.
    setupToastObserver(state);
    log('Toast observer enabled (join/leave + chat + reaction triggers)');

    // Raised hands are sourced from the People panel section (no toast dependency).
    startRaisedHandMonitoring(state);
    log('Raised hand detector enabled (people panel state trigger)');

    // Floating reactions fallback for Meet variants without reaction toast text.
    startReactionMonitoring(state);
    log('Reaction detector enabled (floating emoji fallback)');
  });
}

/**
 * Stops monitoring participants
 * @param {Object} state - State object
 */
export function stopParticipantMonitoring(state) {
  if (peoplePanelObserver) {
    peoplePanelObserver.disconnect();
    peoplePanelObserver = null;
  }
  if (toastObserver) {
    toastObserver.disconnect();
    toastObserver = null;
  }
  if (panelWatcher) {
    panelWatcher.disconnect();
    panelWatcher = null;
  }
  
  // Clear any pending scans
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }
  if (passiveScanInterval) {
    clearInterval(passiveScanInterval);
    passiveScanInterval = null;
  }
  pendingScans = [];
  reactionDebounceByParticipant.clear();
  stopRaisedHandMonitoring();
  stopReactionMonitoring();
  
  log('Participant monitoring stopped');
}

/**
 * Sets up toast observer for join/leave notifications
 * Toasts provide exact timestamps for events
 * @param {Object} state - State object
 */
function setupToastObserver(state) {
  toastObserver = new MutationObserver((mutations) => {
    if (!state.isTracking) return;
    
    for (const mutation of mutations) {
      const candidateNodes = [];

      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            candidateNodes.push(node);
          }
        }
      }

      if (mutation.type === 'characterData') {
        const elementNode = mutation.target?.parentElement;
        if (elementNode) {
          candidateNodes.push(elementNode);
        }
      }

      for (const node of candidateNodes) {
        const text = node.textContent?.trim() || '';
        const textLower = text.toLowerCase();
        
        // Skip if this looks like a UI element (tooltips, button text, etc.)
        // Common patterns: "People" + number, single words, short text
        if (isLikelyUIElement(text)) {
          continue;
        }
        
        // Check for join notification
        if (textLower.includes(CONFIG.PATTERNS.joined)) {
          const name = extractNameFromToast(text, CONFIG.PATTERNS.joined);
          if (name && !isInvalidParticipant(name, CONFIG) && isValidToastName(name)) {
            // Prevent duplicate processing of the same toast
            const recentKey = `join:${name}`;
            const lastSeen = recentToasts.get(recentKey);
            
            // Ignore if we saw this exact toast within the last 2 seconds
            if (lastSeen && Date.now() - lastSeen < 2000) {
              return;
            }
            
            recentToasts.set(recentKey, Date.now());
            // Clean up old entries after 5 seconds
            setTimeout(() => recentToasts.delete(recentKey), 5000);
            
            log('Toast: Participant joined:', name);
            
            // Queue scan to batch with other potential toasts
            queueScan(state, (state) => {
              rescanAndDetectNew(state);
            }, `join toast: ${name}`);
          }
        }
        
        // Check for leave notification
        if (textLower.includes(CONFIG.PATTERNS.left)) {
          const name = extractNameFromToast(text, CONFIG.PATTERNS.left);
          if (name && !isInvalidParticipant(name, CONFIG) && isValidToastName(name)) {
            // Prevent duplicate processing of the same toast
            const recentKey = `leave:${name}`;
            const lastSeen = recentToasts.get(recentKey);
            
            // Ignore if we saw this exact toast within the last 2 seconds
            if (lastSeen && Date.now() - lastSeen < 2000) {
              return;
            }
            
            recentToasts.set(recentKey, Date.now());
            // Clean up old entries after 5 seconds
            setTimeout(() => recentToasts.delete(recentKey), 5000);
            
            log('Toast: Participant left:', name);
            
            // Queue scan to batch with other potential toasts
            queueScan(state, (state) => {
              detectLeftParticipants(state);
            }, `leave toast: ${name}`);
          }
        }

        // Track chat activity from toast only (privacy-preserving, no message content)
        const chatToastData = extractChatActivityFromToastNode(node);
        if (chatToastData || isChatToastText(textLower)) {
          const sender = chatToastData?.name || extractNameFromChatToast(text);

          if (!sender && textLower.includes('chat')) {
            log('Chat-like toast detected but sender parse failed', {
              rawText: text.slice(0, 200)
            });
          }

          if (sender && !isInvalidParticipant(sender, CONFIG) && isValidToastName(sender)) {
            const dedupeSignature = chatToastData?.dedupeKey || `${sender}:${normalizeToastTextForDedupe(text)}`;
            const recentKey = `chat:${dedupeSignature}`;
            const lastSeen = recentToasts.get(recentKey);

            if (lastSeen && Date.now() - lastSeen < 2000) {
              continue;
            }

            recentToasts.set(recentKey, Date.now());
            setTimeout(() => recentToasts.delete(recentKey), 5000);

            const detectedAt = now();
            log('Chat detected (toast trigger)', {
              platform: PLATFORMS.GOOGLE_MEET,
              meetingId: state.meetingId,
              name: sender,
              source: chatToastData?.source || 'chat_text_toast',
              timestamp: detectedAt
            });

            sendImmediate(MESSAGE_TYPES.CHAT_ACTIVITY, {
              platform: PLATFORMS.GOOGLE_MEET,
              meetingId: state.meetingId,
              name: sender,
              source: chatToastData?.source || 'chat_text_toast',
              timestamp: detectedAt
            });
          }
        }

        // Track reactions from toasts with 5s per-participant debounce
        if (textLower.includes(CONFIG.PATTERNS.reactedWith) || /\breacted\b/i.test(text)) {
          const reaction = extractReactionFromToast(text);
          const name = extractNameFromReactionToast(text);
          if (name && reaction && !isInvalidParticipant(name, CONFIG) && isValidToastName(name)) {
            const normalized = name.toLowerCase().trim();
            const lastSeen = reactionDebounceByParticipant.get(normalized) || 0;

            if (Date.now() - lastSeen >= 5000) {
              reactionDebounceByParticipant.set(normalized, Date.now());

              sendImmediate(MESSAGE_TYPES.REACTION, {
                platform: PLATFORMS.GOOGLE_MEET,
                meetingId: state.meetingId,
                name,
                reaction,
                source: 'reaction_toast',
                timestamp: now()
              });
            }
          }
        }
      }
    }
  });
  
  toastObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  log('Toast observer active for join/leave notifications');
}

/**
 * Extract participant name from a reaction toast.
 * Handles variants like "Name reacted 👍" and "Name reacted with 👍".
 * @param {string} text - Toast text content
 * @returns {string|null}
 */
function extractNameFromReactionToast(text) {
  if (!text) return null;

  const patterns = [
    /^(.*?)\s+reacted\s+with\b/i,
    /^(.*?)\s+reacted\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = cleanReactionToastName(match[1]);
      if (cleaned && cleaned !== 'keep_outline') {
        return cleaned;
      }
    }
  }

  const cleanedFallback = cleanReactionToastName(text);
  return cleanedFallback && cleanedFallback !== 'keep_outline' ? cleanedFallback : null;
}

/**
 * Remove UI prefixes/suffixes from a reaction toast sender candidate.
 * @param {string} value - Raw sender candidate
 * @returns {string}
 */
function cleanReactionToastName(value) {
  return (value || '')
    .replace(/^keep_outline$/i, '')
    .replace(/^keep_outline\s+/i, '')
    .replace(/^person\s+/i, '')
    .replace(/^account_circle\s+/i, '')
    .replace(/\s*reacted.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract reaction value from a reaction toast
 * @param {string} text - Toast text content
 * @returns {string|null} Reaction string or null
 */
function extractReactionFromToast(text) {
  const parts = text.split(new RegExp(`\\s*${CONFIG.PATTERNS.reactedWith}\\s*`, 'i'));
  if (parts.length < 2) return null;

  const reaction = parts[1].trim();
  return reaction || null;
}

/**
 * Sets up observer on People Panel for participant changes
 * Uses DOM manager for cached element queries
 * @param {Object} state - State object
 * @returns {boolean} True if observer was set up successfully
 */
function setupPeoplePanelObserver(state) {
  // Find the participants list using DOM manager
  const participantsList = findParticipantsList();
  
  if (!participantsList) {
    warn('Participants list not found - People Panel may be closed');
    return false;
  }
  
  peoplePanelObserver = new MutationObserver(() => {
    if (!state.isTracking) return;
    
    // Debounce the rescan and batch multiple changes
    clearTimeout(state._panelRescanTimeout);
    state._panelRescanTimeout = setTimeout(() => {
      // Queue scans to be batched together
      queueScan(state, rescanAndDetectNew, 'panel mutation - new');
      queueScan(state, detectLeftParticipants, 'panel mutation - left');
    }, CONFIG.DEBOUNCE.PANEL_SCAN);
  });
  
  // Observe the side panel using DOM manager
  const sidePanel = findSidePanel();
  if (sidePanel) {
    peoplePanelObserver.observe(sidePanel, {
      childList: true,
      subtree: true
    });
    log('People Panel observer active (using cached DOM queries)');
    return true;
  }
  
  return false;
}

/**
 * Watches for People Panel to appear and sets up observer
 * @param {Object} state - State object
 */
function setupPanelWatcher(state) {
  panelWatcher = new MutationObserver(() => {
    if (setupPeoplePanelObserver(state)) {
      panelWatcher.disconnect();
      panelWatcher = null;
      log('People Panel found, observer attached');
      // Rescan after panel appears
      scanCurrentParticipants(state);
    }
  });
  
  panelWatcher.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Removed: findParticipantsList() - now using DOM manager's cached version

/**
 * Scans current participants in the People Panel
 * @param {Object} state - State object
 */
function scanCurrentParticipants(state) {
  const participants = extractAllParticipants();
  
  for (const participant of participants) {
    if (!participant.id || isInvalidParticipant(participant.name)) continue;
    
    // Skip self
    if (participant.isSelf) continue;
    
    // Skip presentations
    if (participant.isPresentation) continue;
    
    if (!state.participants.has(participant.id)) {
      state.participants.set(participant.id, {
        ...participant,
        joinedAt: now(),
        leftAt: null
      });
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
        platform: PLATFORMS.GOOGLE_MEET,
        meetingId: state.meetingId,
        participant: {
          id: participant.id,
          name: participant.name,
          isMuted: participant.isMuted,
          joinedAt: now()
        }
      });
    } else {
      // Check if this participant has rejoined (was marked as left but is now present)
      const existing = state.participants.get(participant.id);
      
      if (existing.leftAt) {
        log('Participant rejoined (detected in scan):', participant.name);
        
        // Clear leftAt and update joinedAt to mark rejoin
        existing.leftAt = null;
        existing.joinedAt = now();
        existing.isMuted = participant.isMuted;
        
        // Send PARTICIPANT_JOINED event for the rejoin
        sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
          platform: PLATFORMS.GOOGLE_MEET,
          meetingId: state.meetingId,
          participant: {
            id: participant.id,
            name: participant.name,
            isMuted: participant.isMuted,
            joinedAt: now()
          }
        });
      } else {
        maybeEmitMicToggle(state, participant, existing);
        // Update cached mic status for participants who never left
        existing.isMuted = participant.isMuted;
      }
    }
  }
  
  log('Initial scan:', state.participants.size, 'participants');
}

// Export for compatibility
export { scanCurrentParticipants as scanParticipants };

/**
 * Rescans participants and detects new ones
 * @param {Object} state - State object
 */
function rescanAndDetectNew(state) {
  const participants = extractAllParticipants();
  
  for (const participant of participants) {
    if (!participant.id || isInvalidParticipant(participant.name)) continue;
    if (participant.isSelf || participant.isPresentation) continue;
    
    if (!state.participants.has(participant.id)) {
      log('New participant detected:', participant.name);
      
      state.participants.set(participant.id, {
        ...participant,
        joinedAt: now(),
        leftAt: null
      });
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
        platform: PLATFORMS.GOOGLE_MEET,
        meetingId: state.meetingId,
        participant: {
          id: participant.id,
          name: participant.name,
          isMuted: participant.isMuted,
          joinedAt: now()
        }
      });
    } else {
      // Check if this participant has rejoined (was marked as left but is now present)
      const existing = state.participants.get(participant.id);
      
      if (existing.leftAt) {
        log('Participant rejoined:', participant.name);
        
        // Clear leftAt and update joinedAt to mark rejoin
        existing.leftAt = null;
        existing.joinedAt = now();
        existing.isMuted = participant.isMuted;
        
        // Send PARTICIPANT_JOINED event for the rejoin
        sendImmediate(MESSAGE_TYPES.PARTICIPANT_JOINED, {
          platform: PLATFORMS.GOOGLE_MEET,
          meetingId: state.meetingId,
          participant: {
            id: participant.id,
            name: participant.name,
            isMuted: participant.isMuted,
            joinedAt: now()
          }
        });
      } else {
        maybeEmitMicToggle(state, participant, existing);
        // Update cached mic status for participants who never left
        existing.isMuted = participant.isMuted;
      }
    }
  }
}

/**
 * Detects participants who have left
 * @param {Object} state - State object
 */
function detectLeftParticipants(state) {
  const currentNames = new Set();
  const participants = extractAllParticipants();
  
  for (const p of participants) {
    if (!p.isSelf && !p.isPresentation) {
      currentNames.add(p.name);
    }
  }
  
  // Check which tracked participants are no longer present
  for (const [participantId, participant] of state.participants.entries()) {
    if (participant.leftAt) continue; // Already marked as left
    
    if (!currentNames.has(participant.name)) {
      log('Participant left:', participant.name);
      participant.leftAt = now();
      
      sendImmediate(MESSAGE_TYPES.PARTICIPANT_LEFT, {
        platform: PLATFORMS.GOOGLE_MEET,
        meetingId: state.meetingId,
        name: participant.name, // Send name instead of/in addition to participantId
        participantId: participantId,
        leftAt: now(),
        timestamp: now()
      });
    }
  }
}

/**
 * Extracts all participants from the People Panel
 * @returns {Object[]} Array of participant objects
 */
function extractAllParticipants() {
  const participants = [];
  const list = findParticipantsList();
  
  if (!list) {
    // Fallback: try to find any listitems in side panel
    const sidePanel = findSidePanel();
    if (!sidePanel) return participants;
    
    const items = sidePanel.querySelectorAll('[role="listitem"]');
    items.forEach(item => {
      const p = extractParticipantFromListitem(item);
      if (p) participants.push(p);
    });
    return participants;
  }
  
  const items = list.querySelectorAll('[role="listitem"]');
  items.forEach(item => {
    const p = extractParticipantFromListitem(item);
    if (p) participants.push(p);
  });
  
  return participants;
}

/**
 * Extracts participant data from a listitem element
 * @param {Element} listitem - Listitem DOM element
 * @returns {Object|null} Participant data or null
 */
function extractParticipantFromListitem(listitem) {
  try {
    // Get name from aria-label of the listitem (cleanest source)
    let name = cleanParticipantName(listitem.getAttribute('aria-label') || '');
    
    // If no aria-label or it was cleaned to empty, try to find text content
    if (!name || !isValidParticipantName(name)) {
      name = '';
      // Look for the first generic element that contains just a name (not buttons)
      const textElements = listitem.querySelectorAll('[role="generic"]');
      for (const el of textElements) {
        // Skip elements that contain buttons (they're containers)
        if (el.querySelector('button')) continue;
        
        const text = cleanParticipantName(el.textContent?.trim());
        if (isValidParticipantName(text) && !isInvalidParticipant(text, CONFIG)) {
          name = text;
          break;
        }
      }
    }
    
    if (!name || name.length < 2) return null;
    
    // Check if this is self
    const isSelf = listitem.textContent?.includes(CONFIG.PATTERNS.selfIndicator) || false;
    
    // Check if this is a presentation entry
    const isPresentation = listitem.textContent?.toLowerCase().includes(
      CONFIG.PATTERNS.presentationIndicator
    ) || false;
    
    // Check if muted (has disabled button with "unmute" text)
    const muteButton = listitem.querySelector('button[disabled]');
    const isMuted = muteButton?.textContent?.toLowerCase().includes(CONFIG.PATTERNS.cantUnmute) || 
                    muteButton?.getAttribute('aria-label')?.toLowerCase().includes(CONFIG.PATTERNS.cantUnmute) ||
                    false;
    
    // Check if host
    const isHost = listitem.textContent?.includes(CONFIG.PATTERNS.hostIndicator) || false;
    
    // Generate stable ID from name
    const id = generateParticipantId({ textContent: name });
    
    return {
      id,
      name,
      isSelf,
      isPresentation,
      isMuted,
      isHost
    };
  } catch (err) {
    console.error('[GoogleMeet] Error extracting participant data:', err);
    return null;
  }
}

/**
 * Finds all participant elements in DOM (legacy compatibility + video tiles)
 * @returns {Element[]} Array of participant elements
 */
export function findParticipantElements() {
  const elements = [];
  
  // From People Panel (primary)
  const list = findParticipantsList();
  if (list) {
    elements.push(...list.querySelectorAll('[role="listitem"]'));
  }
  
  return elements;
}

/**
 * Extracts participant data from a DOM element (legacy compatibility)
 * @param {Element} element - Participant DOM element
 * @returns {Object|null} Participant data or null
 */
export function extractParticipantData(element) {
  // Null check
  if (!element) {
    return null;
  }
  
  // If it's a listitem, use the new extraction
  if (element.getAttribute('role') === 'listitem') {
    return extractParticipantFromListitem(element);
  }
  
  // Fallback for video tile elements
  try {
    let name = 'Unknown';
    
    // Try to find name in tooltips or text
    const tooltip = element.querySelector('[role="tooltip"]');
    if (tooltip) {
      name = tooltip.textContent?.trim() || name;
    }
    
    // Try generic elements with text
    if (name === 'Unknown') {
      const generics = element.querySelectorAll('[role="generic"]');
      for (const g of generics) {
        const text = g.textContent?.trim();
        if (text && text.length > 1 && text.length < 100 && !isInvalidParticipant(text, CONFIG)) {
          name = text;
          break;
        }
      }
    }
    
    if (name === 'Unknown' || isInvalidParticipant(name, CONFIG)) return null;
    
    const id = generateParticipantId({ textContent: name });
    return { id, name };
  } catch (err) {
    console.error('[GoogleMeet] Error extracting participant data:', err);
    return null;
  }
}

/**
 * Finds a participant by ID in the state
 * @param {Object} state - State object
 * @param {string} participantId - Participant ID to find
 * @returns {Object|null} Participant data or null
 */
export function findParticipantById(state, participantId) {
  if (state.participants.has(participantId)) {
    return state.participants.get(participantId);
  }
  
  // Try to find by name match
  for (const [id, participant] of state.participants.entries()) {
    if (participant.name === participantId || id === participantId) {
      return participant;
    }
  }
  
  return null;
}

/**
 * Finds a participant ID by name
 * @param {Object} state - State object
 * @param {string} name - Name to search for
 * @returns {string|null} Participant ID or null
 */
export function findParticipantIdByName(state, name) {
  if (!name) return null;
  
  const nameLower = name.toLowerCase();
  
  for (const [id, participant] of state.participants.entries()) {
    if (participant.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(participant.name.toLowerCase())) {
      return id;
    }
  }
  return null;
}

/**
 * Gets current mic status for all participants
 * @param {Object} state - State object
 * @returns {Map} Map of participantId -> isMuted
 */
export function getParticipantMicStatus(state) {
  const micStatus = new Map();
  const participants = extractAllParticipants();
  
  for (const p of participants) {
    if (!p.isSelf && !p.isPresentation) {
      micStatus.set(p.id, p.isMuted);
    }
  }
  
  return micStatus;
}

// Old ensurePeoplePanelOpen functions removed - now using centralized executeDetectionWorkflow
