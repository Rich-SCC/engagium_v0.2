# Engagium System Framework

**Current Revision:** 3.0  
**Scope:** Implemented web app, Google Meet extension, and Zoom Apps SDK bridge  
**Last Updated:** April 16, 2026  
**Status:** Current technical reference

> This document supersedes the older thesis-era framework draft. It reflects the code that is actually present in the repository today: the React dashboard, the Google Meet extension, the Zoom bridge pages, the Express/Postgres backend, the current schema, and the live-session APIs.

---

# Part 1: Methodology and Technology Stack

## 1. Delivery Approach

Engagium is developed as an incrementally delivered product with a strong preference for working, demoable slices over speculative architecture.

Current implementation priorities visible in the codebase:

- Professor-only workflows.
- Automatic session creation from meeting contexts.
- Real-time session monitoring.
- Reliable offline retry for meeting-side clients.
- Schema-backed analytics for classes, sessions, and students.
- Separate support paths for Google Meet and Zoom.

This is no longer a manual-session prototype. The current codebase is centered on meeting-driven session start, flexible auth, and current-state analytics.

## 2. Technology Stack

### 2.1 Backend

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime | Node.js 20.19+ | Enforced by package engines |
| HTTP Framework | Express 4.22.1 | REST API server |
| Realtime | Socket.io 4.8.3 | Live dashboard updates and session rooms |
| Database | PostgreSQL | Schema-driven persistence |
| DB Driver | pg 8.8.x | Query access layer |
| Auth | jsonwebtoken 9.x | JWT access and refresh flows |
| Password hashing | bcryptjs via bcrypt alias | Hashes instructor passwords |
| Security headers | helmet 6.x | HTTP hardening |
| Rate limiting | express-rate-limit 6.7.x | Route-level protection |
| File upload | multer 2.1.x | CSV import for rosters |
| CSV parsing | csv-parser 3.x | Student import processing |
| Email | nodemailer 8.x | Password recovery email flow |
| Utilities | uuid 9.x | Record identifiers |

### 2.2 Frontend

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime | React 18.2 | Main dashboard UI |
| Build tool | Vite 7.3.x | Web app bundling |
| Routing | React Router DOM 6.30.x | Public + protected app routes |
| Data fetching | TanStack React Query 4.24.x | Server-state caching |
| HTTP | Axios 1.15.x | API client wrapper |
| Charts | Recharts 3.5.x | Analytics visualizations |
| Realtime client | socket.io-client 4.8.x | WebSocket integration |
| UI icons | @heroicons/react 2.0.x | Dashboard and page icons |
| Zoom bridge | @zoom/appssdk 0.16.x | Zoom meeting integration |

### 2.3 Browser Extension

| Layer | Technology | Notes |
|-------|------------|-------|
| Platform | Chrome Manifest V3 | Extension runtime |
| Runtime | React 18.2 | Popup and options UI |
| Build tool | Vite 7.3.x | Extension bundling |
| Local storage | IndexedDB via idb 7.1.x | Offline queue and cached state |
| Dates | date-fns 2.30.x | Time formatting helpers |
| Utilities | uuid 9.x | Local event identifiers |
| Chrome types | @types/chrome 0.0.254 | Developer tooling |

### 2.4 Tooling and Environment

| Tool | Purpose |
|------|---------|
| Docker Compose | Local dev and production services |
| Chrome DevTools | Extension debugging |
| Postman / Thunder Client | API verification |
| GitHub Actions | Backend regression and validation workflows |
| VS Code | Primary development environment |

---

# Part 2: Architecture and Modules

## 3. System Topology

Engagium currently has four cooperating runtime surfaces:

1. The authenticated React dashboard.
2. The Node/Express backend.
3. The Google Meet extension.
4. The Zoom Apps SDK bridge flow running through the web app.

The backend is shared by all surfaces. Auth is split between JWT for web users and extension tokens for meeting-side clients.

## 4. Frontend Architecture

### 4.1 Current Routes

Public routes:

- `/` - landing page.
- `/forgot-password` - password recovery request.
- `/reset-password` - password reset form.
- `/zoom/bridge` - Zoom iframe bridge.
- `/zoom/oauth/callback` - Zoom OAuth callback.

Protected routes under `/app`:

