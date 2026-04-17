# Engagium - Current System Architecture & Source of Truth

**Version:** 3.0  
**Purpose:** Professor-only participation tracking web application with Google Meet extension support and Zoom Apps SDK bridge support  
**Last Updated:** April 16, 2026  
**Status:** Current implementation reference

---

## Executive Summary

Engagium is a professor-facing participation tracking system. The current codebase is built around three coordinated surfaces:

1. A React web app for class management, live monitoring, analytics, and account settings.
2. A Chrome Manifest V3 extension for Google Meet tracking.
3. A Zoom Apps SDK bridge flow exposed through the web app for Zoom meeting contexts.

The backend is a Node.js + Express + PostgreSQL + Socket.io service that powers authentication, class and student management, session lifecycle operations, participation logging, attendance tracking, and real-time updates.

This document reflects the implemented codebase, not the earlier thesis-era design notes. In particular, it updates the system to match the current route structure, schema, session bundling behavior, extension token model, and Zoom integration paths.

---

## 1. Current Product Scope

### 1.1 What Engagium does today

- Tracks participation for instructor-owned classes.
- Stores classes, students, tags, notes, exemptions, sessions, attendance intervals, and participation logs.
- Starts sessions from meeting contexts rather than manual session creation.
- Supports Google Meet through the browser extension.
- Supports Zoom through the web app bridge and Zoom Apps SDK entry points.
- Uses Socket.io to surface active sessions and live events in the dashboard.
- Uses extension tokens for non-web authentication of meeting-side clients.

### 1.2 What is no longer part of the current codebase

- Manual session creation as the primary workflow.
- Student-facing accounts or dashboards.
- Notification-center flows from the earlier draft.
- A Zoom browser-bot implementation inside the extension.

---

## 2. System Components

### 2.1 Frontend Web Application

The frontend is a React SPA routed under `/app` for authenticated users.

Core pages currently implemented:

- `/` - landing page with sign-in and sign-up entry points.
- `/forgot-password` and `/reset-password` - password recovery flows.
- `/app/home` - dashboard overview.
- `/app/live-feed` - real-time participation feed.
- `/app/classes` - class list and management.
- `/app/classes/:id` - class detail page.
- `/app/sessions` - session history and bundling views.
- `/app/sessions/:id` - session detail page.
- `/app/sessions/bundled/:bundleId` - bundled session detail page.
- `/app/analytics` - class-level analytics.
- `/app/settings` - profile and extension token management.
- `/zoom/bridge` - Zoom iframe bridge.
- `/zoom/oauth/callback` - Zoom OAuth callback handler.

Important frontend components include:

- `Layout.jsx` - sidebar shell and navigation.
- `ActiveSessionCard.jsx` - live session summary card.
- `LiveEventFeed.jsx` - recent participation stream.
- `ClassAnalytics.jsx` - class analytics visualizations.
- `SessionCalendarView.jsx` - schedule-aware session grouping.
- `AttendanceRoster.jsx` - attendance display for sessions.
- Student management modals for import, merge, notes, tags, and bulk actions.

### 2.2 Backend API

The backend is an Express server that exposes REST endpoints and Socket.io events.

Current backend concerns:

- JWT authentication and refresh flows for the web app.
- Extension token generation, verification, revocation, and lookup.
- CRUD and analytics for classes, students, tags, notes, sessions, attendance, and participation.
- Session lifecycle APIs for web and meeting-side clients.
- Real-time room-based events for dashboard updates.

### 2.3 Browser Extension

The extension is a Manifest V3 Chrome extension focused on Google Meet only.

Current responsibilities:

- Detect Google Meet sessions.
- Track join and leave activity.
- Track chat, reactions, hand raises, and mic toggles.
- Queue failed work locally and retry when connectivity returns.
- Send events to the backend with extension token authentication.

### 2.4 Zoom Apps SDK Bridge

Zoom support is implemented through the web app rather than the extension.

The current codebase includes:

- `frontend/src/pages/ZoomIframeBridge.jsx`
- `frontend/src/pages/ZoomOAuthCallback.jsx`
- `frontend/src/services/zoomIframeApi.js`
- `frontend/src/services/zoomSdkBridge.js`

This path is used to connect meeting-context interactions to backend session APIs using the same extension-token-based trust model.

---

## 3. Current Authentication Model

### 3.1 Web app authentication

The web app uses JWT access tokens plus refresh-token renewal.

Implemented routes include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `POST /api/auth/logout`
- `POST /api/auth/generate-extension-token`

### 3.2 Extension token authentication

Meeting-side clients do not use the web JWT directly. They use extension tokens stored in the `extension_tokens` table.

Current endpoints:

- `POST /api/extension-tokens/generate`
- `GET /api/extension-tokens`
- `DELETE /api/extension-tokens/:id`
- `DELETE /api/extension-tokens/revoke-all`
- `POST /api/extension-tokens/verify`

