/**
 * Google Meet Content Script - Configuration
 * DOM selectors and timing configuration
 * 
 * IMPORTANT: Updated November 2025 - Google Meet now uses ARIA-based accessibility structure
 * Old data-* attribute selectors no longer work.
 * 
 * Reference: __documentation/Extension/GOOGLE_MEET_DOM_REFERENCE.md
 */

// Event types for communication between content script and background
export const EVENT_TYPES = {
  // Attendance events (extension → backend)
  PARTICIPANT_JOINED: 'PARTICIPANT_JOINED',
  PARTICIPANT_LEFT: 'PARTICIPANT_LEFT',
  
  // Status events
  MIC_STATUS_CHANGED: 'MIC_STATUS_CHANGED',
  CAMERA_STATUS_CHANGED: 'CAMERA_STATUS_CHANGED',
  
  // Interaction events
  HAND_RAISED: 'HAND_RAISED',
  HAND_LOWERED: 'HAND_LOWERED',
  REACTION: 'REACTION',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  
  // Session events
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
  
  // Screen sharing
  SCREEN_SHARE_STARTED: 'SCREEN_SHARE_STARTED',
  SCREEN_SHARE_ENDED: 'SCREEN_SHARE_ENDED'
};

// SELECTORS export for backwards compatibility
export const SELECTORS = {
  // People Panel (PRIMARY SOURCE - always has complete participant list)
  sidePanel: 'aside[aria-label="Side panel"]',
  participantsList: '[role="list"][aria-label="Participants"]',
  peoplePanelList: '[role="list"][aria-label="Participants"]',
  participantItem: '[role="listitem"]',
  
  // Raised Hands Section
  raisedHandsRegion: '[role="region"][aria-label="Raised hands"]',
  
  // People Button
  peopleButton: 'button[aria-label*="People"]',
  
  // Chat Panel
  chatTextbox: '[role="textbox"][aria-label="Send a message"]',
  
  // Control Bar
  micButton: 'button[aria-label*="microphone"]',
  cameraButton: 'button[aria-label*="camera"]',
  
  // Screen Share
  presentationRegion: '[role="region"][aria-label="Presentation"]',
  
  // Video Grid
  mainVideoGrid: '[role="main"]'
};