- `/app/home` - dashboard overview.
- `/app/live-feed` - real-time event stream.
- `/app/classes` - class management.
- `/app/classes/:id` - class detail and roster workspace.
- `/app/sessions` - session history and bundle view.
- `/app/sessions/:id` - session detail.
- `/app/sessions/bundled/:bundleId` - bundled session detail.
- `/app/analytics` - class analytics selector and views.
- `/app/settings` - profile and extension token management.

### 4.2 Core Pages and Responsibilities

| Page | Responsibility |
|------|----------------|
| `LandingPage` | Authentication entry and product entry point |
| `Home` | Summary dashboard with active sessions, schedule-aware views, and recent sessions |
| `LiveFeed` | Real-time feed of participation and attendance events |
| `MyClasses` | Class list, create/edit flows, and class-level operations |
| `ClassDetailsPage` | Roster, links, exemptions, tags, notes, and class analytics entry points |
| `Sessions` | Session list with raw/bundled modes and schedule grouping |
| `SessionDetailPage` | Single-session attendance and participation review |
| `BundledSessionDetailPage` | Aggregated view for fragmented sessions grouped by schedule |
| `Analytics` | Class picker that opens class-level analytics |
| `Settings` | Profile updates and extension token lifecycle management |
| `ZoomIframeBridge` | Meeting-context bridge for Zoom |
| `ZoomOAuthCallback` | OAuth return path for Zoom |

### 4.3 Important Frontend Modules

| Module | Purpose |
|--------|---------|
| `Layout.jsx` | Sidebar navigation and page shell |
| `AuthContext.jsx` | Auth state, token persistence, and session bootstrap |
| `WebSocketContext.jsx` | Socket.io connection, active sessions, live events, attendance merges |
| `services/api.js` | Main HTTP API client and resource wrappers |
| `services/zoomIframeApi.js` | Token-authenticated Zoom bridge requests |
| `services/zoomSdkBridge.js` | Zoom SDK coordination layer |
| `components/ActiveSessionCard.jsx` | Live session summary |
| `components/LiveEventFeed.jsx` | Real-time event rendering and normalization |
| `components/ClassAnalytics.jsx` | Recharts-based analytics dashboard |
| `components/Sessions/*` | Session forms, calendar, attendance roster, and related UI |
| `components/Students/*` | Student import, merge, notes, tags, and bulk actions |
| `components/ClassDetails/*` | Class form, session links, exemption management |
| `components/Participation/*` | Participation filters, summary, and logs |

### 4.4 Frontend Behavior Worth Preserving

- Sessions are shown in both raw and bundled forms.
- Bundling logic compares session timestamps against class schedules.
- Live event rendering merges mic-toggle events into speaking-session summaries where appropriate.
- Analytics uses a single-class-at-a-time model.
- The dashboard is professor-only and redirects authenticated users away from public routes.

## 5. Backend Architecture

### 5.1 Entry and Middleware

Current backend entry point responsibilities:

- Load environment configuration.
- Configure CORS and Helmet.
- Apply route-level rate limiting.
- Mount auth, class, session, participation, and extension-token routes.
- Initialize Socket.io.
- Validate database readiness and schema migrations at startup.

Key middleware modules:

- `auth.js` - JWT validation and role checks.
- `flexibleAuth.js` - accepts JWT or extension token.
- `extensionAuth.js` - extension-token-only workflows where needed.

### 5.2 Current Controllers

| Controller | Responsibility |
|------------|----------------|
| `authController` | Register, login, refresh, profile, password reset, extension token generation |
| `classController` | Classes, schedules, session links, exemptions, analytics |
| `sessionController` | Session lifecycle, attendance, live events, bundling support |
| `studentController` | Student CRUD, import, bulk edit, merge, duplicate detection |
| `participationController` | Participation event persistence and retrieval |
| `studentTagController` | Tag management and assignment |
| `studentNoteController` | Per-student note management |
| `extensionTokenController` | Extension token lifecycle and verification |

### 5.3 Route Structure

Auth routes:

- `/api/auth/*`

Class routes:

- `/api/classes/*`

Session routes:

- `/api/sessions/*`

Participation routes:

- `/api/participation/*`

Extension token routes:

- `/api/extension-tokens/*`

### 5.4 Socket Layer

The socket handler currently supports room joins for instructors and sessions, live participation broadcasts, and connection tracking.

Room names used by the codebase:

