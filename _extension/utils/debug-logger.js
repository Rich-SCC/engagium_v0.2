/**
 * Debug Logger Utility
 * Centralized debug logging for the extension
 * Broadcasts logs to options page for real-time monitoring
 */

import { STORAGE_KEYS } from './constants.js';

const MAX_DEBUG_LOGS = 500;
const DEBUG_STORAGE_KEY = 'debug_logs';

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

  // Storage and broadcast in try-catch to prevent failures
  try {
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[DebugLogger] chrome.storage.local not available');
      return;
    }

    // Get existing logs
    const result = await chrome.storage.local.get(DEBUG_STORAGE_KEY);
    const logs = result[DEBUG_STORAGE_KEY] || [];
    
    // Add new entry at the beginning
    logs.unshift(entry);
    
    // Trim to max size
    const trimmedLogs = logs.slice(0, MAX_DEBUG_LOGS);
    
    // Save back
    await chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: trimmedLogs });
    
    // Broadcast to any listening tabs (options page)
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'DEBUG_LOG_ADDED',
        entry
      }).catch(() => {
        // Ignore errors when no listeners
      });
    }
  } catch (error) {
    // Log error but don't fail the caller
    console.warn('[DebugLogger] Failed to save log:', error.message);
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
