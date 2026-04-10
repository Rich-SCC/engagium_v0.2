/**
 * Debug Logger Utility
 * Centralized debug logging for the extension
 * Broadcasts logs to options page for real-time monitoring
 */

const MAX_DEBUG_LOGS = 500;
const DEBUG_STORAGE_KEY = 'debug_logs';
const DEBUG_FLUSH_INTERVAL_MS = 1000;
const DEBUG_MAX_BUFFER_SIZE = 25;
const NOISY_EVENT_RATE_LIMIT_MS = 3000;

// Polling-heavy events can create write pressure; rate-limit persisted logs per key.
const NOISY_EVENTS = new Set([
  'MIC_TOGGLE',
  'PARTICIPANT_JOINED',
  'PARTICIPANT_LEFT',
  'HAND_RAISE',
  'REACTION',
  'CHAT_ACTIVITY',
  'MIC_STATUS_CHANGED'
]);

let pendingLogs = [];
let flushTimer = null;
let isFlushing = false;
const lastPersistedByKey = new Map();

/**
 * Log entry structure
 * @typedef {Object} DebugLogEntry
 * @property {string} id - Unique identifier
 * @property {string} timestamp - ISO timestamp
 * @property {string} source - Source of the log (content, background, api, socket)
 * @property {string} type - Type of event (SEND, RECEIVE, ERROR, INFO)
 * @property {string} event - Event name
 * @property {any} data - Event data
 */

/**
 * Add a debug log entry and broadcast to listeners
 * @param {string} source - Source identifier
 * @param {string} type - Log type (SEND, RECEIVE, ERROR, INFO)
 * @param {string} event - Event name
 * @param {any} data - Log data
 */
export async function debugLog(source, type, event, data = null) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    source,
    type,
    event,
    data
  };

  // Console log with formatting (always works)
  const emoji = getEmoji(type);
  const color = getColor(type);
  console.log(
    `%c${emoji} [${source}] ${type}: ${event}`,
    `color: ${color}; font-weight: bold;`,
    data || ''
  );

  if (!shouldPersistEntry(entry)) {
    return;
  }

  // Storage and broadcast in try-catch to prevent failures
  try {
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[DebugLogger] chrome.storage.local not available');
      return;
    }

    pendingLogs.push(entry);

    const shouldFlushNow =
      type === 'ERROR' ||
      type === 'WARN' ||
      pendingLogs.length >= DEBUG_MAX_BUFFER_SIZE;

    if (shouldFlushNow) {
      await flushPendingLogs();
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushPendingLogs().catch((error) => {
          console.warn('[DebugLogger] Timed flush failed:', error.message);
        });
      }, DEBUG_FLUSH_INTERVAL_MS);
    }
  } catch (error) {
    // Log error but don't fail the caller
    console.warn('[DebugLogger] Failed to save log:', error.message);
  }
}

function shouldPersistEntry(entry) {
  // Always keep failures and warnings for diagnostics.
  if (entry.type === 'ERROR' || entry.type === 'WARN') {
    return true;
  }

  if (!NOISY_EVENTS.has(entry.event)) {
    return true;
  }

  const key = `${entry.source}:${entry.type}:${entry.event}`;
  const last = lastPersistedByKey.get(key) || 0;
  const current = Date.now();

  if (current - last < NOISY_EVENT_RATE_LIMIT_MS) {
    return false;
  }

  lastPersistedByKey.set(key, current);
  return true;
}

async function flushPendingLogs() {
  if (isFlushing || pendingLogs.length === 0) {
    return;
  }

  isFlushing = true;

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = [...pendingLogs].reverse();
  pendingLogs = [];

  try {
    const result = await chrome.storage.local.get(DEBUG_STORAGE_KEY);
    const logs = result[DEBUG_STORAGE_KEY] || [];

    // batch is newest-first after reverse(); prepend to existing list.
    const mergedLogs = [...batch, ...logs].slice(0, MAX_DEBUG_LOGS);
    await chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: mergedLogs });

    // Broadcast only the latest entry to avoid message spam in high-volume periods.
    const latestEntry = batch[0];
    if (latestEntry && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'DEBUG_LOG_ADDED',
        entry: latestEntry
      }).catch(() => {
        // Ignore errors when no listeners
      });
    }
  } catch (error) {
    // Re-queue dropped batch on failure.
    pendingLogs = [...batch.reverse(), ...pendingLogs];
    throw error;
  } finally {
    isFlushing = false;

    // If new entries arrived while flushing, schedule next flush.
    if (pendingLogs.length > 0 && !flushTimer) {
      flushTimer = setTimeout(() => {
        flushPendingLogs().catch((error) => {
          console.warn('[DebugLogger] Follow-up flush failed:', error.message);
        });
      }, DEBUG_FLUSH_INTERVAL_MS);
    }
  }
}

/**
 * Get all debug logs
 * @returns {Promise<DebugLogEntry[]>}
 */
export async function getDebugLogs() {
  try {
    const result = await chrome.storage.local.get(DEBUG_STORAGE_KEY);
    return result[DEBUG_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[DebugLogger] Failed to get logs:', error);
    return [];
  }
}

/**
 * Clear all debug logs
 */
export async function clearDebugLogs() {
  try {
    await chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: [] });
    console.log('[DebugLogger] Logs cleared');
  } catch (error) {
    console.error('[DebugLogger] Failed to clear logs:', error);
  }
}

/**
 * Get emoji for log type
 */
function getEmoji(type) {
  switch (type) {
    case 'SEND': return '📤';
    case 'RECEIVE': return '📥';
    case 'ERROR': return '❌';
    case 'SUCCESS': return '✅';
    case 'INFO': return 'ℹ️';
    case 'WARN': return '⚠️';
    case 'EVENT': return '🎯';
    default: return '📋';
  }
}

/**
 * Get color for log type
 */
function getColor(type) {
  switch (type) {
    case 'SEND': return '#3b82f6';
    case 'RECEIVE': return '#10b981';
    case 'ERROR': return '#ef4444';
    case 'SUCCESS': return '#22c55e';
    case 'INFO': return '#6b7280';
    case 'WARN': return '#f59e0b';
    case 'EVENT': return '#8b5cf6';
    default: return '#374151';
  }
}

// Convenience methods
export const debug = {
  send: (source, event, data) => debugLog(source, 'SEND', event, data),
  receive: (source, event, data) => debugLog(source, 'RECEIVE', event, data),
  error: (source, event, data) => debugLog(source, 'ERROR', event, data),
  success: (source, event, data) => debugLog(source, 'SUCCESS', event, data),
  info: (source, event, data) => debugLog(source, 'INFO', event, data),
  warn: (source, event, data) => debugLog(source, 'WARN', event, data),
  event: (source, event, data) => debugLog(source, 'EVENT', event, data),
  log: (source, event, data) => debugLog(source, 'INFO', event, data), // Alias for info
};

export default debug;
