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
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please login in extension options.');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Extension-Token': token,
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
      throw new Error('Authentication expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.statusText}`);
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
  return await apiRequest('/classes');
}

export async function getClassById(classId) {
  return await apiRequest(`/classes/${classId}`);
}

export async function getStudentsByClass(classId) {
  const response = await apiRequest(`/classes/${classId}/students`);
  return response.students || [];
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
