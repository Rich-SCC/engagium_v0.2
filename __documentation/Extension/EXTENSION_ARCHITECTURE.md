# Engagium Browser Extension - Architecture Document

**Version:** 1.0.0  
**Target:** Chrome/Edge (Manifest V3)  
**Last Updated:** November 25, 2025

---

## 1. Overview

### Purpose
The Engagium Browser Extension automatically tracks student attendance and participation during online meetings (Google Meet, with Zoom support planned). It captures live data and submits it to the Engagium web application via bulk API endpoints.

### Key Features
- **Automatic Attendance Tracking**: Monitor join/leave times for all participants
- **Participation Logging**: Track chat messages, reactions, hand raises, mic/camera usage
- **Intelligent Matching**: Match meeting participants to student roster using fuzzy matching
- **Offline Support**: Queue data locally and sync when connection restored
- **Multi-Platform**: Google Meet (MVP), Zoom (planned)
- **Privacy-First**: Data stored locally until explicitly synced by instructor

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      MEETING PLATFORMS                       │
│              Zoom.us  |  meet.google.com                     │
└─────────────────────────────┬───────────────────────────────┘
                              │ DOM Observation
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     CONTENT SCRIPTS                          │
│  ┌────────────┐  ┌──────────────┐                           │
│  │ Zoom.js    │  │ GoogleMeet.js│                           │
│  │ - Detect   │  │ - Detect     │                           │
│  │ - Extract  │  │ - Extract    │                           │
│  │ - Monitor  │  │ - Monitor    │                           │
│  └─────┬──────┘  └──────┬───────┘                           │
│        │                │                                    │
│        └────────────────┼────────────────────────────────────│
│                         │ postMessage()                      │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKGROUND SERVICE WORKER                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Message Router                                       │   │
│  │  - Receive from content scripts                       │   │
│  │  - Broadcast to popup                                 │   │
│  │  - Coordinate state                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Session Mgr  │  │ Storage Mgr  │  │ API Client      │   │
│  │ - Track state│  │ - IndexedDB  │  │ - Auth tokens   │   │
│  │ - Timestamps │  │ - Queue sync │  │ - Bulk submit   │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ↓             ↓             ↓
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │  POPUP   │  │ OPTIONS  │  │  BADGE ICON  │
    │  UI      │  │  PAGE    │  │  + TOOLTIP   │
    │ (React)  │  │ (React)  │  │              │
    └──────────┘  └──────────┘  └──────────────┘
            │
            ↓
    ┌─────────────────────────┐
    │   ENGAGIUM WEB APP      │
    │   Backend API           │
    │   - POST /attendance    │
    │   - POST /participation │
    └─────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Content Scripts

**Files:**
- `content/zoom.js` - Zoom meeting detection and tracking
- `content/google-meet.js` - Google Meet detection and tracking
- `content/ms-teams.js` - MS Teams detection and tracking (future)
- `content/base-tracker.js` - Shared tracking logic (base class)
- `content/dom-observer.js` - Generic DOM mutation observer utilities

**Responsibilities:**
- Detect when user navigates to meeting page
- Inject UI overlay (tracking indicator)
- Extract meeting metadata (ID, title, URL)
- Monitor participant list DOM changes
- Extract participant data (name, email, avatar)
- Track join/leave timestamps
- Monitor chat messages (if accessible)
- Monitor reactions and hand raises
- Send events to background worker via `chrome.runtime.sendMessage()`

**Technical Details:**
- **Injection Method:** Declarative content scripts in manifest.json
- **Match Patterns:**
  - Google Meet: `https://meet.google.com/*`
  - Zoom: `https://zoom.us/j/*`, `https://*.zoom.us/wc/*` (future)
- **DOM Selectors:** Platform-specific selectors (documented in each file)
- **Permissions:** `activeTab`, `scripting`

