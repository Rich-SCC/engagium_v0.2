/**
 * Google Meet Content Script - Meeting Notifications
 * Provides visual prompts and notifications within the meeting UI
 */

import { log } from '../core/utils.js';

/**
 * Show a notification for Join Now button (when tracking started but still in waiting room)
 * @param {Object} classInfo - { class_id, class_name } if known
 */
export function showJoinNowPrompt(classInfo) {
  log('Join Now prompt disabled by configuration');
}

/**
 * Show a reminder to start tracking (appears if not tracking 60s after joining)
 * @param {Object} classInfo - { class_id, class_name } if known
 * @param {Function} onStartTracking - Callback when user clicks to start
 */
export function showTrackingReminder(classInfo, onStartTracking) {
  // Check if already showing
  if (document.getElementById('engagium-tracking-reminder')) {
    return;
  }
  
  log('Showing tracking reminder');
  
  const reminder = document.createElement('div');
  reminder.id = 'engagium-tracking-reminder';
  reminder.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: white !important;
    border-radius: 8px !important;
    padding: 16px 20px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25) !important;
    z-index: 2147483647 !important;
    font-family: 'Google Sans', Roboto, sans-serif !important;
    min-width: 400px !important;
    max-width: 500px !important;
    animation: slideDown 0.3s ease-out !important;
    border-left: 4px solid #1a73e8 !important;
    pointer-events: auto !important;
    display: block !important;
    visibility: visible !important;
  `;
  
  reminder.innerHTML = `
    <style>
      @keyframes slideDown {
        from {
          transform: translate(-50%, -100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
    </style>
    <div style="display: flex; align-items: center; gap: 12px;">
      <img src="${chrome.runtime.getURL('assets/icons/icon32.png')}" alt="Engagium" style="width: 32px; height: 32px; display: block;">
      <div style="flex: 1;">
        <div style="font-weight: 500; font-size: 15px; color: #202124; margin-bottom: 4px;">
          ${classInfo ? `Start tracking for ${classInfo.class_name}?` : 'Start tracking attendance?'}
        </div>
        <div style="font-size: 13px; color: #5f6368;">
          Click below to begin tracking participation
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="engagium-reminder-start" style="
          padding: 8px 16px;
          background: #1a73e8;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Google Sans', Roboto, sans-serif;
        ">Start Tracking</button>
        <button id="engagium-reminder-dismiss" style="
          background: transparent;
          border: none;
          color: #5f6368;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(reminder);
  log('Tracking reminder element appended to body');
  
  // Verify it's visible
  setTimeout(() => {
    const check = document.getElementById('engagium-tracking-reminder');
    if (check) {
      log('Tracking reminder confirmed in DOM with computed style:', window.getComputedStyle(check).display);
    } else {
      console.error('[Engagium] Tracking reminder was removed from DOM!');
    }
  }, 100);
  
  // Start tracking button
  document.getElementById('engagium-reminder-start').addEventListener('click', () => {
    reminder.style.animation = 'slideDown 0.2s ease-out reverse';
    setTimeout(() => {
      reminder.remove();
      onStartTracking();
    }, 200);
  });
  
  // Dismiss button
  document.getElementById('engagium-reminder-dismiss').addEventListener('click', () => {
    reminder.style.animation = 'slideDown 0.2s ease-out reverse';
    setTimeout(() => reminder.remove(), 200);
  });
  
  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.getElementById('engagium-tracking-reminder')) {
      reminder.style.animation = 'slideDown 0.2s ease-out reverse';
      setTimeout(() => reminder.remove(), 200);
    }
  }, 30000);
}

/**
 * Show confirmation that retroactive participants were captured
 * @param {number} count - Number of participants captured
 */
export function showRetroactiveCaptureNotification(count) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: #0f9d58 !important;
    color: white !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    z-index: 2147483647 !important;
    font-family: 'Google Sans', Roboto, sans-serif !important;
    font-size: 14px !important;
    animation: slideInRight 0.3s ease-out !important;
    display: block !important;
    visibility: visible !important;
  `;
  
  notification.innerHTML = `
    ✓ Captured ${count} participant${count !== 1 ? 's' : ''} already in meeting
  `;
  
  document.body.appendChild(notification);
  log('Retroactive capture notification displayed:', count, 'participants');
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.2s ease-out reverse';
    setTimeout(() => notification.remove(), 200);
  }, 4000);
}

/**
 * Dismiss all active notifications
 */
export function dismissAllNotifications() {
  const notifications = [
    'engagium-join-prompt',
    'engagium-tracking-reminder'
  ];
  
  notifications.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  });
}
