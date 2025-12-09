# APPENDIX A  
DIAGRAMS AND SYSTEM MODELS

This appendix presents the key diagrams and system models used to illustrate the architecture, data flows, and functional decomposition of the ENGAGIUM system.

---

## A.1 Context Diagram

The context diagram shows ENGAGIUM as a single process interacting with external entities.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ENGAGIUM CONTEXT DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   INSTRUCTOR    │
                              │    (User)       │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌─────────────────┐  ┌───────────────┐  ┌───────────────────┐
         │ Web Dashboard   │  │ Chrome        │  │ Class Roster      │
         │ (View Data)     │  │ Extension     │  │ (CSV Import)      │
         └────────┬────────┘  │ (Install/Use) │  └─────────┬─────────┘
                  │           └───────┬───────┘            │
                  │                   │                    │
                  └───────────────────┼────────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │                        │
                         │       ENGAGIUM         │
                         │  Participation         │
                         │  Tracking System       │
                         │                        │
                         └────────────┬───────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
   │  GOOGLE MEET    │      │   PostgreSQL    │      │  Email Service  │
   │  (DOM Events)   │      │   DATABASE      │      │  (Nodemailer)   │
   └─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Description:**

The ENGAGIUM system interacts with the following external entities:

| Entity | Role | Data Flow |
|--------|------|-----------|
| **Instructor** | Primary user who manages classes, views attendance, and monitors participation | Inputs: credentials, class data, session commands; Outputs: dashboards, reports, analytics |
| **Google Meet** | Video conferencing platform from which participation events are detected | Inputs: DOM events (join/leave, chat, reactions, hand raise, mic toggle) |
| **PostgreSQL Database** | Persistent storage for all system data | Inputs/Outputs: users, classes, students, sessions, attendance, participation logs |
| **Email Service** | External service for password reset and notifications | Outputs: password reset emails |

---

## A.2 Level-0 Data Flow Diagram (Exploded Diagram)

The Level-0 DFD decomposes the ENGAGIUM system into its major processes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ENGAGIUM LEVEL-0 DFD                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌───────────────┐                                         ┌───────────────┐
    │  INSTRUCTOR   │                                         │  GOOGLE MEET  │
    └───────┬───────┘                                         └───────┬───────┘
            │                                                         │
            │ Login credentials                                       │ DOM events
            │ Class/student data                                      │ (join, leave,
            │ Session commands                                        │  chat, reactions,
            ▼                                                         │  hand raise, mic)
    ┌───────────────────┐                                             │
    │                   │                                             │
    │  1.0 AUTHENTICATE │                                             │
    │  & AUTHORIZE      │                                             │
    │                   │                                             │
    └─────────┬─────────┘                                             │
              │                                                       │
              │ User ID, tokens                                       │
              ▼                                                       ▼
    ┌───────────────────┐                               ┌───────────────────┐
    │                   │                               │                   │
    │  2.0 MANAGE       │                               │  4.0 DETECT       │
    │  CLASSES &        │                               │  PARTICIPATION    │
    │  STUDENTS         │                               │  EVENTS           │
    │                   │                               │                   │
    └─────────┬─────────┘                               └─────────┬─────────┘
              │                                                   │
              │ Class/student records                             │ Event data
              ▼                                                   ▼
    ┌───────────────────┐                               ┌───────────────────┐
    │                   │◄──────────────────────────────│                   │
    │  3.0 MANAGE       │      Session context          │  5.0 PROCESS &    │
    │  SESSIONS         │──────────────────────────────►│  STORE EVENTS     │
    │                   │                               │                   │
    └─────────┬─────────┘                               └─────────┬─────────┘
              │                                                   │
              │ Session records                                   │ Attendance &
              │                                                   │ participation logs
              ▼                                                   ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                                                                          │
    │                           D1: DATABASE                                   │
    │    (users, classes, students, sessions, attendance, participation)       │
    │                                                                          │
    └─────────────────────────────────────────────────────────────────────────┘
              │
              │ Aggregated data
              ▼
    ┌───────────────────┐
    │                   │
    │  6.0 GENERATE     │─────────────────────────────►  Reports, Analytics
    │  REPORTS &        │                                to Instructor
    │  ANALYTICS        │
    │                   │
    └───────────────────┘
