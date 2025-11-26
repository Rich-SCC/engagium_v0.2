// Shared constants for the extension

export const PLATFORMS = {
  ZOOM: 'zoom',
  GOOGLE_MEET: 'google-meet',
  MS_TEAMS: 'ms-teams'
};

export const MESSAGE_TYPES = {
  // From content script to background
  MEETING_DETECTED: 'MEETING_DETECTED',
  MEETING_LEFT: 'MEETING_LEFT',
  PARTICIPANT_JOINED: 'PARTICIPANT_JOINED',
  PARTICIPANT_LEFT: 'PARTICIPANT_LEFT',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  REACTION: 'REACTION',
  HAND_RAISE: 'HAND_RAISE',
  MIC_TOGGLE: 'MIC_TOGGLE',
  CAMERA_TOGGLE: 'CAMERA_TOGGLE',
  
  // From popup to background
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  GET_SESSION_STATUS: 'GET_SESSION_STATUS',
  GET_PARTICIPANTS: 'GET_PARTICIPANTS',
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
  CHAT: 'chat',
  REACTION: 'reaction',
  HAND_RAISE: 'hand_raise',
  MIC_ON: 'mic_on',
  CAMERA_ON: 'camera_on',
  QUESTION: 'question',
  ANSWER: 'answer'
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  MEETING_MAPPINGS: 'meeting_mappings',
  AUTO_START: 'auto_start',
  MATCH_THRESHOLD: 'match_threshold',
  LAST_SYNC: 'last_sync'
};

export const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://engagium.app/api' 
    : 'http://localhost:3001/api';

export const DB_NAME = 'EngagiumExtension';
export const DB_VERSION = 1;

export const DB_STORES = {
  ACTIVE_SESSIONS: 'active_sessions',
  TRACKED_PARTICIPANTS: 'tracked_participants',
  PARTICIPATION_EVENTS: 'participation_events',
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
