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
  createStudentsBulk,
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
  clearAllData,
  getSetting,
  setSetting
} from '../utils/storage.js';
import { now } from '../utils/date-utils.js';
import { debug } from '../utils/debug-logger.js';

console.log('[Background] Service worker started');
// Use setTimeout to ensure storage is ready before logging
setTimeout(() => {
  debug.info('background', 'SERVICE_WORKER_START', 'Service worker initialized').catch(() => {});
}, 100);

// Meeting detection state
let currentMeetingDetection = null; // { meeting_id, platform, tab_id }

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);
  debug.receive('background', message.type, { data: message, sender: sender?.tab?.id });

  handleMessage(message, sender)
    .then(response => {
      debug.success('background', `${message.type}_RESPONSE`, response);
      sendResponse({ success: true, data: response });
    })
    .catch(error => {
      console.error('[Background] Error handling message:', error);
      debug.error('background', `${message.type}_ERROR`, { error: error.message, stack: error.stack });
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
      
    case MESSAGE_TYPES.MEETING_LEFT:
      // Meeting left - automatically end session if one is active
      console.log('[Background] Meeting left:', data.meetingId);
      return await handleMeetingLeft(data);

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
      // getClasses() already returns the data array, so return it directly
      const classes = await getClasses();
      return classes;

    case 'GET_STUDENTS':
      return await getStudentsByClass(data.classId);

    case 'GET_SYNC_STATUS':
      return await syncQueueManager.getStatus();

    case 'RETRY_SYNC':
      return await syncQueueManager.retryItem(data.itemId);

    case 'IS_AUTHENTICATED':
      return await isAuthenticated();

    case 'CLEAR_ALL_SESSIONS':
      // For debugging/recovery - clears all local session data
      await clearAllData();
      sessionManager.activeSessionId = null;
      console.log('[Background] All session data cleared');
      return { cleared: true };

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
      classes = await getClasses(); // Already returns array
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

/**
 * Handle meeting left - auto-end session if active
 */
async function handleMeetingLeft(data) {
  const { meetingId } = data;
  
  // Check if there's an active session for this meeting
  const session = await sessionManager.getActiveSession();
  
  if (!session) {
    console.log('[Background] No active session to end');
    // Clear meeting detection state if any
    if (currentMeetingDetection?.meeting_id === meetingId) {
      currentMeetingDetection = null;
    }
    return { acknowledged: true, sessionEnded: false };
  }
  
  // Check if this is the same meeting
  if (session.meeting_id !== meetingId) {
    console.log('[Background] Meeting ID mismatch, not ending session');
    return { acknowledged: true, sessionEnded: false };
  }
  
  console.log('[Background] Auto-ending session due to meeting exit:', session.id);
  
  try {
    // End the session (this handles all cleanup and sync)
    await handleEndSession({ sessionId: session.id });
    console.log('[Background] Session auto-ended successfully');
    return { acknowledged: true, sessionEnded: true };
  } catch (error) {
    console.error('[Background] Failed to auto-end session:', error);
    return { acknowledged: true, sessionEnded: false, error: error.message };
  }
}

// ============================================================================
// Session Control
// ============================================================================

async function handleStartSession(data) {
  const { class_id, meeting_id, platform, save_meeting_link } = data;

  try {
    // Fetch class name if not provided
    let className = data.class_name;
    if (!className) {
      const classes = await getClasses(); // Already returns array
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

    // Save meeting link to class if requested (for future auto-mapping)
    if (save_meeting_link && meeting_id) {
      try {
        const { addClassLink } = await import('./api-client.js');
        await addClassLink(class_id, {
          link: meeting_id,
          platform: platform || 'google-meet',
          is_active: true
        });
        console.log('[Background] Meeting link saved to class');
      } catch (linkError) {
        // Don't fail the session start if link save fails
        console.warn('[Background] Failed to save meeting link:', linkError);
      }
    }

    // Load student roster for matching
    const students = await getStudentsByClass(class_id);
    sessionManager.setStudentRoster(students);

    // Notify content script to start tracking BEFORE clearing detection state
    if (currentMeetingDetection?.tab_id) {
      try {
        await chrome.tabs.sendMessage(currentMeetingDetection.tab_id, {
          type: MESSAGE_TYPES.SESSION_STARTED,
          sessionId: session.id
        });
        console.log('[Background] Notified content script to start tracking');
      } catch (error) {
        console.error('[Background] Failed to notify content script:', error);
      }
    }

    // Clear meeting detection state AFTER notifying content script
    currentMeetingDetection = null;

    console.log('[Background] Session started:', session.id);
    return session;

  } catch (error) {
    console.error('[Background] Failed to start session:', error);
    throw error;
  }
}

async function handleEndSession(data) {
  const { sessionId } = data;

  try {
    // Get session info before ending (need class_id)
    const sessionInfo = await getSession(sessionId);
    
    // End session locally
    const session = await sessionManager.endSession(sessionId);

    // Aggregate and submit data
    try {
      // First, add unmapped participants as students to the class
      await addUnmappedParticipantsAsStudents(sessionId, sessionInfo?.class_id);
      
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
      try {
        const attendancePayload = await buildAttendancePayload(sessionId);
        const participationPayload = await buildParticipationPayload(sessionId);

        await syncQueueManager.enqueue('attendance', sessionId, attendancePayload);
        await syncQueueManager.enqueue('participation', sessionId, participationPayload);

        console.log('[Background] Session data queued for retry');
      } catch (queueError) {
        console.error('[Background] Failed to queue session data:', queueError);
      }
      
      // Clear local data even if sync failed (data is in queue)
      try {
        await clearSessionData(sessionId);
      } catch (clearError) {
        console.error('[Background] Failed to clear session data:', clearError);
      }
    }

    return session;
  } catch (error) {
    console.error('[Background] Failed to end session:', error);
    throw error;
  }
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

/**
 * Add unmapped participants as students to the class
 * This ensures all participants get tracked even if not in the roster
 */
async function addUnmappedParticipantsAsStudents(sessionId, classId) {
  if (!classId) {
    console.warn('[Background] No class ID for adding unmapped participants');
    return;
  }

  try {
    const participants = await getParticipantsBySession(sessionId);
    
    // Find unmapped participants
    const unmappedParticipants = participants.filter(p => !p.matched_student_id);
    
    if (unmappedParticipants.length === 0) {
      console.log('[Background] No unmapped participants to add');
      return;
    }

    console.log('[Background] Adding', unmappedParticipants.length, 'unmapped participants as students');

    // Convert participants to student format
    const studentsToAdd = unmappedParticipants.map(p => ({
      name: p.name,
      email: p.email
    }));

    // Bulk create students in backend
    const result = await createStudentsBulk(classId, studentsToAdd);
    
    console.log('[Background] Added students:', result?.added || 0, 'of', studentsToAdd.length);

    // Update local participant records with new student IDs
    // This allows their attendance and participation to be properly tracked
    if (result?.students) {
      for (const newStudent of result.students) {
        // Find matching participant by name
        const matchingParticipant = unmappedParticipants.find(p => {
          const participantName = p.name.toLowerCase();
          const studentName = `${newStudent.first_name} ${newStudent.last_name}`.toLowerCase();
          return participantName.includes(newStudent.first_name.toLowerCase()) ||
                 participantName.includes(newStudent.last_name.toLowerCase()) ||
                 studentName.includes(participantName.split(' ')[0]);
        });

        if (matchingParticipant) {
          // Import updateParticipant if not already done
          const { updateParticipant } = await import('../utils/storage.js');
          await updateParticipant(matchingParticipant.id, {
            matched_student_id: newStudent.id,
            matched_student_name: `${newStudent.first_name} ${newStudent.last_name}`,
            match_confidence: 1.0,
            match_method: 'auto_created'
          });
          console.log('[Background] Linked participant', matchingParticipant.name, 'to new student', newStudent.id);
        }
      }
    }

  } catch (error) {
    console.error('[Background] Failed to add unmapped participants as students:', error);
    // Don't throw - this is a nice-to-have feature, shouldn't block session end
  }
}

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
