/**
 * Google Meet Content Script - Tracking Indicator
 * Visual overlay showing tracking status
 */

import { log } from '../core/utils.js';

const INDICATOR_ID = 'engagium-indicator';

/**
 * Injects the tracking indicator into the page
 */
export function injectTrackingIndicator() {
  log('Tracking indicator disabled by configuration');
}

/**
 * Updates the tracking indicator status
 * @param {'active'|'idle'} status - Status to display
 * @param {number} [participantCount] - Optional participant count for active status
 */
export function updateIndicator(status, participantCount = 0) {
  void status;
  void participantCount;
}

/**
 * Removes the tracking indicator from the page
 */
export function removeTrackingIndicator() {
  const indicator = document.getElementById(INDICATOR_ID);
  if (indicator) indicator.remove();
}
