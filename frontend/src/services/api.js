import axios from 'axios';
import { getToken, removeToken } from '@/utils/auth';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle 401 unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
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
};

// Classes API
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getStats: () => api.get('/classes/stats'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),

  // Student management
  getStudents: (classId) => api.get(`/classes/${classId}/students`),
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
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getStats: () => api.get('/sessions/stats'),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (sessionData) => api.post('/sessions', sessionData),
  update: (id, sessionData) => api.put(`/sessions/${id}`, sessionData),
  delete: (id) => api.delete(`/sessions/${id}`),
  start: (id) => api.put(`/sessions/${id}/start`),
  end: (id) => api.put(`/sessions/${id}/end`),
  getStudents: (id) => api.get(`/sessions/${id}/students`),
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