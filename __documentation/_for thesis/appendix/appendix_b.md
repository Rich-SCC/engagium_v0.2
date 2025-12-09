# APPENDIX B  
SYSTEM ARCHITECTURE AND TECHNICAL FRAMEWORK

This appendix provides a comprehensive technical overview of the ENGAGIUM system, including its architecture, modules, API structure, database schema, and technology stack.

---

## B.1 Overview of Engagium System

**ENGAGIUM** is an automated participation tracking system designed for instructors conducting synchronous online classes via Google Meet. The system addresses the challenge of manual participation monitoring by automatically detecting and recording student engagement activities in real time.

**Core Capabilities:**

- **Automated Attendance Tracking**: Detects when participants join and leave Google Meet sessions, recording precise timestamps and calculating total duration
- **Participation Event Detection**: Monitors chat messages, emoji reactions, hand raises, and microphone activity
- **Real-Time Dashboard**: Provides instructors with live visibility into session activity via WebSocket-based updates
- **Student Roster Management**: Allows instructors to manage class rosters, import students via CSV, and automatically match participant names to enrolled students
- **Session Analytics**: Aggregates attendance and participation data for review and reporting

**Design Principles:**

1. **Privacy-First**: The system does not record audio, video, or message content—only metadata about participation events
2. **Non-Intrusive**: The browser extension operates silently without affecting the Google Meet experience
3. **Offline-Resilient**: Local storage and sync queues ensure data is not lost during network interruptions
4. **Real-Time**: WebSocket communication enables instant dashboard updates

---

## B.2 System Architecture (3-Tier Model)

ENGAGIUM follows a three-tier architecture separating presentation, application logic, and data storage.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENGAGIUM 3-TIER ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            PRESENTATION TIER                                 │
    │                                                                              │
    │   ┌─────────────────────────────┐      ┌─────────────────────────────┐      │
    │   │     Chrome Extension        │      │       Web Dashboard         │      │
    │   │                             │      │                             │      │
    │   │  • Popup UI (session ctrl)  │      │  • React SPA                │      │
    │   │  • Options Page (auth)      │      │  • Real-time updates        │      │
    │   │  • Content Scripts (detect) │      │  • Responsive design        │      │
    │   └─────────────────────────────┘      └─────────────────────────────┘      │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
                                         │
                    HTTP REST API        │        WebSocket (Socket.io)
                    X-Extension-Token    │        JWT Bearer Token
                                         ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            APPLICATION TIER                                  │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │                    Node.js + Express Backend                         │   │
    │   │                                                                      │   │
    │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
    │   │  │    Auth     │  │   Class     │  │  Session    │  │Participation│ │   │
    │   │  │  Controller │  │ Controller  │  │ Controller  │  │ Controller  │ │   │
    │   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
    │   │                                                                      │   │
    │   │  ┌─────────────────────────────┐  ┌─────────────────────────────┐   │   │
    │   │  │   Flexible Auth Middleware  │  │    Socket.io Server         │   │   │
    │   │  │   (JWT or Extension Token)  │  │    (Room-based broadcast)   │   │   │
    │   │  └─────────────────────────────┘  └─────────────────────────────┘   │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                              DATA TIER                                       │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │                        PostgreSQL Database                           │   │
    │   │                                                                      │   │
    │   │  • users              • sessions              • participation_logs   │   │
    │   │  • classes            • attendance_records    • notifications        │   │
    │   │  • students           • attendance_intervals  • extension_tokens     │   │
    │   │  • session_links      • student_tags          • student_notes        │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
