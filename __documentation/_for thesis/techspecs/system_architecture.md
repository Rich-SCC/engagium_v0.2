# System Architecture
## Engagium System - Chapter 3.3.1 Reference

This document describes the high-level technical architecture of the Engagium system.

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENGAGIUM SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────┐                      ┌──────────────────────┐        │
│   │   GOOGLE MEET TAB    │                      │   INSTRUCTOR'S       │        │
│   │   (Meeting Session)  │                      │   WEB BROWSER        │        │
│   │                      │                      │                      │        │
│   │  ┌────────────────┐  │                      │  ┌────────────────┐  │        │
│   │  │ Content Scripts│  │                      │  │ React Dashboard│  │        │
│   │  │                │  │                      │  │                │  │        │
│   │  │ - Participant  │  │                      │  │ - Live Feed    │  │        │
│   │  │   Detector     │  │                      │  │ - Sessions     │  │        │
│   │  │ - Chat Monitor │  │                      │  │ - Analytics    │  │        │
│   │  │ - Reaction     │  │                      │  │ - Class Mgmt   │  │        │
│   │  │   Detector     │  │                      │  │                │  │        │
│   │  │ - Hand Raise   │  │                      │  └───────┬────────┘  │        │
│   │  │   Detector     │  │                      │          │           │        │
│   │  │ - Mic Toggle   │  │                      │          │ HTTP/WS   │        │
│   │  │   Detector     │  │                      │          │           │        │
│   │  └───────┬────────┘  │                      └──────────┼───────────┘        │
│   │          │           │                                 │                    │
│   └──────────┼───────────┘                                 │                    │
│              │ Message Passing                             │                    │
│              ▼                                             │                    │
│   ┌──────────────────────┐                                 │                    │
│   │   SERVICE WORKER     │                                 │                    │
│   │   (Background)       │                                 │                    │
│   │                      │                                 │                    │
│   │ - Session Manager    │                                 │                    │
│   │ - API Client         │                                 │                    │
│   │ - Socket Client      │                                 │                    │
│   │ - Sync Queue         ├─────────────────────────────────┤                    │
│   │ - IndexedDB Storage  │         HTTP REST API           │                    │
│   │                      │         + WebSocket             │                    │
│   └──────────┬───────────┘                                 │                    │
│              │                                             │                    │
│              │ X-Extension-Token                           │ JWT Bearer Token   │
│              │                                             │                    │
│              └─────────────────────┬───────────────────────┘                    │
│                                    │                                            │
│                                    ▼                                            │
│              ┌─────────────────────────────────────────────┐                    │
│              │              BACKEND SERVER                  │                    │
│              │              (Node.js + Express)             │                    │
│              │                                              │                    │
│              │  ┌────────────┐  ┌────────────────────────┐ │                    │
│              │  │ REST API   │  │    Socket.io Server    │ │                    │
│              │  │            │  │                        │ │                    │
│              │  │ /auth      │  │ Rooms:                 │ │                    │
│              │  │ /classes   │  │ - instructor:{userId}  │ │                    │
│              │  │ /sessions  │  │ - session:{sessionId}  │ │                    │
│              │  │ /students  │  │                        │ │                    │
│              │  │ /particip. │  │ Events:                │ │                    │
│              │  └─────┬──────┘  │ - session:started      │ │                    │
│              │        │         │ - session:ended        │ │                    │
│              │        │         │ - participation:logged │ │                    │
│              │        │         │ - attendance:updated   │ │                    │
│              │        │         └───────────┬────────────┘ │                    │
│              │        │                     │              │                    │
│              │        └──────────┬──────────┘              │                    │
│              │                   │                         │                    │
│              │         ┌─────────▼─────────┐               │                    │
│              │         │   Controllers &   │               │                    │
│              │         │     Services      │               │                    │
│              │         └─────────┬─────────┘               │                    │
│              │                   │                         │                    │
│              └───────────────────┼─────────────────────────┘                    │
│                                  │                                              │
│                                  ▼                                              │
│              ┌─────────────────────────────────────────────┐                    │
│              │              POSTGRESQL DATABASE             │                    │
│              │                                              │                    │
│              │  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │                    │
│              │  │  users  │ │ classes │ │   students    │  │                    │
│              │  └─────────┘ └─────────┘ └───────────────┘  │                    │
│              │  ┌─────────┐ ┌─────────────────────────────┐│                    │
│              │  │sessions │ │ attendance_records/intervals││                    │
│              │  └─────────┘ └─────────────────────────────┘│                    │
│              │  ┌───────────────────┐ ┌─────────────────┐  │                    │
│              │  │ participation_logs│ │ notifications   │  │                    │
│              │  └───────────────────┘ └─────────────────┘  │                    │
│              │                                              │                    │
│              └──────────────────────────────────────────────┘                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW: EXTENSION TO DASHBOARD                         │
└─────────────────────────────────────────────────────────────────────────────────┘

    Google Meet DOM                Content Script              Service Worker
         │                              │                           │
         │  (DOM Observation)           │                           │
         │◄─────────────────────────────│                           │
         │                              │                           │
         │  Participant joins           │                           │
         ├─────────────────────────────►│                           │
         │                              │  chrome.runtime           │
         │                              │  .sendMessage()           │
         │                              ├──────────────────────────►│
         │                              │                           │
         │                              │                           │  HTTP POST
         │                              │                           │  /sessions/live-event
         │                              │                           ├──────────────┐
         │                              │                           │              │
         │                              │                           │              ▼
         │                              │                           │       ┌──────────────┐
         │                              │                           │       │   Backend    │
         │                              │                           │       │   Server     │
         │                              │                           │       └──────┬───────┘
         │                              │                           │              │
         │                              │                           │              │ Socket.io
         │                              │                           │              │ broadcast
         │                              │                           │              │
         │                              │                           │              ▼
         │                              │                           │       ┌──────────────┐
         │                              │                           │       │  Dashboard   │
         │                              │                           │       │  (React)     │
         │                              │                           │       └──────────────┘
