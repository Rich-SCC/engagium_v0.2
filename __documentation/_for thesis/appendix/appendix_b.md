# APPENDIX B
SYSTEM ARCHITECTURE AND TECHNICAL FRAMEWORK

**Last Updated:** April 18, 2026

This appendix presents the current technical architecture of ENGAGIUM based on implemented modules, active API contracts, and the live database schema.

---

## B.1 Overview of Engagium System

ENGAGIUM is a professor-facing participation tracking platform for synchronous online classes. The current implementation integrates:

1. A React web dashboard for instructor workflows.
2. A Chrome Manifest V3 extension for Google Meet event capture.
3. A Zoom Apps SDK bridge path in the web application.
4. A shared Node.js + Express + PostgreSQL + Socket.io backend.

### Core Capabilities

- Meeting-driven session lifecycle management.
- Attendance interval tracking (join/leave with duration totals).
- Participation logging (chat, reaction, hand raise, mic toggles, join/leave markers).
- Real-time dashboard updates through room-based Socket.io communication.
- Class, roster, tags, notes, links, exemptions, and bulk operations.
- Extension-token-based authentication for meeting-side clients.

### Technical Characteristics

1. Privacy-preserving signal capture (no audio/video recording in system data model).
2. Offline-resilient extension submission via queued retries.
3. Unified data model for Google Meet and Zoom bridge flows.
4. Flexible authorization model supporting JWT and extension tokens.

---

## B.2 System Architecture (3-Tier Model)

ENGAGIUM follows a three-tier architecture with clear separation of interface, business logic, and persistence.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENGAGIUM 3-TIER ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            PRESENTATION TIER                               │
    │                                                                             │
    │   ┌─────────────────────────────┐      ┌────────────────────────────────┐  │
    │   │ Chrome Extension            │      │ Web Application                │  │
    │   │ (Google Meet)               │      │ (React Dashboard + Zoom Bridge)│  │
    │   │ - service worker            │      │ - public auth/zoom routes      │  │
    │   │ - detectors + sync queue    │      │ - protected /app instructor UI │  │
    │   │ - popup/options UI          │      │ - live feed, analytics, settings│ │
    │   └─────────────────────────────┘      └────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            APPLICATION TIER                                │
    │                                                                             │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │ Node.js + Express + Socket.io Backend                              │   │
    │   │ - auth, class, session, participation, extension-token APIs        │   │
    │   │ - JWT auth + flexible auth + extension auth                        │   │
    │   │ - room-based realtime event distribution                            │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                               DATA TIER                                    │
    │                                                                             │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │ PostgreSQL                                                         │   │
    │   │ - auth/token tables                                                │   │
    │   │ - class/student/session domain tables                              │   │
    │   │ - attendance interval/final record tables                          │   │
    │   │ - participation/event log tables                                   │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────────┘