**Message Format to Background:**
```javascript
// Participant joined
{
  type: 'PARTICIPANT_JOINED',
  platform: 'zoom',
  meetingId: 'abc-defg-hij',
  participant: {
    id: 'zoom-participant-123',
    name: 'John Doe',
    email: 'john@university.edu',
    avatar: 'data:image/png;base64,...',
    joinedAt: '2025-11-25T14:30:00.000Z'
  }
}

// Participant left
{
  type: 'PARTICIPANT_LEFT',
  platform: 'zoom',
  meetingId: 'abc-defg-hij',
  participantId: 'zoom-participant-123',
  leftAt: '2025-11-25T15:45:00.000Z'
}

// Chat message
{
  type: 'CHAT_MESSAGE',
  platform: 'zoom',
  meetingId: 'abc-defg-hij',
  participantId: 'zoom-participant-123',
  message: 'Great question!',
  timestamp: '2025-11-25T14:35:00.000Z'
}

// Reaction
{
  type: 'REACTION',
  platform: 'zoom',
  meetingId: 'abc-defg-hij',
  participantId: 'zoom-participant-123',
  reaction: '👍',
  timestamp: '2025-11-25T14:36:00.000Z'
}
```

---

### 3.2 Background Service Worker

**File:** `background/service-worker.js`

**Modules:**
- `background/session-manager.js` - Active session state management
- `background/storage-manager.js` - IndexedDB operations
- `background/api-client.js` - Backend API communication
- `background/message-router.js` - Message passing coordinator
- `background/sync-queue.js` - Offline sync queue

**Responsibilities:**
- **Message Routing:** Receive messages from content scripts, broadcast to popup
- **Session Lifecycle:** Track active sessions, start/stop tracking
- **Data Aggregation:** Collect participant events, build attendance records
- **Storage:** Persist data to IndexedDB
- **API Sync:** Submit bulk data to backend when session ends
- **Token Management:** Store and refresh auth tokens
- **Offline Queue:** Queue failed API calls for retry

**IndexedDB Schema:**
```javascript
// Database: EngagiumExtension, Version: 1

// Store: active_sessions
{
  id: 'uuid-v4',
  class_id: 'uuid',
  class_name: 'CS 101',
  meeting_id: 'zoom-abc-123',
  meeting_platform: 'zoom',
  started_at: '2025-11-25T14:00:00.000Z',
  ended_at: null, // null if active
  status: 'active' // active | ended | synced
}

// Store: tracked_participants
{
  id: 'uuid-v4',
  session_id: 'uuid',
  platform_participant_id: 'zoom-participant-123',
  name: 'John Doe',
  email: 'john@university.edu',
  matched_student_id: 'uuid', // null if unmatched
  matched_student_name: 'John Doe',
  match_confidence: 0.95, // 0-1 scale
  joined_at: '2025-11-25T14:05:00.000Z',
  left_at: '2025-11-25T15:45:00.000Z',
  total_duration_seconds: 6000
}

// Store: participation_events
{
  id: 'uuid-v4',
  session_id: 'uuid',
  participant_id: 'uuid', // FK to tracked_participants
  event_type: 'chat_message' | 'reaction' | 'hand_raise' | 'mic_on' | 'camera_on',
  event_data: { message: '...', reaction: '👍' },
  timestamp: '2025-11-25T14:35:00.000Z'
}

// Store: sync_queue
{
  id: 'uuid-v4',
  type: 'attendance' | 'participation',
  session_id: 'uuid',
  payload: { ... }, // Full API request body
  attempts: 0,
  last_attempt: null,
  created_at: '2025-11-25T16:00:00.000Z'
}

// Store: settings
{
  key: 'auth_token' | 'auto_start' | 'default_class_id' | 'meeting_mappings',
  value: { ... }
}
```

**API Integration:**
```javascript
// Submit attendance (end of session)
POST https://engagium.app/api/sessions/:sessionId/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  attendance: [
    {
      student_id: 'uuid',
      status: 'present',
      joined_at: '2025-11-25T14:05:00Z',
      left_at: '2025-11-25T15:45:00Z'
    },
    // ... all participants
  ]
}

// Submit participation (end of session)
POST https://engagium.app/api/participation/sessions/:sessionId/logs/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  logs: [
    {
      student_id: 'uuid',
      interaction_type: 'chat',
      timestamp: '2025-11-25T14:35:00Z',
      metadata: { message_length: 50 }
    },
    // ... all events
  ]
}
```

---

### 3.3 Popup UI

**Files:**
- `popup/index.html` - Entry point
- `popup/App.jsx` - Main React component
- `popup/components/SessionStatus.jsx` - Active session display
- `popup/components/ParticipantList.jsx` - Live participant list
- `popup/components/AttendancePreview.jsx` - Preview before submit
- `popup/components/SyncStatus.jsx` - Sync progress indicator

**Responsibilities:**
- Display active session status
- Show participant count and list
- Start tracking button (if not auto-started)
- End session button (triggers sync)
- Show sync status and errors
- Quick access to options

