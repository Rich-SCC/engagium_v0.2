import { resolveApiBaseUrl } from '@/utils/apiBaseUrl';

const API_BASE_URL = resolveApiBaseUrl();

async function request(endpoint, { method = 'GET', token, body } = {}) {
  if (!token) {
    throw new Error('Missing Zoom bridge token');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Extension-Token': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function requestPublic(endpoint, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const zoomIframeAPI = {
  verifyTokenIdentity: (token) =>
    requestPublic('/extension-tokens/verify', {
      method: 'POST',
      body: { token },
    }),

  getClasses: (token) => request('/classes', { token }),

  getActiveSessions: (token) => request('/sessions/active', { token }),

  getSessionAttendanceWithIntervals: (token, sessionId) =>
    request(`/sessions/${sessionId}/attendance/full`, { token }),

  startSessionFromMeeting: (token, payload) =>
    request('/sessions/start-from-meeting', {
      method: 'POST',
      token,
      body: payload,
    }),

  endSessionWithTimestamp: (token, sessionId, endedAt) =>
    request(`/sessions/${sessionId}/end-with-timestamp`, {
      method: 'PUT',
      token,
      body: { ended_at: endedAt },
    }),

  sendLiveEvent: (token, payload) =>
    request('/sessions/live-event', {
      method: 'POST',
      token,
      body: payload,
    }),
};

export default zoomIframeAPI;
