/**
 * Date/Time Utility Functions
 */

import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';

/**
 * Format timestamp to readable string
 * @param {string|Date} timestamp 
 * @returns {string} - e.g., "2:30 PM"
 */
export function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return format(date, 'h:mm a');
}

/**
 * Format timestamp to full date and time
 * @param {string|Date} timestamp 
 * @returns {string} - e.g., "Nov 25, 2025 at 2:30 PM"
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return format(date, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp 
 * @returns {string} - e.g., "5 minutes ago"
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Calculate duration between two timestamps
 * @param {string|Date} start 
 * @param {string|Date} end 
 * @returns {string} - e.g., "1h 23m"
 */
export function formatDuration(start, end) {
  if (!start || !end) return 'N/A';
  
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  
  const seconds = differenceInSeconds(endDate, startDate);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Convert duration in seconds to readable string
 * @param {number} seconds 
 * @returns {string} - e.g., "1h 23m"
 */
export function secondsToDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get ISO string for current timestamp
 * @returns {string}
 */
export function now() {
  return new Date().toISOString();
}

/**
 * Check if timestamp is today
 * @param {string|Date} timestamp 
 * @returns {boolean}
 */
export function isToday(timestamp) {
  if (!timestamp) return false;
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}
