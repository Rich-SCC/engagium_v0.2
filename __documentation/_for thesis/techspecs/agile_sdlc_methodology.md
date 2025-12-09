# Agile SDLC Methodology
## Engagium System - Chapter 3.2 Reference

This document describes how the Engagium system was developed following an Agile Software Development Life Cycle (SDLC) approach.

---

## Overview

The Engagium system was developed using an **Agile SDLC methodology** with iterative development cycles. This approach was chosen because:

1. **Evolving Requirements:** Participation tracking requirements became clearer through iterative testing
2. **Technical Uncertainty:** Google Meet's DOM structure required experimentation to understand
3. **Stakeholder Feedback:** Regular feedback from potential users guided feature prioritization
4. **Risk Management:** Early and frequent delivery allowed early detection of technical risks

---

## Development Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AGILE SDLC PHASES - ENGAGIUM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

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

## Phase 1: Requirements Analysis

### 1.1 Problem Identification

The initial phase involved identifying the core problem:
- Instructors teaching online classes via Google Meet lack visibility into student participation
- Manual attendance tracking is time-consuming and error-prone
- Existing solutions do not provide real-time participation insights

### 1.2 Stakeholder Analysis

**Primary Users:**
- College instructors conducting synchronous online classes
- Faculty using Google Meet as their primary video conferencing platform

**User Needs Identified:**
- Automated attendance tracking with accurate timestamps
- Real-time visibility into student participation
- Historical data for attendance records and analytics
- Minimal setup and learning curve

### 1.3 Functional Requirements

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

### 1.4 Non-Functional Requirements

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

### 1.5 Technical Constraints Identified

- Google Meet does not provide a public API for attendance data
- Browser extensions have limited access to page content
- Manifest V3 restrictions on background script execution
- Real-time updates require WebSocket infrastructure
- DOM-based detection is vulnerable to UI changes

---

## Phase 2: System Design

### 2.1 Architecture Design

The system was designed with a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE DESIGN                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            PRESENTATION TIER                                 │
    │                                                                              │
    │   ┌─────────────────────┐              ┌─────────────────────┐              │
    │   │  Chrome Extension   │              │   Web Dashboard     │              │
    │   │  - Popup UI         │              │   - React SPA       │              │
    │   │  - Options Page     │              │   - Real-time UI    │              │
    │   └─────────────────────┘              └─────────────────────┘              │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            APPLICATION TIER                                  │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │                    Node.js + Express Backend                         │   │
    │   │  - REST API                                                          │   │
    │   │  - WebSocket Server (Socket.io)                                      │   │
    │   │  - Authentication (JWT)                                              │   │
    │   │  - Business Logic                                                    │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                              DATA TIER                                       │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────────┐   │
    │   │                        PostgreSQL Database                           │   │
    │   │  - User accounts                                                     │   │
    │   │  - Class and student data                                            │   │
    │   │  - Session and attendance records                                    │   │
    │   │  - Participation logs                                                │   │
    │   └─────────────────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Database Design

Entity-Relationship modeling identified the following core entities:
- **Users** (instructors)
- **Classes** (courses managed by instructors)
- **Students** (enrolled in classes)
- **Sessions** (class meetings)
- **Attendance Records** (final attendance status)
- **Attendance Intervals** (precise join/leave timestamps)
- **Participation Logs** (interaction events)

Design decisions:
- UUID primary keys for security and distribution
- JSONB for flexible schedule storage
- Separate intervals table for precise duration tracking
- ENUM types for type-safe status fields

### 2.3 Extension Architecture Design

The browser extension was designed with:
- **Service Worker:** Central coordinator (Manifest V3 requirement)
- **Content Scripts:** DOM interaction with Google Meet
- **Popup:** Quick session control interface
- **Options Page:** Authentication and settings

Key design decisions:
- Modular detector pattern for different event types
- Message passing between components
- IndexedDB for offline-first data storage
- Sync queue for network resilience

### 2.4 API Design

RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication operations
- `/api/classes/*` - Class management
- `/api/sessions/*` - Session lifecycle
- `/api/participation/*` - Participation data

Real-time events via Socket.io:
- Room-based broadcasting (per instructor, per session)
- Event types for attendance and participation updates

### 2.5 UI/UX Design

Dashboard design principles:
- Clean, minimal interface focused on data
- Real-time updates without page refresh
- Mobile-responsive layout
- Consistent navigation patterns

Extension design principles:
- Non-intrusive presence
- Clear status indicators
- Minimal clicks for common actions

---

## Phase 3: Development

Development followed an iterative approach, building features incrementally.

### 3.1 Iteration 1: Foundation

**Scope:**
- Project setup and configuration
- Database schema implementation
- Basic backend API structure
- Authentication system (JWT)

**Deliverables:**
- PostgreSQL database with core tables
- Express.js server with route structure
- User registration and login endpoints
- JWT token generation and validation

**Technical Decisions:**
- Chose PostgreSQL for relational data integrity
- Implemented refresh token pattern for security
- Used bcrypt for password hashing

### 3.2 Iteration 2: Core CRUD Operations

**Scope:**
- Class management API
- Student management API
- Session management API
- Basic frontend pages

**Deliverables:**
- Full CRUD for classes, students, sessions
- CSV import for student rosters
- React dashboard with routing
- Authentication context and protected routes

**Technical Decisions:**
- React Query for server state management
- React Hook Form for form handling
- Tailwind CSS for rapid UI development

### 3.3 Iteration 3: Browser Extension Core

**Scope:**
- Chrome extension structure (Manifest V3)
- Google Meet detection
- Participant tracking (join/leave)
- Extension-backend communication

