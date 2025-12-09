/**
 * API Client for Engagium Backend
 * Handles all API calls with authentication
 */

import { API_BASE_URL, PLATFORMS } from '../utils/constants.js';
import { formatGoogleMeetUrl } from '../utils/url-utils.js';
import { getAuthToken, clearAuthToken, verifyAuthToken } from '../utils/auth.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('API');

/**
 * Make authenticated API request
 * @param {string} endpoint 
 * @param {Object} options 
 * @param {boolean} options.clearTokenOn401 - If true, clear token on 401 (default: true)
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const { clearTokenOn401 = true, ...fetchOptions } = options;
  
  if (!token) {
    throw new Error('Not authenticated. Please login in extension options.');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Extension-Token': token,
    ...fetchOptions.headers
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers
    });

    if (response.status === 401) {
      // Only clear token if explicitly allowed (critical auth flows)
      if (clearTokenOn401) {
        await clearAuthToken();
        throw new Error('Authentication expired. Please login again.');
      } else {
        // Non-critical operation failed, don't clear token
        throw new Error('Unauthorized. This operation may require different permissions.');
      }
    }

    if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Access denied');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Request failed:', error);
    throw error;
  }
}

// ============================================================================
// Authentication
// ============================================================================

export async function verifyToken() {
  try {
    const token = await getAuthToken();
    if (!token) return false;
    
    const result = await verifyAuthToken(token);
    return result.valid;
  } catch (error) {
    logger.error('Token verification failed:', error);
    return false;
  }
}

export async function getUserInfo() {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    // Verify token and get user info in one call
    const url = `${API_BASE_URL}/extension-tokens/verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const data = await response.json();
    if (data.success && data.data.user) {
      return { success: true, data: data.data.user };
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    logger.error('Get user info failed:', error);
    throw error;
  }
}

// ============================================================================
// Classes & Students
// ============================================================================

export async function getClasses() {
  const response = await apiRequest('/classes');
  // Backend returns { success: true, data: [...] }
  return response.data || [];
}

export async function getClassById(classId) {
  const response = await apiRequest(`/classes/${classId}`);
  return response.data || null;
}

/**
 * Add a meeting link to a class (for auto-mapping)
 * @param {string} classId 
 * @param {Object} linkData - { link, platform?, is_active? }
 * @returns {Promise<Object>}
 */
export async function addClassLink(classId, linkData) {
  logger.log('Adding class link:', {
    classId,
    link: linkData.link
  });

  // Don't clear token on 401 for this non-critical operation
  return await apiRequest(`/classes/${classId}/links`, {
    method: 'POST',
    body: JSON.stringify({
      link_url: linkData.link,
      link_type: linkData.platform === PLATFORMS.GOOGLE_MEET ? 'meet' : (linkData.platform || 'meet'),
      label: 'Auto-mapped from extension',
      is_primary: linkData.is_active ?? true
    }),
    clearTokenOn401: false
  });
}

export async function getStudentsByClass(classId) {
  logger.log('Fetching students for class:', classId);
  try {
    const response = await apiRequest(`/classes/${classId}/students`);
    logger.debug('Raw response:', JSON.stringify(response, null, 2));
    
    // Backend may return { success: true, data: { students: [...] } } or { success: true, data: [...] } or { students: [...] }
    let students = [];
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        students = response.data;
      } else if (response.data.students) {
        students = response.data.students;
      }
    } else if (response.students) {
      students = response.students;
    } else if (Array.isArray(response)) {
      students = response;
    }
    
    logger.log('Parsed students:', students.length, 'students');
    if (students.length > 0) {
      logger.debug('First student:', JSON.stringify(students[0], null, 2));
      logger.debug('Student fields:', Object.keys(students[0]));
    }
    
    // Map full_name to name for consistency with matcher
    const mappedStudents = students.map(s => ({
      id: s.id,
      name: s.full_name || s.name,
      student_id: s.student_id
    }));
    
    logger.success('✅ Returning', mappedStudents.length, 'mapped students');
    return mappedStudents;
  } catch (error) {
    logger.error('❌ Failed to fetch students:', error);
    throw error;
  }
}

/**
 * Create a new student in a class
 * @param {string} classId 
 * @param {Object} studentData - { first_name, last_name, email?, student_id? }
 * @returns {Promise<Object>}
 */
export async function createStudent(classId, studentData) {
  const response = await apiRequest(`/classes/${classId}/students`, {
    method: 'POST',
    body: JSON.stringify(studentData)
  });
  return response.data || null;
}

/**
 * Bulk create students in a class (for unmapped participants)
 * @param {string} classId 
 * @param {Array} students - [{ first_name, last_name, email?, student_id? }]
 * @returns {Promise<Object>}
 */
export async function createStudentsBulk(classId, students) {
  const response = await apiRequest(`/classes/${classId}/students/bulk`, {
    method: 'POST',
    body: JSON.stringify({ students })
  });
  return response.data || [];
}

// ============================================================================
// Sessions
// ============================================================================

export async function getSessionById(sessionId) {
  return await apiRequest(`/sessions/${sessionId}`);
}

