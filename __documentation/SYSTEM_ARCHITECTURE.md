# Engagium - System Architecture & Source of Truth

**Version:** 2.0  
**Purpose:** Professor-only participation tracking web application  
**Last Updated:** November 26, 2025  
**Status:** Definitive Architecture Document

---

## Executive Summary

**Engagium** is a web application exclusively for professors to automatically track and analyze student participation during Google Meet and Zoom meetings via browser extension. There is **zero student involvement** with the application. All participation data is captured automatically by the extension and synced to the web app for real-time monitoring and post-session analytics.

### Core Principles

1. **Professor-Only Application** - No student login, no student dashboard, no student-facing features
2. **Automated Participation Tracking** - No manual event entry; all data captured by extension
3. **Extension-Driven Sessions** - Sessions auto-created when professor confirms tracking in active meeting
4. **Manual Class Management Only** - Professors manually input: classes, students, meeting links, schedules, exemptions
5. **Live Tracking Dashboard** - Real-time participation monitoring during active sessions
6. **Class-Level Analytics** - Post-session analytics aggregated at class level (no inter-class comparisons)

---

## 1. System Components

### 1.1 Web Application (Frontend + Backend)

**Purpose:** Professor's central hub for class management, live tracking, and analytics

**Core Functions:**
- Class creation and roster management (manual input)
- Real-time session monitoring dashboard
- Post-session participation analytics
- Extension authentication

**Technology Stack:**
- Frontend: React, React Router, TailwindCSS, Socket.io-client
- Backend: Node.js, Express, PostgreSQL, Socket.io
- Authentication: JWT (access + refresh tokens)

### 1.2 Browser Extension (Chrome/Edge)

**Purpose:** Automatic participation data capture from meeting platforms

**Core Functions:**
- Detect meetings (Google Meet, Zoom)
- Prompt professor to map meeting to class or decline tracking
- Auto-create session in backend on confirmation
- Track participation events (chat, reactions, mic/camera toggles, join/leave)
- Real-time sync to backend via WebSocket
- Offline queue with retry mechanism

**Technology Stack:**
- Manifest V3
- React (popup + options UI)
- IndexedDB (local storage)
- Chrome APIs (runtime, storage, tabs)

---

## 2. Data Models & Database Schema

### 2.1 Core Tables

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'instructor' NOT NULL,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Notes:** Only instructors; no student users