**UI States:**
1. **Not Tracking:** "No active session. Join a meeting to start tracking."
2. **Tracking - Active:** Session timer, participant list, "End Session" button
3. **Syncing:** Progress bar, "Submitting attendance..."
4. **Synced:** Success checkmark, "Attendance submitted successfully"
5. **Error:** Error message, "Retry" button

**Screenshot Mockup:**
```
┌─────────────────────────────┐
│ Engagium Tracker            │
├─────────────────────────────┤
│ 🟢 Tracking: CS 101         │
│ Duration: 1h 23m            │
│                             │
│ 📊 23 participants tracked  │
│ ✅ 20 matched to roster     │
│ ⚠️  3 unmatched             │
│                             │
│ Recent Joins:               │
│ • John Doe (14:35)          │
│ • Jane Smith (14:36)        │
│                             │
│ [End Session & Submit]      │
│ [View Full List]            │
│ [Settings]                  │
└─────────────────────────────┘
```

---

### 3.4 Options Page

**Files:**
- `options/index.html` - Entry point
- `options/App.jsx` - Main React component
- `options/pages/Login.jsx` - Authentication
- `options/pages/ClassMapping.jsx` - Meeting → Class mapping
- `options/pages/RosterSync.jsx` - Student roster management
- `options/pages/Preferences.jsx` - Extension settings

**Responsibilities:**
- **Authentication:** Login with Engagium credentials, store auth token
- **Class Mapping:** Map meeting IDs/URLs to classes
- **Roster Sync:** Fetch student rosters from backend, cache locally
- **Auto-Start:** Configure auto-start tracking on meeting join
- **Name Matching Rules:** Configure fuzzy matching threshold
- **Data Management:** View/clear local data, export for debugging

**Authentication Flow (OAuth-style Redirect):**
1. User opens options page
2. Clicks "Login with Engagium" button
3. Extension opens new tab: `http://localhost:3000/extension/auth` (dev) or `https://engagium.app/extension/auth` (prod)
4. User logs in on web app (if not already logged in)
5. User clicks "Authorize Extension" button on web app
6. Web app redirects to: `chrome-extension://<extension-id>/options/callback.html?token=<jwt>&user=<user_data>`
7. Callback page extracts token from URL, stores in `chrome.storage.local`
8. Callback page sends message to options page and closes itself
9. Options page updates to show "Connected" status

**Benefits of OAuth Flow:**
- No manual token copying required
- Uses existing web app authentication
- Better UX (single click login)
- Automatic user info retrieval
- Secure token transmission via redirect

**Class Mapping UI:**
```
┌─────────────────────────────────────────────┐
│ Meeting → Class Mapping                     │
├─────────────────────────────────────────────┤
│ Add New Mapping:                            │
│ Meeting ID/URL: [___________________]       │
│ Class: [Select Class ▾]                     │
│ [+ Add Mapping]                             │
│                                             │
│ Existing Mappings:                          │
│ • Zoom: abc-defg-hij → CS 101               │
│ • Meet: xyz-1234-567 → CS 102               │
│ [Edit] [Delete]                             │
└─────────────────────────────────────────────┘
```

---

### 3.5 Student Matching Algorithm

**File:** `utils/student-matcher.js`

**Responsibilities:**
- Match meeting participant names to student roster
- Handle name variations (nicknames, middle names, etc.)
- Email domain matching (if participant email available)
- Fuzzy string matching with confidence scores
- Manual override support

**Algorithm:**
```javascript
function matchParticipant(participant, studentRoster) {
  const matches = [];
  
  for (const student of studentRoster) {
    let score = 0;
    
    // 1. Exact email match (highest confidence)
    if (participant.email && participant.email === student.email) {
      score = 1.0;
    }
    // 2. Fuzzy name match
    else {
      const nameSimilarity = levenshteinDistance(
        normalize(participant.name),
        normalize(student.name)
      );
      score = nameSimilarity;
    }
    
    if (score > 0.6) { // Threshold
      matches.push({ student, score });
    }
  }
  
  // Return best match
  matches.sort((a, b) => b.score - a.score);
  return matches[0] || null;
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .split(/\s+/)
    .sort()
    .join(' ');
}
```

**Edge Cases:**
- Multiple students with same name → Use email or manual selection
- Participant changes name mid-meeting → Update mapping
- Guest participants (non-students) → Flag as unmatched
- Professor/TA in participant list → Exclude from attendance