**Deliverables:**
- Working extension that detects meetings
- Participant detector using People Panel
- Session start/end from extension
- Extension token authentication

**Technical Decisions:**
- ARIA-based DOM selectors for stability
- MutationObserver for real-time detection
- Separate extension token system (not JWT)

### 3.4 Iteration 4: Attendance Tracking

**Scope:**
- Attendance interval tracking
- Duration calculation
- Student name matching
- Absent student marking

**Deliverables:**
- Two-table attendance model (records + intervals)
- Automatic duration calculation on session end
- Fuzzy name matching algorithm
- Dashboard attendance display

**Technical Decisions:**
- Intervals table for precise multi-join tracking
- Calculate totals on session end (not real-time)
- NULL left_at indicates "still in meeting"

### 3.5 Iteration 5: Real-Time Communication

**Scope:**
- WebSocket integration
- Live event broadcasting
- Dashboard real-time updates
- Live feed page

**Deliverables:**
- Socket.io server integration
- Room-based event routing
- WebSocketContext in frontend
- Real-time attendance updates

**Technical Decisions:**
- Room pattern: `instructor:{id}`, `session:{id}`
- Events emitted after database writes
- Frontend subscribes on page mount

### 3.6 Iteration 6: Participation Detection

**Scope:**
- Chat message detection
- Reaction detection
- Hand raise detection
- Microphone toggle detection

**Deliverables:**
- Content script modules for each event type
- Participation logs storage
- Event display in dashboard
- Deduplication logic

**Technical Decisions:**
- Toast notifications as secondary detection source
- Local deduplication before sending to server
- Participation types stored in ENUM

### 3.7 Iteration 7: Polish and Documentation

**Scope:**
- Error handling improvements
- User experience refinements
- Code documentation
- Thesis documentation

**Deliverables:**
- Improved error messages
- Loading states and feedback
- Technical documentation
- User guides

---

## Phase 4: Testing

### 4.1 Testing Strategy

| Test Type | Description | Status |
|-----------|-------------|--------|
| **Unit Testing** | Individual function testing | Planned |
| **Integration Testing** | API endpoint testing | Manual |
| **System Testing** | End-to-end functionality | Manual |
| **Usability Testing** | User experience evaluation | Planned |
| **Accuracy Testing** | Participation detection accuracy | In Progress |

### 4.2 Functional Testing

**Backend API Testing:**
- All endpoints tested manually via Postman/Thunder Client
- Authentication flows verified
- CRUD operations validated
- Error responses checked

**Frontend Testing:**
- Navigation flows tested
- Form submissions validated
- Real-time updates verified
- Responsive layout checked

**Extension Testing:**
- Meeting detection verified
- Participant tracking tested
- Session lifecycle validated
- Offline behavior tested

### 4.3 Accuracy Testing (Planned)

Participation detection accuracy will be measured by:
1. Conducting controlled test sessions
2. Manually recording actual events
3. Comparing with system-detected events
4. Calculating precision and recall metrics

### 4.4 Usability Testing (Planned)

Using standardized instruments:
- System Usability Scale (SUS) questionnaire
- Task completion rate measurement
- User feedback collection

---

## Phase 5: Deployment

### 5.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                           DEVELOPMENT ENVIRONMENT                            │
    │                                                                              │
    │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
    │   │ Frontend        │  │ Backend         │  │ PostgreSQL      │             │
    │   │ localhost:5173  │  │ localhost:3000  │  │ localhost:5432  │             │
    │   │ (Vite dev)      │  │ (Node.js)       │  │                 │             │
    │   └─────────────────┘  └─────────────────┘  └─────────────────┘             │
    │                                                                              │
    │   ┌─────────────────┐                                                        │
    │   │ Extension       │                                                        │
    │   │ (Unpacked load) │                                                        │
    │   └─────────────────┘                                                        │
    └─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Deployment Procedure

**Backend Deployment:**
1. Set up Node.js environment
2. Configure environment variables
3. Initialize PostgreSQL database
4. Run schema migrations
5. Start Express server

**Frontend Deployment:**
1. Build production bundle (`npm run build`)
2. Serve static files
3. Configure API endpoint

**Extension Deployment:**
1. Build extension (`npm run build`)
2. Load unpacked extension in Chrome
3. Configure extension settings
4. Authenticate with backend

### 5.3 Testing Environment Setup

For usability testing:
1. Backend deployed on local or institutional server
2. Frontend accessible via web browser
3. Extension distributed as unpacked build
4. Test accounts pre-created for faculty
5. Sample classes with student rosters prepared

---

## Agile Practices Applied

### Iterative Development
- Features built incrementally
- Working software delivered at each iteration
- Feedback incorporated into next iteration

### Prioritization
- Must-have features developed first
- Should-have features added iteratively
- Could-have features documented for future

### Continuous Integration
- Regular commits to version control
- Feature branches merged after testing
- Main branch kept in working state

### Documentation
- Technical documentation maintained alongside code
- User-facing documentation prepared for testing phase
- Thesis documentation developed in parallel

---

## Lessons Learned

### Technical Lessons
1. **DOM Detection is Fragile:** ARIA attributes more stable than class names
2. **Manifest V3 Constraints:** Service worker lifecycle requires careful handling
3. **Real-time Complexity:** WebSocket room management requires clear architecture

### Process Lessons
1. **Early Prototyping:** Testing DOM detection early prevented wasted effort
2. **Incremental Delivery:** Working features motivated continued development
3. **Documentation Parallel:** Writing docs alongside code ensures accuracy

---

*This document describes the Agile SDLC methodology as applied to Engagium development.*