- `instructor_{userId}`
- `session:{sessionId}`

Observed event names include:

- `join_instructor_room`
- `join:session`
- `leave:session`
- `participation:update`
- `participation:live_update`
- `session:status`
- `session:status_response`
- `session:joined`
- `session:left`
- `user:joined`
- `user:left`

## 6. Extension Architecture

### 6.1 Manifest and Entry Points

The extension is a Manifest V3 package built for Google Meet only.

Current entry points:

- `background/service-worker.js`
- `content/loader.js`
- `popup/index.html`
- `options/index.html`

Manifest characteristics:

- Content script match: `https://meet.google.com/*-*-*`
- Background worker: module service worker
- Host permissions limited to Engagium backend domains
- No Zoom meeting-page content script in the extension

### 6.2 Background Modules

| Module | Purpose |
|--------|---------|
| `background/service-worker.js` | Orchestrates message routing and lifecycle |
| `background/session-manager.js` | Maintains current session state |
| `background/api-client.js` | Calls backend APIs |
| `background/socket-client.js` | Socket.io connectivity |
| `background/sync-queue.js` | Offline retry queue |
| `background/handlers/participant-handler.js` | Participant event handling |

### 6.3 Google Meet Content Modules

The Google Meet tree is organized into detection, DOM, UI, and core helpers.

Current module groups:

- `detection/participant-detector.js`
- `detection/chat-detector.js`
- `detection/reaction-detector.js`
- `detection/raised-hand-detector.js`
- `detection/mic-toggle-detector.js`
- `detection/meeting-exit-detector.js`
- `detection/url-monitor.js`
- `dom/dom-manager.js`
- `dom/panel-manager.js`
- `core/config.js`
- `core/state.js`
- `core/event-emitter.js`
- `core/utils.js`
- `ui/tracking-indicator.js`
- `ui/meeting-notifications.js`

### 6.4 Extension Behavior

- Detect meetings and normalize the current URL.
- Capture join/leave, chat, reaction, hand-raise, and mic-toggle activity.
- Match participants to students when possible.
- Queue failed writes locally and retry later.
- Store and verify extension tokens separately from web JWTs.

## 7. Zoom Bridge Architecture

Zoom is implemented as a web-app bridge, not an extension bot.

Current Zoom bridge flow:

- `ZoomOAuthCallback` receives the OAuth return payload.
- `ZoomIframeBridge` loads the SDK-facing bridge UI.
- `zoomIframeApi.js` sends token-authenticated backend requests.
- `zoomSdkBridge.js` wires the Zoom SDK context to Engagium operations.

This approach matches the repo direction of keeping Zoom implementation aligned with Zoom Apps SDK capabilities instead of broader meeting-bot automation.

---

# Part 3: Data Layer

## 8. Schema Overview

The current PostgreSQL schema in `backend/db/schema.sql` contains the following core entities:

- `users`
- `extension_tokens`
- `classes`
- `students`
- `sessions`
- `attendance_records`
- `attendance_intervals`
- `participation_logs`
- `session_links`
- `exempted_accounts`
- `student_tags`
- `student_tag_assignments`
- `student_notes`

## 9. Table Semantics

### 9.1 Users and auth

- `users` stores instructor and admin accounts.
- Passwords are stored as hashes.
- Refresh tokens and reset tokens are persisted for account flows.
- `extension_tokens` stores hashed meeting-side tokens with previews, expiry, and revocation state.

### 9.2 Classes and roster management

- `classes` stores course metadata, schedules, and status.
- `students` stores roster entries with a single `full_name` field and `deleted_at` soft delete.
- `session_links` stores optional class meeting links, including Zoom-specific metadata.
- `exempted_accounts` stores TA, observer, and alternate-account exclusions.

### 9.3 Session tracking

- `sessions` stores the meeting title, class relation, primary meeting link, and actual start/end timestamps.
- `attendance_records` stores final attendance state and duration totals.
- `attendance_intervals` stores each join/leave window for a participant.
- `participation_logs` stores event-level interaction data.

### 9.4 Student organization and annotations

- `student_tags` defines class-local labels.
- `student_tag_assignments` maps tags to students.
- `student_notes` stores instructor-authored notes linked to students.

## 10. Important Data Rules