```

---

## 3. Authentication Architecture

Engagium uses a **dual authentication system** to support both the web dashboard and browser extension.

### 3.1 Web Application Authentication (JWT)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           JWT AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    User                    Frontend                   Backend                Database
     │                         │                          │                       │
     │  Login Request          │                          │                       │
     ├────────────────────────►│                          │                       │
     │                         │  POST /auth/login        │                       │
     │                         ├─────────────────────────►│                       │
     │                         │                          │  Verify credentials   │
     │                         │                          ├──────────────────────►│
     │                         │                          │◄─────────────────────┤
     │                         │                          │                       │
     │                         │  { accessToken,          │                       │
     │                         │    refreshToken }        │                       │
     │                         │◄─────────────────────────┤                       │
     │                         │                          │                       │
     │  Store tokens           │                          │                       │
     │  (localStorage)         │                          │                       │
     │◄────────────────────────┤                          │                       │
     │                         │                          │                       │
     │  API Request            │                          │                       │
     ├────────────────────────►│                          │                       │
     │                         │  Authorization:          │                       │
     │                         │  Bearer {accessToken}    │                       │
     │                         ├─────────────────────────►│                       │
     │                         │                          │  Verify JWT           │
     │                         │                          │  Extract user_id      │
     │                         │◄─────────────────────────┤                       │
```

**JWT Token Details:**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), stored in database, used to obtain new access tokens

### 3.2 Extension Authentication (Extension Tokens)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      EXTENSION TOKEN AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────────────┘

    Extension                Dashboard                  Backend                Database
        │                        │                         │                       │
        │  User opens Options    │                         │                       │
        │  page, clicks Connect  │                         │                       │
        ├───────────────────────►│                         │                       │
        │                        │  POST /extension-tokens │                       │
        │                        │  /generate              │                       │
        │                        ├────────────────────────►│                       │
        │                        │                         │  Store hashed token   │
        │                        │                         ├──────────────────────►│
        │                        │                         │◄─────────────────────┤
        │                        │  { token: "ext_xxx" }   │                       │
        │                        │◄────────────────────────┤                       │
        │                        │                         │                       │
        │  chrome.storage.sync   │                         │                       │
        │  .set({ extToken })    │                         │                       │
        │◄───────────────────────┤                         │                       │
        │                        │                         │                       │
        │  API Request           │                         │                       │
        │  X-Extension-Token:    │                         │                       │
        │  ext_xxx               │                         │                       │
        ├────────────────────────────────────────────────►│                       │
        │                        │                         │  Verify token hash    │
        │                        │                         │  Get user_id          │
        │                        │◄────────────────────────┤                       │
