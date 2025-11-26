/**
 * Background Service Worker
 * Main coordinator for the extension
 */

import { MESSAGE_TYPES, SESSION_STATUS, ATTENDANCE_STATUS } from '../utils/constants.js';
import { sessionManager } from './session-manager.js';
import { syncQueueManager } from './sync-queue.js';
import {
  getClasses,
  getStudentsByClass,
  submitBulkAttendance,
  submitBulkParticipation,
  startSession as apiStartSession,
  endSession as apiEndSession,
  isAuthenticated
} from './api-client.js';
import {
  getSession,
  updateSession,
  getParticipantsBySession,
  getEventsBySession,
  clearSessionData,
  getSetting,
  setSetting
} from '../utils/storage.js';
import { now } from '../utils/date-utils.js';

console.log('[Background] Service worker started');

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);

  handleMessage(message, sender)
    .then(response => {
      sendResponse({ success: true, data: response });
    })
    .catch(error => {
      console.error('[Background] Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handle incoming messages
 */
async function handleMessage(message, sender) {
  const { type, ...data } = message;

  switch (type) {
    // ========== From Content Scripts ==========
    case MESSAGE_TYPES.MEETING_DETECTED:
      return await handleMeetingDetected(data, sender);

    case MESSAGE_TYPES.PARTICIPANT_JOINED:
      return await sessionManager.handleParticipantJoined(data);

    case MESSAGE_TYPES.PARTICIPANT_LEFT:
      return await sessionManager.handleParticipantLeft(data);

    case MESSAGE_TYPES.CHAT_MESSAGE:
    case MESSAGE_TYPES.REACTION:
    case MESSAGE_TYPES.HAND_RAISE:
    case MESSAGE_TYPES.MIC_TOGGLE:
    case MESSAGE_TYPES.CAMERA_TOGGLE:
      return await sessionManager.handleParticipationEvent({ type, ...data });

    // ========== From Popup ==========
    case MESSAGE_TYPES.START_SESSION:
      return await handleStartSession(data);

    case MESSAGE_TYPES.END_SESSION:
      return await handleEndSession(data);

    case MESSAGE_TYPES.GET_SESSION_STATUS:
      return await handleGetSessionStatus();

    case MESSAGE_TYPES.GET_PARTICIPANTS:
      return await handleGetParticipants(data);

    case MESSAGE_TYPES.MANUAL_MATCH:
      return await sessionManager.manualMatch(data.participantId, data.studentId);

    // ========== Other ==========
    case 'GET_CLASSES':
      return await getClasses();

    case 'GET_STUDENTS':
      return await getStudentsByClass(data.classId);

    case 'GET_SYNC_STATUS':
      return await syncQueueManager.getStatus();

    case 'RETRY_SYNC':
      return await syncQueueManager.retryItem(data.itemId);

    case 'IS_AUTHENTICATED':
      return await isAuthenticated();

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

// ============================================================================
// Meeting Detection
// ============================================================================

async function handleMeetingDetected(data, sender) {
  const { platform, meetingId } = data;
  console.log('[Background] Meeting detected:', platform, meetingId);

  // Check if auto-start enabled
  const autoStart = await getSetting('auto_start');
  
  if (!autoStart) {
    console.log('[Background] Auto-start disabled, waiting for manual start');
    return { autoStart: false };
  }

  // Check if meeting is mapped to a class
  const mappings = await getSetting('meeting_mappings') || {};
  const classMapping = mappings[meetingId];

  if (!classMapping) {
    console.log('[Background] Meeting not mapped to class');
    return { autoStart: false, needsMapping: true };
  }

  // Auto-start session
  try {
    const session = await sessionManager.startSession({
      class_id: classMapping.class_id,
      class_name: classMapping.class_name,
      meeting_id: meetingId,
      meeting_platform: platform
    });

    // Load student roster
    const students = await getStudentsByClass(classMapping.class_id);
    sessionManager.setStudentRoster(students);

    // Update badge
    updateBadge('active');

    // Notify content script
    chrome.tabs.sendMessage(sender.tab.id, {
      type: MESSAGE_TYPES.SESSION_STARTED,
      sessionId: session.id
    });

    return { autoStart: true, session };
  } catch (error) {
    console.error('[Background] Failed to auto-start session:', error);
    return { autoStart: false, error: error.message };
  }
}

// ============================================================================
// Session Control
// ============================================================================

async function handleStartSession(data) {
  const { classId, className, meetingId, meetingPlatform } = data;

  // Create session
  const session = await sessionManager.startSession({
    class_id: classId,
    class_name: className,
    meeting_id: meetingId,
    meeting_platform: meetingPlatform
  });

  // Load student roster
  const students = await getStudentsByClass(classId);
  sessionManager.setStudentRoster(students);

  // Try to start session in backend (create if needed)
  try {
    // Note: We may need to create the session in backend first
    // For now, just log
    console.log('[Background] Session started locally:', session.id);
  } catch (error) {
    console.error('[Background] Failed to start backend session:', error);
  }

  // Update badge
  updateBadge('active');

  return session;
}

async function handleEndSession(data) {
  const { sessionId } = data;

  // End session locally
  const session = await sessionManager.endSession(sessionId);

  // Aggregate and submit data
  try {
    await submitSessionData(sessionId);
    
    // Mark as synced
    await updateSession(sessionId, {
      status: SESSION_STATUS.SYNCED
    });

    // Clear local data
    await clearSessionData(sessionId);

    console.log('[Background] Session ended and synced:', sessionId);
  } catch (error) {
    console.error('[Background] Failed to sync session data:', error);
    
    // Add to sync queue for retry
    const attendancePayload = await buildAttendancePayload(sessionId);
    const participationPayload = await buildParticipationPayload(sessionId);

    await syncQueueManager.enqueue('attendance', sessionId, attendancePayload);
    await syncQueueManager.enqueue('participation', sessionId, participationPayload);

    console.log('[Background] Session data queued for retry');
  }

  // Update badge
  updateBadge('idle');

  return session;
}

async function handleGetSessionStatus() {
  const session = await sessionManager.getActiveSession();
  
  if (!session) {
    return {
      status: SESSION_STATUS.IDLE,
      session: null
    };
  }

  const participants = await getParticipantsBySession(session.id);
  const events = await getEventsBySession(session.id);

  return {
    status: session.status,
    session: {
      ...session,
      participant_count: participants.length,
      matched_count: participants.filter(p => p.matched_student_id).length,
      event_count: events.length
    }
  };
}

async function handleGetParticipants(data) {
  const { sessionId } = data;
  const participants = await getParticipantsBySession(sessionId);

  // Get event counts for each participant
  const participantsWithCounts = await Promise.all(
    participants.map(async (p) => {
      const events = await getEventsBySession(sessionId);
      const participantEvents = events.filter(e => e.participant_id === p.id);
      
      return {
        ...p,
        event_count: participantEvents.length
      };
    })
  );

  return participantsWithCounts;
}

// ============================================================================
// Data Submission
// ============================================================================

async function submitSessionData(sessionId) {
  console.log('[Background] Submitting session data:', sessionId);

  // Build payloads
  const attendancePayload = await buildAttendancePayload(sessionId);
  const participationPayload = await buildParticipationPayload(sessionId);

  // Submit attendance
  if (attendancePayload.attendance.length > 0) {
    await submitBulkAttendance(sessionId, attendancePayload.attendance);
    console.log('[Background] Attendance submitted:', attendancePayload.attendance.length);
  }

  // Submit participation
  if (participationPayload.logs.length > 0) {
    await submitBulkParticipation(sessionId, participationPayload.logs);
    console.log('[Background] Participation submitted:', participationPayload.logs.length);
  }
}

async function buildAttendancePayload(sessionId) {
  const participants = await getParticipantsBySession(sessionId);

  const attendance = participants
    .filter(p => p.matched_student_id) // Only matched students
    .map(p => ({
      student_id: p.matched_student_id,
      status: ATTENDANCE_STATUS.PRESENT,
      joined_at: p.joined_at,
      left_at: p.left_at || now() // Use current time if still in meeting
    }));

  return { attendance };
}

async function buildParticipationPayload(sessionId) {
  const participants = await getParticipantsBySession(sessionId);
  const events = await getEventsBySession(sessionId);

  const logs = [];

  for (const event of events) {
    const participant = participants.find(p => p.id === event.participant_id);
    
    if (!participant || !participant.matched_student_id) {
      continue; // Skip unmatched
    }

    logs.push({
      student_id: participant.matched_student_id,
      interaction_type: event.event_type,
      timestamp: event.timestamp,
      metadata: event.event_data
    });
  }

  return { logs };
}

// ============================================================================
// Badge Management
// ============================================================================

function updateBadge(status) {
  if (status === 'active') {
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Green
    chrome.action.setTitle({ title: 'Engagium Tracker - Session Active' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Engagium Tracker' });
  }
}

// ============================================================================
// Installation & Updates
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default settings
    setSetting('auto_start', false);
    setSetting('match_threshold', 0.7);
    setSetting('meeting_mappings', {});

    // Open options page
    chrome.runtime.openOptionsPage();
  }
});

// ============================================================================
// Network Status (for sync queue)
// ============================================================================

self.addEventListener('online', () => {
  console.log('[Background] Back online, processing sync queue');
  syncQueueManager.processQueue();
});

console.log('[Background] Service worker initialized');
