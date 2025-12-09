import axios from 'axios';
import { getToken, getRefreshToken, setToken, removeTokens } from '@/utils/auth';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized - token expired or invalid
    // Skip for login endpoint as 401 there means invalid credentials, not expired token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to landing page
        removeTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the access token
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken
        });

        const { accessToken } = response.data.data;
        setToken(accessToken);
        
        // Update the authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to landing page
        processQueue(refreshError, null);
        removeTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Extension Tokens API
export const extensionTokensAPI = {
  getAll: () => api.get('/extension-tokens'),
  generate: () => api.post('/extension-tokens/generate'),
  revoke: (tokenId) => api.delete(`/extension-tokens/${tokenId}`),
  revokeAll: () => api.delete('/extension-tokens/revoke-all'),
};

// Classes API
export const classesAPI = {
  getAll: (includeArchived = false) => api.get(`/classes?include_archived=${includeArchived}`),
  getStats: () => api.get('/classes/stats'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
  
  // Status and schedule
  updateStatus: (id, status) => api.patch(`/classes/${id}/status`, { status }),
  updateSchedule: (id, schedule) => api.patch(`/classes/${id}/schedule`, { schedule }),

  // Session links
  getLinks: (classId) => api.get(`/classes/${classId}/links`),
  addLink: (classId, linkData) => api.post(`/classes/${classId}/links`, linkData),
  updateLink: (classId, linkId, linkData) => api.put(`/classes/${classId}/links/${linkId}`, linkData),
  deleteLink: (classId, linkId) => api.delete(`/classes/${classId}/links/${linkId}`),

  // Exempted accounts
  getExemptions: (classId) => api.get(`/classes/${classId}/exemptions`),
  addExemption: (classId, exemptionData) => api.post(`/classes/${classId}/exemptions`, exemptionData),
  deleteExemption: (classId, exemptionId) => api.delete(`/classes/${classId}/exemptions/${exemptionId}`),

  // Student management
  getStudents: (classId, params) => api.get(`/classes/${classId}/students`, { params }),
  getStudentDetails: (classId, studentId) => api.get(`/classes/${classId}/students/${studentId}`),
  addStudent: (classId, studentData) => api.post(`/classes/${classId}/students`, studentData),
  updateStudent: (classId, studentId, studentData) =>
    api.put(`/classes/${classId}/students/${studentId}`, studentData),
  removeStudent: (classId, studentId) =>
    api.delete(`/classes/${classId}/students/${studentId}`),
  importStudents: (classId, formData) =>
    api.post(`/classes/${classId}/students/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  bulkDeleteStudents: (classId, studentIds) =>
    api.post(`/classes/${classId}/students/bulk-delete`, { student_ids: studentIds }),
  bulkUpdateStudents: (classId, updates) =>
    api.post(`/classes/${classId}/students/bulk-update`, { updates }),
  exportStudents: (classId) =>
    api.get(`/classes/${classId}/students/export`, {
      responseType: 'blob',
    }),
  checkDuplicates: (classId, params) =>
    api.get(`/classes/${classId}/students/check-duplicates`, { params }),
  mergeStudents: (classId, keepStudentId, mergeStudentId) =>
    api.post(`/classes/${classId}/students/merge`, {
      keep_student_id: keepStudentId,
      merge_student_id: mergeStudentId
    }),

  // Student tags
  getTags: (classId) => api.get(`/classes/${classId}/tags`),
  createTag: (classId, tagData) => api.post(`/classes/${classId}/tags`, tagData),
  updateTag: (classId, tagId, tagData) => api.put(`/classes/${classId}/tags/${tagId}`, tagData),
  deleteTag: (classId, tagId) => api.delete(`/classes/${classId}/tags/${tagId}`),
  getStudentTags: (classId, studentId) => api.get(`/classes/${classId}/students/${studentId}/tags`),
  assignTag: (classId, studentId, tagId) =>
    api.post(`/classes/${classId}/students/${studentId}/tags/${tagId}`),
  removeTag: (classId, studentId, tagId) =>
    api.delete(`/classes/${classId}/students/${studentId}/tags/${tagId}`),
  bulkAssignTag: (classId, tagId, studentIds) =>
    api.post(`/classes/${classId}/tags/${tagId}/bulk-assign`, { student_ids: studentIds }),
  bulkRemoveTag: (classId, tagId, studentIds) =>
    api.post(`/classes/${classId}/tags/${tagId}/bulk-remove`, { student_ids: studentIds }),

  // Student notes
  getStudentNotes: (classId, studentId) => api.get(`/classes/${classId}/students/${studentId}/notes`),
  createNote: (classId, studentId, noteText) =>
    api.post(`/classes/${classId}/students/${studentId}/notes`, { note_text: noteText }),
  updateNote: (classId, studentId, noteId, noteText) =>
    api.put(`/classes/${classId}/students/${studentId}/notes/${noteId}`, { note_text: noteText }),
  deleteNote: (classId, studentId, noteId) =>
    api.delete(`/classes/${classId}/students/${studentId}/notes/${noteId}`),
  getRecentNotes: (classId, limit = 10) =>
    api.get(`/classes/${classId}/notes/recent`, { params: { limit } }),

  // Class sessions
  getSessions: (classId, params) => api.get(`/classes/${classId}/sessions`, { params }),

  // Analytics
  getClassAnalytics: (classId, params) => api.get(`/classes/${classId}/analytics`, { params }),
  getStudentAnalytics: (classId, studentId, params) => 
    api.get(`/classes/${classId}/students/${studentId}/analytics`, { params }),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getActive: () => api.get('/sessions/active'),
  getStats: () => api.get('/sessions/stats'),
  getById: (id) => api.get(`/sessions/${id}`),
  getWithAttendance: (id) => api.get(`/sessions/${id}/full`),
  create: (sessionData) => api.post('/sessions', sessionData),
  update: (id, sessionData) => api.put(`/sessions/${id}`, sessionData),
  delete: (id) => api.delete(`/sessions/${id}`),
  start: (id) => api.put(`/sessions/${id}/start`),
  end: (id) => api.put(`/sessions/${id}/end`),
  
  // Extension endpoints (NEW)
  startFromMeeting: (data) => api.post('/sessions/start-from-meeting', data),
  endWithTimestamp: (id, endedAt) => 
    api.put(`/sessions/${id}/end-with-timestamp`, { ended_at: endedAt }),
  
  getStudents: (id) => api.get(`/sessions/${id}/students`),
  
  // Date range and calendar
  getByDateRange: (startDate, endDate) =>
    api.get('/sessions/date-range', { params: { startDate, endDate } }),
  getCalendarData: (year, month) =>
    api.get('/sessions/calendar', { params: { year, month } }),
  
  // Attendance
  submitBulkAttendance: (id, attendance) =>
    api.post(`/sessions/${id}/attendance/bulk`, { attendance }),
  getAttendance: (id) => api.get(`/sessions/${id}/attendance`),
  getAttendanceWithIntervals: (id) => api.get(`/sessions/${id}/attendance/full`),
  getAttendanceStats: (id) => api.get(`/sessions/${id}/attendance/stats`),
  linkParticipantToStudent: (id, data) => api.post(`/sessions/${id}/attendance/link`, data),
};

// Students API
export const studentsAPI = {
  // Create student from unmatched participant
  createFromParticipant: (classId, participantName) =>
    api.post(`/classes/${classId}/students/from-participant`, { participant_name: participantName }),
};

// Participation API
export const participationAPI = {
  getLogs: (sessionId, params = {}) =>
    api.get(`/participation/sessions/${sessionId}/logs`, { params }),
  addLog: (sessionId, logData) =>
    api.post(`/participation/sessions/${sessionId}/logs`, logData),
  addBulkLogs: (sessionId, logs) =>
    api.post(`/participation/sessions/${sessionId}/logs/bulk`, { logs }),
  getSummary: (sessionId) =>
    api.get(`/participation/sessions/${sessionId}/summary`),
  getRecentActivity: (sessionId, minutes = 5) =>
    api.get(`/participation/sessions/${sessionId}/recent?minutes=${minutes}`),
};

export default api;