export async function startSessionFromMeeting(sessionData) {
  const { class_id, meeting_id, platform } = sessionData;
  
  // Format meeting_id as full URL for consistent storage
  const formattedLink = platform === PLATFORMS.GOOGLE_MEET 
    ? formatGoogleMeetUrl(meeting_id)
    : meeting_id;
  
  return await apiRequest('/sessions/start-from-meeting', {
    method: 'POST',
    body: JSON.stringify({
      class_id,
      meeting_link: formattedLink,
      started_at: new Date().toISOString(), // Required by backend
      platform,
      additional_data: {
        extension_version: chrome.runtime.getManifest().version
      }
    })
  });
}

export async function endSessionWithTimestamp(sessionId, endedAt) {
  return await apiRequest(`/sessions/${sessionId}/end-with-timestamp`, {
    method: 'PUT',
    body: JSON.stringify({ ended_at: endedAt }),
    clearTokenOn401: false // Don't clear token if session end fails
  });
}

export async function startSession(sessionId) {
  return await apiRequest(`/sessions/${sessionId}/start`, {
    method: 'POST',
    clearTokenOn401: false // Don't clear token if session start fails
  });
}

export async function endSession(sessionId) {
  return await apiRequest(`/sessions/${sessionId}/end`, {
    method: 'POST',
    clearTokenOn401: false // Don't clear token if session end fails
  });
}

// ============================================================================
// Attendance (Bulk Submission)
// ============================================================================

/**
 * Submit bulk attendance for a session
 * @param {string} sessionId 
 * @param {Array} attendanceRecords - [{ student_id, status, joined_at, left_at }]
 * @returns {Promise<Object>}
 */
export async function submitBulkAttendance(sessionId, attendanceRecords) {
  logger.log('Submitting bulk attendance:', {
    sessionId,
    count: attendanceRecords.length
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/bulk`, {
    method: 'POST',
    body: JSON.stringify({ attendance: attendanceRecords }),
    clearTokenOn401: false // Don't clear token if attendance submission fails
  });
}

// ============================================================================
// Attendance Intervals (Real-time Tracking)
// ============================================================================

/**
 * Record a participant join event (creates attendance interval)
 * @param {string} sessionId 
 * @param {Object} data - { participant_name, joined_at, student_id? }
 * @returns {Promise<Object>}
 */
export async function recordParticipantJoin(sessionId, data) {
  logger.log('Recording participant join:', {
    sessionId,
    participant: data.participant_name
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/join`, {
    method: 'POST',
    body: JSON.stringify(data),
    clearTokenOn401: false // Don't clear token during session tracking
  });
}

/**
 * Record a participant leave event (closes attendance interval)
 * @param {string} sessionId 
 * @param {Object} data - { participant_name, left_at }
 * @returns {Promise<Object>}
 */
export async function recordParticipantLeave(sessionId, data) {
  logger.log('Recording participant leave:', {
    sessionId,
    participant: data.participant_name
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/leave`, {
    method: 'POST',
    body: JSON.stringify(data),
    clearTokenOn401: false // Don't clear token during session tracking
  });
}

/**
 * Get full attendance data with intervals for a session
 * @param {string} sessionId 
 * @returns {Promise<Object>}
 */
export async function getSessionAttendanceWithIntervals(sessionId) {
  return await apiRequest(`/sessions/${sessionId}/attendance/full`);
}

/**
 * Link an unmatched participant to a student
 * @param {string} sessionId 
 * @param {Object} data - { participant_name, student_id?, create_student? }
 * @returns {Promise<Object>}
 */
export async function linkParticipantToStudent(sessionId, data) {
  logger.log('Linking participant to student:', {
    sessionId,
    participant: data.participant_name,
    createStudent: data.create_student
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/link`, {
    method: 'POST',
    body: JSON.stringify(data),
    clearTokenOn401: false // Don't clear token during session tracking
  });
}

/**
 * Create a student from an unmatched participant
 * @param {string} classId 
 * @param {Object} data - { participant_name, session_id }
 * @returns {Promise<Object>}
 */
export async function createStudentFromParticipant(classId, data) {
  logger.log('Creating student from participant:', {
    classId,
    participant: data.participant_name
  });

  return await apiRequest(`/classes/${classId}/students/from-participant`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============================================================================
// Participation (Bulk Submission)
// ============================================================================

/**
 * Submit bulk participation logs for a session
 * @param {string} sessionId 
 * @param {Array} participationLogs - [{ student_id, interaction_type, timestamp, metadata }]
 * @returns {Promise<Object>}
 */
export async function submitBulkParticipation(sessionId, participationLogs) {
  logger.log('Submitting bulk participation:', {
    sessionId,
    count: participationLogs.length
  });

  return await apiRequest(`/participation/sessions/${sessionId}/logs/bulk`, {
    method: 'POST',
    body: JSON.stringify({ logs: participationLogs }),
    clearTokenOn401: false // Don't clear token during session data submission
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

export async function isAuthenticated() {
  const token = await getAuthToken();
  if (!token) return false;
  return await verifyToken();
}

export async function logout() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.USER_INFO
  ]);
}
