/**
 * Google Meet Content Script - Tracking Indicator
 * Visual overlay showing tracking status
 */

import { log } from '../core/utils.js';

const INDICATOR_ID = 'engagium-indicator';
const STATUS_DOT_ID = 'engagium-status-dot';

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
    top: 12px;
    left: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 6px 10px;
    border-radius: 20px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  
  indicator.innerHTML = `
    <img src="${chrome.runtime.getURL('assets/icons/icon32.png')}" 
         alt="Engagium" 
         style="width: 20px; height: 20px; display: block;">
    <div id="${STATUS_DOT_ID}" style="
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #9ca3af;
      transition: all 0.3s ease;
    "></div>
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
  
  if (!dot) return;
  
  if (status === 'active') {
    dot.style.background = '#10b981'; // Green
    dot.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
  } else {
    dot.style.background = '#9ca3af'; // Gray
    dot.style.boxShadow = 'none';
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
