/**
 * IndexedDB Storage Manager
 * Handles all database operations for the extension
 */

import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, DB_STORES } from './constants.js';

let db = null;

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Active sessions store
      if (!database.objectStoreNames.contains(DB_STORES.ACTIVE_SESSIONS)) {
        const sessionsStore = database.createObjectStore(DB_STORES.ACTIVE_SESSIONS, {
          keyPath: 'id'
        });
        sessionsStore.createIndex('status', 'status');
        sessionsStore.createIndex('started_at', 'started_at');
      }

      // Tracked participants store
      if (!database.objectStoreNames.contains(DB_STORES.TRACKED_PARTICIPANTS)) {
        const participantsStore = database.createObjectStore(DB_STORES.TRACKED_PARTICIPANTS, {
          keyPath: 'id'
        });
        participantsStore.createIndex('session_id', 'session_id');
        participantsStore.createIndex('platform_participant_id', 'platform_participant_id');
        participantsStore.createIndex('matched_student_id', 'matched_student_id');
      }

      // Participation events store
      if (!database.objectStoreNames.contains(DB_STORES.PARTICIPATION_EVENTS)) {
        const eventsStore = database.createObjectStore(DB_STORES.PARTICIPATION_EVENTS, {
          keyPath: 'id'
        });
        eventsStore.createIndex('session_id', 'session_id');
        eventsStore.createIndex('participant_id', 'participant_id');
        eventsStore.createIndex('timestamp', 'timestamp');
      }

      // Sync queue store
      if (!database.objectStoreNames.contains(DB_STORES.SYNC_QUEUE)) {
        const queueStore = database.createObjectStore(DB_STORES.SYNC_QUEUE, {
          keyPath: 'id'
        });
        queueStore.createIndex('type', 'type');
        queueStore.createIndex('session_id', 'session_id');
        queueStore.createIndex('attempts', 'attempts');
      }

      // Settings store
      if (!database.objectStoreNames.contains(DB_STORES.SETTINGS)) {
        database.createObjectStore(DB_STORES.SETTINGS, {
          keyPath: 'key'
        });
      }
    }
  });

  return db;
}

// ============================================================================
// Active Sessions CRUD
// ============================================================================

export async function createSession(sessionData) {
  const database = await initDB();
  return await database.add(DB_STORES.ACTIVE_SESSIONS, sessionData);
}

export async function getSession(sessionId) {
  const database = await initDB();
  return await database.get(DB_STORES.ACTIVE_SESSIONS, sessionId);
}

export async function updateSession(sessionId, updates) {
  const database = await initDB();
  const session = await database.get(DB_STORES.ACTIVE_SESSIONS, sessionId);
  if (!session) throw new Error('Session not found');
  
  const updated = { ...session, ...updates };
  await database.put(DB_STORES.ACTIVE_SESSIONS, updated);
  return updated;
}

export async function deleteSession(sessionId) {
  const database = await initDB();
  await database.delete(DB_STORES.ACTIVE_SESSIONS, sessionId);
}

export async function getActiveSessions() {
  const database = await initDB();
  const index = database.transaction(DB_STORES.ACTIVE_SESSIONS).store.index('status');
  return await index.getAll('active');
}

export async function getAllSessions() {
  const database = await initDB();
  return await database.getAll(DB_STORES.ACTIVE_SESSIONS);
}

// ============================================================================
// Tracked Participants CRUD
// ============================================================================

export async function createParticipant(participantData) {
  const database = await initDB();
  return await database.add(DB_STORES.TRACKED_PARTICIPANTS, participantData);
}

export async function getParticipant(participantId) {
  const database = await initDB();
  return await database.get(DB_STORES.TRACKED_PARTICIPANTS, participantId);
}

export async function updateParticipant(participantId, updates) {
  const database = await initDB();
  const participant = await database.get(DB_STORES.TRACKED_PARTICIPANTS, participantId);
  if (!participant) throw new Error('Participant not found');
  
  const updated = { ...participant, ...updates };
  await database.put(DB_STORES.TRACKED_PARTICIPANTS, updated);
  return updated;
}