```

**Process Descriptions:**

| Process | Description |
|---------|-------------|
| **1.0 Authenticate & Authorize** | Handles user registration, login, JWT token generation, refresh tokens, password reset, and extension token authentication |
| **2.0 Manage Classes & Students** | CRUD operations for classes, student roster management, CSV import, student tagging, exempted accounts |
| **3.0 Manage Sessions** | Session lifecycle (create, start, end), meeting link association, session scheduling |
| **4.0 Detect Participation Events** | Browser extension content scripts observe Google Meet DOM for participant join/leave, chat messages, reactions, hand raises, and microphone toggles |
| **5.0 Process & Store Events** | Backend receives events, matches participants to enrolled students, stores attendance intervals and participation logs |
| **6.0 Generate Reports & Analytics** | Aggregates attendance durations, calculates participation metrics, presents data on dashboard |

---

## A.3 Program Flowchart

The following flowchart illustrates the main operational flow during a live session.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENGAGIUM SESSION TRACKING FLOWCHART                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │  START  │
                                    └────┬────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Instructor opens    │
                              │ Google Meet         │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Extension detects   │
                              │ meeting URL         │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Instructor clicks   │
                              │ "Start Session"     │
                              │ in extension popup  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Extension sends     │
                              │ start request to    │
                              │ backend API         │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Backend creates     │
                              │ session record      │
                              │ (status: active)    │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Content scripts     │
                              │ begin DOM           │
                              │ observation         │
                              └──────────┬──────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │         DETECTION LOOP                 │
                    │  (Runs continuously during session)    │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
    │ Participant     │        │ Participation   │        │ Participant     │
    │ JOINS meeting   │        │ EVENT detected  │        │ LEAVES meeting  │
    │                 │        │ (chat, reaction,│        │                 │
    │                 │        │  hand, mic)     │        │                 │
    └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
             │                          │                          │
             ▼                          ▼                          ▼
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
    │ Send join event │        │ Send event to   │        │ Send leave event│
    │ to service      │        │ service worker  │        │ to service      │
    │ worker          │        │                 │        │ worker          │
    └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │ Service worker      │
                              │ sends to backend    │
                              │ (HTTP + WebSocket)  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Backend stores in   │
                              │ database:           │
                              │ - attendance_       │
                              │   intervals         │
                              │ - participation_    │
                              │   logs              │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ WebSocket broadcasts│
                              │ to dashboard        │
                              │ (real-time update)  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Dashboard displays  │
                              │ live feed           │
                              └──────────┬──────────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │ Session      │
                                 │ ended?       │
                                 └──────┬───────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                         NO                          YES
                          │                           │
                          │                           ▼
                          │                 ┌─────────────────────┐
                          │                 │ Instructor clicks   │
                          │                 │ "End Session"       │
                          │                 └──────────┬──────────┘
                          │                            │
                          │                            ▼
                          │                 ┌─────────────────────┐
                          │                 │ Backend:            │
                          │                 │ - Closes open       │
                          │                 │   intervals         │
                          │                 │ - Calculates total  │
                          │                 │   durations         │
                          │                 │ - Marks absent      │
                          │                 │   students          │
                          │                 │ - Updates session   │
                          │                 │   status: ended     │
                          │                 └──────────┬──────────┘
                          │                            │
                          │                            ▼
                          │                 ┌─────────────────────┐
                          │                 │ Final attendance    │
                          │                 │ records available   │
                          │                 │ on dashboard        │
                          │                 └──────────┬──────────┘
                          │                            │
                          └───────►(loop)              ▼
                                                 ┌─────────┐
                                                 │   END   │
                                                 └─────────┘
```

**Key Points:**

