// Shared constants for the extension

// Only Google Meet is supported (Zoom browser has inaccessible DOM)
export const PLATFORMS = {
  GOOGLE_MEET: 'google-meet'
};

export const MESSAGE_TYPES = {
  // From content script to background
  MEETING_DETECTED: 'MEETING_DETECTED',
  MEETING_LEFT: 'MEETING_LEFT',
  PARTICIPANT_JOINED: 'PARTICIPANT_JOINED',
  PARTICIPANT_LEFT: 'PARTICIPANT_LEFT',
  PLATFORM_SWITCH: 'PLATFORM_SWITCH',
  
  // From popup to background
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  GET_SESSION_STATUS: 'GET_SESSION_STATUS',
  GET_PARTICIPANTS: 'GET_PARTICIPANTS',
  GET_MEETING_STATUS: 'GET_MEETING_STATUS',
  DISMISS_MEETING: 'DISMISS_MEETING',
  MANUAL_MATCH: 'MANUAL_MATCH',
  
  // From background to popup/content
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
  PARTICIPANT_UPDATE: 'PARTICIPANT_UPDATE',
  SYNC_STATUS: 'SYNC_STATUS',
  ERROR: 'ERROR'
};

export const SESSION_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  ENDED: 'ended',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

export const INTERACTION_TYPES = {
  // Removed participation event types - see __documentation/Extension/PLANNED_FEATURES.md
  // Future: CHAT, REACTION, HAND_RAISE, MIC_ON, CAMERA_ON
  QUESTION: 'question',
  ANSWER: 'answer'
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  MEETING_MAPPINGS: 'meeting_mappings',
  AUTO_START: 'auto_start',
  MATCH_THRESHOLD: 'match_threshold',
  LAST_SYNC: 'last_sync',
  AUTO_OPEN_POPUP: 'auto_open_popup',
  SHOW_JOIN_PROMPT: 'show_join_prompt',
  SHOW_TRACKING_REMINDER: 'show_tracking_reminder'
};

// Detect dev vs production using chrome.runtime.getManifest()
// Dev builds don't have 'update_url', production builds do
const isDev = !('update_url' in chrome.runtime.getManifest());
export const API_BASE_URL = isDev
  ? 'http://localhost:3001/api' 
  : 'https://engagium.app/api';

export const DB_NAME = 'EngagiumExtension';
export const DB_VERSION = 2; // Bumped for attendance_intervals store

export const DB_STORES = {
  ACTIVE_SESSIONS: 'active_sessions',
  TRACKED_PARTICIPANTS: 'tracked_participants',
  PARTICIPATION_EVENTS: 'participation_events',
  ATTENDANCE_INTERVALS: 'attendance_intervals', // NEW: Track join/leave intervals
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings'
};

export const MATCH_CONFIDENCE = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5
};

export const SYNC_RETRY = {
  MAX_ATTEMPTS: 5,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 60000, // 1 minute
  BACKOFF_FACTOR: 2
};

export const DEFAULTS = {
  AUTO_START: false,
  MATCH_THRESHOLD: 0.7,
  MAX_PARTICIPANTS: 500,
  DATA_RETENTION_DAYS: 7
};