```

### Tier Responsibilities

| Tier | Components | Responsibilities |
|------|------------|------------------|
| Presentation | Extension + React application | Event capture, user interaction, live data rendering |
| Application | Express APIs + Socket.io | Authorization, orchestration, business rules, realtime propagation |
| Data | PostgreSQL schema | Persistent system of record and relational integrity |

---

## B.3 Module Descriptions

### B.3.1 Browser Extension Modules

| Module Group | Representative Files | Responsibility |
|-------------|----------------------|----------------|
| Background runtime | `background/service-worker.js`, `background/session-manager.js`, `background/api-client.js`, `background/socket-client.js`, `background/sync-queue.js`, `background/handlers/participant-handler.js` | Session state, API/socket communication, retry queue, background orchestration |
| Meet detection | `content/google-meet/detection/participant-detector.js`, `chat-detector.js`, `reaction-detector.js`, `raised-hand-detector.js`, `mic-toggle-detector.js`, `meeting-exit-detector.js`, `url-monitor.js`, `people-panel.js` | Detect Google Meet participation and lifecycle signals |
| Meet core and DOM | `content/google-meet/core/*`, `content/google-meet/dom/*` | Shared config/state/event-emission and DOM mediation |
| UI modules | `content/google-meet/ui/*`, `popup/popup.jsx`, `options/options.jsx` | Tracking indicators, notifications, popup/options user interfaces |
| Utilities | `_extension/utils/*` | Storage, matching, formatting, auth, logging helpers |

### B.3.2 Backend Modules

| Module Group | Representative Files | Responsibility |
|-------------|----------------------|----------------|
| Routes | `backend/src/routes/auth.js`, `classes.js`, `sessions.js`, `participation.js`, `extensionTokens.js` | Exposed API surface |
| Controllers | `backend/src/controllers/*` | Auth, classes/students/tags/notes, sessions, participation, extension token logic |
| Middleware | `backend/src/middleware/auth.js`, `flexibleAuth.js`, `extensionAuth.js` | JWT and extension-token authorization paths |
| Realtime | `backend/src/socket/socketHandler.js` | Socket authentication, room joins/leaves, event broadcast |
| Services | `backend/src/services/emailService.js` | Password reset email workflows |

### B.3.3 Frontend Modules

| Module Group | Representative Files | Responsibility |
|-------------|----------------------|----------------|
| Routing shell | `frontend/src/App.jsx`, `frontend/src/main.jsx` | Public/protected routing and app bootstrap |
| Contexts | `frontend/src/contexts/AuthContext.jsx`, `WebSocketContext.jsx` | Auth state and realtime state orchestration |
| Pages | `frontend/src/pages/*` including `Home.jsx`, `LiveFeed.jsx`, `MyClasses.jsx`, `ClassDetailsPage.jsx`, `Sessions.jsx`, `SessionDetailPage.jsx`, `BundledSessionDetailPage.jsx`, `Analytics.jsx`, `Settings.jsx`, `ZoomIframeBridge.jsx`, `ZoomOAuthCallback.jsx` | Instructor operations, live views, analytics, Zoom bridge flow |
| Services/components | `frontend/src/services/*`, `frontend/src/components/*` | API wrappers, Zoom bridge integration, view-layer composition |

---

## B.4 Browser Extension Architecture

The extension uses Manifest V3 service-worker architecture and targets Google Meet.

### Runtime Structure

1. Content modules detect and normalize meeting events.
2. Events are passed to the background runtime.
3. Background runtime writes immediately when possible and queues on failure.
4. Queued events are retried and synchronized to backend APIs.

### Manifest Scope

- Content script match pattern: `https://meet.google.com/*-*-*`
- Web-accessible resources match pattern: `https://meet.google.com/*`
- No Zoom meeting content script path in extension implementation.

### Detection Coverage

| Event Type | Detection Path |
|-----------|----------------|
| Join/Leave | Participant + people panel detectors |
| Chat | Chat detector |
| Reactions | Reaction detector |
| Hand raises | Raised-hand detector |
| Mic toggle | Mic-toggle detector |
| Meeting exit | Meeting-exit detector |

---

## B.5 Zoom Bridge Architecture

The Zoom bridge provides an alternative pathway to Google Meet integration via Zoom Apps SDK. However, it operates under fundamental constraints that differ substantially from the extension model.

### Runtime Structure

1. Web application routes handle Zoom OAuth flow and session initialization.
2. Zoom Apps SDK client loads an embedded iframe within the Zoom meeting context.
3. Meeting data is retrieved via @zoom/appssdk SDK methods and REST API calls.
4. Data is transmitted to the backend via standard REST endpoints (authenticated as instructor).
5. Realtime updates propagate through Socket.io like other clients.

### Zoom Apps SDK Scope

- Web-accessible URL pattern: `frontend/src/pages/ZoomIframeBridge.jsx` serving embedded iframe content.
- SDK version: `@zoom/appssdk@^0.16.37`.
- OAuth flow: `ZoomOAuthCallback.jsx` handles Zoom OAuth redirect.
- Participant data source: Zoom API calls through SDK context; no direct DOM access to meeting client.

### Data Access Capabilities

The Zoom Apps SDK provides reliable event listeners for core participation signals within security boundaries. The following table compares capture methods:

| Data Type | Extension (GMeet) | Zoom Apps SDK | Implementation Note |
|-----------|-------------------|---------------|-------------------|
| Join/Leave events | ✅ DOM detectors (MutationObserver) | ✅ **Event listeners** (`onParticipantJoined`, `onParticipantLeft`) | SDK events are reliable and low-latency |
| Attendance intervals | ✅ Precise with detector coverage | ✅ Derived from join/leave events | Full interval tracking available |
| Hand raises | ✅ DOM-based detection | ✅ **Feedback events** (`onFeedbackReaction` with hand signal inference) | SDK reliably detects raise/lower through feedback pipeline |
| Reactions | ✅ Chat/reaction panel detection | ✅ **Reaction events** (`onReaction` with emoji/unicode/name) | SDK provides full reaction metadata |
| Chat content/participation | ✅ Chat panel text capture | ❌ **Not accessible** | Zoom Apps SDK restricts direct chat content access for privacy |
| Chat activity detection (no content) | ✅ Chat panel mutations | ❌ **Not accessible** | SDK does not expose chat event stream or activity indicators |
| Mic toggles | ✅ Icon state detection | ❌ **Not accessible** | Zoom Apps SDK does not expose real-time mic-state API |

### Architectural Alternatives and Trade-offs

While the Zoom Apps SDK provides event listeners for joins/leaves, hand raises, and reactions, it does not expose chat content or real-time audio-state signals. This creates a capture gap compared to the Google Meet extension:

**Limitations requiring architectural choices:**

1. **Chat content access** – Zoom Apps SDK does not expose message text (privacy-by-design restriction).
2. **Chat activity detection** – No API available to detect "participant posted message" events without exposing content.
3. **Real-time mic-state tracking** – Zoom Apps SDK does not provide `onMicToggle` or equivalent listener.

**Option 1: Zoom RTMS SDK (Premium Path)**
- Use Zoom Real-Time Messaging SDK (premium tier, additional licensing required).
- Provides access to participant metadata including real-time audio/video state and chat streams (if approved).
- Cost: Premium subscription + compliance overhead.
- Feasibility: Supported by Zoom but significantly increases deployment cost and requires additional permissions.

**Option 2: Architectural Redesign (Server-Side Recording)**
- Implement server-side meeting recording and signal extraction.
- Extract mic/state from audio streams or request meeting server logs.
- Cost: Significant infrastructure (video processing, storage, bandwidth, legal/privacy compliance).
- Feasibility: Technically possible but prohibitive for single-instructor deployment.

**Option 3: Hybrid Client Agent (Zoom Client Plugin)**
- Extend Zoom client itself via native Zoom plugin APIs (if available).
- Requires Zoom client installation and plugin certification.
- Cost: Client-side distribution complexity; native development required.
- Feasibility: Limited by Zoom's plugin ecosystem and approval process.

**Current Implementation Choice**

ENGAGIUM uses **Option 1 (Zoom Apps SDK without premium extensions)** for the following reasons:

1. **Comprehensive event coverage**: The SDK provides event listeners for joins/leaves, hand raises, and reactions—capturing the majority of participation signals reliably.
2. **Web-first deployment simplicity**: No additional licensing tier or client-side agent required; remains browser-based like the extension model.
3. **Known and acceptable gaps**: Chat content and real-time mic-state are the primary gaps; these can be documented as limitation scope in research findings.
4. **Future upgrade path**: Can migrate to RTMS SDK (premium) or hybrid agent if research scope expands to require chat/mic data in future work.

### Capture Strategy for Zoom Bridge

Participation signals are captured via the following mechanisms:

- **Attendance**: Join/leave events from `onParticipantJoined` and `onParticipantLeft` listeners, with deduplication and lifecycle tracking.
- **Hand raises**: Detected via `onFeedbackReaction` feedback signal analysis with hand-action inference (raised/lowered state).
- **Reactions**: Captured via `onReaction` listener with full emoji/unicode/name metadata extraction.
- **Session metadata**: Start/end timestamps and class/student linkage via standard APIs.

**SDK Limitations (Not Captured)**:
- **Chat content**: Text messages are not accessible via Zoom Apps SDK due to privacy restrictions.
- **Chat activity indicators**: No API to detect chat participation without exposing message content.
- **Mic toggles**: Real-time mic-state changes are not exposed by the Zoom Apps SDK.

These limitations are documented as Known Limitations in Chapter 4 and represent the architectural boundary of the web-based Zoom Apps SDK model.

---

## B.6 API Structure and Endpoints

ENGAGIUM exposes REST endpoints grouped by domain.

### B.6.1 Authentication Endpoints

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh-token` |
| POST | `/api/auth/forgot-password` |
| POST | `/api/auth/reset-password` |
| GET | `/api/auth/profile` |
| PUT | `/api/auth/profile` |
| PUT | `/api/auth/change-password` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/generate-extension-token` |

### B.6.2 Extension Token Endpoints

| Method | Endpoint |
|--------|----------|
| POST | `/api/extension-tokens/generate` |
| GET | `/api/extension-tokens` |
| DELETE | `/api/extension-tokens/revoke-all` |
| DELETE | `/api/extension-tokens/:id` |
| POST | `/api/extension-tokens/verify` |

### B.6.3 Class, Student, Tag, and Note Endpoints (Representative)

| Method | Endpoint |
|--------|----------|
| GET | `/api/classes` |
| GET | `/api/classes/stats` |
| GET | `/api/classes/:id` |
| POST | `/api/classes` |
| PUT | `/api/classes/:id` |
| DELETE | `/api/classes/:id` |
| PATCH | `/api/classes/:id/status` |
| PATCH | `/api/classes/:id/schedule` |
| GET | `/api/classes/:id/links` |
| POST | `/api/classes/:id/links` |
| PUT | `/api/classes/:id/links/:linkId` |
| DELETE | `/api/classes/:id/links/:linkId` |
| GET | `/api/classes/:id/exemptions` |
| POST | `/api/classes/:id/exemptions` |
| DELETE | `/api/classes/:id/exemptions/:exemptionId` |
| GET | `/api/classes/:classId/students` |
| POST | `/api/classes/:classId/students` |
| POST | `/api/classes/:classId/students/import` |
| POST | `/api/classes/:classId/students/merge` |
| GET | `/api/classes/:classId/tags` |
| POST | `/api/classes/:classId/tags` |
| GET | `/api/classes/:classId/students/:studentId/notes` |
| POST | `/api/classes/:classId/students/:studentId/notes` |

### B.6.4 Session Endpoints (Representative)

| Method | Endpoint |
|--------|----------|
| GET | `/api/sessions` |
| GET | `/api/sessions/stats` |
| GET | `/api/sessions/date-range` |
| GET | `/api/sessions/calendar` |
| GET | `/api/sessions/active` |
| POST | `/api/sessions/start-from-meeting` |
| PUT | `/api/sessions/:id/end-with-timestamp` |
| POST | `/api/sessions/live-event` |
| POST | `/api/sessions/:id/attendance/join` |
| POST | `/api/sessions/:id/attendance/leave` |
| GET | `/api/sessions/:id/attendance/full` |
| POST | `/api/sessions/:id/attendance/link` |
| POST | `/api/sessions/:id/attendance/bulk` |
| POST | `/api/sessions/:id/participation/bulk` |
| POST | `/api/sessions/attendance/full/bulk` |

### B.6.5 Participation Endpoints

| Method | Endpoint |
|--------|----------|
| POST | `/api/participation/sessions/:sessionId/logs` |
| POST | `/api/participation/sessions/:sessionId/logs/bulk` |
| POST | `/api/participation/sessions/logs/bulk` |
| GET | `/api/participation/sessions/:sessionId/logs` |
| GET | `/api/participation/sessions/:sessionId/summary` |
| GET | `/api/participation/sessions/:sessionId/recent` |

### B.6.6 Realtime Events

| Event | Direction |
|-------|-----------|
| `join_instructor_room` | Client -> Server |
| `join:session` | Client -> Server |
| `leave:session` | Client -> Server |
| `participation:update` | Client -> Server |
| `session:status` | Client -> Server |
| `session:status_response` | Server -> Client |
| `session:joined` | Server -> Client |
| `session:left` | Server -> Client |
| `user:joined` | Server -> Client |
| `user:left` | Server -> Client |
| `participation:live_update` | Server -> Client |

---

## B.7 Database Schema (ERD + Table Definitions)

### B.7.1 Current Core Tables

| Domain | Tables |
|-------|--------|
| Identity/Auth | `users`, `refresh_token_sessions`, `extension_tokens` |
| Class/Roster | `classes`, `students`, `session_links`, `exempted_accounts` |
| Session/Attendance | `sessions`, `attendance_records`, `attendance_intervals` |
| Participation | `participation_logs` |
| Student metadata | `student_tags`, `student_tag_assignments`, `student_notes` |

### B.7.2 Relational Structure (Simplified)

```
users (1) -> (N) classes
classes (1) -> (N) students
classes (1) -> (N) sessions
classes (1) -> (N) session_links
classes (1) -> (N) exempted_accounts
classes (1) -> (N) student_tags
students (N) <-> (N) student_tags via student_tag_assignments
students (1) -> (N) student_notes
sessions (1) -> (N) attendance_records
sessions (1) -> (N) attendance_intervals
sessions (1) -> (N) participation_logs
students (0..1) -> (N) attendance_records / attendance_intervals / participation_logs
```

### B.7.3 Enumerations

| Enum | Values |
|------|--------|
| `user_role` | `instructor`, `admin` |
| `session_status` | `scheduled`, `active`, `ended` |
| `interaction_type` | `manual_entry`, `chat`, `reaction`, `mic_toggle`, `camera_toggle`, `hand_raise`, `join`, `leave` |

### B.7.4 Key Schema Rules

- Student records support soft delete via `students.deleted_at`.
- Attendance duration is interval-derived using `attendance_intervals` and reflected in `attendance_records`.
- Participation can be stored even when student linkage is unresolved (`student_id` nullable in logs/attendance records).
- Token tables support revocation and expiry semantics.

---

## B.8 Technology Stack Summary

### B.8.1 Backend

| Technology | Version |
|-----------|---------|
| Node.js | >=20.19.0 |
| express | 4.22.1 |
| socket.io | ^4.8.3 |
| jsonwebtoken | ^9.0.3 |
| bcrypt (bcryptjs alias) | npm:bcryptjs@^2.4.3 |
| helmet | ^6.0.0 |
| express-rate-limit | ^6.7.0 |
| pg | ^8.8.0 |
| multer | ^2.1.1 |
| csv-parser | ^3.0.0 |
| nodemailer | ^8.0.5 |

### B.8.2 Frontend

| Technology | Version |
|-----------|---------|
| react / react-dom | ^18.2.0 |
| vite | ^7.3.2 |
| react-router-dom | ^6.30.3 |
| @tanstack/react-query | ^4.24.0 |
| axios | ^1.15.0 |
| socket.io-client | ^4.8.1 |
| recharts | ^3.5.1 |
| @zoom/appssdk | ^0.16.37 |

### B.8.3 Extension

| Technology | Version |
|-----------|---------|
| Manifest | v3 |
| react / react-dom | ^18.2.0 |
| vite | ^7.3.2 |
| idb | ^7.1.1 |
| date-fns | ^2.30.0 |
| uuid | ^9.0.0 |

---

## B.9 Development Progress (Implementation Status)

Current implementation status reflects a deployed architecture direction rather than an early prototype state.

### Completed Implementation Areas

- Authentication and profile flows for dashboard users.
- Extension token lifecycle management.
- Comprehensive class/student/tag/note/link/exemption workflows.
- Meeting-driven session lifecycle and attendance interval tracking.
- Participation logging, summaries, and recent activity retrieval.
- Realtime dashboard synchronization via Socket.io rooms/events.
- Zoom bridge routing and service integration in frontend.

### Validation Focus Areas

- Ongoing detector robustness against Google Meet DOM changes.
- End-to-end regression coverage for meeting-side ingestion and realtime updates.
- Continued documentation synchronization with route/schema/module changes.

### Architectural Direction Statement

ENGAGIUM has moved beyond thesis-era assumptions of a single integration path. The present system uses a split integration model:

- Google Meet via extension runtime.
- Zoom via web bridge and Zoom Apps SDK services.
- Shared backend APIs and shared relational schema for both pathways.