```

**Extension Token Details:**
- **Long-lived**: No expiration (until manually revoked)
- **Revocable**: User can revoke from dashboard Settings
- **Separate from JWT**: Does not affect web session

### 3.3 Flexible Authentication Middleware

The backend uses `flexibleAuth` middleware that accepts either authentication method:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FLEXIBLE AUTH MIDDLEWARE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

                              Incoming Request
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │  Check X-Extension-Token       │
                    │  header exists?                │
                    └────────────────┬───────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                         YES                    NO
                          │                     │
                          ▼                     ▼
               ┌──────────────────┐  ┌──────────────────┐
               │ Verify extension │  │ Check Bearer     │
               │ token in DB      │  │ token exists?    │
               └────────┬─────────┘  └────────┬─────────┘
                        │                     │
                   ┌────┴────┐           ┌────┴────┐
                   │         │           │         │
                 Valid    Invalid       YES        NO
                   │         │           │         │
                   ▼         │           ▼         ▼
            ┌───────────┐    │  ┌───────────┐  ┌───────────┐
            │ Set       │    │  │ Verify    │  │ 401       │
            │ req.user  │    │  │ JWT       │  │ Unauth    │
            │ Continue  │    │  └─────┬─────┘  └───────────┘
            └───────────┘    │        │
                             │   ┌────┴────┐
                             │   │         │
                             │ Valid    Invalid
                             │   │         │
                             │   ▼         ▼
                             │ ┌───────────┐
                             └►│ 401 Error │
                               └───────────┘
```

---

## 4. Real-Time Communication Architecture

### 4.1 WebSocket Room Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SOCKET.IO ROOM ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                              Socket.io Server
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
   │ instructor:uuid-1 │    │ instructor:uuid-2 │    │ instructor:uuid-3 │
   │                   │    │                   │    │                   │
   │ ┌───────────────┐ │    │ ┌───────────────┐ │    │ ┌───────────────┐ │
   │ │ Dashboard Tab │ │    │ │ Dashboard Tab │ │    │ │ Dashboard Tab │ │
   │ └───────────────┘ │    │ └───────────────┘ │    │ └───────────────┘ │
   └─────────┬─────────┘    └───────────────────┘    └───────────────────┘
             │
             │ Also joins when viewing specific session
             ▼
   ┌───────────────────┐
   │ session:sess-uuid │
   │                   │
   │ Events:           │
   │ - join/leave      │
   │ - participation   │
   │ - attendance      │
   └───────────────────┘
```

### 4.2 WebSocket Events

| Event Name | Direction | Payload | Purpose |
|------------|-----------|---------|---------|
| `join_instructor_room` | Client → Server | `{ userId }` | Subscribe to instructor updates |
| `join_session` | Client → Server | `{ sessionId }` | Subscribe to session updates |
| `leave_session` | Client → Server | `{ sessionId }` | Unsubscribe from session |
| `session:started` | Server → Client | `{ session }` | New session notification |
| `session:ended` | Server → Client | `{ sessionId }` | Session ended notification |
| `participation:logged` | Server → Client | `{ event }` | New participation event |
| `attendance:updated` | Server → Client | `{ attendance }` | Attendance change |
| `participant:joined` | Server → Client | `{ participant }` | New participant in session |
| `participant:left` | Server → Client | `{ participantId }` | Participant left session |

---

## 5. Extension Architecture

### 5.1 Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER EXTENSION ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                              CHROME BROWSER                                  │
    │                                                                              │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
    │  │   POPUP         │  │   OPTIONS       │  │   GOOGLE MEET   │              │
    │  │   (popup.jsx)   │  │   (options.jsx) │  │   TAB           │              │
    │  │                 │  │                 │  │                 │              │
    │  │ - Start/Stop    │  │ - Login         │  │ ┌─────────────┐ │              │
    │  │   Session       │  │ - Class Map     │  │ │Content      │ │              │
    │  │ - View Status   │  │ - Settings      │  │ │Scripts      │ │              │
    │  │ - Quick Actions │  │ - Debug Panel   │  │ │             │ │              │
    │  │                 │  │                 │  │ │(14 modules) │ │              │
    │  └────────┬────────┘  └────────┬────────┘  │ └──────┬──────┘ │              │
    │           │                    │           └────────┼────────┘              │
    │           │                    │                    │                       │
    │           │    chrome.runtime.sendMessage()         │                       │
    │           └────────────────────┼────────────────────┘                       │
    │                                │                                            │
    │                                ▼                                            │
    │           ┌────────────────────────────────────────┐                        │
    │           │         SERVICE WORKER                  │                        │
    │           │         (Manifest V3 Background)        │                        │
    │           │                                         │                        │
    │           │  ┌─────────────┐  ┌─────────────────┐  │                        │
    │           │  │ Session     │  │ API Client      │  │                        │
    │           │  │ Manager     │  │ (HTTP requests) │  │                        │
    │           │  └─────────────┘  └─────────────────┘  │                        │
    │           │  ┌─────────────┐  ┌─────────────────┐  │                        │
    │           │  │ Socket      │  │ Sync Queue      │  │                        │
    │           │  │ Client      │  │ (Offline)       │  │                        │
    │           │  └─────────────┘  └─────────────────┘  │                        │
    │           │  ┌─────────────────────────────────┐   │                        │
    │           │  │ IndexedDB Storage (idb)         │   │                        │
    │           │  │ - Sessions, Participants, Events│   │                        │
    │           │  └─────────────────────────────────┘   │                        │
    │           │                                         │                        │
    │           └────────────────────┬───────────────────┘                        │
    │                                │                                            │
    └────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     │ HTTP + X-Extension-Token
                                     ▼
                              ┌──────────────┐
                              │   Backend    │
                              │   Server     │
                              └──────────────┘
```