---

## 4. Data Flow

### 4.1 Session Start Flow
```
1. User joins Zoom meeting
   ↓
2. Content script detects meeting page
   ↓
3. Send message: { type: 'MEETING_DETECTED', meetingId: '...' }
   ↓
4. Background: Check if meeting mapped to class
   ↓
5a. If mapped → Auto-start tracking
5b. If not mapped → Notify popup: "Map this meeting to a class?"
   ↓
6. Create active_session in IndexedDB
   ↓
7. Update popup UI: Show "Tracking Active"
   ↓
8. Update badge icon: Green dot
```

### 4.2 Participant Tracking Flow
```
1. Content script observes participant list changes
   ↓
2. Participant joins → Extract name/email
   ↓
3. Send message: { type: 'PARTICIPANT_JOINED', participant: {...} }
   ↓
4. Background: Match participant to student roster
   ↓
5. Create tracked_participant record with match result
   ↓
6. Broadcast to popup: Update participant count
```

### 4.3 Participation Event Flow
```
1. Content script observes chat message
   ↓
2. Extract message metadata (sender, text, timestamp)
   ↓
3. Send message: { type: 'CHAT_MESSAGE', ... }
   ↓
4. Background: Create participation_event record
   ↓
5. Link event to tracked_participant
```

### 4.4 Session End Flow
```
1. User clicks "End Session" in popup
   ↓
2. Popup sends: { type: 'END_SESSION', sessionId: '...' }
   ↓
3. Background: Aggregate all tracked_participants
   ↓
4. Build attendance payload (array of attendance records)
   ↓
5. Build participation payload (array of participation logs)
   ↓
6. POST /sessions/:id/attendance/bulk
   ↓
7a. Success → Mark session as 'synced', clear local data
7b. Failure → Add to sync_queue, show error in popup
   ↓
8. POST /participation/sessions/:id/logs/bulk
   ↓
9. Update popup: "Successfully submitted!"
   ↓
10. Clear badge icon
```

---

## 5. Security & Privacy

### 5.1 Permissions
**Minimum Required:**
- `activeTab` - Access current tab when extension icon clicked
- `storage` - Store auth token and settings in `chrome.storage.local`
- `scripting` - Inject content scripts programmatically (if needed)

**Optional (Future):**
- `notifications` - Show desktop notifications for events
- `alarms` - Schedule periodic sync attempts

**NOT Required:**
- ❌ `tabs` - Not needed (use `activeTab` instead)
- ❌ `<all_urls>` - Only specific meeting domains

### 5.2 Data Handling
- **Local Storage:** All session data stored locally until manually synced
- **No Auto-Upload:** Data only sent to server when instructor clicks "End Session"
- **Encryption:** Auth tokens stored encrypted in `chrome.storage.local`
- **Data Retention:** Local data cleared after successful sync (or 7 days, whichever first)
- **GDPR Compliance:** No PII collected beyond meeting participant names (as displayed by platform)

### 5.3 Authentication
- **JWT Token:** Obtained via OAuth-like flow from web app
- **Token Storage:** `chrome.storage.local` (encrypted by Chrome)
- **Token Expiry:** Refresh before expiration (24 hour validity)
- **Logout:** Clear all local data including tokens

---

## 6. Error Handling

### 6.1 Network Errors
- **Offline Submission:** Queue in `sync_queue`, retry when online
- **API Errors (5xx):** Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
- **API Errors (4xx):** Show error to user, don't retry (except 401 → re-auth)

### 6.2 Matching Errors
- **No Match Found:** Flag participant as unmatched, allow manual mapping in popup
- **Low Confidence Match:** Show warning, allow instructor to confirm/override

### 6.3 Platform Changes
- **Selector Breaks:** Graceful fallback, log error to console, notify user "Tracking unavailable"
- **Auto-Update:** Monitor GitHub for selector updates, notify user to update extension

---

## 7. Performance Considerations

### 7.1 Content Script Optimization
- **Throttle DOM Observers:** Max 1 update per second
- **Lazy Loading:** Only activate tracking when session started
- **Memory Limits:** Cap participant list at 500 (large webinars)

### 7.2 Background Worker Optimization
- **Batch Writes:** Write to IndexedDB in batches (max 1/sec)
- **Indexed Queries:** Add indexes on session_id, timestamp
- **Cleanup:** Auto-delete synced sessions older than 7 days

