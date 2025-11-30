/**
 * Google Meet Content Script - Tracking Indicator
 * Visual overlay showing tracking status
 */

import { log } from './utils.js';

const INDICATOR_ID = 'engagium-indicator';
const STATUS_DOT_ID = 'engagium-status-dot';
const STATUS_TEXT_ID = 'engagium-status-text';

/**
 * Injects the tracking indicator into the page
 */
export function injectTrackingIndicator() {
  // Remove existing indicator if present
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) {
    existing.remove();
  }
  
  const indicator = document.createElement('div');
  indicator.id = INDICATOR_ID;
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #1f2937;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  `;
  
  indicator.innerHTML = `
    <div id="${STATUS_DOT_ID}" style="
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6b7280;
    "></div>
    <span id="${STATUS_TEXT_ID}">Engagium: Idle</span>
  `;
  
  document.body.appendChild(indicator);
  log('Tracking indicator injected');
}

/**
 * Updates the tracking indicator status
 * @param {'active'|'idle'} status - Status to display
 * @param {number} [participantCount] - Optional participant count for active status
 */
export function updateIndicator(status, participantCount = 0) {
  const dot = document.getElementById(STATUS_DOT_ID);
  const text = document.getElementById(STATUS_TEXT_ID);
  
  if (!dot || !text) return;
  
  if (status === 'active') {
    dot.style.background = '#10b981'; // Green
    dot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.6)';
    text.textContent = `Engagium: Tracking (${participantCount})`;
  } else {
    dot.style.background = '#6b7280'; // Gray
    dot.style.boxShadow = 'none';
    text.textContent = 'Engagium: Idle';
  }
}

/**
 * Removes the tracking indicator from the page
 */
export function removeTrackingIndicator() {
  const indicator = document.getElementById(INDICATOR_ID);
  if (indicator) {
    indicator.remove();
    log('Tracking indicator removed');
  }
}
