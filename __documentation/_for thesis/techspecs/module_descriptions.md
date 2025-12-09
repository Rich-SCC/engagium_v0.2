# Module Descriptions
## Engagium System - Chapter 3.3.2 Reference

This document provides detailed descriptions of each core component/module in the Engagium system.

---

## Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ENGAGIUM SYSTEM MODULES                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────────────┐                                                         │
│   │ 1. BROWSER        │  Chrome extension for Google Meet participation          │
│   │    EXTENSION      │  tracking with offline support                           │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 2. API SERVICES   │  REST endpoints for CRUD operations and                  │
│   │    (Backend)      │  real-time WebSocket communication                       │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 3. PARTICIPATION  │  Event detection, processing, and storage                │
│   │    LOGGING ENGINE │  for attendance and interaction tracking                 │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 4. ANALYTICS      │  Attendance rates, duration calculations,                │
│   │    ENGINE         │  and participation metrics                               │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 5. WEB DASHBOARD  │  React-based interface for instructors                   │
│   │                   │  to view and manage class data                           │
│   └───────────────────┘                                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Browser Extension

### Purpose
The browser extension serves as the primary data collection interface, detecting and capturing participation events directly from Google Meet sessions. It runs as a Chrome extension using Manifest V3.

### Components

#### 1.1 Service Worker (Background Script)
**Location:** `_extension/background/`

| File | Responsibility |
|------|----------------|
| `service-worker.js` | Main coordinator; handles message routing between content scripts, popup, and options page; manages extension lifecycle |
| `session-manager.js` | Manages active session state; coordinates session start/end; handles participant matching |
| `api-client.js` | HTTP communication with backend API; handles request formatting and error handling |
| `socket-client.js` | WebSocket connection to backend; emits real-time events |
| `sync-queue.js` | Offline support; queues failed requests for retry; implements exponential backoff |

#### 1.2 Content Scripts (Google Meet Integration)
**Location:** `_extension/content/google-meet/`

| File | Responsibility |
|------|----------------|
| `index.js` | Entry point; initializes all detectors when meeting is detected |
| `participant-detector.js` | **Primary detector**: Monitors People Panel for join/leave events; extracts participant names |
| `chat-monitor.js` | Monitors Chat Panel for new messages; extracts sender and message text |
| `reaction-detector.js` | Detects emoji reactions via toast notifications and video tile overlays |
| `hand-raise-detector.js` | Monitors Raised Hands section; detects hand raise/lower events |
| `media-state-detector.js` | Detects microphone unmute events via People Panel button states |
| `screen-share-detector.js` | Detects screen sharing (auxiliary, not a participation type) |
| `url-monitor.js` | Monitors URL changes to detect meeting entry/exit |
| `event-emitter.js` | Queues detected events and sends to service worker |
| `config.js` | DOM selectors, patterns, and constants for Google Meet's ARIA-based structure |
| `state.js` | Shared state object for tracking status |
| `utils.js` | Helper functions for ID generation, logging, name cleaning |
| `people-panel.js` | People panel DOM queries and participant extraction |
| `tracking-indicator.js` | Visual indicator showing tracking is active |

#### 1.3 Popup Interface
**Location:** `_extension/popup/`

| File | Responsibility |
|------|----------------|
| `popup.jsx` | React component for quick session control |
| `popup.css` | Styling for popup interface |
| `index.html` | HTML entry point |

**Features:**
- Start/stop session tracking
- View current session status
- See active participant count
- Quick navigation to dashboard

#### 1.4 Options Page
**Location:** `_extension/options/`

| File | Responsibility |
|------|----------------|
| `options.jsx` | React component for extension settings |
| `callback.js` | OAuth callback handler for authentication |
| `options.css` | Styling for options interface |
| `index.html`, `callback.html` | HTML entry points |

**Features:**
- Connect extension to Engagium account
- Map meeting links to classes
- Configure tracking preferences
- Debug panel for troubleshooting

#### 1.5 Utilities
**Location:** `_extension/utils/`

| File | Responsibility |
|------|----------------|
| `constants.js` | Message types, event types, configuration constants |
| `storage.js` | Chrome storage API wrappers |
| `debug-logger.js` | Logging utilities with levels |
| `date-utils.js` | Date/time formatting helpers |
| `student-matcher.js` | Algorithm for matching participant names to enrolled students |

---

## 2. API Services (Backend)

### Purpose
The backend provides RESTful API endpoints for all system operations and manages real-time communication via WebSocket.

### Controllers
**Location:** `backend/src/controllers/`

| Controller | Endpoints | Responsibility |
|------------|-----------|----------------|
| `authController.js` | `/auth/*` | User registration, login, logout, password reset, profile management, token refresh |
| `classController.js` | `/classes/*` | Class CRUD, meeting links, exempted accounts |
| `sessionController.js` | `/sessions/*` | Session lifecycle (start/end), live events, attendance queries |
| `studentController.js` | `/classes/:id/students/*` | Student CRUD, CSV import, bulk operations, duplicate detection |
| `participationController.js` | `/participation/*` | Log and retrieve participation events |
| `studentTagController.js` | `/classes/:id/tags/*` | Tag management for student organization |
| `studentNoteController.js` | `/classes/:id/students/:id/notes/*` | Timestamped notes per student |
| `notificationController.js` | `/notifications/*` | System notification management |
| `extensionTokenController.js` | `/extension-tokens/*` | Extension token generation and revocation |