#### `classes`
```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY,
    instructor_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    section VARCHAR(50),
    description TEXT,
    schedule JSONB, -- Reference only: {days: ['monday'], time: '10:00 AM'}
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Notes:** 
- `schedule` is reference-only (typical meeting times)
- Students enrolled permanently; no class-level absence concept

#### `students`
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    student_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Notes:** Students never interact with system; roster managed by professor

#### `sessions`
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    title VARCHAR(255) NOT NULL, -- Auto-generated: "[Class] - [Date] [Time]"
    meeting_link VARCHAR(500), -- Primary meeting link
    started_at TIMESTAMP, -- Actual start time from extension
    ended_at TIMESTAMP, -- Actual end time from extension
    status session_status DEFAULT 'active', -- 'active' | 'ended'
    additional_data JSONB, -- Logs: link switches, platform changes
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Notes:**
- **No `session_date`/`session_time` fields** - removed; use `started_at`/`ended_at`
- Created automatically by extension when professor confirms tracking
- `meeting_link` stores first/primary link; additional links logged in `additional_data`
- Title auto-generated; professor can edit later

#### `participation_logs`
```sql
CREATE TABLE participation_logs (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    student_id UUID REFERENCES students(id),
    interaction_type interaction_type NOT NULL, -- 'chat' | 'reaction' | 'mic_toggle' | 'camera_toggle' | 'platform_switch'
    interaction_value TEXT, -- Chat message, reaction emoji, etc.
    timestamp TIMESTAMP DEFAULT NOW(),
    additional_data JSONB -- Metadata: platform, meeting_link (for switches)
);
```
**Notes:**
- All events captured automatically by extension
- Includes `platform_switch` type for mid-session link/platform changes
- No manual entry capability

#### `attendance_records`
```sql
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    student_id UUID REFERENCES students(id),
    status VARCHAR(20) DEFAULT 'present', -- 'present' | 'absent'
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);
```
**Notes:**
- Derived from participation events (has events = present)
- Tracks join/leave times per session
- Session-level attendance only; students stay enrolled in class

#### `session_links`
```sql
CREATE TABLE session_links (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    link_url VARCHAR(500) NOT NULL,
    link_type VARCHAR(50), -- 'meet' | 'zoom'
    label VARCHAR(100),
    zoom_meeting_id VARCHAR(100),
    zoom_passcode VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Notes:**
- Optional pre-mapping convenience feature
- Extension checks detected meeting against these links
- If match found, auto-suggests class; otherwise prompts professor

#### `exempted_accounts`
```sql
CREATE TABLE exempted_accounts (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    account_identifier VARCHAR(255) NOT NULL, -- Email or name
    reason VARCHAR(255), -- 'TA', 'Observer', 'Alt account'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, account_identifier)
);
```
**Notes:** Exclude TAs, monitors, alternate accounts from tracking

### 2.2 Removed/Deprecated Fields

- ❌ `sessions.session_date` - Removed; use `started_at`
- ❌ `sessions.session_time` - Removed; use `started_at`
- ❌ `sessions.topic` - Removed; unnecessary complexity
- ❌ `sessions.description` - Removed; use auto-generated title

---

## 3. User Workflows

### 3.1 Initial Setup Flow

```
1. Professor registers/logs into web app
2. Creates class (name, subject, section, schedule reference)
3. Adds students (manual entry or CSV import)
4. Adds meeting links (optional pre-mapping)
5. Adds exempted accounts (TAs, observers)
6. Installs browser extension
7. Logs into extension via OAuth redirect
```

### 3.2 Session Tracking Flow (PRIMARY WORKFLOW)

```
PROFESSOR JOINS MEETING
    ↓
Extension detects meeting (URL/ID extraction)
    ↓
Check if meeting link pre-mapped to class
    ↓
┌─────────────────────┬─────────────────────┐
│ MAPPED              │ UNMAPPED            │
│ Show confirmation:  │ Show options:       │
│ "Track [Class]?"    │ 1. Select class     │
│ [Yes] [Dismiss]     │ 2. Dismiss (no track)│
└──────┬──────────────┴──────┬──────────────┘
       │                     │
   Professor confirms    Professor selects
       ↓                     ↓
Extension checks online connection
       ↓
   [ONLINE]              [OFFLINE]
       ↓                     ↓
POST /api/sessions/    Show error:
start-from-meeting     "Must be online
{class_id, meeting_link, to start session"
 started_at, title}
       ↓
Backend creates session
(status='active')
       ↓
Returns session_id to extension
       ↓
Extension stores session_id locally
       ↓
Extension begins tracking:
- Join/leave events → attendance_records
- Chat messages → participation_logs
- Reactions → participation_logs
- Mic toggles → participation_logs
- Camera toggles → participation_logs
       ↓
Real-time sync to backend via WebSocket
       ↓
Professor monitors live on web dashboard
       ↓
PROFESSOR LEAVES MEETING OR CLICKS "END SESSION"
       ↓
Extension POSTs end timestamp
PUT /api/sessions/:id/end
{ended_at}
       ↓
Backend updates session status='ended'
       ↓
Professor views analytics on web app
```

### 3.3 Meeting Link Switch Flow (Mid-Session)

```
Professor switches from GMeet to GMeet (different link)
OR switches from GMeet to Zoom
    ↓
Extension detects new meeting
    ↓
Checks if active session exists
    ↓
Prompts: "Continue tracking in new meeting?"
    ↓
Professor confirms
    ↓
Extension logs platform_switch event:
{
  interaction_type: 'platform_switch',
  additional_data: {
    from_link: 'meet.google.com/abc',
    to_link: 'meet.google.com/xyz',
    from_platform: 'meet',
    to_platform: 'meet'
  }
}
    ↓
Continues tracking in new meeting
(same session_id)
    ↓
First link stored in sessions.meeting_link
Additional links logged in sessions.additional_data
```

### 3.4 Offline Tracking Flow

```
Professor confirms session start (ONLINE)
    ↓
Extension creates session in backend
    ↓
INTERNET CONNECTION DROPS
    ↓
Extension detects offline
    ↓
Continues capturing participation events locally
    ↓
Events queued in IndexedDB (sync_queue)
    ↓
CONNECTION RESTORED
    ↓
Extension detects online
    ↓
Processes sync queue (exponential backoff retry)
    ↓
Bulk submits queued events to backend
    ↓
Clears sync queue on success
```

---

## 4. API Endpoints

### 4.1 Authentication
- `POST /api/auth/register` - Professor registration
- `POST /api/auth/login` - Professor login (returns access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token
- `GET /api/auth/extension/token` - Extension OAuth callback endpoint

### 4.2 Classes
- `GET /api/classes` - List professor's classes
- `POST /api/classes` - Create class
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Archive class

### 4.3 Students
- `GET /api/classes/:classId/students` - List students
- `POST /api/classes/:classId/students` - Add student
- `POST /api/classes/:classId/students/import` - CSV import
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Remove student

### 4.4 Sessions (UPDATED)
- **`POST /api/sessions/start-from-meeting`** - **NEW:** Extension creates session
  ```json
  {
    "class_id": "uuid",
    "meeting_link": "meet.google.com/abc-defg-hij",
    "started_at": "2025-11-26T10:00:00Z",
    "title": "CS 101 - Nov 26, 10:00 AM"
  }
  ```
- `GET /api/sessions` - List all professor's sessions (read-only)
- `GET /api/sessions/:id` - Get session details
- **`PUT /api/sessions/:id/end`** - End session (update `ended_at`)
- `PUT /api/sessions/:id/title` - Update session title (post-session only)
- ❌ **REMOVED:** `POST /api/sessions` (manual session creation)
- ❌ **REMOVED:** `POST /api/sessions/:id/start` (manual start)

### 4.5 Participation
- `POST /api/participation/sessions/:id/logs/bulk` - Bulk log submission (extension)
- `GET /api/participation/sessions/:id/logs` - Get session logs
- `GET /api/participation/sessions/:id/summary` - Session summary stats
- ❌ **DISABLED:** `POST /api/participation/sessions/:id/logs` (single log entry)

### 4.6 Attendance
- `POST /api/sessions/:id/attendance/bulk` - Bulk attendance submission (extension)
- `GET /api/sessions/:id/attendance` - Get session attendance
- `GET /api/sessions/:id/attendance/stats` - Attendance statistics

### 4.7 Session Links
- `GET /api/classes/:classId/links` - List meeting links
- `POST /api/classes/:classId/links` - Add meeting link
- `PUT /api/session-links/:id` - Update link
- `DELETE /api/session-links/:id` - Remove link

### 4.8 Exemptions
- `GET /api/classes/:classId/exemptions` - List exemptions
- `POST /api/classes/:classId/exemptions` - Add exemption
- `DELETE /api/exemptions/:id` - Remove exemption

---

## 5. Real-Time Features (WebSocket)

### 5.1 Socket.io Events

**Backend Emits:**
- `session:started` - New session created
  ```json
  {
    "session_id": "uuid",
    "class_id": "uuid",
    "class_name": "CS 101",
    "started_at": "2025-11-26T10:00:00Z"
  }
  ```
- `participation:logged` - New participation event
  ```json
  {
    "session_id": "uuid",
    "student_name": "John Doe",
    "interaction_type": "chat",
    "timestamp": "2025-11-26T10:05:00Z"
  }
  ```
- `session:ended` - Session ended
  ```json
  {
    "session_id": "uuid",
    "ended_at": "2025-11-26T11:00:00Z",
    "total_participants": 25
  }
  ```
- `attendance:updated` - Attendance change (join/leave)
  ```json
  {
    "session_id": "uuid",
    "student_name": "Jane Smith",
    "action": "joined",
    "timestamp": "2025-11-26T10:03:00Z"
  }
  ```

**Frontend Listens:**
- Connects on dashboard mount
- Subscribes to professor's sessions
- Updates UI in real-time

---

## 6. Frontend Pages & Components

### 6.1 Pages (Routes)

#### **Dashboard (`/app/dashboard`)** - PRIMARY VIEW
- **Active Sessions Card** (WebSocket)
  - Shows currently tracked sessions
  - Real-time participant count
  - Session duration timer
  - "View Details" button
- **Live Event Feed** (WebSocket)
  - Recent participation events across all active sessions
  - Auto-scrolling feed
  - Filter by session
- **Recent Sessions List**
  - Last 5 ended sessions
  - Quick stats preview
- **Quick Actions**
  - Create class
  - Manage students
  - View analytics

#### **Classes Page (`/app/classes`)**
- Class list (active/archived tabs)
- Create class form (name, subject, section, schedule reference, meeting links)
- Student roster management
  - Add manually
  - CSV import
  - Edit/delete
  - Tags
  - Notes
- Exemptions management
- Session links management

#### **Analytics Page (`/app/analytics`)**
- **Class selector** (single class at a time)
- **Aggregated class-level views:**
  - Total sessions count
  - Average participation per student
  - Participation trends over time (chart)
  - Engagement score distribution (chart)
  - Event type breakdown (pie chart)
  - Student participation heatmap
  - Top participants
  - Lowest participants (intervention candidates)
- **Individual session drill-down:**
  - Session details
  - Attendance list
  - Participation logs
  - Export CSV
- **NO inter-class comparisons**

#### **Sessions Page (`/app/sessions`)** - READ-ONLY
- Session history list (all classes)
- Filter by class, date range, status
- Session cards show:
  - Class name
  - Auto-generated title (editable)
  - Started/ended timestamps
  - Duration
  - Participant count
  - Meeting link
- Click session → view details (attendance + participation logs)
- ❌ **NO "Create Session" button**

#### **Settings Page (`/app/settings`)**
- Profile information
- Password change
- Extension connection status
- Data export
- Account deletion

### 6.2 Key Components

- `Layout.jsx` - Sidebar navigation, header, content area
- `ActiveSessionCard.jsx` - Live session monitoring (WebSocket)
- `LiveEventFeed.jsx` - Real-time participation stream (WebSocket)
- `ClassForm.jsx` - Create/edit class
- `StudentRoster.jsx` - Student list with import
- `SessionHistory.jsx` - Read-only session list
- `SessionDetailView.jsx` - Attendance + participation tabs
- `AnalyticsDashboard.jsx` - Charts and aggregations

---

## 7. Extension Architecture

### 7.1 Components

#### **Content Scripts** (`content/google-meet.js`, `content/zoom.js`)
- Injected into meeting pages
- Detect meeting (extract ID/URL)
- Monitor participant list (DOM observation)
- Track chat messages, reactions, mic/camera toggles
- Send events to background worker

#### **Background Service Worker** (`background/service-worker.js`)
- Message routing
- Session state management (`session-manager.js`)
- Local storage (IndexedDB via `storage.js`)
- API communication (`api-client.js`)
- Offline sync queue (`sync-queue.js`)
- Student name matching (`student-matcher.js`)

#### **Popup UI** (`popup/popup.jsx`)
- Shows active session status
- Participant list preview (matched/unmatched)
- "End Session" button
- **Meeting detection prompt:**
  - "Track this meeting for [Class]?" [Yes] [Dismiss]
  - OR "Select class to track:" [Class dropdown] [Dismiss]

#### **Options Page** (`options/options.jsx`)
- OAuth login (redirect to web app)
- Meeting link mapping (optional convenience)
- Student roster sync (cache locally)
- Auto-start preferences
- Data management (clear local storage)

### 7.2 Extension Data Flow

```
MEETING PAGE (Google Meet/Zoom)
    ↓
Content Script detects meeting
    ↓
Sends MESSAGE_TYPES.MEETING_DETECTED to background
    ↓
Background checks if link pre-mapped (storage)
    ↓
Background sends UPDATE_POPUP to popup
    ↓
Popup shows confirmation/selection UI
    ↓
Professor confirms → MESSAGE_TYPES.START_SESSION
    ↓
Background checks online connection
    ↓
[ONLINE] POST /api/sessions/start-from-meeting
    ↓
Backend creates session, returns session_id
    ↓
Background stores session_id + class_id locally
    ↓
Background sends START_TRACKING to content script
    ↓
Content script begins monitoring (participants, chat, etc.)
    ↓
Content script sends events → background
    ↓
Background matches participants to students (fuzzy matching)
    ↓
Background syncs events to backend via WebSocket (real-time)
    ↓
Background queues events locally (IndexedDB) if offline
    ↓
Professor ends session → MESSAGE_TYPES.END_SESSION
    ↓
Background PUT /api/sessions/:id/end
    ↓
Background bulk submits any queued events
    ↓
Background clears local session state
```

### 7.3 Offline Handling

1. **Session Start:** MUST be online (cannot create session offline)
2. **Mid-Session Disconnect:** Continue capturing events locally
3. **Event Queue:** Store in IndexedDB `sync_queue` table
4. **Reconnection:** Process queue with exponential backoff
5. **Retry Logic:** 3 attempts, then show notification in web app

---

## 8. Security & Privacy

### 8.1 Authentication
- JWT access tokens (15min expiry)
- Refresh tokens (7 day expiry, stored in httpOnly cookie)
- Extension uses OAuth-style redirect flow
- Token stored in extension `chrome.storage.local` (encrypted)

### 8.2 Authorization
- All API endpoints verify professor owns the resource (class, session, student)
- Middleware: `authenticateToken`, `authorizeClassAccess`

### 8.3 Data Privacy
- No student accounts = no student data breach risk
- Participation data viewable only by class professor
- Meeting data stored only during session (not recorded)
- Extension captures only participant metadata (no video/audio)

### 8.4 CORS & CSP
- Backend CORS restricted to web app domain + extension ID
- Extension CSP allows only necessary hosts

---

## 9. Performance Considerations

### 9.1 Real-Time Sync
- WebSocket connection per professor
- Emit events only to relevant professor (room-based)
- Throttle high-frequency events (mic toggles) to 1/sec

### 9.2 Database Optimization
- Indexes on: `sessions.class_id`, `participation_logs.session_id`, `attendance_records.session_id`
- Pagination for session lists (50 per page)
- Lazy-load participation logs (scroll-based)

### 9.3 Extension Performance
- Debounce DOM observations (500ms)
- Batch event submissions (10 events or 5 seconds)
- Local IndexedDB caching (student roster, class mappings)

---

## 10. Testing Strategy

### 10.1 Backend Testing
- Unit tests: Models, controllers, middleware
- Integration tests: API endpoints, auth flow
- Load testing: WebSocket concurrent connections

### 10.2 Frontend Testing
- Component tests: React Testing Library
- E2E tests: Real-time dashboard updates (mock WebSocket)

### 10.3 Extension Testing
- Unit tests: Student matcher, API client
- Integration tests: Content script → background → backend
- Manual tests: Live meeting tracking (Google Meet, Zoom)

---

## 11. Deployment

### 11.1 Web App
- **Frontend:** Vercel/Netlify (static React build)
- **Backend:** Railway/Heroku/DigitalOcean (Node.js + PostgreSQL)
- **Environment Variables:**
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL` (CORS)
  - `EXTENSION_ID` (CORS)

### 11.2 Extension
- **Chrome Web Store:** Manifest V3 package
- **Update Strategy:** Auto-update via Chrome Web Store
- **Versioning:** Semantic versioning (1.0.0 → 1.1.0)

---

## 12. Future Enhancements (Out of Scope)

- Zoom platform support (currently Google Meet only)
- Mobile app for professors
- Email/Slack notifications
- Advanced analytics (ML-based engagement predictions)
- Student self-service portal (if requirements change)
- Inter-class analytics (if requirements change)

---

## 13. Glossary

- **Professor:** Instructor using Engagium to track participation
- **Student:** Enrolled in class; tracked automatically via extension; no system access
- **Session:** Single meeting instance tracked by extension (auto-created)
- **Participation Event:** Single interaction logged (chat, reaction, toggle)
- **Attendance Record:** Join/leave times per student per session
- **Class:** Course with enrolled students, managed by professor
- **Extension:** Browser extension (Chrome/Edge) for auto-tracking
- **Real-Time Sync:** WebSocket-based live data streaming
- **Offline Queue:** IndexedDB storage for events during network outage
- **Session Link:** Pre-mapped meeting URL to class (optional)
- **Exemption:** Account excluded from tracking (TA, observer, alt account)

---

## 14. Source of Truth Changelog

| Version | Date | Changes |
|---------|---------|---------||
| 1.0 | Nov 25, 2025 | Initial architecture (manual session creation) |
| 2.0 | Nov 26, 2025 | **Major revision:** Auto session creation, live tracking, removed manual session entry, meeting link switching support |
| 2.1 | Dec 9, 2025 | Removed notifications feature - not needed for single-instructor use case |

---

**END OF DOCUMENT**

This document serves as the single source of truth for Engagium's architecture, data models, workflows, and implementation requirements. All development, testing, and documentation should align with this specification.
