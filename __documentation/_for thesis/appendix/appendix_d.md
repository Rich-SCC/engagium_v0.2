# APPENDIX D  
PROGRAM LISTING

> ⚠️ **DRAFT** — This appendix is subject to change as development continues. To be finalized before final submission when the codebase is frozen.

This appendix provides summaries of the key source code files in the ENGAGIUM system. Full source code is available in the project repository. Only major modules and their responsibilities are described here.

> **Note:** Complete source code listings are available upon request or in the accompanying digital submission.

---

## D.1 Backend Key Files (Summaries Only)

The backend is built with Node.js and Express.js, following a modular controller-based architecture.

### D.1.1 Server Entry Point

**File:** `backend/server.js`

**Purpose:** Main entry point that initializes the Express application, connects to PostgreSQL, sets up middleware, mounts API routes, and starts the HTTP server with Socket.io integration.

**Key Responsibilities:**
- Load environment configuration
- Initialize database connection pool
- Configure CORS, JSON parsing, and authentication middleware
- Mount route handlers for all API endpoints
- Initialize Socket.io server for real-time communication
- Start listening on configured port

---

### D.1.2 Authentication Controller

**File:** `backend/src/controllers/authController.js`

**Purpose:** Handles all user authentication operations including registration, login, token management, and password reset.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `register` | Creates new user account with hashed password |
| `login` | Validates credentials, generates JWT access and refresh tokens |
| `refreshToken` | Issues new access token using valid refresh token |
| `logout` | Invalidates refresh token |
| `forgotPassword` | Generates reset token and sends email |
| `resetPassword` | Validates reset token and updates password |
| `getProfile` | Returns current user's profile information |
| `updateProfile` | Updates user's name, email, or password |

**Security Measures:**
- Passwords hashed using bcrypt with salt rounds
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in database and expire in 7 days
- Reset tokens are time-limited and single-use

---

### D.1.3 Extension Token Controller

**File:** `backend/src/controllers/extensionTokenController.js`

**Purpose:** Manages long-lived authentication tokens for the browser extension, separate from JWT tokens.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `generateToken` | Creates new extension token, stores hash in database |
| `listTokens` | Returns all tokens for current user (with masked values) |
| `revokeToken` | Invalidates specific token by ID |
| `revokeAllTokens` | Invalidates all tokens for current user |
| `verifyToken` | Validates token hash and returns associated user |

**Token Format:** `ext_[32-character-random-string]`

---

### D.1.4 Class Controller

**File:** `backend/src/controllers/classController.js`

**Purpose:** Manages class/course CRUD operations, meeting links, and exempted accounts.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getClasses` | Lists all classes for authenticated instructor |
| `getClassById` | Returns single class with statistics |
| `createClass` | Creates new class with name, subject, section, schedule |
| `updateClass` | Updates class properties |
| `deleteClass` | Removes class and cascades to related data |
| `archiveClass` | Toggles class status between active/archived |
| `getClassStats` | Returns aggregated attendance and session statistics |
| `getLinks` | Lists meeting links for a class |
| `addLink` | Adds meeting link (Google Meet, Zoom, etc.) |
| `updateLink` | Modifies meeting link properties |
| `deleteLink` | Removes meeting link |
| `getExemptedAccounts` | Lists accounts excluded from tracking |
| `addExemptedAccount` | Adds account to exemption list |
| `removeExemptedAccount` | Removes account from exemption list |

---

### D.1.5 Student Controller

**File:** `backend/src/controllers/studentController.js`

**Purpose:** Manages student roster operations including individual CRUD, CSV import, and bulk operations.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getStudentsByClass` | Lists all students in a class |
| `getStudentById` | Returns single student with attendance history |
| `createStudent` | Adds student to class roster |
| `updateStudent` | Updates student name or ID |
| `deleteStudent` | Removes student from roster |
| `importStudents` | Parses CSV and bulk inserts students |
| `bulkDeleteStudents` | Removes multiple students by ID array |
| `checkDuplicates` | Identifies potential duplicate entries by name similarity |

**CSV Import Format:**
```
full_name,student_id
"Dela Cruz, Juan",2021-0001
"Santos, Maria",2021-0002
```

---

### D.1.6 Session Controller

**File:** `backend/src/controllers/sessionController.js`

