# Data Flow Diagrams
## Engagium System - Current Operational Flows

**Last Updated:** April 18, 2026  
**Status:** Aligned with active frontend, extension, and backend flows

---

## 1. Session Start Flow (Google Meet Extension)

```
Google Meet DOM
  -> content/google-meet detectors + URL monitor
  -> extension background service worker
  -> POST /api/sessions/start-from-meeting (X-Extension-Token)
  -> backend creates/updates active session state
  -> database writes to sessions/attendance tables
  -> Socket.io emits updates to dashboard rooms
  -> frontend WebSocket context updates active session UI
```

---

## 2. Attendance Join/Leave Flow

```
Participant change in Meet
  -> participant detector emits join/leave event
  -> extension background routes to session attendance endpoint:
     - POST /api/sessions/:id/attendance/join
     - POST /api/sessions/:id/attendance/leave
  -> backend writes attendance_records + attendance_intervals
  -> duration and status fields are recalculated as needed
  -> frontend reads updated attendance via session APIs and/or socket events
```

---

## 3. Participation Event Flow

```
Chat / reaction / hand / mic event
  -> detector-specific module (chat, reaction, raised hand, mic toggle)
  -> event emitter + background normalization
  -> POST /api/sessions/live-event or bulk ingestion endpoints
  -> backend persists participation_logs
  -> Socket.io emits participation:live_update to session room
  -> Live feed + session detail UI refreshes in dashboard
```

---

## 4. Session End Flow

```
End trigger (meeting exit or explicit end)
  -> extension or bridge calls PUT /api/sessions/:id/end-with-timestamp
  -> backend closes session and finalizes attendance intervals
  -> session status transitions to ended
  -> final attendance/participation summary endpoints become authoritative
```

---

## 5. Dashboard JWT Flow

```
User login (POST /api/auth/login)
  -> backend returns access + refresh tokens
  -> frontend stores auth state
  -> protected routes under /app enabled
  -> API requests use Authorization: Bearer <token>
  -> refresh flow via POST /api/auth/refresh-token when needed
```

---

## 6. Extension Token Flow

```
Dashboard settings/token management
  -> POST /api/extension-tokens/generate (JWT-authenticated)
  -> token saved in extension storage
  -> extension requests include X-Extension-Token
  -> backend flexibleAuth/extension auth resolves user context
```

---

## 7. Zoom Bridge Flow

```
/zoom/bridge and /zoom/oauth/callback routes
  -> zoomSdkBridge + zoomIframeApi services
  -> bridge-side session and event operations use backend APIs
  -> backend writes to same sessions/attendance/participation schema
  -> dashboard consumes resulting data exactly like Meet-originated sessions
```

---

## 8. Offline Retry Flow (Extension)

```
Network/API failure on meeting-side event
  -> event stored in IndexedDB via sync queue
  -> retry worker replays queued events
  -> successful writes clear queue entries
```

---

## 9. Primary Data Stores by Flow

| Flow | Main tables |
|------|-------------|
| Auth | `users`, `refresh_token_sessions`, `extension_tokens` |
| Class and roster | `classes`, `students`, `session_links`, `exempted_accounts` |
| Session lifecycle | `sessions` |
| Attendance | `attendance_records`, `attendance_intervals` |
| Participation | `participation_logs` |
| Student organization | `student_tags`, `student_tag_assignments`, `student_notes` |

---

## 10. Notes for Thesis Figures

For Chapter 3 diagrams, use current event/route names from code (for example `join:session`, `participation:live_update`, `/api/sessions/start-from-meeting`) rather than older labels such as `session:started`/`attendance:updated` where those labels are not currently emitted by the active socket handler.