### Route Files
**Location:** `backend/src/routes/`

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `authRoutes.js` | `/api/auth` | Authentication endpoints |
| `classRoutes.js` | `/api/classes` | Class and student management |
| `sessionRoutes.js` | `/api/sessions` | Session operations |
| `participationRoutes.js` | `/api/participation` | Participation logging |
| `notificationRoutes.js` | `/api/notifications` | Notification operations |
| `extensionTokenRoutes.js` | `/api/extension-tokens` | Token management |

### Services
**Location:** `backend/src/services/`

| Service | Responsibility |
|---------|----------------|
| `emailService.js` | Password reset emails via Nodemailer |

### Middleware
**Location:** `backend/src/middleware/`

| Middleware | Responsibility |
|------------|----------------|
| `authMiddleware.js` | JWT verification, extension token verification, flexible auth |
| `errorHandler.js` | Centralized error handling and formatting |

### Socket Handler
**Location:** `backend/src/socket/`

| File | Responsibility |
|------|----------------|
| `socketHandler.js` | WebSocket event handling, room management, broadcast logic |

### Key API Endpoints

#### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Authenticate and receive tokens |
| POST | `/auth/refresh-token` | Get new access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/profile` | Get current user profile |
| PUT | `/auth/profile` | Update user profile |

#### Sessions (Extension-focused)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/sessions/start-from-meeting` | Start session from extension |
| POST | `/sessions/:id/live-event` | Send real-time participation event |
| PUT | `/sessions/:id/end-with-timestamp` | End session with precise timestamp |
| POST | `/sessions/:id/attendance/join` | Record participant join |
| POST | `/sessions/:id/attendance/leave` | Record participant leave |

---

## 3. Participation Logging Engine

### Purpose
Detects, processes, and stores participation events during live sessions. Operates across extension and backend.

### Participation Event Types

| Type | Code | Detection Source | Storage Field |
|------|------|------------------|---------------|
| **Attendance (Join/Leave)** | `attendance` | People Panel | `attendance_records`, `attendance_intervals` |
| **Chat Messages** | `chat` | Chat Panel | `participation_logs` |
| **Reactions** | `reaction` | Toast notifications | `participation_logs` |
| **Hand Raises** | `hand_raise` | Raised Hands section | `participation_logs` |
| **Mic Unmute** | `mic_toggle` | People Panel buttons | `participation_logs` |

### Event Detection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PARTICIPATION EVENT DETECTION                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Google Meet DOM
          │
          │ MutationObserver
          ▼
    ┌──────────────────┐
    │ Detector Module  │  (participant-detector, chat-monitor, etc.)
    │                  │
    │ - Parse DOM      │
    │ - Extract data   │
    │ - Validate       │
    │ - Deduplicate    │
    └────────┬─────────┘
             │
             │ queueEvent()
             ▼
    ┌──────────────────┐
    │ Event Emitter    │
    │                  │
    │ - Queue locally  │
    │ - Batch if needed│
    │ - Send message   │
    └────────┬─────────┘
             │
             │ chrome.runtime.sendMessage()
             ▼
    ┌──────────────────┐
    │ Service Worker   │
    │                  │
    │ - Store in IDB   │
    │ - Call API       │
    └────────┬─────────┘
             │
             │ POST /sessions/:id/live-event
             ▼
    ┌──────────────────┐
    │ Backend          │
    │                  │
    │ - Validate       │
    │ - Store in DB    │
    │ - Broadcast WS   │
    └──────────────────┘