**Purpose:** Manages session lifecycle from creation through completion, including attendance finalization.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getSessions` | Lists sessions with filters (class, status, date range) |
| `getSessionById` | Returns session with attendance and participation summary |
| `startSession` | Creates session, sets status to 'active', records start time |
| `endSession` | Closes open intervals, calculates durations, marks absents, updates status |
| `getAttendance` | Returns attendance records for a session |
| `getAttendanceIntervals` | Returns detailed join/leave intervals |
| `processLiveEvent` | Handles real-time events from extension (join, leave, participation) |

**Session End Process:**
1. Close all open attendance intervals (set `left_at` to current time)
2. Calculate total duration for each participant
3. Update `attendance_records` with final durations
4. Mark enrolled students not in attendance as 'absent'
5. Set session status to 'ended' and record `ended_at`
6. Broadcast `session:ended` via WebSocket

---

### D.1.7 Participation Controller

**File:** `backend/src/controllers/participationController.js`

**Purpose:** Handles logging and retrieval of participation events (chat, reactions, hand raises, mic toggles).

**Key Functions:**

| Function | Description |
|----------|-------------|
| `logParticipation` | Stores participation event with type, value, timestamp |
| `getSessionParticipation` | Returns all events for a session |
| `getStudentParticipation` | Returns participation history for a student |
| `getParticipationStats` | Aggregates event counts by type |

**Participation Types:**
- `chat` – Chat message sent
- `reaction` – Emoji reaction (👍, ❤️, etc.)
- `hand_raise` – Hand raised
- `mic_toggle` – Microphone unmuted

---

### D.1.8 Socket Handler

**File:** `backend/src/socket/socketHandler.js`

**Purpose:** Manages WebSocket connections, room subscriptions, and real-time event broadcasting.

**Key Events:**

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_instructor_room` | Client → Server | Subscribe to instructor's updates |
| `join_session` | Client → Server | Subscribe to specific session's events |
| `leave_session` | Client → Server | Unsubscribe from session |
| `session:started` | Server → Client | Notify dashboard of new session |
| `session:ended` | Server → Client | Notify dashboard session ended |
| `participant:joined` | Server → Client | Real-time join notification |
| `participant:left` | Server → Client | Real-time leave notification |
| `participation:logged` | Server → Client | Real-time participation event |
| `attendance:updated` | Server → Client | Attendance record changed |

**Room Pattern:**
- `instructor:{userId}` – All updates for an instructor
- `session:{sessionId}` – Updates for specific session

---

### D.1.9 Authentication Middleware

**File:** `backend/src/middleware/authMiddleware.js`

**Purpose:** Provides flexible authentication that accepts either JWT Bearer tokens (from dashboard) or extension tokens (from browser extension).

**Middleware Functions:**

| Function | Description |
|----------|-------------|
| `authenticate` | Verifies JWT Bearer token |
| `authenticateExtension` | Verifies X-Extension-Token header |
| `flexibleAuth` | Accepts either JWT or extension token |

**Request Flow:**
1. Check for `X-Extension-Token` header → verify extension token
2. If not present, check for `Authorization: Bearer` header → verify JWT
3. If neither, return 401 Unauthorized
4. On success, attach `req.user` with user ID and proceed

---

## D.2 Frontend Key Files

The frontend is a React single-page application built with Vite and styled with Tailwind CSS.

### D.2.1 Authentication Context

**File:** `frontend/src/contexts/AuthContext.jsx`

**Purpose:** Provides authentication state and methods to all components via React Context.

**Key State:**
- `user` – Current user object (null if not authenticated)
- `isLoading` – Authentication check in progress
- `isAuthenticated` – Boolean indicating login status

**Key Methods:**

| Method | Description |
|--------|-------------|
| `login(email, password)` | Authenticates user, stores tokens, sets user state |
| `logout()` | Clears tokens, resets user state |
| `register(data)` | Creates account and auto-logs in |
| `refreshToken()` | Obtains new access token using refresh token |
| `updateProfile(data)` | Updates user profile |

**Token Storage:**
- Access token: `localStorage.accessToken`
- Refresh token: `localStorage.refreshToken`

---

### D.2.2 WebSocket Context

**File:** `frontend/src/contexts/WebSocketContext.jsx`

**Purpose:** Manages Socket.io connection and provides real-time event subscription to components.

**Key State:**
- `socket` – Socket.io client instance
- `isConnected` – Connection status
- `activeSession` – Currently tracked session

**Key Methods:**

| Method | Description |
|--------|-------------|
| `connect()` | Establishes WebSocket connection with auth |
| `disconnect()` | Closes WebSocket connection |
| `joinInstructorRoom(userId)` | Subscribes to instructor updates |
| `joinSession(sessionId)` | Subscribes to session events |
| `leaveSession(sessionId)` | Unsubscribes from session |
| `onEvent(eventName, handler)` | Registers event listener |
| `offEvent(eventName, handler)` | Removes event listener |

---

### D.2.3 Main Page Components

| Component | File | Purpose |
|-----------|------|---------|
| **LandingPage** | `LandingPage.jsx` | Public page with login/register links, feature overview |
| **Home** | `Home.jsx` | Dashboard overview with stats, recent sessions, notifications |
| **MyClasses** | `MyClasses.jsx` | Class list with create/edit/archive functionality |
| **ClassDetailsPage** | `ClassDetailsPage.jsx` | Single class view with tabs for students, sessions, settings |
| **Sessions** | `Sessions.jsx` | Session history with calendar and list views |
| **SessionDetailPage** | `SessionDetailPage.jsx` | Session attendance and participation details |
| **LiveFeed** | `LiveFeed.jsx` | Real-time event stream during active sessions |
| **Analytics** | `Analytics.jsx` | Participation metrics and engagement summaries |
| **Settings** | `Settings.jsx` | Profile management, extension token management |
| **Notifications** | `Notifications.jsx` | System notification list |