### 7.3 Popup UI Optimization
- **Virtual Scrolling:** For participant lists >100
- **Debounced Updates:** Update UI max 1/sec even if events more frequent

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Student matcher algorithm (various name formats)
- API client (mocked responses)
- Storage manager (IndexedDB operations)

### 8.2 Integration Tests
- Content script → Background message passing
- Background → Popup updates
- Full sync flow (end-to-end)

### 8.3 Manual Testing
- **Zoom:** Join test meeting, verify participant tracking
- **Google Meet:** Join test meeting, verify participant tracking
- **Offline:** Disconnect network, verify queue, reconnect, verify sync
- **Unmatched Participants:** Add guests, verify manual mapping UI

---

## 9. Deployment

### 9.1 Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/ folder containing:
# - manifest.json
# - background.js (bundled)
# - content.js (bundled)
# - popup.html + popup.js (bundled React app)
# - options.html + options.js (bundled React app)
# - assets/ (icons, styles)
```

### 9.2 Chrome Web Store
- **Listing Name:** Engagium - Attendance & Participation Tracker
- **Category:** Productivity
- **Icon:** 128x128 logo
- **Screenshots:** 5 images (1280x800)
- **Privacy Policy:** Link to engagium.app/privacy
- **Permissions Justification:** Document in store listing

### 9.3 Updates
- **Auto-Update:** Chrome automatically updates extensions
- **Version Bump:** Increment manifest.json version on each release
- **Changelog:** Maintain CHANGELOG.md

---

## 10. Future Enhancements

### 10.1 Advanced Features
- **Screenshot Capture:** Take snapshots of meeting (with consent)
- **Audio Transcription:** Transcribe meeting audio (future AI integration)
- **Breakout Rooms:** Track attendance in Zoom breakout rooms
- **Mobile Support:** React Native extension wrapper (if possible)

### 10.2 Analytics
- **Usage Metrics:** Track extension usage (anonymized)
- **Error Reporting:** Sentry integration for crash reports
- **Performance Monitoring:** Track API latency, sync success rates

---

## 11. File Structure

```
_extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── package.json               # npm dependencies
├── webpack.config.js          # Bundler config (or vite.config.js)
├── README.md                  # Developer setup instructions
│
├── background/
│   ├── service-worker.js      # Main background script
│   ├── session-manager.js     # Session state management
│   ├── storage-manager.js     # IndexedDB operations
│   ├── api-client.js          # Backend API calls
│   ├── message-router.js      # Message passing coordinator
│   └── sync-queue.js          # Offline sync queue
│
├── content/
│   ├── base-tracker.js        # Base class for platform trackers
│   ├── google-meet.js         # Google Meet-specific tracker
│   ├── zoom.js                # Zoom tracker (future)
│   └── dom-observer.js        # DOM mutation utilities
│
├── popup/
│   ├── index.html             # Popup HTML entry point
│   ├── App.jsx                # Main React component
│   ├── popup.css              # Styles
│   └── components/
│       ├── SessionStatus.jsx
│       ├── ParticipantList.jsx
│       ├── AttendancePreview.jsx
│       └── SyncStatus.jsx
│
├── options/
│   ├── index.html             # Options page HTML
│   ├── App.jsx                # Main React component
│   ├── options.css            # Styles
│   └── pages/
│       ├── Login.jsx
│       ├── ClassMapping.jsx
│       ├── RosterSync.jsx
│       └── Preferences.jsx
│
├── utils/
│   ├── student-matcher.js     # Name matching algorithm
│   ├── date-utils.js          # Date/time formatting
│   ├── crypto.js              # Token encryption
│   └── constants.js           # Shared constants
│
├── assets/
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── styles/
│       └── shared.css
│
└── tests/
    ├── unit/
    │   ├── student-matcher.test.js
    │   └── api-client.test.js
    └── integration/
        └── sync-flow.test.js
```

---

**Next Steps:**
1. Review this architecture with team
2. Set up project structure (`npm init`, create folders)
3. Implement content script for Zoom (highest priority platform)
4. Build background service worker core
5. Create basic popup UI
6. Test end-to-end flow with live Zoom meeting
7. Iterate based on feedback

**Estimated Timeline:**
- Week 1: Project setup, content scripts (Zoom), background worker
- Week 2: Popup UI, API integration, storage layer
- Week 3: Options page, student matching, error handling
- Week 4: Testing, bug fixes, documentation, Chrome Web Store submission
