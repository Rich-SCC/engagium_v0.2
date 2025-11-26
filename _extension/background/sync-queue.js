/**
 * Sync Queue Manager
 * Handles offline queue and retry logic for failed API calls
 */

import { v4 as uuidv4 } from 'uuid';
import { SYNC_RETRY } from '../utils/constants.js';
import {
  addToSyncQueue,
  getSyncQueue,
  updateSyncQueueItem,
  removeSyncQueueItem
} from '../utils/storage.js';
import { now } from '../utils/date-utils.js';
import { submitBulkAttendance, submitBulkParticipation } from './api-client.js';

class SyncQueueManager {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Add sync item to queue
   * @param {string} type - 'attendance' | 'participation'
   * @param {string} sessionId 
   * @param {Object} payload 
   */
  async enqueue(type, sessionId, payload) {
    const item = {
      id: uuidv4(),
      type,
      session_id: sessionId,
      payload,
      attempts: 0,
      last_attempt: null,
      created_at: now()
    };

    await addToSyncQueue(item);
    console.log('[SyncQueue] Item added:', item.id, type);

    // Trigger processing
    this.processQueue();
  }

  /**
   * Process all items in the queue
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log('[SyncQueue] Already processing');
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await getSyncQueue();
      console.log('[SyncQueue] Processing queue:', queue.length, 'items');

      for (const item of queue) {
        await this.processItem(item);
      }
    } catch (error) {
      console.error('[SyncQueue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queue item
   * @param {Object} item 
   */
  async processItem(item) {
    // Check if max attempts reached
    if (item.attempts >= SYNC_RETRY.MAX_ATTEMPTS) {
      console.error('[SyncQueue] Max attempts reached for item:', item.id);
      // Keep in queue for manual retry or user action
      return;
    }

    // Calculate backoff delay
    const backoffDelay = Math.min(
      SYNC_RETRY.INITIAL_DELAY * Math.pow(SYNC_RETRY.BACKOFF_FACTOR, item.attempts),
      SYNC_RETRY.MAX_DELAY
    );

    // Check if enough time has passed since last attempt
    if (item.last_attempt) {
      const timeSinceLastAttempt = Date.now() - new Date(item.last_attempt).getTime();
      if (timeSinceLastAttempt < backoffDelay) {
        console.log('[SyncQueue] Waiting for backoff:', item.id);
        return;
      }
    }

    console.log('[SyncQueue] Attempting sync:', item.id, 'attempt:', item.attempts + 1);

    try {
      // Update attempts
      await updateSyncQueueItem(item.id, {
        attempts: item.attempts + 1,
        last_attempt: now()
      });

      // Submit based on type
      if (item.type === 'attendance') {
        await submitBulkAttendance(item.session_id, item.payload.attendance);
      } else if (item.type === 'participation') {
        await submitBulkParticipation(item.session_id, item.payload.logs);
      }

      // Success - remove from queue
      await removeSyncQueueItem(item.id);
      console.log('[SyncQueue] Item synced successfully:', item.id);

      // Broadcast success event
      chrome.runtime.sendMessage({
        type: 'SYNC_SUCCESS',
        itemId: item.id,
        itemType: item.type
      });

    } catch (error) {
      console.error('[SyncQueue] Sync failed:', item.id, error.message);

      // Update with error
      await updateSyncQueueItem(item.id, {
        last_error: error.message
      });

      // Broadcast error event
      chrome.runtime.sendMessage({
        type: 'SYNC_ERROR',
        itemId: item.id,
        itemType: item.type,
        error: error.message,
        attempts: item.attempts + 1
      });
    }
  }

  /**
   * Retry a specific queue item
   * @param {string} itemId 
   */
  async retryItem(itemId) {
    const queue = await getSyncQueue();
    const item = queue.find(i => i.id === itemId);

    if (!item) {
      throw new Error('Queue item not found');
    }

    // Reset attempts to force immediate retry
    await updateSyncQueueItem(itemId, {
      attempts: 0,
      last_attempt: null
    });

    await this.processQueue();
  }

  /**
   * Clear all queue items for a session
   * @param {string} sessionId 
   */
  async clearSessionQueue(sessionId) {
    const queue = await getSyncQueue();
    const sessionItems = queue.filter(item => item.session_id === sessionId);

    for (const item of sessionItems) {
      await removeSyncQueueItem(item.id);
    }

    console.log('[SyncQueue] Cleared session queue:', sessionId);
  }

  /**
   * Get queue status
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const queue = await getSyncQueue();

    return {
      total: queue.length,
      pending: queue.filter(item => item.attempts === 0).length,
      retrying: queue.filter(item => item.attempts > 0 && item.attempts < SYNC_RETRY.MAX_ATTEMPTS).length,
      failed: queue.filter(item => item.attempts >= SYNC_RETRY.MAX_ATTEMPTS).length
    };
  }
}

// Export singleton instance
export const syncQueueManager = new SyncQueueManager();

// Setup periodic sync check (every 5 minutes)
chrome.alarms.create('sync-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-check') {
    console.log('[SyncQueue] Periodic sync check');
    syncQueueManager.processQueue();
  }
});