export async function getParticipantsBySession(sessionId) {
  const database = await initDB();
  const index = database.transaction(DB_STORES.TRACKED_PARTICIPANTS).store.index('session_id');
  return await index.getAll(sessionId);
}

export async function deleteParticipantsBySession(sessionId) {
  const database = await initDB();
  const participants = await getParticipantsBySession(sessionId);
  const tx = database.transaction(DB_STORES.TRACKED_PARTICIPANTS, 'readwrite');
  
  for (const participant of participants) {
    await tx.store.delete(participant.id);
  }
  
  await tx.done;
}

// ============================================================================
// Participation Events CRUD
// ============================================================================

export async function createEvent(eventData) {
  const database = await initDB();
  return await database.add(DB_STORES.PARTICIPATION_EVENTS, eventData);
}

export async function getEventsBySession(sessionId) {
  const database = await initDB();
  const index = database.transaction(DB_STORES.PARTICIPATION_EVENTS).store.index('session_id');
  return await index.getAll(sessionId);
}

export async function getEventsByParticipant(participantId) {
  const database = await initDB();
  const index = database.transaction(DB_STORES.PARTICIPATION_EVENTS).store.index('participant_id');
  return await index.getAll(participantId);
}

export async function deleteEventsBySession(sessionId) {
  const database = await initDB();
  const events = await getEventsBySession(sessionId);
  const tx = database.transaction(DB_STORES.PARTICIPATION_EVENTS, 'readwrite');
  
  for (const event of events) {
    await tx.store.delete(event.id);
  }
  
  await tx.done;
}

// ============================================================================
// Sync Queue CRUD
// ============================================================================

export async function addToSyncQueue(queueItem) {
  const database = await initDB();
  return await database.add(DB_STORES.SYNC_QUEUE, queueItem);
}

export async function getSyncQueue() {
  const database = await initDB();
  return await database.getAll(DB_STORES.SYNC_QUEUE);
}

export async function updateSyncQueueItem(itemId, updates) {
  const database = await initDB();
  const item = await database.get(DB_STORES.SYNC_QUEUE, itemId);
  if (!item) throw new Error('Queue item not found');
  
  const updated = { ...item, ...updates };
  await database.put(DB_STORES.SYNC_QUEUE, updated);
  return updated;
}

export async function removeSyncQueueItem(itemId) {
  const database = await initDB();
  await database.delete(DB_STORES.SYNC_QUEUE, itemId);
}

// ============================================================================
// Settings CRUD
// ============================================================================

export async function getSetting(key) {
  const database = await initDB();
  const setting = await database.get(DB_STORES.SETTINGS, key);
  return setting ? setting.value : null;
}

export async function setSetting(key, value) {
  const database = await initDB();
  await database.put(DB_STORES.SETTINGS, { key, value });
}

export async function getAllSettings() {
  const database = await initDB();
  const settings = await database.getAll(DB_STORES.SETTINGS);
  return settings.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});
}

// ============================================================================
// Cleanup
// ============================================================================

export async function clearSessionData(sessionId) {
  await deleteEventsBySession(sessionId);
  await deleteParticipantsBySession(sessionId);
  await deleteSession(sessionId);
}

export async function clearAllData() {
  const database = await initDB();
  const tx = database.transaction(
    [
      DB_STORES.ACTIVE_SESSIONS,
      DB_STORES.TRACKED_PARTICIPANTS,
      DB_STORES.PARTICIPATION_EVENTS,
      DB_STORES.SYNC_QUEUE
    ],
    'readwrite'
  );

  await tx.objectStore(DB_STORES.ACTIVE_SESSIONS).clear();
  await tx.objectStore(DB_STORES.TRACKED_PARTICIPANTS).clear();
  await tx.objectStore(DB_STORES.PARTICIPATION_EVENTS).clear();
  await tx.objectStore(DB_STORES.SYNC_QUEUE).clear();

  await tx.done;
}