- Session attendance is derived from activity and join/leave evidence.
- Participants may be present in logs even when they are not matched to a roster student.
- The system treats class ownership as the primary authorization boundary.
- Session records are write-once in spirit after start, with limited post-session edits.
- Analytics are class-scoped and session-scoped, not cross-instructor or inter-class comparison products.

## 11. Schema Features

The schema includes:

- ENUMs for `user_role`, `session_status`, and `interaction_type`.
- Foreign keys with cascade or set-null behavior where appropriate.
- Lookup indexes for common class, student, session, attendance, note, tag, and token queries.
- `updated_at` triggers on mutable tables.
- Unique constraints to prevent duplicate student IDs, duplicate tag assignments, duplicate exemptions, and duplicate attendance records per participant.

## 12. Data Flow Highlights

### 12.1 Start-from-meeting flow

1. A meeting-side client confirms tracking.
2. The client calls `POST /api/sessions/start-from-meeting`.
3. The backend creates the session and marks it active.
4. The client stores the session ID locally and begins event capture.

### 12.2 Attendance flow

1. The extension or bridge records join and leave events.
2. The backend writes interval records.
3. The final attendance record is updated with totals and timestamps.
4. The dashboard reads attendance and interval data for display and analytics.

### 12.3 Participation flow

1. Meeting-side clients submit chat, reaction, hand, mic, or camera events.
2. Events are normalized and written to `participation_logs`.
3. Socket.io relays live updates to the active dashboard session.

### 12.4 Session bundling flow

1. The frontend loads all sessions for the instructor.
2. It compares `started_at` / `ended_at` against class schedules.
3. Sessions that align with a schedule window are grouped into a bundle.
4. The bundled view helps the instructor inspect fragmented or closely related meeting fragments.

---

# Part 4: Quality, Security, and Operations

## 13. Security Model

### 13.1 Authentication

- Web users authenticate with JWT access tokens and refresh tokens.
- Meeting-side clients authenticate with extension tokens.
- Zoom bridge requests use the same meeting-side token model.

### 13.2 Authorization

- Every class, student, and session lookup validates instructor ownership or admin role.
- Flexible routes still resolve to a user identity before the controller logic runs.
- Session access is room-scoped and ownership-scoped in the socket layer.

### 13.3 API protection

- Helmet is enabled.
- CORS is constrained to configured origins.
- Rate limiting keys by JWT prefix or extension-token prefix where possible.

## 14. Performance Considerations

Current performance choices in the codebase include:

- React Query caching for dashboard reads.
- Socket rooms to avoid broadcasting to unrelated users.
- Bulk submission endpoints for attendance and participation data.
- IndexedDB queueing for meeting-side offline work.
- Schedule-aware session grouping on the frontend to avoid naive listing.

## 15. Testing and Validation

The current codebase is organized for a mixed validation strategy:

- Backend route and controller validation.
- Frontend component and interaction testing.
- Extension behavior checks in Chrome DevTools.
- Manual verification of meeting-side flows in Google Meet and Zoom bridge contexts.
- Docker-based backend validation when local Node tooling is not the preferred path.

## 16. Deployment Notes

### 16.1 Backend

- Built and run as a Node server.
- Requires configured JWT secrets and database connectivity.
- Applies schema work at startup.

### 16.2 Frontend

- Built with Vite.
- Served as a static app behind the configured web host.
- Includes public Zoom bridge routes and authenticated dashboard routes.

### 16.3 Extension

- Packaged as a Manifest V3 extension.
- Uses a service worker plus content script loader.
- Targets Google Meet URLs only.

## 17. Current Design Constraints

- Google Meet is the only browser-extension meeting platform in this repository.
- Zoom support is intentionally bridge-based rather than extension-based.
- There is no student login surface.
- Session creation is meeting-driven, not manually initiated from the dashboard.
- The analytics model is class-first and session-first, not inter-class comparison based.

---

## 18. Current Implementation Summary

The codebase now reflects a stable split architecture:

- The web app manages classes, students, sessions, analytics, settings, and Zoom bridge flows.
- The extension captures Google Meet signals and pushes them through extension-token-authenticated APIs.
- The backend persists the shared state, enforces ownership, and broadcasts live updates.
- The database stores the professor-owned participation record as the system of record.

This document should be treated as the technical companion to the architecture source of truth and kept synchronized with the routes, schema, and component tree in the repository.