1. **Extension Tier**: Detects meeting URL, observes DOM, sends events via message passing
2. **Backend Tier**: Receives events, stores in PostgreSQL, broadcasts via WebSocket
3. **Frontend Tier**: Subscribes to WebSocket rooms, displays real-time updates
4. **Session End**: Triggers duration calculation and absent marking

---

## A.4 Visual Table of Contents (VTOC) Diagram

The VTOC diagram presents a hierarchical decomposition of the ENGAGIUM system modules.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENGAGIUM VTOC DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                                 ┌──────────────────┐
                                 │    ENGAGIUM      │
                                 │     SYSTEM       │
                                 │     (0.0)        │
                                 └────────┬─────────┘
                                          │
        ┌─────────────┬───────────────────┼───────────────────┬─────────────┐
        │             │                   │                   │             │
        ▼             ▼                   ▼                   ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   BROWSER    │ │   BACKEND    │ │     WEB      │ │   DATABASE   │ │   REAL-TIME  │
│  EXTENSION   │ │     API      │ │  DASHBOARD   │ │    LAYER     │ │ COMMUNICATION│
│    (1.0)     │ │    (2.0)     │ │    (3.0)     │ │    (4.0)     │ │    (5.0)     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │                │
       │                │                │                │                │
  ┌────┴────┐      ┌────┴────┐      ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
  │         │      │         │      │         │      │         │      │         │
  ▼         ▼      ▼         ▼      ▼         ▼      ▼         ▼      ▼         ▼

┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│Content││Service││ Auth  ││Class  ││ Auth  ││ Class ││ Users ││Classes││Socket ││WebSock│
│Scripts││Worker ││Module ││Module ││ Pages ││ Pages ││ Table ││ Table ││  IO   ││Context│
│(1.1)  ││(1.2)  ││(2.1)  ││(2.2)  ││(3.1)  ││(3.2)  ││(4.1)  ││(4.2)  ││Server ││(5.2)  │
└───┬───┘└───┬───┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘│(5.1)  │└───────┘
    │        │                                                          └───────┘
    │        │