---

### D.2.4 Key Hooks and Utilities

| File | Purpose |
|------|---------|
| `hooks/useApi.js` | Custom hook for API calls with auth headers |
| `hooks/useDebounce.js` | Debounces rapidly changing values |
| `utils/api.js` | Axios instance with interceptors for token refresh |
| `utils/dateUtils.js` | Date formatting and manipulation helpers |
| `utils/exportUtils.js` | CSV generation utilities |

---

## D.3 Extension Scripts

The browser extension is built with Manifest V3 and React (via Vite).

### D.3.1 Service Worker (Background)

**File:** `_extension/background/service-worker.js`

**Purpose:** Central coordinator that handles message passing, API communication, session state, and offline queue.

**Key Responsibilities:**
- Listen for messages from content scripts and popup
- Manage session state (active session ID, class mapping)
- Send HTTP requests to backend with extension token
- Maintain WebSocket connection for real-time sync
- Queue failed requests for retry when online

**Message Types Handled:**

| Message | Action |
|---------|--------|
| `START_SESSION` | Creates session via API, updates state |
| `END_SESSION` | Ends session via API, cleans up state |
| `PARTICIPANT_JOINED` | Sends join event to backend |
| `PARTICIPANT_LEFT` | Sends leave event to backend |
| `PARTICIPATION_EVENT` | Sends participation event to backend |
| `GET_SESSION_STATUS` | Returns current session state |

---

### D.3.2 Content Scripts (Google Meet)

Located in `_extension/content/google-meet/`

| Script | Purpose | Detection Method |
|--------|---------|------------------|
| **loader.js** | Entry point; initializes all detectors | Script injection |
| **participant-detector.js** | Detects join/leave events | MutationObserver on People Panel |
| **chat-monitor.js** | Detects chat messages | MutationObserver on Chat Panel |
| **reaction-detector.js** | Detects emoji reactions | MutationObserver on toast notifications |
| **hand-raise-detector.js** | Detects hand raises | MutationObserver on "Raised hands" section |
| **media-state-detector.js** | Detects mic unmutes | Button state observation in People Panel |
| **url-monitor.js** | Detects meeting URL changes | URL observation |
| **event-emitter.js** | Queues and sends events to service worker | chrome.runtime.sendMessage |
| **config.js** | DOM selectors and ARIA patterns | Static configuration |
| **state.js** | Shared state (known participants, session) | In-memory state |

**Detection Flow:**
1. `loader.js` waits for Google Meet UI to load
2. Individual detectors initialize MutationObservers
3. When events detected, call `event-emitter.js`
4. Event emitter sends message to service worker
5. Service worker sends to backend API

---

### D.3.3 Popup UI

**File:** `_extension/popup/popup.jsx`

**Purpose:** Quick session control interface accessible from extension icon.

**Key Features:**
- Display current meeting status (detected, not detected)
- Show session status (active, not started)
- Start Session button (when meeting detected, no active session)
- End Session button (when session active)
- Link to dashboard
- Link to options page

**State Display:**
- 🔴 Not connected (no extension token)
- 🟡 Ready (connected, no active session)
- 🟢 Tracking (active session in progress)

---

### D.3.4 Options Page

**File:** `_extension/options/options.jsx`

**Purpose:** Extension settings and authentication configuration.

**Key Features:**
- Connect to Account (OAuth flow or token input)
- Display connected account info
- Class-to-URL mapping configuration
- Meeting link associations
- Debug panel (for development)
- Disconnect/logout

**Class Mapping:**
Allows instructors to associate Google Meet URLs with specific classes for automatic session creation.

```
┌────────────────────────────────────────────────────────┐
│  Class Mappings                                        │
│                                                        │
│  CCS101 - Intro to Computing                          │
│  └─ https://meet.google.com/abc-defg-hij              │
│                                                        │
│  CCS102 - Programming Fundamentals                     │
│  └─ https://meet.google.com/xyz-uvwx-yz               │
│                                                        │
│  [+ Add Mapping]                                       │
└────────────────────────────────────────────────────────┘
```

---

### D.3.5 Utility Modules

| File | Purpose |
|------|---------|
| `utils/storage.js` | Wrapper for chrome.storage API |
| `utils/constants.js` | API URLs, event types, storage keys |
| `utils/date-utils.js` | Timestamp formatting |
| `utils/debug-logger.js` | Console logging with levels |
| `utils/student-matcher.js` | Fuzzy matching for participant names |

**Student Matcher Algorithm:**
1. Normalize names (lowercase, trim, remove special characters)
2. Compare against enrolled student names
3. Use Levenshtein distance for fuzzy matching
4. Return best match above confidence threshold
