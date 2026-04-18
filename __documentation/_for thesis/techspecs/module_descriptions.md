# Module Descriptions
## Engagium System - Current Module Inventory

**Last Updated:** April 18, 2026  
**Status:** Synced with active repository modules

---

## 1. System Module Groups

1. Browser extension (Google Meet tracking).
2. Backend API and realtime services.
3. Frontend dashboard and bridge pages.
4. Shared persistence model (PostgreSQL schema).

---

## 2. Browser Extension Modules

### 2.1 Core runtime

Location: `_extension/background/`

| File | Responsibility |
|------|----------------|
| `service-worker.js` | Extension runtime coordinator and message orchestration |
| `session-manager.js` | Session state lifecycle in extension runtime |
| `api-client.js` | Authenticated backend requests |
| `socket-client.js` | Socket connectivity from extension side |
| `sync-queue.js` | Offline queue and retry behavior |
| `handlers/participant-handler.js` | Participant-specific handling pipeline |

### 2.2 Google Meet content modules

Location: `_extension/content/google-meet/`

| Group | Representative files |
|------|-----------------------|
| Detection | `participant-detector.js`, `chat-detector.js`, `reaction-detector.js`, `raised-hand-detector.js`, `mic-toggle-detector.js`, `meeting-exit-detector.js`, `url-monitor.js`, `people-panel.js` |
| Core | `core/config.js`, `core/state.js`, `core/event-emitter.js`, `core/utils.js` |
| DOM | `dom/dom-manager.js`, `dom/panel-manager.js` |
| UI | `ui/tracking-indicator.js`, `ui/meeting-notifications.js` |
| Entry | `index.js` |

### 2.3 Extension UI modules

| Surface | Entry files |
|--------|-------------|
| Popup | `popup/index.html`, `popup/popup.jsx` |
| Options | `options/index.html`, `options/options.jsx`, `options/callback.html`, `options/callback.js` |

### 2.4 Extension utility modules

Location: `_extension/utils/`

- `auth.js`
- `class-formatter.js`
- `constants.js`
- `date-utils.js`
- `debug-logger.js`
- `logger.js`
- `storage.js`
- `string-utils.js`
- `student-matcher.js`
- `url-utils.js`

---

## 3. Backend Modules

### 3.1 Route modules

Location: `backend/src/routes/`

- `auth.js`
- `classes.js`
- `sessions.js`
- `participation.js`
- `extensionTokens.js`

### 3.2 Controller modules

Location: `backend/src/controllers/`

- `authController.js`
- `classController.js`
- `studentController.js`
- `sessionController.js`
- `participationController.js`
- `studentTagController.js`
- `studentNoteController.js`
- `extensionTokenController.js`

### 3.3 Middleware modules

Location: `backend/src/middleware/`

- `auth.js`
- `flexibleAuth.js`
- `extensionAuth.js`

### 3.4 Service and socket modules

- Service: `backend/src/services/emailService.js`
- Socket handler: `backend/src/socket/socketHandler.js`
- Server entry: `backend/server.js`

---

## 4. Frontend Modules

### 4.1 Top-level app/router

- `frontend/src/App.jsx`
- `frontend/src/main.jsx`

### 4.2 Pages

Location: `frontend/src/pages/`

- `LandingPage.jsx`
- `ForgotPassword.jsx`
- `ResetPassword.jsx`
- `ZoomIframeBridge.jsx`
- `ZoomOAuthCallback.jsx`
- `Home.jsx`
- `LiveFeed.jsx`
- `MyClasses.jsx`
- `ClassDetailsPage.jsx`
- `Sessions.jsx`
- `SessionDetailPage.jsx`
- `BundledSessionDetailPage.jsx`
- `Analytics.jsx`
- `Settings.jsx`

### 4.3 Context and service modules

- Contexts: `AuthContext.jsx`, `WebSocketContext.jsx` (in `frontend/src/contexts/`)
- Services: API and Zoom bridge services (in `frontend/src/services/`)
- Components: class/session/student/participation analytics components (in `frontend/src/components/`)

---

## 5. Module Interaction Summary

- Extension detectors gather meeting events and send them to the background runtime.
- Background runtime authenticates with extension tokens and submits session/attendance/participation updates.
- Backend persists data, enforces ownership rules, and emits live updates via Socket.io.
- Frontend reads REST state and reacts to socket events for live dashboard behavior.
- Zoom bridge pages use frontend services to route Zoom context actions into the same backend session model.

---

## 6. Implementation Notes

- Do not document `notifications` backend modules/routes in current-state sections; those files are not part of the active backend route/controller inventory.
- Use current route filenames (`auth.js`, `classes.js`, etc.), not older `*Routes.js` names.