┌───┴───┐┌───┴───┐
│Popup  ││Options│
│UI     ││Page   │
│(1.3)  ││(1.4)  │
└───────┘└───────┘
```

**Module Hierarchy:**

| Level 0 | Level 1 | Level 2 | Description |
|---------|---------|---------|-------------|
| 0.0 Engagium System | | | Root system |
| | 1.0 Browser Extension | | Chrome extension (Manifest V3) |
| | | 1.1 Content Scripts | DOM observation modules for Google Meet |
| | | 1.2 Service Worker | Background coordinator, API client, sync queue |
| | | 1.3 Popup UI | Quick session control interface |
| | | 1.4 Options Page | Authentication and settings |
| | 2.0 Backend API | | Node.js + Express server |
| | | 2.1 Auth Module | JWT, refresh tokens, extension tokens |
| | | 2.2 Class Module | Classes, students, tags, notes |
| | | 2.3 Session Module | Session lifecycle, attendance |
| | | 2.4 Participation Module | Event logging and retrieval |
| | 3.0 Web Dashboard | | React SPA |
| | | 3.1 Auth Pages | Login, register, password reset |
| | | 3.2 Class Pages | Class management, student roster |
| | | 3.3 Session Pages | Session history, live feed, details |
| | | 3.4 Analytics Pages | Participation metrics, reports |
| | 4.0 Database Layer | | PostgreSQL |
| | | 4.1–4.7 Tables | users, classes, students, sessions, attendance_records, attendance_intervals, participation_logs |
| | 5.0 Real-Time Communication | | Socket.io |
| | | 5.1 Socket Server | Room management, event broadcasting |
| | | 5.2 WebSocket Context | Frontend subscription and state updates |

---

## A.5 Input-Process-Output (IPO) Diagram

The IPO diagram summarizes the main inputs, processing activities, and outputs of the ENGAGIUM system.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ENGAGIUM IPO DIAGRAM                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐    ┌─────────────────────────────┐    ┌─────────────────────┐
│       INPUTS        │    │         PROCESSING          │    │       OUTPUTS       │
├─────────────────────┤    ├─────────────────────────────┤    ├─────────────────────┤
│                     │    │                             │    │                     │
│ • Instructor        │    │ 1. User Authentication      │    │ • Attendance        │
│   credentials       │───►│    - Validate credentials   │───►│   records with      │
│   (email, password) │    │    - Generate JWT tokens    │    │   precise durations │
│                     │    │    - Manage sessions        │    │                     │
├─────────────────────┤    ├─────────────────────────────┤    ├─────────────────────┤
│                     │    │                             │    │                     │
│ • Class information │    │ 2. Class & Student Mgmt     │    │ • Student roster    │
│   (name, section,   │───►│    - Store class details    │───►│   with matched      │
│   schedule)         │    │    - Manage student roster  │    │   attendance        │
│                     │    │    - Handle CSV imports     │    │                     │
├─────────────────────┤    ├─────────────────────────────┤    ├─────────────────────┤
│                     │    │                             │    │                     │
│ • Student roster    │    │ 3. Session Management       │    │ • Session history   │
│   (names, IDs via   │───►│    - Create/start sessions  │───►│   with status and   │
│   CSV import)       │    │    - Track session state    │    │   timestamps        │
│                     │    │    - End and finalize       │    │                     │
├─────────────────────┤    ├─────────────────────────────┤    ├─────────────────────┤
│                     │    │                             │    │                     │
│ • Google Meet DOM   │    │ 4. Event Detection          │    │ • Participation     │
│   events:           │───►│    - Observe People Panel   │───►│   logs (chat,       │
│   - Participant     │    │    - Monitor chat panel     │    │   reactions, hand   │
│     join/leave      │    │    - Detect reactions/hands │    │   raises, mic)      │
│   - Chat messages   │    │    - Track mic toggles      │    │                     │
│   - Reactions       │    │                             │    │                     │
│   - Hand raises     │    ├─────────────────────────────┤    ├─────────────────────┤
│   - Mic toggles     │    │                             │    │                     │
│                     │    │ 5. Data Processing          │    │ • Real-time         │
├─────────────────────┤    │    - Match participant      │    │   dashboard         │
│                     │───►│      names to students      │───►│   updates via       │
│ • Meeting URL       │    │    - Calculate durations    │    │   WebSocket         │
│   (Google Meet      │    │    - Mark absent students   │    │                     │
│   link)             │    │    - Deduplicate events     │    │                     │
│                     │    │                             │    │                     │
├─────────────────────┤    ├─────────────────────────────┤    ├─────────────────────┤
│                     │    │                             │    │                     │
│ • Session commands  │    │ 6. Report Generation        │    │ • Analytics and     │
│   (start, end)      │───►│    - Aggregate metrics      │───►│   engagement        │
│                     │    │    - Generate summaries     │    │   summaries         │
│                     │    │    - Prepare export data    │    │                     │
│                     │    │                             │    │ • Exportable        │
│                     │    │                             │    │   reports (CSV)     │
└─────────────────────┘    └─────────────────────────────┘    └─────────────────────┘
```

**IPO Summary Table:**

| Category | Input | Process | Output |
|----------|-------|---------|--------|
| **Authentication** | Email, password, extension token | Validate, generate JWT, verify tokens | Access tokens, authenticated session |
| **Class Management** | Class details, CSV roster | Store, validate, deduplicate | Class records, student list |
| **Session Lifecycle** | Start/end commands, meeting URL | Create session, update status, finalize | Session records with timestamps |
| **Attendance Tracking** | Join/leave DOM events | Record intervals, calculate duration, match students | Attendance records with total minutes |
| **Participation Logging** | Chat, reaction, hand, mic events | Deduplicate, store with timestamp | Participation logs by type |
| **Real-Time Updates** | All events | Broadcast via WebSocket | Live dashboard updates |
| **Analytics** | Stored attendance and participation | Aggregate, summarize | Metrics, reports |
