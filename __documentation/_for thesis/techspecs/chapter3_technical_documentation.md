# Engagium System — Chapter 3 Technical Documentation
## Comprehensive Reference for Thesis Methodology

This document consolidates all technical documentation for Chapter 3 of the thesis, covering system architecture, development methodology, and risk assessment.

---

# Table of Contents

1. [System Development Methodology (Agile SDLC)](#1-system-development-methodology-agile-sdlc)
   - 1.1 [Requirements Analysis](#11-requirements-analysis)
   - 1.2 [System Design](#12-system-design)
   - 1.3 [Development](#13-development)
   - 1.4 [Testing](#14-testing)
   - 1.5 [Deployment](#15-deployment)
2. [System Architecture and Components](#2-system-architecture-and-components)
   - 2.1 [System Architecture Overview](#21-system-architecture-overview)
   - 2.2 [Module Descriptions](#22-module-descriptions)
   - 2.3 [Data Flow Diagrams](#23-data-flow-diagrams)
   - 2.4 [Technology Stack](#24-technology-stack)
   - 2.5 [Database Schema](#25-database-schema)
3. [System Development Progress](#3-system-development-progress)
   - 3.1 [Completed Components](#31-completed-components)
   - 3.2 [Components Under Development](#32-components-under-development)
   - 3.3 [Planned Enhancements](#33-planned-enhancements)
4. [Data Privacy and Ethical Considerations](#4-data-privacy-and-ethical-considerations)
5. [Testing Environment](#5-testing-environment)
6. [Limitations During Development and Testing](#6-limitations-during-development-and-testing)
7. [Risk Assessment and Mitigation](#7-risk-assessment-and-mitigation)

---

# 1. System Development Methodology (Agile SDLC)

The Engagium system was developed using an **Agile Software Development Life Cycle (SDLC)** methodology with iterative development cycles. This approach was chosen because:

- **Evolving Requirements:** Participation tracking requirements became clearer through iterative testing
- **Technical Uncertainty:** Google Meet's DOM structure required experimentation to understand
- **Stakeholder Feedback:** Regular feedback from potential users guided feature prioritization
- **Risk Management:** Early and frequent delivery allowed early detection of technical risks

## Development Phases Overview

```
    ┌─────────────────┐
    │ PHASE 1         │
    │ Requirements    │
    │ Analysis        │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ PHASE 2         │
    │ System Design   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ PHASE 3         │◄────►│ Iterative       │
    │ Development     │      │ Refinement      │
    └────────┬────────┘      └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ PHASE 4         │
    │ Testing         │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ PHASE 5         │
    │ Deployment      │
    └─────────────────┘
```

---

## 1.1 Requirements Analysis

### Problem Identification

The initial phase involved identifying the core problem:
- Instructors teaching online classes via Google Meet lack visibility into student participation
- Manual attendance tracking is time-consuming and error-prone
- Existing solutions do not provide real-time participation insights

### Stakeholder Analysis

**Primary Users:** College instructors conducting synchronous online classes via Google Meet

**User Needs Identified:**
- Automated attendance tracking with accurate timestamps
- Real-time visibility into student participation
- Historical data for attendance records and analytics
- Minimal setup and learning curve

### Functional Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| FR-01 | System shall automatically detect when participants join/leave a Google Meet session | Must Have |
| FR-02 | System shall record attendance with precise timestamps | Must Have |
| FR-03 | System shall calculate total duration per participant | Must Have |
| FR-04 | System shall allow instructors to manage class rosters | Must Have |
| FR-05 | System shall match participant names to enrolled students | Must Have |
| FR-06 | System shall provide a web dashboard for viewing attendance data | Must Have |
| FR-07 | System shall detect chat messages as participation events | Should Have |
| FR-08 | System shall detect reactions as participation events | Should Have |
| FR-09 | System shall detect hand raises as participation events | Should Have |
| FR-10 | System shall detect microphone activity as participation | Should Have |
| FR-11 | System shall provide real-time updates to the dashboard | Should Have |
| FR-12 | System shall support multiple classes per instructor | Must Have |
| FR-13 | System shall allow CSV import of student rosters | Should Have |
| FR-14 | System shall provide attendance analytics and reports | Could Have |

### Non-Functional Requirements

| Requirement ID | Description | Category |
|----------------|-------------|----------|
| NFR-01 | Extension shall not significantly impact browser performance | Performance |
| NFR-02 | Dashboard shall load within 3 seconds on standard broadband | Performance |
| NFR-03 | System shall handle network interruptions gracefully | Reliability |
| NFR-04 | System shall protect user data with encryption and authentication | Security |
| NFR-05 | Extension shall work on Chrome version 120 and above | Compatibility |
| NFR-06 | Dashboard shall be responsive for desktop use | Usability |
| NFR-07 | System shall not record audio or video content | Privacy |
| NFR-08 | System shall provide clear feedback on tracking status | Usability |

### Technical Constraints Identified

- Google Meet does not provide a public API for attendance data
- Browser extensions have limited access to page content
- Manifest V3 restrictions on background script execution
- Real-time updates require WebSocket infrastructure
- DOM-based detection is vulnerable to UI changes

---

## 1.2 System Design

### Architecture Design

The system was designed with a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PRESENTATION TIER                                     │
│   ┌─────────────────────┐              ┌─────────────────────┐                  │
│   │  Chrome Extension   │              │   Web Dashboard     │                  │
│   │  - Popup UI         │              │   - React SPA       │                  │
│   │  - Options Page     │              │   - Real-time UI    │                  │
│   └─────────────────────┘              └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION TIER                                      │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    Node.js + Express Backend                             │   │
│   │  - REST API  |  - WebSocket Server  |  - Authentication  |  - Logic     │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA TIER                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        PostgreSQL Database                               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Database Design

Entity-Relationship modeling identified the following core entities:
- **Users** (instructors)
- **Classes** (courses managed by instructors)
- **Students** (enrolled in classes)
- **Sessions** (class meetings)
- **Attendance Records** (final attendance status)
- **Attendance Intervals** (precise join/leave timestamps)
- **Participation Logs** (interaction events)

### Extension Architecture Design

The browser extension was designed with:
- **Service Worker:** Central coordinator (Manifest V3 requirement)
- **Content Scripts:** DOM interaction with Google Meet
- **Popup:** Quick session control interface
- **Options Page:** Authentication and settings

### API Design

RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication operations
- `/api/classes/*` - Class management
- `/api/sessions/*` - Session lifecycle
- `/api/participation/*` - Participation data

Real-time events via Socket.io with room-based broadcasting.

---

## 1.3 Development

Development followed an iterative approach with seven iterations:

| Iteration | Focus Area | Key Deliverables |
|-----------|------------|------------------|
| **1** | Foundation | Database schema, Express server, JWT authentication |
| **2** | Core CRUD | Class/student/session management, React dashboard |
| **3** | Extension Core | Manifest V3 structure, meeting detection, participant tracking |
| **4** | Attendance | Interval tracking, duration calculation, name matching |
| **5** | Real-Time | WebSocket integration, live broadcasting, dashboard updates |
| **6** | Participation | Chat, reaction, hand raise, mic toggle detection |
| **7** | Polish | Error handling, documentation, user experience refinements |

---

## 1.4 Testing

### Testing Strategy

| Test Type | Description | Status |
|-----------|-------------|--------|
| Unit Testing | Individual function testing | Planned |
| Integration Testing | API endpoint testing | Manual |
| System Testing | End-to-end functionality | Manual |
| Usability Testing | User experience evaluation | Planned |
| Accuracy Testing | Participation detection accuracy | In Progress |

### Accuracy Testing (Planned)

Participation detection accuracy will be measured by:
1. Conducting controlled test sessions
2. Manually recording actual events
3. Comparing with system-detected events
4. Calculating precision and recall metrics

---

## 1.5 Deployment

### Deployment Architecture

**Development Environment:**
- Frontend: localhost:5173 (Vite dev server)
- Backend: localhost:3000 (Node.js)
- Database: localhost:5432 (PostgreSQL)
- Extension: Unpacked load in Chrome

### Deployment Procedure

**Backend:** Set up Node.js environment → Configure environment variables → Initialize database → Run migrations → Start server

**Frontend:** Build production bundle → Serve static files → Configure API endpoint

**Extension:** Build extension → Load unpacked in Chrome → Configure settings → Authenticate

---

# 2. System Architecture and Components

## 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENGAGIUM SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────┐                      ┌──────────────────────┐        │
│   │   GOOGLE MEET TAB    │                      │   WEB DASHBOARD      │        │
│   │                      │                      │   (React SPA)        │        │
│   │  ┌────────────────┐  │                      │                      │        │
│   │  │ Content Scripts│  │                      │  - Live Feed         │        │
│   │  │ - Participant  │  │                      │  - Sessions          │        │
│   │  │   Detector     │  │                      │  - Analytics         │        │
│   │  │ - Chat Monitor │  │                      │  - Class Management  │        │
│   │  │ - Reaction     │  │                      │                      │        │
│   │  │   Detector     │  │                      └───────────┬──────────┘        │
│   │  │ - Hand Raise   │  │                                  │                   │
│   │  │ - Mic Detector │  │                                  │ HTTP + WebSocket  │
│   │  └───────┬────────┘  │                                  │                   │
│   └──────────┼───────────┘                                  │                   │
│              │ Message Passing                              │                   │
│              ▼                                              │                   │
│   ┌──────────────────────┐                                  │                   │
│   │   SERVICE WORKER     │──────────────────────────────────┤                   │
│   │   - Session Manager  │      HTTP + X-Extension-Token    │                   │
│   │   - API Client       │                                  │                   │
│   │   - Sync Queue       │                                  │                   │
│   └──────────────────────┘                                  │                   │
│                                                             │                   │
│                              ┌───────────────────────────────┘                   │
│                              │                                                   │
│                              ▼                                                   │
│              ┌───────────────────────────────────────┐                          │
│              │         BACKEND SERVER                 │                          │
│              │         (Node.js + Express)            │                          │
│              │                                        │                          │
│              │  ┌─────────────┐  ┌─────────────────┐ │                          │
│              │  │  REST API   │  │  Socket.io      │ │                          │
│              │  │  Endpoints  │  │  Server         │ │                          │
│              │  └──────┬──────┘  └────────┬────────┘ │                          │
│              │         └──────────┬───────┘          │                          │
│              └────────────────────┼──────────────────┘                          │
│                                   │                                              │
│                                   ▼                                              │
│              ┌───────────────────────────────────────┐                          │
│              │         POSTGRESQL DATABASE            │                          │
│              │  users | classes | students | sessions │                          │
│              │  attendance_records | attendance_intervals                        │
│              │  participation_logs | notifications                               │
│              └───────────────────────────────────────┘                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Dual Authentication System

The system uses two authentication methods:

1. **JWT Tokens (Web Dashboard):**
   - Access Token: 15 minutes, used for API requests
   - Refresh Token: 7 days, stored in database

2. **Extension Tokens (Browser Extension):**
   - Long-lived, no expiration until revoked
   - Stored securely in Chrome storage

**Flexible Auth Middleware:** Backend accepts either authentication method, enabling both web and extension access.

### Real-Time Communication

WebSocket (Socket.io) architecture:
- **Rooms:** `instructor:{userId}`, `session:{sessionId}`
- **Events:** `session:started`, `session:ended`, `participation:logged`, `attendance:updated`

---

## 2.2 Module Descriptions

### Module 1: Browser Extension

**Purpose:** Primary data collection interface for Google Meet participation tracking.

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Service Worker | `background/` | Main coordinator, session management, API communication |
| Content Scripts | `content/google-meet/` | DOM observation and event detection |
| Popup | `popup/` | Quick session control UI |
| Options Page | `options/` | Authentication and settings |

**Content Script Modules (14 total):**

| Module | Detection Target |
|--------|------------------|
| `participant-detector.js` | Join/leave events via People Panel |
| `chat-monitor.js` | Chat messages via Chat Panel |
| `reaction-detector.js` | Emoji reactions via toast notifications |
| `hand-raise-detector.js` | Hand raises via Raised Hands section |
| `media-state-detector.js` | Mic unmute events via button states |
| `url-monitor.js` | Meeting URL detection |
| `event-emitter.js` | Event queuing and transmission |
| `config.js` | DOM selectors and patterns |
| `state.js` | Shared state management |
| `utils.js` | Helper functions |
| `people-panel.js` | People panel queries |
| `tracking-indicator.js` | Visual tracking status |
| `screen-share-detector.js` | Screen share detection (auxiliary) |
| `index.js` | Module coordination |

### Module 2: Backend API Services

**Purpose:** REST endpoints and real-time communication hub.

| Controller | Endpoints | Responsibility |
|------------|-----------|----------------|
| `authController` | `/auth/*` | Registration, login, password reset, profile |
| `classController` | `/classes/*` | Class CRUD, meeting links, exemptions |
| `sessionController` | `/sessions/*` | Session lifecycle, live events, attendance |
| `studentController` | `/students/*` | Student CRUD, CSV import, bulk operations |
| `participationController` | `/participation/*` | Log and retrieve participation events |
| `studentTagController` | `/tags/*` | Tag management |
| `studentNoteController` | `/notes/*` | Student notes |
| `notificationController` | `/notifications/*` | System notifications |
| `extensionTokenController` | `/extension-tokens/*` | Token management |

### Module 3: Participation Logging Engine

**Purpose:** Detect, process, and store participation events.

| Event Type | Code | Detection Source | Database Table |
|------------|------|------------------|----------------|
| Attendance | `attendance` | People Panel | `attendance_records`, `attendance_intervals` |
| Chat | `chat` | Chat Panel | `participation_logs` |
| Reaction | `reaction` | Toast notifications | `participation_logs` |
| Hand Raise | `hand_raise` | Raised Hands section | `participation_logs` |
| Mic Unmute | `mic_toggle` | People Panel buttons | `participation_logs` |

### Module 4: Analytics Engine

**Purpose:** Calculate metrics and aggregate data for instructor insights.

| Metric | Calculation |
|--------|-------------|
| Attendance Rate | (Present + Late) / Total Students × 100 |
| Average Duration | Sum(duration) / Count(participants) |
| On-time Rate | Present / (Present + Late) × 100 |
| Active Participation Rate | Students with ≥1 interaction / Total present |

### Module 5: Web Dashboard

**Purpose:** Instructor interface for viewing and managing class data.

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Public page with login/register |
| Home | `/home` | Dashboard overview |
| Live Feed | `/live-feed` | Real-time event display |
| My Classes | `/classes` | Class management |
| Class Details | `/classes/:id` | Individual class view |
| Sessions | `/sessions` | Session history |
| Session Detail | `/sessions/:id` | Attendance and participation |
| Analytics | `/analytics` | Metrics and trends |
| Settings | `/settings` | Profile and tokens |
| Notifications | `/notifications` | System alerts |

---

## 2.3 Data Flow Diagrams

### Session Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SESSION LIFECYCLE DATA FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: MEETING DETECTION
    Instructor opens Google Meet
              │
              ▼
    URL Monitor detects meet.google.com/* → Extracts meeting ID
              │
              ▼
    Service Worker checks meeting URL against class links
              │
        Found match? ──► Ready to track


PHASE 2: SESSION START
    Instructor clicks "Start Session" in popup
              │
              ▼
    Service Worker POST /sessions/start-from-meeting
              │
              ▼
    Backend creates session (status: 'active') → Broadcasts session:started
              │
              ▼
    Dashboard shows new active session


PHASE 3: PARTICIPANT TRACKING
    People Panel DOM changes detected
              │
              ▼
    Participant Detector compares current vs tracked
              │
         ┌────┴────┐
         │         │
    NEW JOIN    LEAVE
         │         │
         ▼         ▼
    POST /attendance/join    POST /attendance/leave
         │                        │
         ▼                        ▼
    Create interval         Close interval
    (joined_at = NOW)       (left_at = NOW)
         │                        │
         └──────────┬─────────────┘
                    ▼
    Socket broadcast → Dashboard updates


PHASE 4: SESSION END
    Instructor clicks "End Session" OR leaves meeting
              │
              ▼
    PUT /sessions/:id/end-with-timestamp
              │
              ▼
    Backend: Close all open intervals → Calculate durations → Mark absents
              │
              ▼
    Socket broadcast session:ended → Dashboard moves to history
```

### Participation Event Flow

```
    Google Meet DOM Event
              │
              ▼
    Detector Module (MutationObserver)
    - Parse DOM
    - Extract data
    - Deduplicate
              │
              ▼
    Event Emitter → Queue locally
              │
              ▼
    Service Worker
    - Store in IndexedDB
    - Match to student
    - POST /sessions/:id/live-event
              │
              ▼
    Backend
    - Validate event
    - INSERT participation_logs
    - Socket broadcast
              │
              ▼
    Dashboard Live Feed → Real-time display
```

### Attendance Interval Tracking

```
SCENARIO: Student joins at 10:00, leaves at 10:30, rejoins at 10:45, session ends at 11:00

Step 1: Join (10:00)
    INSERT attendance_records (status: present, first_joined_at: 10:00)
    INSERT attendance_intervals (joined_at: 10:00, left_at: NULL)

Step 2: Leave (10:30)
    UPDATE attendance_intervals SET left_at = 10:30
    UPDATE attendance_records (last_left_at: 10:30, duration: 30 min)

Step 3: Rejoin (10:45)
    INSERT attendance_intervals (joined_at: 10:45, left_at: NULL)

Step 4: Session End (11:00)
    UPDATE all open intervals SET left_at = 11:00
    Recalculate total duration: 30 + 15 = 45 minutes
    UPDATE attendance_records (duration: 45 min)
    INSERT absent records for students not in attendance

RESULT:
┌─────────────────────────────────────────────────────────────────┐
│ attendance_intervals                                             │
├──────────────────┬────────────┬────────────┬────────────────────┤
│ participant_name │ joined_at  │ left_at    │ duration           │
├──────────────────┼────────────┼────────────┼────────────────────┤
│ Juan Dela Cruz   │ 10:00      │ 10:30      │ 30 min             │
│ Juan Dela Cruz   │ 10:45      │ 11:00      │ 15 min             │
├──────────────────┴────────────┴────────────┼────────────────────┤
│                                      TOTAL │ 45 min             │
└─────────────────────────────────────────────┴────────────────────┘
```

---

## 2.4 Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x+ | JavaScript runtime |
| Express.js | 4.18.0 | REST API framework |
| Socket.io | 4.6.0 | Real-time WebSocket |
| PostgreSQL (pg) | 8.8.0 | Database driver |
| JSON Web Tokens | 9.0.0 | Authentication |
| bcrypt | 5.1.0 | Password hashing |
| Helmet | 6.0.0 | Security headers |
| express-rate-limit | 6.7.0 | Rate limiting |
| Multer | 2.0.2 | File uploads |
| Nodemailer | 7.0.10 | Email sending |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI library |
| Vite | 6.1.0 | Build tool |
| React Router DOM | 6.8.0 | Client routing |
| TanStack React Query | 4.24.0 | Server state |
| React Hook Form | 7.43.0 | Form handling |
| Axios | 1.3.0 | HTTP client |
| Socket.io Client | 4.8.1 | WebSocket client |
| Tailwind CSS | 3.3.0 | Styling |
| Heroicons | 2.0.18 | Icons |

### Browser Extension

| Technology | Version | Purpose |
|------------|---------|---------|
| Chrome Manifest V3 | 3 | Extension platform |
| React | 18.2.0 | Popup/Options UI |
| Vite | 7.2.4 | Extension bundler |
| idb (IndexedDB) | 7.1.1 | Local storage |
| date-fns | 2.30.0 | Date utilities |
| uuid | 9.0.0 | ID generation |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL 14+ | Relational database |
| uuid-ossp extension | Native UUID generation |
| ENUM types | Type-safe status fields |
| JSONB | Flexible data storage |
| Triggers | Automatic timestamp updates |

---

## 2.5 Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK: id (UUID)   │
│    email        │
│    password_hash│
│    role         │──────────────────────────────────────────────────────┐
└────────┬────────┘                                                       │
         │ 1:N                                                            │
         ▼                                                                │
┌─────────────────┐                                                       │
│    CLASSES      │                                                       │
│─────────────────│                                                       │
│ PK: id          │                                                       │
│ FK: instructor_id                                                       │
│    name, section│                                                       │
└────────┬────────┘                                                       │
         │                                                                │
    ┌────┼────┬────────────┬────────────┬─────────────┐                   │
    │    │    │            │            │             │                   │
    ▼    ▼    ▼            ▼            ▼             │                   │
┌──────┐┌──────┐┌──────────┐┌──────────┐┌───────────┐ │                   │
│STUD- ││SESS- ││SESSION   ││EXEMPTED  ││STUDENT    │ │                   │
│ENTS  ││IONS  ││LINKS     ││ACCOUNTS  ││TAGS       │ │                   │
└──┬───┘└──┬───┘└──────────┘└──────────┘└─────┬─────┘ │                   │
   │       │                                  │       │                   │
   │       │ 1:N                              │ 1:N   │                   │
   │       │                                  ▼       │                   │
   │  ┌────┴────────────────┐         ┌───────────┐   │                   │
   │  │                     │         │TAG_ASSIGN-│   │                   │
   │  ▼                     ▼         │MENTS      │◄──┘                   │
   │┌─────────────┐  ┌─────────────┐  └───────────┘                       │
   ││ATTENDANCE   │  │ATTENDANCE   │                                      │
   ││RECORDS      │  │INTERVALS    │                                      │
   │└─────────────┘  └─────────────┘                                      │
   │       │                                                              │
   │       │                        ┌─────────────────┐                   │
   │       └───────────────────────►│PARTICIPATION    │                   │
   │                                │LOGS             │◄──────────────────┘
   │                                └─────────────────┘                   │
   │                                                                      │
   │  ┌─────────────────┐           ┌─────────────────┐                   │
   └─►│STUDENT_NOTES    │           │NOTIFICATIONS    │◄──────────────────┘
      └─────────────────┘           └─────────────────┘
```

### Tables Summary (13 Total)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Instructor accounts | email, password_hash, role |
| `classes` | Course information | name, section, schedule, status |
| `students` | Enrolled students | full_name, student_id |
| `sessions` | Class meetings | title, status, started_at, ended_at |
| `attendance_records` | Final attendance | status, total_duration_minutes |
| `attendance_intervals` | Join/leave cycles | joined_at, left_at |
| `participation_logs` | Interaction events | interaction_type, timestamp |
| `session_links` | Meeting URLs | link_url, link_type, is_primary |
| `exempted_accounts` | Excluded accounts | account_identifier, reason |
| `student_tags` | Tag definitions | tag_name, tag_color |
| `student_tag_assignments` | Tag assignments | student_id, tag_id |
| `student_notes` | Student notes | note_text, created_at |
| `notifications` | System alerts | type, title, message, read |

### Custom ENUM Types

```sql
CREATE TYPE user_role AS ENUM ('instructor', 'admin');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'ended');
CREATE TYPE interaction_type AS ENUM (
  'manual_entry', 'chat', 'reaction', 
  'mic_toggle', 'camera_toggle', 'platform_switch', 'hand_raise'
);
```

---

# 3. System Development Progress

## 3.1 Completed Components

| Category | Features | Status |
|----------|----------|--------|
| **Authentication** | Registration, login, JWT, refresh tokens, password reset, extension tokens | ✅ Complete |
| **Class Management** | CRUD, scheduling, archive/activate, meeting links, exemptions | ✅ Complete |
| **Student Management** | CRUD, CSV import, bulk operations, tagging, notes | ✅ Complete |
| **Session Lifecycle** | Start/end from extension, status tracking, history, calendar | ✅ Complete |
| **Attendance Tracking** | Join/leave detection, intervals, duration calculation, absent marking | ✅ Complete |
| **Real-Time Communication** | WebSocket server, rooms, event broadcasting | ✅ Complete |
| **Browser Extension** | Manifest V3, meeting detection, popup, options, offline storage | ✅ Complete |
| **Web Dashboard** | 12 pages, responsive design, real-time updates | ✅ Complete |

## 3.2 Components Under Development

| Component | Status | Known Limitations |
|-----------|--------|-------------------|
| **Chat Detection** | 🔄 Code exists | Chat Panel must be open |
| **Reaction Detection** | 🔄 Code exists | Relies on toast notifications |
| **Hand Raise Detection** | 🔄 Code exists | People Panel must be open |
| **Mic Toggle Detection** | 🔄 Code exists | Only detects unmute events |

**Validation Needed:** Field testing to verify accuracy across different meeting scenarios.

## 3.3 Planned Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| CSV Export | High | Export attendance/participation to CSV |
| Attendance Trends | High | Line charts over time |
| Participation Heatmaps | Medium | Visual engagement patterns |
| Session Summaries | Medium | Auto-generated recaps |
| Zoom Integration | Medium | Extend to Zoom meetings |
| Email Notifications | Medium | Session reminders |
| API Documentation | Medium | OpenAPI/Swagger docs |
| Microsoft Teams | Low | Extend to Teams meetings |

---

# 4. Data Privacy and Ethical Considerations

## Data Collected

| Data Type | Storage | Purpose | Access |
|-----------|---------|---------|--------|
| Participant names | `attendance_records` | Attendance tracking | Instructor only |
| Join/leave timestamps | `attendance_intervals` | Duration calculation | Instructor only |
| Chat message text | `participation_logs` | Participation evidence | Instructor only |
| Reaction type | `participation_logs` | Participation tracking | Instructor only |
| Event timestamps | All tables | Activity timeline | Instructor only |

## Data NOT Collected

| Data Type | Reason |
|-----------|--------|
| **Audio streams** | Privacy - not captured by extension |
| **Video streams** | Privacy - not captured by extension |
| **Screen share content** | Privacy - only detects share state |
| **Private messages** | Only visible in-call messages |
| **Student passwords** | Students do not have accounts |

## Data Isolation

- Each instructor can only access their own classes
- Backend verifies `instructor_id === req.user.id` on every request
- Extension tokens scoped to individual users
- No cross-instructor data access possible

## Security Measures

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS encryption |
| Authentication | JWT + Extension tokens |
| Passwords | bcrypt with salt |
| API | Rate limiting |
| Headers | Helmet.js security headers |

---

# 5. Testing Environment

## Hardware Environment

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Processor | Intel i3 / AMD equivalent | Intel i5 or better |
| RAM | 4 GB | 8 GB |
| Storage | 500 MB free | 1 GB free |
| Display | 1280×720 | 1920×1080 |

## Software Environment

| Component | Requirement |
|-----------|-------------|
| Operating System | Windows 10/11, macOS 10.15+, Ubuntu 20.04+ |
| Browser | Google Chrome 120 or later |
| Node.js | Version 18.x or 20.x LTS |
| PostgreSQL | Version 14 or later |
| npm | Version 9.x or 10.x |

## Network Environment

| Requirement | Specification |
|-------------|---------------|
| Internet Connection | Stable broadband (5 Mbps+) |
| Latency | < 200ms to server |
| Firewall | Allow WebSocket connections |
| Proxy | Direct connection preferred |

---

# 6. Limitations During Development and Testing

## Browser Restrictions

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Service worker suspension | May miss events during long idle | Keep-alive mechanisms |
| Content script isolation | Limited DOM access | ARIA-based selectors |
| Storage quotas | IndexedDB limits | Periodic cleanup |
| Background throttling | Reduced performance | Efficient batching |

## Platform Dependency

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Google Meet DOM changes | Detection may fail | Modular selectors, monitoring |
| People Panel required | Miss events if closed | User guidance |
| Chat Panel required | Miss chat if closed | User guidance |
| Meeting UI variations | Inconsistent detection | Multiple fallback methods |

## Sample Size Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Limited faculty testers | Reduced statistical validity | Appropriate statistical methods |
| Single institution | Limited generalizability | Document limitations |
| Short testing period | May miss edge cases | Extended monitoring |

---

# 7. Risk Assessment and Mitigation

## Risk Matrix

| Risk ID | Risk | Likelihood | Impact | Level | Mitigation |
|---------|------|------------|--------|-------|------------|
| R01 | Google Meet UI changes | High | High | **Critical** | Modular selectors, monitoring, fallbacks |
| R02 | Chrome extension API changes | Medium | High | **High** | Use stable APIs, monitor releases |
| R03 | Browser throttling | Medium | Medium | **Medium** | Keep-alive, content script priority |
| R04 | Network connectivity issues | Medium | Medium | **Medium** | Offline-first, sync queue, retry |
| R05 | Incomplete participation detection | High | Medium | **High** | Document requirements, user guidance |
| R06 | Name matching inaccuracies | Medium | Low | **Low** | Fuzzy matching, manual correction |
| R07 | Database performance | Low | High | **Medium** | Indexing, pagination, optimization |
| R08 | Token compromise | Low | High | **Medium** | Short-lived tokens, HTTPS, revocation |
| R09 | WebSocket instability | Medium | Medium | **Medium** | Auto-reconnect, status indicators |
| R10 | Limited test sample | High | Medium | **High** | Maximize participation, document limits |
| R11 | Time constraints | Medium | Medium | **Medium** | MVP approach, prioritization |
| R12 | Cross-browser issues | Medium | Low | **Low** | Focus on Chrome, document requirements |

## Contingency Plans

**If Google Meet DOM changes:**
1. Pause tracking temporarily
2. Analyze new structure
3. Update selectors
4. Test and re-enable

**If extension token compromised:**
1. Revoke all tokens
2. Generate new token
3. Re-authenticate

**If participation detection fails:**
1. Fall back to attendance-only
2. Provide manual entry option
3. Update detection logic

---

# Summary

This comprehensive documentation covers all technical aspects of the Engagium system for Chapter 3 of the thesis:

| Section | Chapter Reference | Content |
|---------|-------------------|---------|
| Agile SDLC Methodology | 3.2 | 5 phases, 7 iterations, requirements |
| System Architecture | 3.3.1 | Three-tier design, dual auth, WebSocket |
| Module Descriptions | 3.3.2 | 5 modules, 14 content scripts, 9 controllers |
| Data Flow Diagrams | 3.3.3 | Session lifecycle, participation, attendance |
| Technology Stack | 3.3.4 | Backend, frontend, extension, database |
| Database Schema | 3.3.2 | 13 tables, 3 ENUMs, ER diagram |
| Development Progress | 3.4 | Completed, under development, planned |
| Data Privacy | 3.8 | Collected vs not collected, security |
| Testing Environment | 3.10 | Hardware, software, network requirements |
| Limitations | 3.11 | Browser, platform, sample size |
| Risk Assessment | 3.12 | 12 risks with mitigation strategies |

---

*This consolidated document reflects the Engagium system as of December 2025.*