export const CONFIG = {
  // DOM Selectors (Google Meet UI - November 2025)
  // Uses ARIA roles and labels instead of data-* attributes
  SELECTORS: {
    // People Panel (PRIMARY SOURCE - always has complete participant list)
    sidePanel: 'aside[aria-label="Side panel"]',
    participantsList: '[role="list"][aria-label="Participants"]',
    peoplePanelList: '[role="list"][aria-label="Participants"]', // alias for consistency
    participantItem: '[role="listitem"]',
    
    // Raised Hands Section (appears when hands are raised)
    raisedHandsRegion: '[role="region"][aria-label="Raised hands"]',
    
    // People Button (to check participant count)
    peopleButton: 'button[aria-label*="People"]',
    
    // Chat Panel
    chatTextbox: '[role="textbox"][aria-label="Send a message"]',
    
    // Control Bar (for self status - less relevant for monitoring others)
    micButton: 'button[aria-label*="microphone"]',
    cameraButton: 'button[aria-label*="camera"]',
    
    // Screen Share / Presentation
    presentationRegion: '[role="region"][aria-label="Presentation"]',
    
    // Video Grid (supplementary - limited to visible tiles)
    mainVideoGrid: '[role="main"]',
    
    // Meeting Info
    meetingTitle: '[role="heading"][level="1"]',
    
    // Tooltips (for name extraction)
    tooltip: '[role="tooltip"]'
  },
  
  // Text patterns for detection (case-insensitive matching)
  PATTERNS: {
    // Self indicators (to exclude from monitoring)
    selfIndicator: '(You)',
    hostIndicator: 'Meeting host',
    presentationIndicator: 'presentation',
    yourPresentation: 'Your presentation',
    
    // Toast notification patterns
    joined: 'joined',
    left: 'left',
    raisedHand: 'has raised a hand',
    reactedWith: 'reacted with',
    saysInChat: 'says in chat:',  // NEW: Chat toast pattern
    presenting: 'is presenting',
    stoppedPresenting: 'stopped presenting',
    
    // Mic status in People Panel
    // MUTED: disabled button with "can't unmute"
    // UNMUTED: clickable button with "[Name]'s microphone"
    cantUnmute: "can't unmute",
    mutesMicrophone: "'s microphone",  // NEW: Unmuted indicator
    
    // Icon text patterns (from accessibility tree)
    handIcon: 'front_hand',
    micIcon: 'mic',
    micOffIcon: 'mic_off',
    videocamIcon: 'videocam',
    videocamOffIcon: 'videocam_off',
    presentIcon: 'present_to_all'
  },
  
  // Available reactions in Google Meet
  REACTIONS: ['💖', '👍', '🎉', '👏', '😂', '😮', '😢', '🤔', '👎'],
  
  // Emoji detection regex (for reaction detection on tiles)
  EMOJI_REGEX: /[\u{1F300}-\u{1F9FF}]/u,
  
  // Debounce delays (in milliseconds)
  DEBOUNCE: {
    PARTICIPANT_UPDATE: 500,   // Increased from 300ms
    TOAST_PROCESS: 200,        // Increased from 100ms
    PANEL_SCAN: 750,           // Increased from 500ms
    CHAT_PROCESS: 200          // Increased from 100ms
  },
  
  // Retry configuration for finding elements
  RETRY: {
    MAX_ATTEMPTS: 10,
    DELAY_MS: 500
  },
  
  // Reaction deduplication window (in milliseconds)
  REACTION_DEDUP_WINDOW: 3000,
  
  // Invalid participant names to filter out (UI element text)
  INVALID_NAMES: [
    'frame_person',
    'person',
    'mic',
    'mic_off',
    'videocam',
    'videocam_off',
    'more_vert',
    'push_pin',
    'volume_up',
    'volume_off',
    'present_to_all',
    'keyboard_arrow_up',
    'keyboard_arrow_down',
    'close',
    'search',
    'person_add',
    'front_hand',
    'back_hand',
    'keep',
    'send',
    'mood',
    'computer_arrow_up',
    'call_end',
    'apps',
    'lock_person',
    'info',
    'chat',
    'people',
    // Additional UI text to filter
    'more actions',
    'lower',
    'open queue',
    'pin message',
    'unpin message',
    'send a message',
    'meeting host',
    'add people',
    'search for people',
    'contributors',
    'in the meeting',
    'raised hands',
    'lower all hands',
    'in-call messages'
  ],
  
  // Meeting ID pattern (xxx-xxxx-xxx)
  MEETING_ID_PATTERN: /\/([a-z]{3}-[a-z]{4}-[a-z]{3})/
};

/**
 * Cleans a participant name by removing UI text suffixes
 * @param {string} name - Raw name from DOM
 * @returns {string} Cleaned name
 */
export function cleanParticipantName(name) {
  if (!name) return '';
  
  return name
    // Remove (You) and anything after
    .replace(/\s*\(You\).*$/i, '')
    // Remove Meeting host and anything after
    .replace(/\s*Meeting host.*$/i, '')
    // Remove Open queue button text
    .replace(/\s*Open queue.*$/i, '')
    // Remove close/Close button text (matches "close", "closeClose", "close Close")
    .replace(/\s*close\s*Close.*$/i, '')
    .replace(/\s*close$/i, '')
    // Remove Lower button text
    .replace(/\s*Lower.*$/i, '')
    // Remove More actions button text
    .replace(/\s*More actions.*$/i, '')
    // Remove Your presentation indicator
    .replace(/\s*Your presentation.*$/i, '')
    // Remove accessibility text that gets included
    .replace(/\s*You can't unmute.*$/i, '')
    // Clean up any trailing whitespace
    .trim();
}

/**
 * Checks if a name is a valid participant name (not UI text)
 * @param {string} name - Name to check
 * @returns {boolean} True if valid
 */
export function isValidParticipantName(name) {
  if (!name || name.length < 2 || name.length > 100) return false;
  
  const lower = name.toLowerCase().trim();
  
  // Check against invalid names list
  if (CONFIG.INVALID_NAMES.includes(lower)) return false;
  
  // Additional checks for UI text
  const uiPatterns = [
    'open queue',
    'close',
    'lower',
    'more actions',
    'pin message',
    'send a message',
    "can't unmute",
    'meeting host'
  ];
  
  for (const pattern of uiPatterns) {
    if (lower.includes(pattern)) return false;
  }
  
  return true;
}