```

### Attendance Tracking Details

Attendance uses a two-table approach for precision:

1. **`attendance_records`**: Final status per participant per session
   - Status: present, absent, late
   - Total duration in minutes
   - First join and last leave timestamps

2. **`attendance_intervals`**: Each join/leave pair
   - Precise `joined_at` and `left_at` timestamps
   - Allows calculation of actual time in meeting
   - Handles multiple join/leave cycles

### Data Stored Per Event Type

| Event Type | Data Captured |
|------------|---------------|
| **Attendance** | participant_name, joined_at, left_at, duration_minutes |
| **Chat** | participant_name, message_text, timestamp |
| **Reaction** | participant_name, emoji/reaction_type, timestamp |
| **Hand Raise** | participant_name, timestamp |
| **Mic Unmute** | participant_name, timestamp, state (on) |

---

## 4. Analytics Engine

### Purpose
Calculates metrics and aggregates data for instructor insights. Operates primarily in the backend with display in the frontend.

### Metrics Calculated

#### Attendance Metrics
| Metric | Calculation | Location |
|--------|-------------|----------|
| **Attendance Rate** | (Present + Late) / Total Students × 100 | Session detail, class summary |
| **Average Duration** | Sum(duration_minutes) / Count(participants) | Session detail |
| **On-time Rate** | Present / (Present + Late) × 100 | Session detail |
| **Class Attendance Trend** | Attendance rate over multiple sessions | Class analytics |

#### Participation Metrics
| Metric | Calculation | Location |
|--------|-------------|----------|
| **Total Interactions** | Count of all participation_logs | Session detail |
| **Interactions per Student** | Count grouped by student_id | Student detail |
| **Interaction by Type** | Count grouped by interaction_type | Session analytics |
| **Active Participation Rate** | Students with ≥1 interaction / Total present | Session summary |

### Backend Endpoints for Analytics

| Endpoint | Data Returned |
|----------|---------------|
| `GET /classes/:id/stats` | Class-level statistics |
| `GET /sessions/:id/stats` | Session-level statistics |
| `GET /sessions/:id/attendance` | Detailed attendance with intervals |
| `GET /participation/:sessionId/summary` | Participation summary by type |
| `GET /participation/:sessionId/recent` | Recent activity feed |

### Frontend Analytics Pages

| Page | Analytics Displayed |
|------|---------------------|
| `Home.jsx` | Dashboard overview with class stats |
| `Analytics.jsx` | Trend charts and comparisons |
| `SessionDetailPage.jsx` | Per-session attendance and participation |
| `ClassDetailsPage.jsx` | Class-level metrics and student list |

---

## 5. Web Dashboard

### Purpose
Provides instructors with a comprehensive interface to manage classes, view attendance data, and monitor participation in real-time.

### Page Structure
**Location:** `frontend/src/pages/`

| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage.jsx` | `/` | Public landing page with login/register |
| `Home.jsx` | `/home` | Dashboard overview with stats and quick actions |
| `LiveFeed.jsx` | `/live-feed` | Real-time session monitoring |
| `MyClasses.jsx` | `/classes` | Class list and management |
| `ClassDetailsPage.jsx` | `/classes/:id` | Individual class view with students, sessions |
| `Sessions.jsx` | `/sessions` | Session history and calendar |
| `SessionDetailPage.jsx` | `/sessions/:id` | Session attendance and participation details |
| `Analytics.jsx` | `/analytics` | Attendance trends and participation metrics |
| `Settings.jsx` | `/settings` | User profile and extension tokens |
| `Notifications.jsx` | `/notifications` | System notification center |
| `ForgotPassword.jsx` | `/forgot-password` | Password reset request |
| `ResetPassword.jsx` | `/reset-password` | Password reset form |

### Component Structure
**Location:** `frontend/src/components/`

```
components/
├── common/           # Shared UI components (buttons, modals, inputs)
├── layout/           # Page layout (header, sidebar, navigation)
├── class/            # Class-specific components
├── session/          # Session-specific components
├── student/          # Student management components
├── attendance/       # Attendance display components
└── participation/    # Participation log components
```

### Context Providers
**Location:** `frontend/src/contexts/`

| Context | Purpose |
|---------|---------|
| `AuthContext.jsx` | Authentication state, login/logout, token management |
| `WebSocketContext.jsx` | Socket.io connection, event handling, room management |

### Services
**Location:** `frontend/src/services/`

| Service | Purpose |
|---------|---------|
| `api.js` | Axios instance with interceptors for auth headers |
| `authService.js` | Authentication API calls |
| `classService.js` | Class management API calls |
| `sessionService.js` | Session management API calls |
| `studentService.js` | Student management API calls |
| `participationService.js` | Participation data API calls |

### Key Features

#### Real-time Updates
- WebSocket connection established on login
- Joins instructor room for broadcast events
- Live feed page shows events as they occur
- Session detail page updates attendance in real-time

#### Class Management
- Create/edit/delete classes
- Configure class schedule (days, time)
- Add multiple meeting links per class
- Archive/activate classes
- Manage exempted accounts (TAs, observers)

#### Student Management
- Manual add/edit/delete students
- CSV import with validation
- Bulk operations (delete, update)
- Duplicate detection and merging
- Tagging system for organization
- Timestamped notes per student

#### Session Management
- View session history
- Calendar view of sessions
- Start sessions from extension (auto-created)
- View detailed attendance with intervals
- View participation logs by type

---

## Module Interaction Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MODULE INTERACTION DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │  EXTENSION  │          │   BACKEND   │          │  DASHBOARD  │
    │             │          │             │          │             │
    │ Detects     │  HTTP    │ Processes   │  HTTP    │ Displays    │
    │ events in   ├─────────►│ and stores  │◄─────────┤ data to     │
    │ Google Meet │          │ data        │          │ instructor  │
    │             │          │             │  WS      │             │
    │             │          │ Broadcasts  ├─────────►│ Updates     │
    │             │          │ via Socket  │          │ in real-time│
    └─────────────┘          └──────┬──────┘          └─────────────┘
                                    │
                                    │
                             ┌──────▼──────┐
                             │  DATABASE   │
                             │             │
                             │ Persists    │
                             │ all data    │
                             └─────────────┘
```

---

*This document describes the module structure as implemented in the Engagium codebase as of December 2025.*
