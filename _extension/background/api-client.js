/**
 * API Client for Engagium Backend
 * Handles all API calls with authentication
 */

import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants.js';

/**
 * Get auth token from storage
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

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
        await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
        throw new Error('Authentication expired. Please login again.');
      } else {
        // Non-critical operation failed, don't clear token
        throw new Error('Unauthorized. This operation may require different permissions.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Request failed:', error);
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
    
    // Use the new extension token verification endpoint
    const url = `${API_BASE_URL}/extension-tokens/verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[API] Token verification failed:', error);
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
    console.error('[API] Get user info failed:', error);
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
  console.log('[API] Adding class link:', {
    classId,
    link: linkData.link
  });

  // Don't clear token on 401 for this non-critical operation
  return await apiRequest(`/classes/${classId}/links`, {
    method: 'POST',
    body: JSON.stringify({
      link_url: linkData.link,
      link_type: linkData.platform || 'google_meet',
      label: 'Auto-mapped from extension',
      is_primary: linkData.is_active ?? true
    }),
    clearTokenOn401: false
  });
}

export async function getStudentsByClass(classId) {
  const response = await apiRequest(`/classes/${classId}/students`);
  // Backend may return { success: true, data: { students: [...] } } or { students: [...] }
  return response.data?.students || response.students || [];
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
  return await apiRequest('/sessions/start-from-meeting', {
    method: 'POST',
    body: JSON.stringify({
      class_id,
      meeting_link: meeting_id,
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
    body: JSON.stringify({ ended_at: endedAt })
  });
}

export async function startSession(sessionId) {
  return await apiRequest(`/sessions/${sessionId}/start`, {
    method: 'POST'
  });
}

export async function endSession(sessionId) {
  return await apiRequest(`/sessions/${sessionId}/end`, {
    method: 'POST'
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
  console.log('[API] Submitting bulk attendance:', {
    sessionId,
    count: attendanceRecords.length
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/bulk`, {
    method: 'POST',
    body: JSON.stringify({ attendance: attendanceRecords })
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
  console.log('[API] Recording participant join:', {
    sessionId,
    participant: data.participant_name
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/join`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Record a participant leave event (closes attendance interval)
 * @param {string} sessionId 
 * @param {Object} data - { participant_name, left_at }
 * @returns {Promise<Object>}
 */
export async function recordParticipantLeave(sessionId, data) {
  console.log('[API] Recording participant leave:', {
    sessionId,
    participant: data.participant_name
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/leave`, {
    method: 'POST',
    body: JSON.stringify(data)
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
  console.log('[API] Linking participant to student:', {
    sessionId,
    participant: data.participant_name,
    createStudent: data.create_student
  });

  return await apiRequest(`/sessions/${sessionId}/attendance/link`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Create a student from an unmatched participant
 * @param {string} classId 
 * @param {Object} data - { participant_name, session_id }
 * @returns {Promise<Object>}
 */
export async function createStudentFromParticipant(classId, data) {
  console.log('[API] Creating student from participant:', {
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
  console.log('[API] Submitting bulk participation:', {
    sessionId,
    count: participationLogs.length
  });

  return await apiRequest(`/participation/sessions/${sessionId}/logs/bulk`, {
    method: 'POST',
    body: JSON.stringify({ logs: participationLogs })
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
