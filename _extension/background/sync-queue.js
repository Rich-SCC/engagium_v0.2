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
import { 
  submitBulkAttendance, 
  submitBulkParticipation,
  recordParticipantJoin,
  recordParticipantLeave
} from './api-client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SyncQueue');

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
    logger.log('Item added:', item.id, type);

    // Trigger processing
    this.processQueue();
  }

  /**
   * Process all items in the queue
   */
  async processQueue() {
    if (this.isProcessing) {
      logger.log(' Already processing');
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await getSyncQueue();
      logger.log(' Processing queue:', queue.length, 'items');

      for (const item of queue) {
        await this.processItem(item);
      }
    } catch (error) {
      logger.error(' Error processing queue:', error);
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
      logger.error(' Max attempts reached for item:', item.id);
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
        logger.log(' Waiting for backoff:', item.id);
        return;
      }
    }

    logger.log(' Attempting sync:', item.id, 'attempt:', item.attempts + 1);

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
      } else if (item.type === 'join') {
        await recordParticipantJoin(item.session_id, item.payload);
      } else if (item.type === 'leave') {
        await recordParticipantLeave(item.session_id, item.payload);
      }

      // Success - remove from queue
      await removeSyncQueueItem(item.id);
      logger.log(' Item synced successfully:', item.id);

      // Broadcast success event
      chrome.runtime.sendMessage({
        type: 'SYNC_SUCCESS',
        itemId: item.id,
        itemType: item.type
      });

    } catch (error) {
      logger.error('⚠️ Sync failed:', item.id, error.message);

      // Check if error is non-retryable
      const NON_RETRYABLE_ERRORS = [
        'Can only add participation logs to active sessions',
        'Can only add attendance to active sessions',
        'Unauthorized',
        'Access denied',
        'Session not found',
        'Invalid session',
        'Session has ended'
      ];

      const isNonRetryable = NON_RETRYABLE_ERRORS.some(msg => 
        error.message.includes(msg)
      );

      if (isNonRetryable) {
        logger.warn('🗑️ Non-retryable error, removing from queue:', item.id);
        await removeSyncQueueItem(item.id);
        
        chrome.runtime.sendMessage({
          type: 'SYNC_PERMANENT_FAILURE',
          itemId: item.id,
          itemType: item.type,
          error: error.message
        });
        return;
      }

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

    logger.log(' Cleared session queue:', sessionId);
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

  /**
   * Clear permanently failed items
   * @returns {Promise<number>} Number of items cleared
   */
  async clearFailedItems() {
    const queue = await getSyncQueue();
    const failed = queue.filter(item => item.attempts >= SYNC_RETRY.MAX_ATTEMPTS);
    
    for (const item of failed) {
      await removeSyncQueueItem(item.id);
    }
    
    logger.log('🧹 Cleared', failed.length, 'failed items');
    return failed.length;
  }

  /**
   * Handle session end - clear queue to prevent sync after session closes
   * @param {string} sessionId 
   */
  async onSessionEnd(sessionId) {
    logger.log('📭 Session ended, clearing queue:', sessionId);
    await this.clearSessionQueue(sessionId);
  }
}

// Export singleton instance
export const syncQueueManager = new SyncQueueManager();

// Setup periodic sync check (every 5 minutes)
chrome.alarms.create('sync-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-check') {
    logger.log(' Periodic sync check');
    syncQueueManager.processQueue();
  }
});