```

**Tier Responsibilities:**

| Tier | Components | Responsibilities |
|------|------------|------------------|
| **Presentation** | Chrome Extension, React Dashboard | User interface, event detection, data visualization |
| **Application** | Node.js/Express, Socket.io | Business logic, API endpoints, authentication, real-time broadcasting |
| **Data** | PostgreSQL | Persistent storage, data integrity, relational queries |

---

## B.3 Module Descriptions

### B.3.1 Browser Extension Modules

| Module | File(s) | Responsibility | Key Technologies |
|--------|---------|----------------|------------------|
| **Service Worker** | `service-worker.js` | Central coordinator; handles message passing, API calls, session state | Manifest V3, Chrome APIs |
| **Session Manager** | `session-manager.js` | Manages session lifecycle (start, end, status tracking) | State management |
| **API Client** | `api-client.js` | HTTP requests to backend with extension token auth | Fetch API |
| **Socket Client** | `socket-client.js` | WebSocket connection for real-time updates | Socket.io client |
| **Sync Queue** | `sync-queue.js` | Queues failed requests for retry when online | IndexedDB |
| **Participant Detector** | `participant-detector.js` | Observes People Panel for join/leave events | MutationObserver |
| **Chat Monitor** | `chat-monitor.js` | Detects chat messages in Chat Panel | MutationObserver |
| **Reaction Detector** | `reaction-detector.js` | Captures emoji reactions via toast notifications | MutationObserver |
| **Hand Raise Detector** | `hand-raise-detector.js` | Monitors "Raised hands" section | MutationObserver |
| **Media State Detector** | `media-state-detector.js` | Detects microphone unmute events | Button state observation |
| **Popup UI** | `popup.jsx` | Quick session control interface | React, Vite |
| **Options Page** | `options.jsx` | Authentication, class mapping, settings | React, Vite |

### B.3.2 Backend Modules

| Module | File(s) | Responsibility | Key Endpoints |
|--------|---------|----------------|---------------|
| **Auth Controller** | `authController.js` | User registration, login, JWT management, password reset | `/api/auth/*` |
| **Extension Token Controller** | `extensionTokenController.js` | Generate, list, revoke extension tokens | `/api/extension-tokens/*` |
| **Class Controller** | `classController.js` | Class CRUD, meeting links, exempted accounts | `/api/classes/*` |
| **Student Controller** | `studentController.js` | Student CRUD, CSV import, duplicate detection | `/api/students/*` |
| **Student Tag Controller** | `studentTagController.js` | Tag management and assignments | `/api/classes/:id/tags/*` |
| **Student Note Controller** | `studentNoteController.js` | Timestamped notes per student | `/api/students/:id/notes/*` |
| **Session Controller** | `sessionController.js` | Session lifecycle, attendance retrieval | `/api/sessions/*` |
| **Participation Controller** | `participationController.js` | Log and retrieve participation events | `/api/participation/*` |
| **Socket Handler** | `socketHandler.js` | WebSocket room management, event broadcasting | Socket.io events |
| **Auth Middleware** | `authMiddleware.js` | JWT verification, flexible auth (JWT or extension token) | Middleware |

### B.3.3 Frontend Modules

| Module | File(s) | Responsibility |
|--------|---------|----------------|
| **Auth Context** | `AuthContext.jsx` | Authentication state, token management, login/logout |
| **WebSocket Context** | `WebSocketContext.jsx` | Socket.io connection, room subscription, event handlers |
| **Landing Page** | `LandingPage.jsx` | Public page with login/register links |
| **Home Dashboard** | `Home.jsx` | Overview with statistics and recent activity |
| **My Classes** | `MyClasses.jsx` | Class list, create/edit/archive classes |
| **Class Details** | `ClassDetailsPage.jsx` | Student roster, sessions, settings for a class |
| **Sessions** | `Sessions.jsx` | Session history, calendar view |
| **Session Detail** | `SessionDetailPage.jsx` | Attendance and participation for a session |
| **Live Feed** | `LiveFeed.jsx` | Real-time event stream during active sessions |
| **Analytics** | `Analytics.jsx` | Participation metrics and summaries |
| **Settings** | `Settings.jsx` | Profile management, extension tokens |

---

## B.4 Browser Extension Architecture

The browser extension is built using Chrome Extension Manifest V3 and consists of multiple interconnected components.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       BROWSER EXTENSION ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                              CHROME BROWSER                                  │
    │                                                                              │
    │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐ │
    │  │      POPUP UI      │  │    OPTIONS PAGE    │  │    GOOGLE MEET TAB     │ │
    │  │                    │  │                    │  │                        │ │
    │  │  • Start Session   │  │  • Login/Connect   │  │  ┌──────────────────┐  │ │
    │  │  • End Session     │  │  • Class Mapping   │  │  │  CONTENT SCRIPTS │  │ │
    │  │  • View Status     │  │  • Settings        │  │  │                  │  │ │
    │  │  • Quick Actions   │  │  • Debug Panel     │  │  │  • participant-  │  │ │
    │  │                    │  │                    │  │  │    detector.js   │  │ │
    │  └─────────┬──────────┘  └─────────┬──────────┘  │  │  • chat-         │  │ │
    │            │                       │             │  │    monitor.js    │  │ │
    │            │   chrome.runtime.     │             │  │  • reaction-     │  │ │
    │            │   sendMessage()       │             │  │    detector.js   │  │ │
    │            └───────────┬───────────┘             │  │  • hand-raise-   │  │ │
    │                        │                         │  │    detector.js   │  │ │
    │                        │                         │  │  • media-state-  │  │ │
    │                        ▼                         │  │    detector.js   │  │ │
    │           ┌────────────────────────┐             │  │                  │  │ │
    │           │     SERVICE WORKER     │             │  └────────┬─────────┘  │ │
    │           │                        │             │           │            │ │
    │           │  ┌──────────────────┐  │             └───────────┼────────────┘ │
    │           │  │ Session Manager  │  │                         │              │
    │           │  └──────────────────┘  │◄────────────────────────┘              │
    │           │  ┌──────────────────┐  │       Message Passing                  │
    │           │  │ API Client       │  │                                        │
    │           │  └──────────────────┘  │                                        │
    │           │  ┌──────────────────┐  │                                        │
    │           │  │ Socket Client    │  │                                        │
    │           │  └──────────────────┘  │                                        │
    │           │  ┌──────────────────┐  │                                        │
    │           │  │ Sync Queue       │  │                                        │
    │           │  └──────────────────┘  │                                        │
    │           │  ┌──────────────────┐  │                                        │
    │           │  │ IndexedDB (idb)  │  │                                        │
    │           │  └──────────────────┘  │                                        │
    │           │                        │                                        │
    │           └───────────┬────────────┘                                        │
    │                       │                                                     │
    └───────────────────────┼─────────────────────────────────────────────────────┘
                            │
                            │ HTTP + X-Extension-Token
                            ▼
                     ┌──────────────┐
                     │   Backend    │
                     │   Server     │
                     └──────────────┘
```

**Communication Flow:**

1. **Content Scripts → Service Worker**: Content scripts detect DOM events and send messages via `chrome.runtime.sendMessage()`
2. **Service Worker → Backend**: Service worker batches events and sends HTTP requests with `X-Extension-Token` header
3. **Service Worker → Popup/Options**: State updates are shared via Chrome storage and message passing
4. **Offline Handling**: Failed requests are queued in IndexedDB and retried when connectivity is restored

**Detection Methods:**

| Event Type | Detection Source | Method |
|------------|------------------|--------|
| Participant Join/Leave | People Panel | MutationObserver on participant list |
| Chat Messages | Chat Panel | MutationObserver on message container |
| Reactions | Toast Notifications | MutationObserver on toast container |
| Hand Raises | People Panel "Raised hands" section | MutationObserver |
| Microphone Unmute | People Panel button states | Attribute observation |

---

## B.5 API Structure and Endpoints

The backend exposes a RESTful API organized by resource. All protected endpoints require authentication via JWT Bearer token (dashboard) or X-Extension-Token header (extension).

### B.5.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update user profile |

### B.5.2 Extension Token Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extension-tokens/generate` | Generate new extension token |
| GET | `/api/extension-tokens` | List user's extension tokens |
| DELETE | `/api/extension-tokens/:id` | Revoke specific token |
| DELETE | `/api/extension-tokens` | Revoke all tokens |

### B.5.3 Class Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List instructor's classes |
| POST | `/api/classes` | Create new class |
| GET | `/api/classes/:id` | Get class details |
| PUT | `/api/classes/:id` | Update class |
| DELETE | `/api/classes/:id` | Delete class |
| PUT | `/api/classes/:id/archive` | Archive/activate class |
| GET | `/api/classes/:id/stats` | Get class statistics |
| GET | `/api/classes/:id/links` | Get meeting links |
| POST | `/api/classes/:id/links` | Add meeting link |
| PUT | `/api/classes/:id/links/:linkId` | Update meeting link |
| DELETE | `/api/classes/:id/links/:linkId` | Delete meeting link |

### B.5.4 Student Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes/:id/students` | List students in class |
| POST | `/api/classes/:id/students` | Add student |
| POST | `/api/classes/:id/students/import` | CSV import |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| POST | `/api/classes/:id/students/bulk-delete` | Bulk delete |

### B.5.5 Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List sessions (with filters) |
| POST | `/api/sessions/start` | Start new session |
| POST | `/api/sessions/:id/end` | End session |
| GET | `/api/sessions/:id` | Get session details |
| GET | `/api/sessions/:id/attendance` | Get attendance records |
| POST | `/api/sessions/:id/live-event` | Submit live event (extension) |

### B.5.6 Participation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/participation/session/:id` | Get participation logs for session |
| POST | `/api/participation` | Log participation event |
| GET | `/api/participation/student/:id` | Get student's participation history |

### B.5.7 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_instructor_room` | Client → Server | Subscribe to instructor updates |
| `join_session` | Client → Server | Subscribe to session updates |
| `leave_session` | Client → Server | Unsubscribe from session |
| `session:started` | Server → Client | New session notification |
| `session:ended` | Server → Client | Session ended notification |
| `participation:logged` | Server → Client | New participation event |
| `attendance:updated` | Server → Client | Attendance change |
| `participant:joined` | Server → Client | New participant |
| `participant:left` | Server → Client | Participant left |

---

## B.6 Database Schema (ERD + Table Definitions)

### B.6.1 Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ENGAGIUM DATABASE ERD (SIMPLIFIED)                       │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐       1:N        ┌─────────────┐       1:N        ┌─────────────┐
    │    USERS    │─────────────────►│   CLASSES   │─────────────────►│  STUDENTS   │
    │             │                  │             │                  │             │
    │ id (PK)     │                  │ id (PK)     │                  │ id (PK)     │
    │ email       │                  │ instructor_ │                  │ class_id(FK)│
    │ password    │                  │   id (FK)   │                  │ full_name   │
    │ first_name  │                  │ name        │                  │ student_id  │
    │ last_name   │                  │ subject     │                  └──────┬──────┘
    │ role        │                  │ section     │                         │
    └─────────────┘                  │ schedule    │                         │
                                     └──────┬──────┘                         │
                                            │                                │
                                       1:N  │                                │
                                            ▼                                │
                                     ┌─────────────┐                         │
                                     │  SESSIONS   │                         │
                                     │             │                         │
                                     │ id (PK)     │                         │
                                     │ class_id(FK)│                         │
                                     │ title       │                         │
                                     │ status      │                         │
                                     │ started_at  │                         │
                                     │ ended_at    │                         │
                                     └──────┬──────┘                         │
                                            │                                │
                          ┌─────────────────┼─────────────────┐              │
                          │                 │                 │              │
                     1:N  ▼            1:N  ▼            1:N  ▼              │
               ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
               │   ATTENDANCE_    │ │   ATTENDANCE_    │ │  PARTICIPATION_  ││
               │     RECORDS      │ │    INTERVALS     │ │      LOGS        ││
               │                  │ │                  │ │                  ││
               │ id (PK)          │ │ id (PK)          │ │ id (PK)          ││
               │ session_id (FK)  │ │ session_id (FK)  │ │ session_id (FK)  ││
               │ student_id (FK)◄─┼─│ student_id (FK)  │ │ student_id (FK)◄─┼┘
               │ participant_name │ │ participant_name │ │ interaction_type │
               │ status           │ │ joined_at        │ │ interaction_value│
               │ total_duration   │ │ left_at          │ │ timestamp        │
               └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### B.6.2 Core Table Definitions

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **users** | Instructor/admin accounts | id, email, password_hash, first_name, last_name, role, refresh_token |
| **classes** | Course/class information | id, instructor_id, name, subject, section, schedule (JSONB), status |
| **students** | Enrolled students per class | id, class_id, full_name, student_id |
| **sessions** | Class meeting sessions | id, class_id, title, meeting_link, status, started_at, ended_at |
| **attendance_records** | Final attendance per participant | id, session_id, student_id, participant_name, status, total_duration_minutes |
| **attendance_intervals** | Individual join/leave cycles | id, session_id, student_id, participant_name, joined_at, left_at |
| **participation_logs** | Interaction events | id, session_id, student_id, interaction_type, interaction_value, timestamp |
| **session_links** | Meeting links per class | id, class_id, link_url, link_type, is_primary |
| **exempted_accounts** | Accounts excluded from tracking | id, class_id, account_identifier, reason |
| **student_tags** | Custom tags for students | id, class_id, tag_name, tag_color |
| **student_tag_assignments** | Tag-student relationships | id, student_id, tag_id |
| **student_notes** | Notes per student | id, student_id, note_text, created_by, created_at |
| **notifications** | System notifications | id, user_id, type, title, message, read |
| **extension_tokens** | Extension authentication tokens | id, user_id, token_hash, name, last_used_at |

### B.6.3 Custom ENUM Types

| Type | Values | Purpose |
|------|--------|---------|
| `user_role` | 'instructor', 'admin' | User account roles |
| `session_status` | 'scheduled', 'active', 'ended' | Session lifecycle states |
| `interaction_type` | 'chat', 'reaction', 'mic_toggle', 'hand_raise', 'manual_entry' | Participation event types |

---

## B.7 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | Component-based UI |
| | Vite | Fast build tool and dev server |
| | Tailwind CSS | Utility-first styling |
| | React Query | Server state management |
| | React Hook Form | Form handling and validation |
| | React Router | Client-side routing |
| | Socket.io Client | Real-time updates |
| **Backend** | Node.js | JavaScript runtime |
| | Express.js | Web framework |
| | Socket.io | WebSocket server |
| | JWT (jsonwebtoken) | Token-based authentication |
| | bcrypt | Password hashing |
| | Nodemailer | Email sending |
| | pg (node-postgres) | PostgreSQL client |
| **Database** | PostgreSQL | Relational database |
| | UUID | Primary key generation |
| | JSONB | Flexible JSON storage |
| | ENUM | Type-safe status fields |
| **Extension** | Chrome Extension (Manifest V3) | Browser extension platform |
| | Service Worker | Background script |
| | IndexedDB (idb) | Local data persistence |
| | Chrome Storage API | Settings and token storage |
| | MutationObserver | DOM change detection |

---

## B.8 Development Progress (Agile Iterations)

ENGAGIUM was developed using an Agile SDLC methodology with iterative development cycles.

| Iteration | Focus | Key Deliverables |
|-----------|-------|------------------|
| **1. Foundation** | Project setup, database, authentication | PostgreSQL schema, Express server, JWT auth, user registration/login |
| **2. Core CRUD** | Class and student management | Class CRUD, student CRUD, CSV import, React dashboard setup |
| **3. Extension Core** | Browser extension foundation | Manifest V3 structure, meeting detection, participant tracking, extension token auth |
| **4. Attendance** | Attendance tracking system | Two-table attendance model (records + intervals), duration calculation, student matching |
| **5. Real-Time** | WebSocket integration | Socket.io server, room-based broadcasting, live feed page, real-time dashboard updates |
| **6. Participation** | Participation event detection | Chat monitor, reaction detector, hand raise detector, mic toggle detector, deduplication |
| **7. Polish** | Refinement and documentation | Error handling, UX improvements, technical documentation, thesis documentation |

**Development Status Summary:**

| Category | Count | Status |
|----------|-------|--------|
| Completed Components | 15 | Production-ready |
| Under Development | 4 | Code exists, needs field validation |
| Planned Enhancements | 8 | Future roadmap |

**Completed Features:**
- Authentication & Authorization (JWT + Extension Tokens)
- Class Management (CRUD, meeting links, exempted accounts)
- Student Management (CRUD, CSV import, tags, notes)
- Session Lifecycle (start, end, status tracking)
- Attendance Tracking (join/leave, intervals, duration calculation)
- Real-Time Communication (WebSocket broadcasting)
- Browser Extension Core (Manifest V3, all detectors)
- Web Dashboard (all pages, responsive design)

**Under Validation:**
- Chat message detection accuracy
- Reaction detection completeness
- Hand raise detection reliability
- Microphone toggle detection accuracy
