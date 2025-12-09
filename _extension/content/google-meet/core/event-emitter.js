/**
 * Google Meet Content Script - Event Emitter
 * Central hub for queuing, batching, and deduplicating events
 * All participation events flow through here before being sent to background
 */

import { log } from './utils.js';
import { debug } from '../../../utils/debug-logger.js';

// Event queue for batching
let eventQueue = [];
let flushTimeout = null;

// Configuration
const BATCH_DELAY_MS = 500;  // Wait 500ms before flushing batch
const MAX_QUEUE_SIZE = 50;    // Flush immediately if queue exceeds this

// Deduplication tracking
const recentEvents = new Map();  // eventKey -> timestamp
const DEDUP_WINDOW_MS = 5000;    // Ignore duplicate events within 5 seconds (increased from 3)

/**
 * Generates a unique key for event deduplication
 * Uses participant NAME as primary identifier for consistency across sources
 * @param {string} type - Event type
 * @param {Object} data - Event data
 * @returns {string} Unique event key
 */
function getEventKey(type, data) {
  // Use name as primary identifier since IDs can differ between sources
  const participantName = data.name || data.participant?.name || data.participantId || 'unknown';
  // Normalize name for comparison
  const normalizedName = participantName.toLowerCase().trim();
  
  switch (type) {
    case 'PARTICIPANT_JOINED':
    case 'PARTICIPANT_LEFT':
      return `${type}:${normalizedName}`;
    case 'CHAT_MESSAGE':
      // Include message hash for chat dedup
      const msgHash = data.message ? hashString(data.message.slice(0, 50)) : '';
      return `${type}:${normalizedName}:${msgHash}`;
    case 'REACTION':
      return `${type}:${normalizedName}:${data.reaction}`;
    case 'HAND_RAISE':
      return `${type}:${normalizedName}`;
    case 'MIC_TOGGLE':
    case 'CAMERA_TOGGLE':
      return `${type}:${normalizedName}:${data.state}`;
    case 'MIC_STATUS_CHANGED':
      return `${type}:${normalizedName}:${data.isMuted}`;
    default:
      return `${type}:${normalizedName}:${Date.now()}`;
  }
}

/**
 * Simple string hash for deduplication
 * @param {string} str - String to hash
 * @returns {string} Hash string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Checks if an event is a duplicate
 * @param {string} eventKey - Event key
 * @returns {boolean} True if duplicate
 */
function isDuplicate(eventKey) {
  const lastTime = recentEvents.get(eventKey);
  const now = Date.now();
  
  if (lastTime && (now - lastTime) < DEDUP_WINDOW_MS) {
    return true;
  }
  
  recentEvents.set(eventKey, now);
  
  // Cleanup old entries periodically
  if (recentEvents.size > 200) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [key, time] of recentEvents.entries()) {
      if (time < cutoff) {
        recentEvents.delete(key);
      }
    }
  }
  
  return false;
}

/**
 * Queues an event for batched sending
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {Object} data - Event data
 */
export function queueEvent(type, data) {
  const eventKey = getEventKey(type, data);
  
  // Check for duplicates
  if (isDuplicate(eventKey)) {
    // Only log dedup in debug mode, not every time
    return;
  }
  
  // Only log significant events to reduce noise
  if (!['MIC_STATUS_CHANGED'].includes(type)) {
    debug.event('content', type, data);
  }
  eventQueue.push({ type, data, queuedAt: Date.now() });
  
  // Flush immediately if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushEvents();
    return;
  }
  
  // Schedule flush after delay
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, BATCH_DELAY_MS);
  }
}

/**
 * Flushes all queued events to background
 */
async function flushEvents() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  // Only log if there are significant events
  const significantCount = eventsToSend.filter(e => e.type !== 'MIC_STATUS_CHANGED').length;
  if (significantCount > 0) {
    log(`Flushing ${eventsToSend.length} events`);
  }
  
  // Send each event to background
  for (const event of eventsToSend) {
    try {
      // Only log send for significant events
      if (!['MIC_STATUS_CHANGED'].includes(event.type)) {
        debug.send('content', event.type, event.data);
      }
      await chrome.runtime.sendMessage({
        type: event.type,
        ...event.data
      });
    } catch (error) {
      console.error('[GoogleMeet] Failed to send event:', error);
      debug.error('content', 'SEND_FAILED', { type: event.type, error: error.message });
    }
  }
}

/**
 * Immediately sends an event without queuing (for critical events like join/leave)
 * @param {string} type - Message type
 * @param {Object} data - Event data
 */
export async function sendImmediate(type, data) {
  const eventKey = getEventKey(type, data);
  
  if (isDuplicate(eventKey)) {
    // Silently deduplicate - don't log every time
    return;
  }
  
  try {
    debug.send('content', type, { ...data, immediate: true });
    await chrome.runtime.sendMessage({ type, ...data });
  } catch (error) {
    console.error('[GoogleMeet] Failed to send immediate event:', error);
    debug.error('content', 'IMMEDIATE_SEND_FAILED', { type, error: error.message });
  }
}

/**
 * Clears all pending events (call on cleanup)
 */
export function clearEventQueue() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  eventQueue = [];
  recentEvents.clear();
}
