# System Architecture
## Engagium System - Current Technical Architecture

**Last Updated:** April 18, 2026  
**Status:** Aligned to current codebase

---

## 1. Architecture Overview

Engagium currently operates through three coordinated product surfaces and one shared backend core:

1. React web dashboard (instructor UX).
2. Chrome Manifest V3 extension for Google Meet.
3. Zoom Apps SDK bridge pages/services inside the web app.
4. Node.js + Express + Socket.io + PostgreSQL backend.

---

## 2. Runtime Topology

```
Google Meet Tab
  -> Extension content modules
  -> Extension background service worker
  -> REST calls with X-Extension-Token
  -> Backend API + DB + Socket.io
  -> Dashboard realtime updates

Web Dashboard (React)
  -> REST calls with JWT Bearer token
  -> Backend API + DB + Socket.io

Zoom Bridge Pages (React + Zoom SDK)
  -> Bridge API calls with meeting-side token model
  -> Shared backend session/attendance/participation flows
```

---

## 3. Frontend Architecture

Current routed surfaces:

- Public: `/`, `/forgot-password`, `/reset-password`, `/zoom/bridge`, `/zoom/oauth/callback`
- Protected under `/app`: `home`, `live-feed`, `classes`, `classes/:id`, `sessions`, `sessions/:id`, `sessions/bundled/:bundleId`, `analytics`, `settings`

Core frontend contexts/services:

- `AuthContext.jsx` for auth bootstrap and token lifecycle.
- `WebSocketContext.jsx` for live session/event synchronization.
- `services/api.js` for standard dashboard API operations.
- `services/zoomIframeApi.js` and `services/zoomSdkBridge.js` for Zoom bridge flows.

---

## 4. Backend Architecture

API route groups:

- `/api/auth/*`
- `/api/classes/*`
- `/api/sessions/*`
- `/api/participation/*`
- `/api/extension-tokens/*`

Key backend behaviors:

- `flexibleAuth` accepts JWT or extension token where supported.
- Session lifecycle is meeting-driven (`start-from-meeting` flow).
- Attendance is interval-based and recalculated from join/leave evidence.
- Participation supports single-event and bulk ingestion.
- `/health` includes database readiness state.

---

## 5. Realtime Architecture

Socket authentication uses JWT handshake, then supports:

- Instructor room: `instructor_{userId}`
- Session room: `session:{sessionId}`

Current socket events in code include:

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

---

## 6. Extension Architecture

Manifest V3 components:

- Service worker: `background/service-worker.js`
- Content loader: `content/loader.js`
- Popup UI: `popup/index.html`
- Options UI: `options/index.html`

Google Meet scope:

- Content script match: `https://meet.google.com/*-*-*`
- Web-accessible resources match: `https://meet.google.com/*`

Tracking modules are organized under `content/google-meet/` by:

- `detection/` (participant, chat, reaction, raised hand, mic toggle, exit, URL)
- `dom/` (DOM/panel management)
- `core/` (state, config, event emitter, utils)
- `ui/` (tracking indicator and meeting notifications)

---

## 7. Data Layer Architecture

Primary schema entities:

- Identity/auth: `users`, `refresh_token_sessions`, `extension_tokens`
- Academic domain: `classes`, `students`, `session_links`, `exempted_accounts`
- Session domain: `sessions`, `attendance_records`, `attendance_intervals`, `participation_logs`
- Student organization: `student_tags`, `student_tag_assignments`, `student_notes`

Data model characteristics:

- Instructor ownership boundary on all domain records.
- Soft delete on students (`students.deleted_at`).
- Nullable student linkage for unmatched participants.
- Enum-backed interaction types for participation and presence events.

---

## 8. Security Architecture

- JWT auth for dashboard users.
- Extension token auth for meeting-side clients.
- Flexible auth middleware for mixed client routes.
- Helmet, CORS allowlist, and rate limiting with identity-aware keys.

---

## 9. Architectural Constraints

- Extension tracking is Google Meet-specific.
- Zoom support is bridge-based in frontend, not extension content-script based.
- Student-facing login surface is intentionally absent.
- Session creation is primarily meeting-driven.

