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

// Meeting detection state
let currentMeetingDetection = null; // { meeting_id, platform, tab_id }

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
      
    case MESSAGE_TYPES.PLATFORM_SWITCH:
      return await handlePlatformSwitch(data);

    // ========== From Popup ==========
    case MESSAGE_TYPES.START_SESSION:
      return await handleStartSession(data);

    case MESSAGE_TYPES.END_SESSION:
      return await handleEndSession(data);

    case MESSAGE_TYPES.GET_SESSION_STATUS:
      return await handleGetSessionStatus();

    case MESSAGE_TYPES.GET_PARTICIPANTS:
      return await handleGetParticipants(data);
      
    case MESSAGE_TYPES.GET_MEETING_STATUS:
      return await handleGetMeetingStatus();
      
    case MESSAGE_TYPES.DISMISS_MEETING:
      return await handleDismissMeeting();

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

  // Store meeting detection state
  currentMeetingDetection = {
    meeting_id: meetingId,
    platform: platform,
    tab_id: sender.tab.id
  };

  // Check if meeting is mapped to a class
  const mappings = await getSetting('meeting_mappings') || {};
  const classMapping = mappings[meetingId];

  if (classMapping) {
    currentMeetingDetection.mapped_class_id = classMapping.class_id;
    currentMeetingDetection.mapped_class_name = classMapping.class_name;
  }

  console.log('[Background] Meeting detection stored, awaiting user action');
  
  return { 
    detected: true, 
    meeting: currentMeetingDetection 
  };
}

async function handleGetMeetingStatus() {
  if (!currentMeetingDetection) {
    return { meeting: null, classes: [] };
  }

  // Fetch available classes
  let classes = [];
  try {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const response = await getClasses();
      classes = response.data || response.classes || [];
    }
  } catch (error) {
    console.error('[Background] Failed to fetch classes:', error);
  }

  return {
    meeting: currentMeetingDetection,
    classes: classes
  };
}

function handleDismissMeeting() {
  console.log('[Background] Meeting dismissed');
  currentMeetingDetection = null;
  return { dismissed: true };
}

async function handlePlatformSwitch(data) {
  const { platform, old_meeting_id, new_meeting_id, timestamp } = data;
  console.log('[Background] Platform switch:', old_meeting_id, '->', new_meeting_id);
  
  // Log as participation event with type 'platform_switch'
  const session = await sessionManager.getActiveSession();
  if (!session) {
    console.warn('[Background] No active session for platform switch');
    return { logged: false };
  }
  
  // Create event manually (no participant associated)
  await sessionManager.handleParticipationEvent({
    type: MESSAGE_TYPES.PLATFORM_SWITCH,
    old_meeting_id,
    new_meeting_id,
    platform,
    timestamp,
    participantId: null // No specific participant
  });
  
  console.log('[Background] Platform switch logged');
  return { logged: true };
}

// ============================================================================
// Session Control
// ============================================================================

async function handleStartSession(data) {
  const { class_id, meeting_id, platform } = data;

  try {
    // Fetch class name if not provided
    let className = data.class_name;
    if (!className) {
      const classesResponse = await getClasses();
      const classes = classesResponse.data || classesResponse.classes || [];
      const matchedClass = classes.find(c => c.id === class_id);
      className = matchedClass?.name || 'Unknown Class';
    }

    // Create session via session manager (calls backend API)
    const session = await sessionManager.startSession({
      class_id: class_id,
      class_name: className,
      meeting_id: meeting_id,
      meeting_platform: platform
    });

    // Load student roster for matching
    const students = await getStudentsByClass(class_id);
    sessionManager.setStudentRoster(students);

    // Update badge
    updateBadge('active');

    // Clear meeting detection state
    currentMeetingDetection = null;

    // Notify content script to start tracking
    if (currentMeetingDetection?.tab_id) {
      try {
        chrome.tabs.sendMessage(currentMeetingDetection.tab_id, {
          type: MESSAGE_TYPES.SESSION_STARTED,
          sessionId: session.id
        });
      } catch (error) {
        console.error('[Background] Failed to notify content script:', error);
      }
    }

    console.log('[Background] Session started:', session.id);
    return session;

  } catch (error) {
    console.error('[Background] Failed to start session:', error);
    throw error;
  }
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