### 5.2 Content Script Modules (Google Meet)

| Module | Purpose | Detection Method |
|--------|---------|------------------|
| `participant-detector.js` | Track join/leave events | People Panel DOM observation |
| `chat-monitor.js` | Detect chat messages | Chat panel DOM observation |
| `reaction-detector.js` | Detect emoji reactions | Toast notifications + video tiles |
| `hand-raise-detector.js` | Detect raised hands | Raised hands section in People Panel |
| `media-state-detector.js` | Detect mic unmute events | People Panel button states |
| `screen-share-detector.js` | Detect screen sharing | Auxiliary functionality |
| `url-monitor.js` | Detect meeting URL | URL change observation |
| `event-emitter.js` | Queue and send events | Message passing to service worker |
| `config.js` | DOM selectors and patterns | Static configuration |
| `state.js` | Shared state management | In-memory state |
| `utils.js` | Helper functions | ID generation, logging |
| `people-panel.js` | People panel interactions | DOM queries |
| `tracking-indicator.js` | Visual tracking indicator | DOM injection |
| `index.js` | Main entry point | Module coordination |

---

## 6. Offline-First Design

The extension implements an offline-first architecture to handle network interruptions:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OFFLINE-FIRST ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Participation Event Detected
              │
              ▼
    ┌─────────────────────┐
    │ Store in IndexedDB  │◄────────────────────────────────┐
    │ (Local first)       │                                 │
    └──────────┬──────────┘                                 │
               │                                            │
               ▼                                            │
    ┌─────────────────────┐                                 │
    │ Add to Sync Queue   │                                 │
    └──────────┬──────────┘                                 │
               │                                            │
               ▼                                            │
    ┌─────────────────────┐       ┌─────────────────────┐   │
    │ Try API Request     ├──────►│ Network Available?  │   │
    └─────────────────────┘       └──────────┬──────────┘   │
                                             │              │
                                  ┌──────────┴──────────┐   │
                                  │                     │   │
                                 YES                    NO  │
                                  │                     │   │
                                  ▼                     ▼   │
                        ┌─────────────────┐   ┌─────────────┴───┐
                        │ Send to Backend │   │ Keep in Queue   │
                        │ Remove from     │   │ Retry later     │
                        │ queue on success│   │ (exponential    │
                        └─────────────────┘   │  backoff)       │
                                              └─────────────────┘
```

---

## 7. Security Architecture

### 7.1 Security Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Transport** | HTTPS | Encrypted communication |
| **Authentication** | JWT + Extension Tokens | Identity verification |
| **Authorization** | Role-based (instructor/admin) | Access control |
| **API Protection** | Rate limiting | Prevent abuse |
| **Headers** | Helmet.js | XSS, CSRF, clickjacking protection |
| **Passwords** | bcrypt (10 salt rounds) | Secure password storage |
| **Tokens** | Cryptographic hashing | Extension token storage |

### 7.2 Data Access Control

```
    Request
       │
       ▼
┌──────────────────┐
│ flexibleAuth     │─────► Verify identity
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Controller       │─────► Verify ownership (class.instructor_id === req.user.id)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Database Query   │─────► Only return user's own data
└──────────────────┘
```

---

*This document describes the system architecture as implemented in the Engagium codebase as of December 2025.*