### 3.3 Flexible authorization

The backend exposes a `flexibleAuth` middleware that accepts either:

- `Authorization: Bearer <JWT>` for the web app.
- `X-Extension-Token: <token>` for the extension and Zoom bridge.

This is the key mechanism that allows the same session and participation APIs to serve both the dashboard and meeting-side clients.

---

## 4. Current Database Model

The schema is migration-ready and centered around instructor-owned classes.

### 4.1 Core tables

- `users` - instructors and admins.
- `extension_tokens` - hashed meeting-side tokens.
- `classes` - class metadata and schedule references.
- `students` - class rosters with soft-delete support.
- `sessions` - meeting sessions with `started_at`, `ended_at`, and `status`.
- `attendance_records` - final per-participant attendance state.
- `attendance_intervals` - join/leave intervals for duration calculation.
- `participation_logs` - chat, reaction, mic, camera, hand, join, leave, and manual entries.
- `session_links` - optional mapped meeting links, including Zoom fields.
- `exempted_accounts` - TA, observer, or alternate accounts excluded from tracking.
- `student_tags` - class-level tag definitions.
- `student_tag_assignments` - many-to-many student tags.
- `student_notes` - instructor notes tied to students.

### 4.2 Important schema details

- `students` uses a single `full_name` field, not separate first and last names.
- `students.deleted_at` implements soft delete.
- `attendance_records` stores `participant_name`, `total_duration_minutes`, `first_joined_at`, and `last_left_at`.
- `attendance_intervals` captures each join/leave cycle.
- `participation_logs.student_id` is nullable because meeting participants may be unmatched.
- `interaction_type` includes `manual_entry`, `chat`, `reaction`, `mic_toggle`, `camera_toggle`, `hand_raise`, `join`, and `leave`.
- `session_links` supports platform metadata and Zoom-specific fields such as `zoom_meeting_id` and `zoom_passcode`.

### 4.3 Operational indexes and triggers

The schema includes indexes for class, session, student, attendance, participation, tag, note, and extension-token lookups, plus `updated_at` triggers on the mutable core tables.

---

## 5. Current API Surface

### 5.1 Classes and students

The classes router is broader than the earlier draft and now includes roster management, tags, notes, session links, exemptions, analytics, and bulk operations.

Notable endpoints include:

- `GET /api/classes`
- `GET /api/classes/stats`
- `GET /api/classes/:id`
- `POST /api/classes`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`
- `PATCH /api/classes/:id/status`
- `PATCH /api/classes/:id/schedule`
- `GET /api/classes/:id/links`
- `POST /api/classes/:id/links`
- `PUT /api/classes/:id/links/:linkId`
- `DELETE /api/classes/:id/links/:linkId`
- `GET /api/classes/:id/exemptions`
- `POST /api/classes/:id/exemptions`
- `DELETE /api/classes/:id/exemptions/:exemptionId`
- `GET /api/classes/:classId/students`
- `GET /api/classes/:classId/students/:studentId`
- `GET /api/classes/:classId/students/:studentId/analytics`
- `POST /api/classes/:classId/students/import`
- `GET /api/classes/:classId/students/check-duplicates`
- `GET /api/classes/:classId/students/export`
- `POST /api/classes/:classId/students/bulk`
- `POST /api/classes/:classId/students/bulk-delete`
- `POST /api/classes/:classId/students/bulk-update`
- `POST /api/classes/:classId/students/merge`
- `POST /api/classes/:classId/students/from-participant`
- `GET /api/classes/:classId/tags`
- `POST /api/classes/:classId/tags`
- `PUT /api/classes/:classId/tags/:tagId`
- `DELETE /api/classes/:classId/tags/:tagId`
- `GET /api/classes/:classId/students/:studentId/tags`
- `POST /api/classes/:classId/students/:studentId/tags/:tagId`
- `DELETE /api/classes/:classId/students/:studentId/tags/:tagId`
- `POST /api/classes/:classId/tags/:tagId/bulk-assign`
- `POST /api/classes/:classId/tags/:tagId/bulk-remove`
- `GET /api/classes/:classId/notes/recent`
- `GET /api/classes/:classId/students/:studentId/notes`
- `POST /api/classes/:classId/students/:studentId/notes`
- `PUT /api/classes/:classId/students/:studentId/notes/:noteId`
- `DELETE /api/classes/:classId/students/:studentId/notes/:noteId`

### 5.2 Sessions

Sessions are now auto-created from meeting contexts and then updated, ended, and analyzed through the API.

Important endpoints include:

- `GET /api/sessions`
- `GET /api/sessions/stats`
- `GET /api/sessions/date-range`
- `GET /api/sessions/calendar`
- `GET /api/sessions/active`
- `POST /api/sessions/start-from-meeting`
- `PUT /api/sessions/:id/end-with-timestamp`
- `POST /api/sessions/live-event`
- `GET /api/sessions/:id/students`
- `POST /api/sessions/:id/attendance/join`
- `POST /api/sessions/:id/attendance/leave`
- `GET /api/sessions/:id/attendance/full`
- `POST /api/sessions/:id/attendance/link`
- `POST /api/sessions/:id/attendance/bulk`
- `POST /api/sessions/:id/participation/bulk`
- `GET /api/sessions/:id/full`
- `GET /api/sessions/:id/attendance`
- `GET /api/sessions/:id/attendance/stats`
- `PUT /api/sessions/:id`
- `DELETE /api/sessions/:id`
- `POST /api/sessions/attendance/full/bulk`

### 5.3 Participation

The participation router supports both single and bulk event capture.

Current endpoints include:

- `POST /api/participation/sessions/:sessionId/logs`
- `POST /api/participation/sessions/:sessionId/logs/bulk`
- `GET /api/participation/sessions/:sessionId/logs`
- `GET /api/participation/sessions/:sessionId/summary`
- `GET /api/participation/sessions/:sessionId/recent`
- `POST /api/participation/sessions/logs/bulk`

---

## 6. Real-Time Architecture

### 6.1 Socket.io behavior

The backend Socket.io layer is used for live room membership, event updates, and dashboard synchronization.

Current socket events include:

- `join_instructor_room`
- `join:session`
- `leave:session`
- `participation:update`
- `session:status`
- `session:status_response`
- `session:joined`
- `session:left`
- `user:joined`
- `user:left`
- `participation:live_update`

### 6.2 Room model

- Instructor room: `instructor_{userId}`
- Session room: `session:{sessionId}`

### 6.3 Frontend consumers

The `WebSocketContext` powers:

- active session cards,
- live event feeds,
- session-status polling and synchronization,
- dashboard updates from server-side events.

---

## 7. Extension Architecture

### 7.1 Chrome Manifest V3 structure

The extension is intentionally focused on Google Meet.

Current manifest characteristics:

- Content script matches: `https://meet.google.com/*-*-*`
- Background service worker: `background/service-worker.js`
- Popup UI: `popup/index.html`
- Options UI: `options/index.html`
- Host permissions: Engagium backend domains only

### 7.2 Background worker responsibilities

- Session state management.
- API communication.
- Socket client handling.
- Offline queue retry.
- Participant-event normalization and dispatch.

### 7.3 Google Meet content script modules

The current codebase organizes Meet tracking under `content/google-meet/` with detector, DOM, UI, and core subfolders.

Representative modules include:

- participant detection,
- chat detection,
- reaction detection,
- raised-hand detection,
- mic-toggle detection,
- meeting-exit detection,
- DOM/panel helpers,
- tracking indicator UI,
- meeting notifications UI.

### 7.4 What the extension currently tracks

- Join and leave presence.
- Chat messages.
- Reactions.
- Hand raises.
- Mic toggles.
- Optional camera toggles where supported by the data model.

### 7.5 Offline handling

The extension queues outbound work locally and retries when connectivity returns. The design supports continued event capture even if the network drops mid-session.

---

## 8. Zoom Integration

Zoom support is not implemented as a browser extension bot. It is handled through the web application and Zoom Apps SDK bridge flow.

Current Zoom-related frontend entry points:

- `/zoom/bridge`
- `/zoom/oauth/callback`

Current Zoom-related services:

- `zoomIframeApi.js`
- `zoomSdkBridge.js`

The current architecture treats Zoom as a bridge-based web integration that can call the same backend session APIs as the Google Meet side.

---

## 9. Deployment and Runtime Notes

- Backend runs on Node.js 20.19+.
- Frontend is built with Vite 7 and React 18.
- Extension is built with Vite and packaged as Manifest V3.
- Backend CORS is driven by configured allowed origins.
- Backend startup applies schema work and validates database readiness.
- Rate limiting keys requests by JWT prefix or extension-token prefix where available.

---

## 10. Current Behavioral Rules

- Professors own all classes, sessions, students, and analytics.
- Students do not sign in.
- Sessions are started from meeting contexts, not from a manual session-creation screen.
- Class schedules are used for grouping and display, not as the sole source of truth for actual session timestamps.
- Session analytics are class-scoped, not inter-class comparative.
- The extension and Zoom bridge both rely on meeting-side token authorization rather than raw JWT reuse.

---

## 11. Current State Summary

Engagium is now a three-surface professor tool:

- Web dashboard for administration and analytics.
- Google Meet extension for browser-based participation capture.
- Zoom Apps SDK bridge for Zoom meeting contexts.

The main implementation delta from the older documentation is that the current codebase has moved beyond a pure browser-bot model and now uses a split integration strategy: Google Meet through the extension, Zoom through the web bridge, and a shared backend schema and API layer for both.

---

**END OF DOCUMENT**

This document is the current architecture reference for Engagium and should be kept aligned with the backend routes, frontend routes, extension manifest, and schema in the repository.
