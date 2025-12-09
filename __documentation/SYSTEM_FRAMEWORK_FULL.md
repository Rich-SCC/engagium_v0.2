# Engagium System Framework
# Part 1: Methodology and Technology Stack

> **Comprehensive Technical Reference Document**
> 
> This is Part 1 of 4 of the complete Engagium System Framework.
> - Part 1: Methodology and Technology Stack (this document)
> - Part 2: Architecture and Modules
> - Part 3: Data Layer (Database Schema and Data Flows)
> - Part 4: Development Progress and Risk Assessment

---

# Section A: Agile SDLC Methodology

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

---

# Section B: Technology Stack

## Overview

| Layer | Primary Technologies |
|-------|---------------------|
| **Frontend** | React 18.2, Vite 6.1, Tailwind CSS 3.3 |
| **Backend** | Node.js, Express 4.18, Socket.io 4.6 |
| **Database** | PostgreSQL with pg 8.8 driver |
| **Extension** | Chrome Manifest V3, React 18.2, Vite 7.2 |

---

## 1. Backend Technologies

The backend serves as the central API and real-time communication hub.

### Core Runtime & Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x+ | JavaScript runtime environment |
| **Express.js** | 4.18.0 | REST API web framework |
| **Socket.io** | 4.6.0 | Real-time bidirectional WebSocket communication |

### Security & Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **JSON Web Tokens (jsonwebtoken)** | 9.0.0 | Token-based authentication (access + refresh tokens) |
| **bcrypt** | 5.1.0 | Password hashing with salt rounds |
| **Helmet** | 6.0.0 | HTTP security headers (XSS, CSRF protection) |
| **express-rate-limit** | 6.7.0 | API rate limiting to prevent abuse |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing configuration |

### Database & Data Handling

| Technology | Version | Purpose |
|------------|---------|---------|
| **pg (node-postgres)** | 8.8.0 | PostgreSQL database driver |
| **Multer** | 2.0.2 | Multipart form data handling (CSV uploads) |
| **csv-parser** | 3.0.0 | CSV file parsing for student imports |
| **uuid** | 9.0.0 | UUID generation for database records |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nodemailer** | 7.0.10 | Email sending (password reset functionality) |
| **dotenv** | 16.0.0 | Environment variable management |
| **nodemon** | 3.0.0 | Development auto-restart (dev dependency) |

---

## 2. Frontend Technologies

The frontend provides the instructor dashboard and analytics interface.

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Component-based UI library |
| **React DOM** | 18.2.0 | React rendering for web browsers |
| **Vite** | 6.1.0 | Fast build tool and development server |

### Routing & State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 6.8.0 | Client-side routing and navigation |
| **React Context API** | (built-in) | Global state management (Auth, WebSocket) |
| **TanStack React Query** | 4.24.0 | Server state management, caching, synchronization |

### Forms & HTTP

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.43.0 | Performant form handling with validation |
| **Axios** | 1.3.0 | HTTP client for API requests |
| **Socket.io Client** | 4.8.1 | WebSocket client for real-time updates |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.3.0 | Utility-first CSS framework |
| **PostCSS** | 8.4.24 | CSS transformation and processing |
| **Autoprefixer** | 10.4.14 | Automatic vendor prefixing |
| **Heroicons React** | 2.0.18 | SVG icon library |

---

## 3. Browser Extension Technologies

The Chrome extension interfaces with Google Meet for participation tracking.

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Chrome Extension Manifest V3** | 3 | Latest Chrome extension platform |
| **React** | 18.2.0 | UI for popup and options pages |
| **React DOM** | 18.2.0 | React rendering |
| **Vite** | 7.2.4 | Extension bundling and build |

### Data & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **idb (IndexedDB)** | 7.1.1 | Local offline data persistence |
| **uuid** | 9.0.0 | Unique identifier generation |
| **Chrome Storage API** | (built-in) | Extension settings and token storage |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 2.30.0 | Date formatting and manipulation |
| **@types/chrome** | 0.0.254 | TypeScript definitions for Chrome APIs |

### Extension Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Service Worker** | Manifest V3 | Background script for session coordination |
| **Content Scripts** | Vanilla JS + Modules | Google Meet DOM interaction |
| **Popup** | React | Quick session control interface |
| **Options Page** | React | Authentication and class mapping |

---

## 4. Database Technologies

### Database Engine

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 14+ | Relational database management system |
| **uuid-ossp** | (extension) | Native UUID generation in PostgreSQL |

### Database Features Used

| Feature | Purpose |
|---------|---------|
| **ENUM Types** | Type-safe status fields (user_role, session_status, interaction_type) |
| **JSONB** | Flexible storage for schedules and additional data |
| **Foreign Keys** | Referential integrity with CASCADE deletes |
| **Triggers** | Automatic `updated_at` timestamp management |
| **Indexes** | Query performance optimization |
| **Unique Constraints** | Data integrity (e.g., one attendance record per participant per session) |

---

## 5. Development Tools

### Version Control & Collaboration

| Tool | Purpose |
|------|---------|
| **Git** | Version control system |
| **GitHub** | Repository hosting and collaboration |

### Development Environment

| Tool | Purpose |
|------|---------|
| **Visual Studio Code** | Primary code editor |
| **Node Package Manager (npm)** | Package management |
| **Chrome DevTools** | Extension debugging |

### API Testing

| Tool | Purpose |
|------|---------|
| **Postman / Thunder Client** | API endpoint testing |
| **Browser DevTools** | Network request inspection |

---

## 6. Technology Selection Rationale

### Why Node.js + Express?
- **JavaScript Ecosystem**: Unified language across frontend, backend, and extension
- **Non-blocking I/O**: Efficient handling of real-time WebSocket connections
- **Rich Package Ecosystem**: npm provides extensive library support
- **Easy Integration**: Native JSON handling for API responses

### Why React?
- **Component Reusability**: Modular UI development across dashboard and extension
- **Virtual DOM**: Efficient updates for real-time data displays
- **Strong Community**: Extensive documentation and third-party libraries
- **React Query**: Simplified server state management and caching

### Why PostgreSQL?
- **ACID Compliance**: Reliable transactions for attendance data integrity
- **Complex Queries**: Efficient joins for analytics and reporting
- **JSONB Support**: Flexible storage for variable data structures
- **Scalability**: Handles growing data volumes as usage increases

### Why Socket.io?
- **Real-time Updates**: Instant event propagation to dashboard
- **Room-based Architecture**: Efficient targeted broadcasts per instructor/session
- **Automatic Reconnection**: Handles network interruptions gracefully
- **Fallback Support**: Works even when WebSockets are blocked

### Why Chrome Extension Manifest V3?
- **Modern Standard**: Google's required format for new extensions
- **Service Workers**: Efficient background processing
- **Enhanced Security**: Stricter permission model
- **Performance**: Reduced memory footprint compared to Manifest V2

---

## 7. Version Compatibility Matrix

| Component | Minimum Version | Recommended Version |
|-----------|-----------------|---------------------|
| Node.js | 16.x | 18.x or 20.x LTS |
| npm | 8.x | 9.x or 10.x |
| Chrome Browser | 120+ | Latest stable |
| PostgreSQL | 12 | 14+ |

---

## 8. Dependency Summary

### Backend (15 production dependencies)
```
express, socket.io, pg, jsonwebtoken, bcrypt, helmet, 
cors, express-rate-limit, multer, csv-parser, uuid, 
nodemailer, dotenv, crypto, autoprefixer
```

### Frontend (8 production dependencies)
```
react, react-dom, react-router-dom, @tanstack/react-query,
react-hook-form, axios, socket.io-client, @heroicons/react
```

### Extension (5 production dependencies)
```
react, react-dom, date-fns, idb, uuid
```

---

*End of Part 1. Continue to Part 2: Architecture and Modules.*
# Engagium System Framework
# Part 2: Architecture and Modules

> **Comprehensive Technical Reference Document**
> 
> This is Part 2 of 4 of the complete Engagium System Framework.
> - Part 1: Methodology and Technology Stack
> - Part 2: Architecture and Modules (this document)
> - Part 3: Data Layer (Database Schema and Data Flows)
> - Part 4: Development Progress and Risk Assessment

---

# Section A: System Architecture

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

---

# Section B: Module Descriptions

## Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ENGAGIUM SYSTEM MODULES                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────────────┐                                                         │
│   │ 1. BROWSER        │  Chrome extension for Google Meet participation          │
│   │    EXTENSION      │  tracking with offline support                           │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 2. API SERVICES   │  REST endpoints for CRUD operations and                  │
│   │    (Backend)      │  real-time WebSocket communication                       │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 3. PARTICIPATION  │  Event detection, processing, and storage                │
│   │    LOGGING ENGINE │  for attendance and interaction tracking                 │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 4. ANALYTICS      │  Attendance rates, duration calculations,                │
│   │    ENGINE         │  and participation metrics                               │
│   └───────────────────┘                                                         │
│            │                                                                     │
│            ▼                                                                     │
│   ┌───────────────────┐                                                         │
│   │ 5. WEB DASHBOARD  │  React-based interface for instructors                   │
│   │                   │  to view and manage class data                           │
│   └───────────────────┘                                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Browser Extension

### Purpose
The browser extension serves as the primary data collection interface, detecting and capturing participation events directly from Google Meet sessions. It runs as a Chrome extension using Manifest V3.

### Components

#### 1.1 Service Worker (Background Script)
**Location:** `_extension/background/`

| File | Responsibility |
|------|----------------|
| `service-worker.js` | Main coordinator; handles message routing between content scripts, popup, and options page; manages extension lifecycle |
| `session-manager.js` | Manages active session state; coordinates session start/end; handles participant matching |
| `api-client.js` | HTTP communication with backend API; handles request formatting and error handling |
| `socket-client.js` | WebSocket connection to backend; emits real-time events |
| `sync-queue.js` | Offline support; queues failed requests for retry; implements exponential backoff |

#### 1.2 Content Scripts (Google Meet Integration)
**Location:** `_extension/content/google-meet/`

| File | Responsibility |
|------|----------------|
| `index.js` | Entry point; initializes all detectors when meeting is detected |
| `participant-detector.js` | **Primary detector**: Monitors People Panel for join/leave events; extracts participant names |
| `chat-monitor.js` | Monitors Chat Panel for new messages; extracts sender and message text |
| `reaction-detector.js` | Detects emoji reactions via toast notifications and video tile overlays |
| `hand-raise-detector.js` | Monitors Raised Hands section; detects hand raise/lower events |
| `media-state-detector.js` | Detects microphone unmute events via People Panel button states |
| `screen-share-detector.js` | Detects screen sharing (auxiliary, not a participation type) |
| `url-monitor.js` | Monitors URL changes to detect meeting entry/exit |
| `event-emitter.js` | Queues detected events and sends to service worker |
| `config.js` | DOM selectors, patterns, and constants for Google Meet's ARIA-based structure |
| `state.js` | Shared state object for tracking status |
| `utils.js` | Helper functions for ID generation, logging, name cleaning |
| `people-panel.js` | People panel DOM queries and participant extraction |
| `tracking-indicator.js` | Visual indicator showing tracking is active |

#### 1.3 Popup Interface
**Location:** `_extension/popup/`

| File | Responsibility |
|------|----------------|
| `popup.jsx` | React component for quick session control |
| `popup.css` | Styling for popup interface |
| `index.html` | HTML entry point |

**Features:**
- Start/stop session tracking
- View current session status
- See active participant count
- Quick navigation to dashboard

#### 1.4 Options Page
**Location:** `_extension/options/`

| File | Responsibility |
|------|----------------|
| `options.jsx` | React component for extension settings |
| `callback.js` | OAuth callback handler for authentication |
| `options.css` | Styling for options interface |
| `index.html`, `callback.html` | HTML entry points |

**Features:**
- Connect extension to Engagium account
- Map meeting links to classes
- Configure tracking preferences
- Debug panel for troubleshooting

#### 1.5 Utilities
**Location:** `_extension/utils/`

| File | Responsibility |
|------|----------------|
| `constants.js` | Message types, event types, configuration constants |
| `storage.js` | Chrome storage API wrappers |
| `debug-logger.js` | Logging utilities with levels |
| `date-utils.js` | Date/time formatting helpers |
| `student-matcher.js` | Algorithm for matching participant names to enrolled students |

---

## 2. API Services (Backend)

### Purpose
The backend provides RESTful API endpoints for all system operations and manages real-time communication via WebSocket.

### Controllers
**Location:** `backend/src/controllers/`

| Controller | Endpoints | Responsibility |
|------------|-----------|----------------|
| `authController.js` | `/auth/*` | User registration, login, logout, password reset, profile management, token refresh |
| `classController.js` | `/classes/*` | Class CRUD, meeting links, exempted accounts |
| `sessionController.js` | `/sessions/*` | Session lifecycle (start/end), live events, attendance queries |
| `studentController.js` | `/classes/:id/students/*` | Student CRUD, CSV import, bulk operations, duplicate detection |
| `participationController.js` | `/participation/*` | Log and retrieve participation events |
| `studentTagController.js` | `/classes/:id/tags/*` | Tag management for student organization |
| `studentNoteController.js` | `/classes/:id/students/:id/notes/*` | Timestamped notes per student |
| `notificationController.js` | `/notifications/*` | System notification management |
| `extensionTokenController.js` | `/extension-tokens/*` | Extension token generation and revocation |

### Route Files
**Location:** `backend/src/routes/`

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `authRoutes.js` | `/api/auth` | Authentication endpoints |
| `classRoutes.js` | `/api/classes` | Class and student management |
| `sessionRoutes.js` | `/api/sessions` | Session operations |
| `participationRoutes.js` | `/api/participation` | Participation logging |
| `notificationRoutes.js` | `/api/notifications` | Notification operations |
| `extensionTokenRoutes.js` | `/api/extension-tokens` | Token management |

### Services
**Location:** `backend/src/services/`

| Service | Responsibility |
|---------|----------------|
| `emailService.js` | Password reset emails via Nodemailer |

### Middleware
**Location:** `backend/src/middleware/`

| Middleware | Responsibility |
|------------|----------------|
| `authMiddleware.js` | JWT verification, extension token verification, flexible auth |
| `errorHandler.js` | Centralized error handling and formatting |

### Socket Handler
**Location:** `backend/src/socket/`

| File | Responsibility |
|------|----------------|
| `socketHandler.js` | WebSocket event handling, room management, broadcast logic |

### Key API Endpoints

#### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Authenticate and receive tokens |
| POST | `/auth/refresh-token` | Get new access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/profile` | Get current user profile |
| PUT | `/auth/profile` | Update user profile |

#### Sessions (Extension-focused)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/sessions/start-from-meeting` | Start session from extension |
| POST | `/sessions/:id/live-event` | Send real-time participation event |
| PUT | `/sessions/:id/end-with-timestamp` | End session with precise timestamp |
| POST | `/sessions/:id/attendance/join` | Record participant join |
| POST | `/sessions/:id/attendance/leave` | Record participant leave |

---

## 3. Participation Logging Engine

### Purpose
Detects, processes, and stores participation events during live sessions. Operates across extension and backend.

### Participation Event Types

| Type | Code | Detection Source | Storage Field |
|------|------|------------------|---------------|
| **Attendance (Join/Leave)** | `attendance` | People Panel | `attendance_records`, `attendance_intervals` |
| **Chat Messages** | `chat` | Chat Panel | `participation_logs` |
| **Reactions** | `reaction` | Toast notifications | `participation_logs` |
| **Hand Raises** | `hand_raise` | Raised Hands section | `participation_logs` |
| **Mic Unmute** | `mic_toggle` | People Panel buttons | `participation_logs` |

### Event Detection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PARTICIPATION EVENT DETECTION                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Google Meet DOM
          │
          │ MutationObserver
          ▼
    ┌──────────────────┐
    │ Detector Module  │  (participant-detector, chat-monitor, etc.)
    │                  │
    │ - Parse DOM      │
    │ - Extract data   │
    │ - Validate       │
    │ - Deduplicate    │
    └────────┬─────────┘
             │
             │ queueEvent()
             ▼
    ┌──────────────────┐
    │ Event Emitter    │
    │                  │
    │ - Queue locally  │
    │ - Batch if needed│
    │ - Send message   │
    └────────┬─────────┘
             │
             │ chrome.runtime.sendMessage()
             ▼
    ┌──────────────────┐
    │ Service Worker   │
    │                  │
    │ - Store in IDB   │
    │ - Call API       │
    └────────┬─────────┘
             │
             │ POST /sessions/:id/live-event
             ▼
    ┌──────────────────┐
    │ Backend          │
    │                  │
    │ - Validate       │
    │ - Store in DB    │
    │ - Broadcast WS   │
    └──────────────────┘
```

### Attendance Tracking Details

Attendance uses a two-table approach for precision:

1. **`attendance_records`**: Final status per participant per session
   - Status: present, absent, late
   - Total duration in minutes
   - First join and last leave timestamps

2. **`attendance_intervals`**: Each join/leave pair
   - Precise `joined_at` and `left_at` timestamps
   - Allows calculation of actual time in meeting
   - Handles multiple join/leave cycles

### Data Stored Per Event Type

| Event Type | Data Captured |
|------------|---------------|
| **Attendance** | participant_name, joined_at, left_at, duration_minutes |
| **Chat** | participant_name, message_text, timestamp |
| **Reaction** | participant_name, emoji/reaction_type, timestamp |
| **Hand Raise** | participant_name, timestamp |
| **Mic Unmute** | participant_name, timestamp, state (on) |

---

## 4. Analytics Engine

### Purpose
Calculates metrics and aggregates data for instructor insights. Operates primarily in the backend with display in the frontend.

### Metrics Calculated

#### Attendance Metrics
| Metric | Calculation | Location |
|--------|-------------|----------|
| **Attendance Rate** | (Present + Late) / Total Students × 100 | Session detail, class summary |
| **Average Duration** | Sum(duration_minutes) / Count(participants) | Session detail |
| **On-time Rate** | Present / (Present + Late) × 100 | Session detail |
| **Class Attendance Trend** | Attendance rate over multiple sessions | Class analytics |

#### Participation Metrics
| Metric | Calculation | Location |
|--------|-------------|----------|
| **Total Interactions** | Count of all participation_logs | Session detail |
| **Interactions per Student** | Count grouped by student_id | Student detail |
| **Interaction by Type** | Count grouped by interaction_type | Session analytics |
| **Active Participation Rate** | Students with ≥1 interaction / Total present | Session summary |

### Backend Endpoints for Analytics

| Endpoint | Data Returned |
|----------|---------------|
| `GET /classes/:id/stats` | Class-level statistics |
| `GET /sessions/:id/stats` | Session-level statistics |
| `GET /sessions/:id/attendance` | Detailed attendance with intervals |
| `GET /participation/:sessionId/summary` | Participation summary by type |
| `GET /participation/:sessionId/recent` | Recent activity feed |

### Frontend Analytics Pages

| Page | Analytics Displayed |
|------|---------------------|
| `Home.jsx` | Dashboard overview with class stats |
| `Analytics.jsx` | Trend charts and comparisons |
| `SessionDetailPage.jsx` | Per-session attendance and participation |
| `ClassDetailsPage.jsx` | Class-level metrics and student list |

---

## 5. Web Dashboard

### Purpose
Provides instructors with a comprehensive interface to manage classes, view attendance data, and monitor participation in real-time.

### Page Structure
**Location:** `frontend/src/pages/`

| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage.jsx` | `/` | Public landing page with login/register |
| `Home.jsx` | `/home` | Dashboard overview with stats and quick actions |
| `LiveFeed.jsx` | `/live-feed` | Real-time session monitoring |
| `MyClasses.jsx` | `/classes` | Class list and management |
| `ClassDetailsPage.jsx` | `/classes/:id` | Individual class view with students, sessions |
| `Sessions.jsx` | `/sessions` | Session history and calendar |
| `SessionDetailPage.jsx` | `/sessions/:id` | Session attendance and participation details |
| `Analytics.jsx` | `/analytics` | Attendance trends and participation metrics |
| `Settings.jsx` | `/settings` | User profile and extension tokens |
| `Notifications.jsx` | `/notifications` | System notification center |
| `ForgotPassword.jsx` | `/forgot-password` | Password reset request |
| `ResetPassword.jsx` | `/reset-password` | Password reset form |

### Component Structure
**Location:** `frontend/src/components/`

```
components/
├── common/           # Shared UI components (buttons, modals, inputs)
├── layout/           # Page layout (header, sidebar, navigation)
├── class/            # Class-specific components
├── session/          # Session-specific components
├── student/          # Student management components
├── attendance/       # Attendance display components
└── participation/    # Participation log components
```

### Context Providers
**Location:** `frontend/src/contexts/`

| Context | Purpose |
|---------|---------|
| `AuthContext.jsx` | Authentication state, login/logout, token management |
| `WebSocketContext.jsx` | Socket.io connection, event handling, room management |

### Services
**Location:** `frontend/src/services/`

| Service | Purpose |
|---------|---------|
| `api.js` | Axios instance with interceptors for auth headers |
| `authService.js` | Authentication API calls |
| `classService.js` | Class management API calls |
| `sessionService.js` | Session management API calls |
| `studentService.js` | Student management API calls |
| `participationService.js` | Participation data API calls |

### Key Features

#### Real-time Updates
- WebSocket connection established on login
- Joins instructor room for broadcast events
- Live feed page shows events as they occur
- Session detail page updates attendance in real-time

#### Class Management
- Create/edit/delete classes
- Configure class schedule (days, time)
- Add multiple meeting links per class
- Archive/activate classes
- Manage exempted accounts (TAs, observers)

#### Student Management
- Manual add/edit/delete students
- CSV import with validation
- Bulk operations (delete, update)
- Duplicate detection and merging
- Tagging system for organization
- Timestamped notes per student

#### Session Management
- View session history
- Calendar view of sessions
- Start sessions from extension (auto-created)
- View detailed attendance with intervals
- View participation logs by type

---

## Module Interaction Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MODULE INTERACTION DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │  EXTENSION  │          │   BACKEND   │          │  DASHBOARD  │
    │             │          │             │          │             │
    │ Detects     │  HTTP    │ Processes   │  HTTP    │ Displays    │
    │ events in   ├─────────►│ and stores  │◄─────────┤ data to     │
    │ Google Meet │          │ data        │          │ instructor  │
    │             │          │             │  WS      │             │
    │             │          │ Broadcasts  ├─────────►│ Updates     │
    │             │          │ via Socket  │          │ in real-time│
    └─────────────┘          └──────┬──────┘          └─────────────┘
                                    │
                                    │
                             ┌──────▼──────┐
                             │  DATABASE   │
                             │             │
                             │ Persists    │
                             │ all data    │
                             └─────────────┘
```

---

*End of Part 2. Continue to Part 3: Data Layer (Database Schema and Data Flows).*
# Engagium System Framework
# Part 3: Data Layer (Database Schema and Data Flows)

> **Comprehensive Technical Reference Document**
> 
> This is Part 3 of 4 of the complete Engagium System Framework.
> - Part 1: Methodology and Technology Stack
> - Part 2: Architecture and Modules
> - Part 3: Data Layer (Database Schema and Data Flows) (this document)
> - Part 4: Development Progress and Risk Assessment

---

# Section A: Database Schema

## 1. Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENGAGIUM DATABASE ENTITY-RELATIONSHIP DIAGRAM                 │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │     USERS       │
    │─────────────────│
    │ PK: id (UUID)   │
    │    email        │
    │    password_hash│
    │    first_name   │
    │    last_name    │
    │    role         │◄─────────────────────────────────────────────────────┐
    │    refresh_token│                                                       │
    │    reset_token  │                                                       │
    └────────┬────────┘                                                       │
             │                                                                │
             │ 1:N (instructor_id)                                            │
             ▼                                                                │
    ┌─────────────────┐                                                       │
    │    CLASSES      │                                                       │
    │─────────────────│                                                       │
    │ PK: id (UUID)   │                                                       │
    │ FK: instructor_ │                                                       │
    │     id          │                                                       │
    │    name         │                                                       │
    │    subject      │                                                       │
    │    section      │                                                       │
    │    schedule     │                                                       │
    │    status       │                                                       │
    └────────┬────────┘                                                       │
             │                                                                │
    ┌────────┼────────┬────────────────┬────────────────┬─────────────────┐   │
    │        │        │                │                │                 │   │
    │        │        │                │                │                 │   │
    ▼        ▼        ▼                ▼                ▼                 │   │
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐         │   │
│STUDENTS│ │SESSIONS│ │SESSION   │ │EXEMPTED  │ │STUDENT_TAGS   │         │   │
│────────│ │────────│ │LINKS     │ │ACCOUNTS  │ │───────────────│         │   │
│PK: id  │ │PK: id  │ │──────────│ │──────────│ │PK: id         │         │   │
│FK:class│ │FK:class│ │PK: id    │ │PK: id    │ │FK: class_id   │         │   │
│   _id  │ │   _id  │ │FK: class │ │FK: class │ │   tag_name    │         │   │
│full_   │ │title   │ │   _id    │ │   _id    │ │   tag_color   │         │   │
│ name   │ │meeting │ │link_url  │ │account_  │ └───────┬───────┘         │   │
│student │ │ _link  │ │link_type │ │identifier│         │                 │   │
│ _id    │ │status  │ │is_primary│ │reason    │         │ 1:N             │   │
└───┬────┘ │started │ └──────────┘ └──────────┘         ▼                 │   │
    │      │ _at    │                          ┌───────────────────┐      │   │
    │      │ended_at│                          │STUDENT_TAG_       │      │   │
    │      └───┬────┘                          │ASSIGNMENTS        │      │   │
    │          │                               │───────────────────│      │   │
    │          │                               │PK: id             │      │   │
    │          │                               │FK: student_id     │◄─────┤   │
    │          │                               │FK: tag_id         │      │   │
    │          │                               └───────────────────┘      │   │
    │          │                                                          │   │
    │          │ 1:N                                                      │   │
    │          │                                                          │   │
    │    ┌─────┴────────────────────────┬─────────────────────┐           │   │
    │    │                              │                     │           │   │
    │    ▼                              ▼                     ▼           │   │
    │ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   │   │
    │ │ATTENDANCE_      │    │ATTENDANCE_      │    │PARTICIPATION_   │   │   │
    │ │RECORDS          │    │INTERVALS        │    │LOGS             │   │   │
    │ │─────────────────│    │─────────────────│    │─────────────────│   │   │
    │ │PK: id           │    │PK: id           │    │PK: id           │   │   │
    │ │FK: session_id   │    │FK: session_id   │    │FK: session_id   │   │   │
    │ │FK: student_id   │◄───│FK: student_id   │    │FK: student_id   │◄──┘   │
    │ │participant_name │    │participant_name │    │interaction_type │       │
    │ │status           │    │joined_at        │    │interaction_value│       │
    │ │total_duration   │    │left_at          │    │timestamp        │       │
    │ │first_joined_at  │    └─────────────────┘    │additional_data  │       │
    │ │last_left_at     │                          └─────────────────┘       │
    │ └─────────────────┘                                                     │
    │                                                                         │
    │ 1:N                                              ┌─────────────────┐     │
    │                                                  │NOTIFICATIONS    │     │
    ▼                                                  │─────────────────│     │
┌─────────────────┐                                    │PK: id           │     │
│STUDENT_NOTES    │                                    │FK: user_id      │─────┘
│─────────────────│                                    │type             │
│PK: id           │                                    │title            │
│FK: student_id   │                                    │message          │
│FK: created_by   │────────────────────────────────────│read             │
│note_text        │         (created_by = user_id)     │action_url       │
│created_at       │                                    └─────────────────┘
└─────────────────┘
```

---

## 2. Custom ENUM Types

The database uses PostgreSQL ENUM types for type-safe status fields.

### 2.1 user_role

```sql
CREATE TYPE user_role AS ENUM ('instructor', 'admin');
```

| Value | Description |
|-------|-------------|
| `instructor` | Standard user, can manage own classes |
| `admin` | System administrator (future use) |

### 2.2 session_status

```sql
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'ended');
```

| Value | Description |
|-------|-------------|
| `scheduled` | Session created but not yet started |
| `active` | Session currently in progress |
| `ended` | Session has been completed |

### 2.3 interaction_type

```sql
CREATE TYPE interaction_type AS ENUM (
  'manual_entry', 
  'chat', 
  'reaction', 
  'mic_toggle', 
  'camera_toggle', 
  'platform_switch', 
  'hand_raise'
);
```

| Value | Description |
|-------|-------------|
| `manual_entry` | Manually logged participation |
| `chat` | Chat message sent |
| `reaction` | Emoji reaction |
| `mic_toggle` | Microphone unmuted |
| `camera_toggle` | Camera toggled (reserved) |
| `platform_switch` | Platform change (reserved) |
| `hand_raise` | Hand raised |

---

## 3. Table Definitions

### 3.1 users

Stores instructor/admin accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NOT NULL | User's last name |
| `role` | user_role | DEFAULT 'instructor', NOT NULL | Account role |
| `reset_token` | VARCHAR(255) | | Password reset token |
| `reset_token_expires` | TIMESTAMPTZ | | Token expiration time |
| `refresh_token` | TEXT | | JWT refresh token |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### 3.2 classes

Stores class/course information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `instructor_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Owning instructor |
| `name` | VARCHAR(255) | NOT NULL | Class name |
| `subject` | VARCHAR(100) | | Subject/course code |
| `section` | VARCHAR(50) | | Section identifier |
| `description` | TEXT | | Class description |
| `schedule` | JSONB | | Schedule data: `{days: [], time: ""}` |
| `status` | VARCHAR(20) | DEFAULT 'active', CHECK IN ('active', 'archived') | Class status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### 3.3 students

Stores enrolled students per class.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `class_id` | UUID | NOT NULL, FK → classes(id) ON DELETE CASCADE | Parent class |
| `full_name` | VARCHAR(255) | NOT NULL | Student's display name |
| `student_id` | VARCHAR(50) | | Institution student ID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Unique Constraint:** `(class_id, student_id)` - Student ID unique within class

### 3.4 sessions

Stores class sessions/meetings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `class_id` | UUID | NOT NULL, FK → classes(id) ON DELETE CASCADE | Parent class |
| `title` | VARCHAR(255) | NOT NULL | Session title |
| `meeting_link` | VARCHAR(500) | | Meeting URL |
| `started_at` | TIMESTAMPTZ | | Actual start time |
| `ended_at` | TIMESTAMPTZ | | Actual end time |
| `status` | session_status | DEFAULT 'scheduled', NOT NULL | Session status |
| `session_date` | DATE | | Scheduled date |
| `session_time` | TIME | | Scheduled time |
| `topic` | VARCHAR(255) | | Session topic |
| `description` | TEXT | | Session description |
| `additional_data` | JSONB | | Extra metadata |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

### 3.5 attendance_records

Stores final attendance status per participant per session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | Parent session |
| `student_id` | UUID | FK → students(id) ON DELETE SET NULL | Matched student (optional) |
| `participant_name` | VARCHAR(255) | NOT NULL | Display name from meeting |
| `status` | VARCHAR(20) | DEFAULT 'present', CHECK IN ('present', 'absent', 'late') | Attendance status |
| `total_duration_minutes` | INTEGER | DEFAULT 0 | Total time in meeting |
| `first_joined_at` | TIMESTAMPTZ | | First join timestamp |
| `last_left_at` | TIMESTAMPTZ | | Last leave timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Unique Constraint:** `(session_id, participant_name)` - One record per participant per session

### 3.6 attendance_intervals

Stores each join/leave cycle for precise duration calculation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | Parent session |
| `student_id` | UUID | FK → students(id) ON DELETE SET NULL | Matched student (optional) |
| `participant_name` | VARCHAR(255) | NOT NULL | Display name from meeting |
| `joined_at` | TIMESTAMPTZ | NOT NULL | Join timestamp |
| `left_at` | TIMESTAMPTZ | | Leave timestamp (NULL = still in meeting) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

### 3.7 participation_logs

Stores participation events (chat, reactions, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | Parent session |
| `student_id` | UUID | NOT NULL, FK → students(id) ON DELETE CASCADE | Participating student |
| `interaction_type` | interaction_type | NOT NULL | Type of interaction |
| `interaction_value` | VARCHAR(255) | | Interaction data (e.g., chat text) |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp |
| `additional_data` | JSONB | | Extra metadata |

### 3.8 session_links

Stores meeting links associated with classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `class_id` | UUID | NOT NULL, FK → classes(id) ON DELETE CASCADE | Parent class |
| `link_url` | VARCHAR(500) | NOT NULL | Meeting URL |
| `link_type` | VARCHAR(50) | | Platform: 'zoom', 'meet', 'teams' |
| `label` | VARCHAR(100) | | User-defined label |
| `zoom_meeting_id` | VARCHAR(100) | | Zoom meeting ID (if applicable) |
| `zoom_passcode` | VARCHAR(100) | | Zoom passcode (if applicable) |
| `is_primary` | BOOLEAN | DEFAULT false | Primary link flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### 3.9 exempted_accounts

Stores accounts to exclude from attendance tracking (TAs, observers).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `class_id` | UUID | NOT NULL, FK → classes(id) ON DELETE CASCADE | Parent class |
| `account_identifier` | VARCHAR(255) | NOT NULL | Email or display name |
| `reason` | VARCHAR(255) | | Reason for exemption |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Unique Constraint:** `(class_id, account_identifier)`

### 3.10 student_tags

Stores tag definitions for student organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `class_id` | UUID | NOT NULL, FK → classes(id) ON DELETE CASCADE | Parent class |
| `tag_name` | VARCHAR(100) | NOT NULL | Tag label |
| `tag_color` | VARCHAR(20) | DEFAULT '#3B82F6' | Hex color code |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Unique Constraint:** `(class_id, tag_name)`

### 3.11 student_tag_assignments

Many-to-many relationship between students and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `student_id` | UUID | NOT NULL, FK → students(id) ON DELETE CASCADE | Student |
| `tag_id` | UUID | NOT NULL, FK → student_tags(id) ON DELETE CASCADE | Tag |
| `assigned_at` | TIMESTAMPTZ | DEFAULT NOW() | Assignment time |

**Unique Constraint:** `(student_id, tag_id)`

### 3.12 student_notes

Stores timestamped notes per student.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `student_id` | UUID | NOT NULL, FK → students(id) ON DELETE CASCADE | Parent student |
| `note_text` | TEXT | NOT NULL | Note content |
| `created_by` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Author (instructor) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

### 3.13 notifications

Stores system notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Recipient |
| `type` | VARCHAR(50) | NOT NULL | Notification type |
| `title` | VARCHAR(255) | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification body |
| `action_url` | VARCHAR(500) | | Link to relevant page |
| `read` | BOOLEAN | DEFAULT false | Read status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

## 4. Database Indexes

Performance indexes for common query patterns.

```sql
-- Class lookups by instructor
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_status ON classes(status);

-- Student lookups by class
CREATE INDEX idx_students_class_id ON students(class_id);

-- Session lookups
CREATE INDEX idx_sessions_class_id ON sessions(class_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Meeting link lookups
CREATE INDEX idx_session_links_class_id ON session_links(class_id);

-- Exempted account lookups
CREATE INDEX idx_exempted_accounts_class_id ON exempted_accounts(class_id);

-- Participation log queries
CREATE INDEX idx_participation_logs_session_id ON participation_logs(session_id);
CREATE INDEX idx_participation_logs_student_id ON participation_logs(student_id);
CREATE INDEX idx_participation_logs_timestamp ON participation_logs(timestamp);
CREATE INDEX idx_participation_logs_interaction_type ON participation_logs(interaction_type);

-- Password reset token lookup
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Tag lookups
CREATE INDEX idx_student_tags_class_id ON student_tags(class_id);
CREATE INDEX idx_student_tag_assignments_student_id ON student_tag_assignments(student_id);
CREATE INDEX idx_student_tag_assignments_tag_id ON student_tag_assignments(tag_id);

-- Note lookups
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);

-- Notification lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Attendance lookups
CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_participant_name ON attendance_records(participant_name);

-- Attendance interval lookups
CREATE INDEX idx_attendance_intervals_session_id ON attendance_intervals(session_id);
CREATE INDEX idx_attendance_intervals_student_id ON attendance_intervals(student_id);
CREATE INDEX idx_attendance_intervals_participant_name ON attendance_intervals(participant_name);
```

---

## 5. Triggers

Automatic timestamp management.

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applied to tables with updated_at column
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_links_updated_at 
  BEFORE UPDATE ON session_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at 
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Data Privacy Notes

### Data Collected

| Data Type | Storage Location | Purpose | Access |
|-----------|------------------|---------|--------|
| Participant names | `attendance_records.participant_name` | Attendance tracking | Instructor only |
| Join/leave timestamps | `attendance_intervals` | Duration calculation | Instructor only |
| Chat message text | `participation_logs.interaction_value` | Participation evidence | Instructor only |
| Reaction type | `participation_logs.interaction_value` | Participation tracking | Instructor only |
| Event timestamps | `participation_logs.timestamp` | Activity timeline | Instructor only |

### Data NOT Collected

| Data Type | Reason |
|-----------|--------|
| Audio streams | Privacy - not captured by extension |
| Video streams | Privacy - not captured by extension |
| Screen share content | Privacy - only shares state, not content |
| Private messages | Only in-call messages visible to all |
| Student passwords | Students don't have accounts |

### Data Isolation

- Each instructor can only access their own classes
- Backend verifies `instructor_id` matches `req.user.id` on every request
- Extension tokens are scoped to individual users
- No cross-instructor data access is possible through the API

---

## 7. Schema Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 13 |
| Custom ENUM Types | 3 |
| Foreign Key Relationships | 18 |
| Indexes | 24 |
| Triggers | 4 |
| Unique Constraints | 5 |

---

---

# Section B: Data Flow Diagrams

## 1. Complete Session Lifecycle Flow

This diagram shows the entire flow from when an instructor joins a Google Meet session until the session ends.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SESSION LIFECYCLE DATA FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: MEETING DETECTION
═══════════════════════════

    Instructor opens Google Meet
              │
              ▼
    ┌─────────────────────┐
    │ URL Monitor detects │
    │ meet.google.com/*   │
    │ URL pattern         │
    └──────────┬──────────┘
               │
               │ Extracts meeting ID from URL
               ▼
    ┌─────────────────────┐
    │ Content Script      │
    │ sends message:      │
    │ MEETING_DETECTED    │
    │ { meetingId, url }  │
    └──────────┬──────────┘
               │
               │ chrome.runtime.sendMessage
               ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ checks meeting URL  │
    │ against class links │
    └──────────┬──────────┘
               │
               │ Found matching class?
               ▼
         ┌─────┴─────┐
         │           │
        YES          NO
         │           │
         ▼           ▼
    ┌─────────┐  ┌─────────┐
    │ Ready   │  │ Unknown │
    │ to      │  │ meeting │
    │ track   │  │ prompt  │
    └────┬────┘  │ user    │
         │       └─────────┘


PHASE 2: SESSION START
═══════════════════════

    Instructor clicks "Start Session" in popup
              │
              ▼
    ┌─────────────────────┐
    │ Popup sends message │
    │ START_SESSION       │
    │ { classId,          │
    │   meetingUrl }      │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ POST /sessions/     │
    │ start-from-meeting  │
    │                     │
    │ Headers:            │
    │ X-Extension-Token   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │  1. Verify extension token               │
    │  2. Find class by instructor_id          │
    │  3. Create session record:               │
    │     - status: 'active'                   │
    │     - started_at: NOW()                  │
    │     - meeting_link: url                  │
    │  4. Broadcast socket event               │
    │                                          │
    └──────────────────────┬──────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Response to │ │ Store in    │ │ Socket emit │
    │ Extension   │ │ PostgreSQL  │ │ session:    │
    │ { session } │ │             │ │ started     │
    └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │                               │
           ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │ Service     │                 │ Dashboard   │
    │ Worker      │                 │ receives    │
    │ stores in   │                 │ notification│
    │ IndexedDB   │                 │ shows new   │
    │ starts      │                 │ active      │
    │ tracking    │                 │ session     │
    └─────────────┘                 └─────────────┘


PHASE 3: PARTICIPANT TRACKING (During Session)
══════════════════════════════════════════════

    People Panel in Google Meet
              │
              │ MutationObserver detects DOM change
              ▼
    ┌─────────────────────┐
    │ Participant         │
    │ Detector compares   │
    │ current vs tracked  │
    │ participants        │
    └──────────┬──────────┘
               │
        ┌──────┴──────┐
        │             │
   NEW PARTICIPANT    PARTICIPANT LEFT
        │                    │
        ▼                    ▼
    ┌─────────────┐    ┌─────────────┐
    │ PARTICIPANT_│    │ PARTICIPANT_│
    │ JOINED      │    │ LEFT        │
    │ { name,     │    │ { id,       │
    │   timestamp }│    │   timestamp}│
    └──────┬──────┘    └──────┬──────┘
           │                  │
           └────────┬─────────┘
                    │
                    ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │                     │
    │ 1. Store locally    │
    │ 2. Match to student │
    │ 3. Send to backend  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │ JOIN EVENT:                              │
    │ 1. Create/update attendance_record       │
    │    - status: 'present'                   │
    │    - first_joined_at: timestamp          │
    │ 2. Create attendance_interval            │
    │    - joined_at: timestamp                │
    │    - left_at: NULL                       │
    │                                          │
    │ LEAVE EVENT:                             │
    │ 1. Update attendance_interval            │
    │    - left_at: timestamp                  │
    │ 2. Update attendance_record              │
    │    - last_left_at: timestamp             │
    │    - total_duration_minutes: calculated  │
    │                                          │
    │ 3. Socket broadcast to session room      │
    └──────────────────────┬──────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Dashboard   │
                    │ Live Feed   │
                    │ updates     │
                    │ attendance  │
                    │ list        │
                    └─────────────┘


PHASE 4: SESSION END
════════════════════

    Instructor clicks "End Session" OR leaves meeting
              │
              ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ PUT /sessions/:id/  │
    │ end-with-timestamp  │
    │                     │
    │ { endedAt: ISO }    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │ 1. Update session:                       │
    │    - status: 'ended'                     │
    │    - ended_at: timestamp                 │
    │                                          │
    │ 2. Close all open intervals:             │
    │    UPDATE attendance_intervals           │
    │    SET left_at = ended_at                │
    │    WHERE session_id = ? AND left_at NULL │
    │                                          │
    │ 3. Recalculate all durations:            │
    │    For each participant, sum intervals   │
    │                                          │
    │ 4. Mark absent students:                 │
    │    Students in class roster not in       │
    │    attendance_records → status: 'absent' │
    │                                          │
    │ 5. Socket broadcast session:ended        │
    └──────────────────────┬──────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Extension   │ │ Database    │ │ Dashboard   │
    │ clears      │ │ has final   │ │ moves       │
    │ local state │ │ attendance  │ │ session to  │
    │             │ │ records     │ │ history     │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Participation Event Detection Flow

This diagram details how each type of participation event is detected and processed.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PARTICIPATION EVENT DETECTION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                         GOOGLE MEET PAGE DOM
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ PEOPLE  │                 │  CHAT   │                 │ TOAST   │
│ PANEL   │                 │ PANEL   │                 │ NOTIFS  │
└────┬────┘                 └────┬────┘                 └────┬────┘
     │                           │                           │
     ▼                           ▼                           ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│ Participant │           │ Chat        │           │ Reaction    │
│ Detector    │           │ Monitor     │           │ Detector    │
│             │           │             │           │             │
│ Detects:    │           │ Detects:    │           │ Detects:    │
│ - Join      │           │ - Messages  │           │ - Emoji     │
│ - Leave     │           │ - Sender    │           │ - Who       │
│ - Mic state │           │ - Text      │           │             │
└──────┬──────┘           └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       │                         │                         │
       │                    ┌────┴─────┐                   │
       │                    │          │                   │
       │              ┌─────┴────┐ ┌───┴───────┐          │
       │              ▼          ▼ ▼           │          │
       │        ┌─────────┐  ┌─────────┐       │          │
       │        │Hand Raise│  │ Media   │       │          │
       │        │Detector │  │ State   │       │          │
       │        │         │  │Detector │       │          │
       │        │Detects: │  │         │       │          │
       │        │- Raised │  │Detects: │       │          │
       │        │- Lowered│  │- Mic on │       │          │
       │        └────┬────┘  └────┬────┘       │          │
       │             │            │            │          │
       └─────────────┴────────────┴────────────┴──────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │      EVENT EMITTER       │
                    │                          │
                    │ queueEvent(type, data)   │
                    │                          │
                    │ Responsibilities:        │
                    │ - Deduplicate events     │
                    │ - Add timestamps         │
                    │ - Format payload         │
                    │ - Send to Service Worker │
                    └────────────┬─────────────┘
                                 │
                                 │ chrome.runtime.sendMessage
                                 ▼
                    ┌──────────────────────────┐
                    │     SERVICE WORKER       │
                    │                          │
                    │ Message Handler:         │
                    │                          │
                    │ switch(message.type) {   │
                    │   case PARTICIPANT_JOINED│
                    │   case PARTICIPANT_LEFT  │
                    │   case CHAT_MESSAGE      │
                    │   case REACTION          │
                    │   case HAND_RAISE        │
                    │   case MIC_TOGGLE        │
                    │ }                        │
                    └────────────┬─────────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │             │             │
                   ▼             ▼             ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │ Store in    │ │ Match to    │ │ Send to     │
          │ IndexedDB   │ │ Student     │ │ Backend     │
          │ (offline    │ │ (by name    │ │ API         │
          │  support)   │ │  matching)  │ │             │
          └─────────────┘ └─────────────┘ └──────┬──────┘
                                                 │
                                                 ▼
                    ┌──────────────────────────────────────┐
                    │           BACKEND SERVER              │
                    │                                       │
                    │ POST /sessions/:id/live-event         │
                    │                                       │
                    │ Body:                                 │
                    │ {                                     │
                    │   eventType: "chat" | "reaction" |    │
                    │              "hand_raise" | "mic_on"  │
                    │   participantName: "John Doe",        │
                    │   timestamp: "2025-12-03T10:30:00Z",  │
                    │   data: { message: "..." } // varies  │
                    │ }                                     │
                    │                                       │
                    │ Processing:                           │
                    │ 1. Validate event data                │
                    │ 2. Find/match student_id              │
                    │ 3. INSERT into participation_logs     │
                    │ 4. Broadcast via Socket.io            │
                    └───────────────────┬──────────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                        ▼               ▼               ▼
                  ┌─────────┐     ┌─────────┐     ┌─────────┐
                  │ Database│     │ Socket  │     │ Response│
                  │ INSERT  │     │ Emit    │     │ to      │
                  │         │     │ partici-│     │ Extension│
                  │ partic- │     │ pation: │     │         │
                  │ ipation_│     │ logged  │     │ {success}│
                  │ logs    │     │         │     │         │
                  └─────────┘     └────┬────┘     └─────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Dashboard   │
                              │ Live Feed   │
                              │             │
                              │ Real-time   │
                              │ display of  │
                              │ event       │
                              └─────────────┘
```

---

## 3. Attendance Interval Tracking Flow

This diagram shows the precision attendance tracking with duration calculation.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ATTENDANCE INTERVAL TRACKING FLOW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

SCENARIO: Student joins, leaves for break, rejoins, session ends
═══════════════════════════════════════════════════════════════

Timeline:
    10:00 AM         10:30 AM         10:45 AM         11:00 AM
       │                │                │                │
       ▼                ▼                ▼                ▼
    Student          Student          Student          Session
    JOINS            LEAVES           REJOINS          ENDS


STEP 1: First Join (10:00 AM)
─────────────────────────────
    Event: PARTICIPANT_JOINED
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Check attendance_records for student  │
    │    → NOT FOUND (first time)              │
    │                                          │
    │ 2. INSERT attendance_records:            │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    student_id: stud-456 (if matched)     │
    │    status: 'present'                     │
    │    first_joined_at: 10:00:00             │
    │    total_duration_minutes: 0             │
    │                                          │
    │ 3. INSERT attendance_intervals:          │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    joined_at: 10:00:00                   │
    │    left_at: NULL  ◄── Still in meeting   │
    └─────────────────────────────────────────┘


STEP 2: Leave for Break (10:30 AM)
──────────────────────────────────
    Event: PARTICIPANT_LEFT
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Find open interval (left_at IS NULL)  │
    │                                          │
    │ 2. UPDATE attendance_intervals:          │
    │    SET left_at = 10:30:00                │
    │    WHERE session_id = sess-123           │
    │      AND participant_name = "Juan..."    │
    │      AND left_at IS NULL                 │
    │                                          │
    │ 3. Calculate interval duration:          │
    │    10:30 - 10:00 = 30 minutes            │
    │                                          │
    │ 4. UPDATE attendance_records:            │
    │    last_left_at: 10:30:00                │
    │    total_duration_minutes: 30            │
    └─────────────────────────────────────────┘


Database State After Step 2:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_records                                                               │
├────────────┬──────────────────┬─────────┬──────────────┬───────────┬───────────┤
│ session_id │ participant_name │ status  │ first_joined │ last_left │ duration  │
├────────────┼──────────────────┼─────────┼──────────────┼───────────┼───────────┤
│ sess-123   │ Juan Dela Cruz   │ present │ 10:00:00     │ 10:30:00  │ 30 min    │
└────────────┴──────────────────┴─────────┴──────────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals                                                             │
├────────────┬──────────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │
├────────────┼──────────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │  ◄── Interval 1 (closed)
└────────────┴──────────────────┴────────────┴────────────┘


STEP 3: Rejoin After Break (10:45 AM)
─────────────────────────────────────
    Event: PARTICIPANT_JOINED
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Check attendance_records              │
    │    → FOUND (already tracked)             │
    │                                          │
    │ 2. INSERT NEW attendance_intervals:      │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    joined_at: 10:45:00                   │
    │    left_at: NULL  ◄── New open interval  │
    │                                          │
    │ 3. attendance_records unchanged          │
    │    (will update when leaves again)       │
    └─────────────────────────────────────────┘


Database State After Step 3:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals                                                             │
├────────────┬──────────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │
├────────────┼──────────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │  ◄── Interval 1 (closed)
│ sess-123   │ Juan Dela Cruz   │ 10:45:00   │ NULL       │  ◄── Interval 2 (OPEN)
└────────────┴──────────────────┴────────────┴────────────┘


STEP 4: Session Ends (11:00 AM)
───────────────────────────────
    Event: SESSION_END
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. UPDATE session:                       │
    │    status = 'ended'                      │
    │    ended_at = 11:00:00                   │
    │                                          │
    │ 2. Close ALL open intervals:             │
    │    UPDATE attendance_intervals           │
    │    SET left_at = 11:00:00                │
    │    WHERE session_id = sess-123           │
    │      AND left_at IS NULL                 │
    │                                          │
    │ 3. Recalculate total durations:          │
    │    For each participant:                 │
    │    SUM of (left_at - joined_at)          │
    │    across all their intervals            │
    │                                          │
    │    Juan Dela Cruz:                       │
    │    Interval 1: 30 min (10:00-10:30)      │
    │    Interval 2: 15 min (10:45-11:00)      │
    │    TOTAL: 45 minutes                     │
    │                                          │
    │ 4. UPDATE attendance_records:            │
    │    total_duration_minutes = 45           │
    │    last_left_at = 11:00:00               │
    │                                          │
    │ 5. Mark absent students:                 │
    │    For students in class roster          │
    │    NOT in attendance_records:            │
    │    INSERT with status = 'absent'         │
    └─────────────────────────────────────────┘


FINAL Database State:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_records                                                               │
├────────────┬──────────────────┬─────────┬──────────────┬───────────┬───────────┤
│ session_id │ participant_name │ status  │ first_joined │ last_left │ duration  │
├────────────┼──────────────────┼─────────┼──────────────┼───────────┼───────────┤
│ sess-123   │ Juan Dela Cruz   │ present │ 10:00:00     │ 11:00:00  │ 45 min    │
│ sess-123   │ Maria Santos     │ absent  │ NULL         │ NULL      │ 0 min     │
│ sess-123   │ Pedro Reyes      │ present │ 10:05:00     │ 11:00:00  │ 55 min    │
└────────────┴──────────────────┴─────────┴──────────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals (for Juan Dela Cruz)                                        │
├────────────┬──────────────────┬────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │ duration   │
├────────────┼──────────────────┼────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │ 30 min     │
│ sess-123   │ Juan Dela Cruz   │ 10:45:00   │ 11:00:00   │ 15 min     │
├────────────┴──────────────────┴────────────┴────────────┼────────────┤
│                                               TOTAL     │ 45 min     │
└─────────────────────────────────────────────────────────┴────────────┘
```

---

## 4. Dashboard Real-Time Update Flow

This diagram shows how the dashboard receives and displays real-time updates.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD REAL-TIME UPDATE FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Instructor opens Dashboard
              │
              ▼
    ┌─────────────────────┐
    │ React App mounts    │
    │                     │
    │ AuthContext checks  │
    │ for valid JWT       │
    └──────────┬──────────┘
               │
               │ Valid token
               ▼
    ┌─────────────────────┐
    │ WebSocketContext    │
    │ initializes         │
    │                     │
    │ socket.connect()    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐        ┌─────────────────────┐
    │ Emit:               │        │                     │
    │ join_instructor_room├───────►│   Backend Socket    │
    │ { userId }          │        │                     │
    └─────────────────────┘        │   Joins room:       │
                                   │   instructor:{id}   │
                                   └─────────────────────┘


WHEN EXTENSION SENDS EVENT:
═══════════════════════════

    Extension POST /sessions/:id/live-event
              │
              ▼
    ┌─────────────────────┐
    │ Backend processes   │
    │ event               │
    │                     │
    │ Stores in database  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Socket.io broadcast │
    │                     │
    │ io.to(`instructor:  │
    │   ${instructorId}`) │
    │   .emit('partici-   │
    │   pation:logged',   │
    │   eventData)        │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                          DASHBOARD (React)                                   │
    │                                                                              │
    │  ┌─────────────────────────────────────────────────────────────────────┐    │
    │  │ WebSocketContext                                                     │    │
    │  │                                                                      │    │
    │  │ socket.on('participation:logged', (data) => {                        │    │
    │  │   // Update React state                                              │    │
    │  │   addParticipationEvent(data);                                       │    │
    │  │ });                                                                  │    │
    │  └────────────────────────────────────┬────────────────────────────────┘    │
    │                                       │                                      │
    │                                       │ Context update triggers re-render    │
    │                                       ▼                                      │
    │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
    │  │ LiveFeed.jsx        │  │ SessionDetail.jsx   │  │ Home.jsx            │  │
    │  │                     │  │                     │  │                     │  │
    │  │ Shows event in      │  │ Updates attendance  │  │ Updates stats       │  │
    │  │ real-time feed      │  │ list if viewing     │  │ counters            │  │
    │  │ with animation      │  │ that session        │  │                     │  │
    │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
    │                                                                              │
    └──────────────────────────────────────────────────────────────────────────────┘


EVENT TYPES AND UI UPDATES:
═══════════════════════════

    ┌──────────────────────┬──────────────────────────────────────────────────────┐
    │ Socket Event         │ UI Update                                            │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ session:started      │ - New card appears in Active Sessions                │
    │                      │ - Notification badge increments                      │
    │                      │ - Live Feed shows "Session started" message          │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ session:ended        │ - Card moves to Session History                      │
    │                      │ - Stats recalculate                                  │
    │                      │ - Live Feed shows "Session ended" message            │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participant:joined   │ - Attendance list adds row                           │
    │                      │ - Participant count increments                       │
    │                      │ - Live Feed shows join event                         │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participant:left     │ - Attendance row updates duration                    │
    │                      │ - Live Feed shows leave event                        │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows interaction                        │
    │ (chat)               │ - Chat icon appears on participant row               │
    │                      │ - Session participation count increments             │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows reaction with emoji                │
    │ (reaction)           │ - Reaction count increments                          │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows hand raise                         │
    │ (hand_raise)         │ - Hand icon appears on participant row               │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows mic activity                       │
    │ (mic_toggle)         │ - Mic icon updates on participant row                │
    └──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. Summary: End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE DATA FLOW SUMMARY                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   GOOGLE MEET   │
    │   (DOM Events)  │
    └────────┬────────┘
             │
             │ MutationObserver
             ▼
    ┌─────────────────┐
    │ CONTENT SCRIPTS │
    │ (Detectors)     │
    └────────┬────────┘
             │
             │ chrome.runtime.sendMessage
             ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ SERVICE WORKER  │────►│    IndexedDB    │
    │ (Coordinator)   │     │ (Local Storage) │
    └────────┬────────┘     └─────────────────┘
             │
             │ HTTP POST (X-Extension-Token)
             ▼
    ┌─────────────────┐
    │ BACKEND SERVER  │
    │ (Express.js)    │
    └────────┬────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐
│ PSQL  │ │Socket │ │HTTP   │
│ Store │ │Broad- │ │Resp-  │
│       │ │cast   │ │onse   │
└───────┘ └───┬───┘ └───────┘
              │
              │ WebSocket
              ▼
    ┌─────────────────┐
    │   DASHBOARD     │
    │   (React SPA)   │
    │                 │
    │ Real-time UI    │
    │ updates         │
    └─────────────────┘
```

---

*End of Part 3. Continue to Part 4: Development Progress and Risk Assessment.*
# Engagium System Framework
# Part 4: Development Progress and Risk Assessment

> **Comprehensive Technical Reference Document**
> 
> This is Part 4 of 4 of the complete Engagium System Framework.
> - Part 1: Methodology and Technology Stack
> - Part 2: Architecture and Modules
> - Part 3: Data Layer (Database Schema and Data Flows)
> - Part 4: Development Progress and Risk Assessment (this document)

---

# Section A: Development Progress

## Overview

| Category | Status | Count |
|----------|--------|-------|
| ✅ Completed Components | Production-ready | 15 |
| 🔄 Under Development | Code exists, needs validation | 4 |
| ⏳ Planned Enhancements | Future roadmap | 8 |

---

## 1. Completed Components ✅

### 1.1 Authentication & Authorization

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ Complete | Email/password signup with validation |
| User Login | ✅ Complete | JWT-based authentication |
| Access Tokens | ✅ Complete | Short-lived (15 min) for API requests |
| Refresh Tokens | ✅ Complete | Long-lived (7 days) for session persistence |
| Password Reset | ✅ Complete | Email-based reset flow via Nodemailer |
| Profile Management | ✅ Complete | Update name, email, password |
| Extension Token Auth | ✅ Complete | Separate long-lived tokens for extension |
| Token Revocation | ✅ Complete | Revoke individual or all extension tokens |
| Flexible Auth Middleware | ✅ Complete | Accepts JWT or extension token |

**Files Involved:**
- `backend/src/controllers/authController.js`
- `backend/src/controllers/extensionTokenController.js`
- `backend/src/middleware/authMiddleware.js`
- `frontend/src/contexts/AuthContext.jsx`

### 1.2 Class Management

| Feature | Status | Details |
|---------|--------|---------|
| Create Class | ✅ Complete | Name, subject, section, description |
| Edit Class | ✅ Complete | Update all class properties |
| Delete Class | ✅ Complete | Cascade deletes related data |
| Archive/Activate | ✅ Complete | Soft archive with status field |
| Class Schedule | ✅ Complete | Days and time stored as JSONB |
| Class Statistics | ✅ Complete | Aggregate attendance/session stats |

**Files Involved:**
- `backend/src/controllers/classController.js`
- `frontend/src/pages/MyClasses.jsx`
- `frontend/src/pages/ClassDetailsPage.jsx`

### 1.3 Meeting Link Management

| Feature | Status | Details |
|---------|--------|---------|
| Add Meeting Links | ✅ Complete | Multiple links per class |
| Edit/Delete Links | ✅ Complete | Full CRUD operations |
| Primary Link Flag | ✅ Complete | Mark default meeting link |
| Platform Detection | ✅ Complete | Auto-detect Meet/Zoom/Teams |
| Link-to-Class Mapping | ✅ Complete | Extension maps URLs to classes |

**Files Involved:**
- `backend/src/controllers/classController.js` (links endpoints)
- `_extension/options/options.jsx`

### 1.4 Student Management

| Feature | Status | Details |
|---------|--------|---------|
| Add Students | ✅ Complete | Manual entry with validation |
| Edit Students | ✅ Complete | Update name, student ID |
| Delete Students | ✅ Complete | Individual deletion |
| CSV Import | ✅ Complete | Bulk import with validation |
| Bulk Delete | ✅ Complete | Multi-select deletion |
| Duplicate Detection | ✅ Complete | Detect by name similarity |
| Student Tagging | ✅ Complete | Custom tags with colors |
| Student Notes | ✅ Complete | Timestamped notes per student |

**Files Involved:**
- `backend/src/controllers/studentController.js`
- `backend/src/controllers/studentTagController.js`
- `backend/src/controllers/studentNoteController.js`
- `frontend/src/pages/ClassDetailsPage.jsx`

### 1.5 Session Lifecycle Management

| Feature | Status | Details |
|---------|--------|---------|
| Start Session from Extension | ✅ Complete | Creates session with meeting URL |
| End Session from Extension | ✅ Complete | Updates status and calculates durations |
| End Session from Dashboard | ✅ Complete | Manual session termination |
| Session Status Tracking | ✅ Complete | scheduled → active → ended |
| Session History | ✅ Complete | List all past sessions |
| Session Calendar View | ✅ Complete | Calendar visualization |
| Session Details Page | ✅ Complete | Attendance and participation view |

**Files Involved:**
- `backend/src/controllers/sessionController.js`
- `_extension/background/session-manager.js`
- `frontend/src/pages/Sessions.jsx`
- `frontend/src/pages/SessionDetailPage.jsx`

### 1.6 Attendance Tracking (Join/Leave)

| Feature | Status | Details |
|---------|--------|---------|
| Participant Join Detection | ✅ Complete | People Panel MutationObserver |
| Participant Leave Detection | ✅ Complete | DOM removal detection |
| Attendance Records | ✅ Complete | Final status per participant |
| Attendance Intervals | ✅ Complete | Precise join/leave timestamps |
| Duration Calculation | ✅ Complete | Sum of all intervals |
| Student Matching | ✅ Complete | Match participant names to roster |
| Absent Marking | ✅ Complete | Auto-mark students not in attendance |
| Exempted Accounts | ✅ Complete | Exclude TAs/observers from tracking |

**Files Involved:**
- `_extension/content/google-meet/participant-detector.js`
- `backend/src/controllers/sessionController.js` (attendance endpoints)
- `database/schema.sql` (attendance_records, attendance_intervals)

### 1.7 Real-Time Communication

| Feature | Status | Details |
|---------|--------|---------|
| WebSocket Server | ✅ Complete | Socket.io integration |
| Instructor Rooms | ✅ Complete | Room per instructor for broadcasts |
| Session Rooms | ✅ Complete | Room per active session |
| Session Events | ✅ Complete | started, ended broadcasts |
| Attendance Events | ✅ Complete | join, leave broadcasts |
| Participation Events | ✅ Complete | Real-time event propagation |
| Dashboard Updates | ✅ Complete | React state updates on events |

**Files Involved:**
- `backend/src/socket/socketHandler.js`
- `frontend/src/contexts/WebSocketContext.jsx`
- `frontend/src/pages/LiveFeed.jsx`

### 1.8 Browser Extension Core

| Feature | Status | Details |
|---------|--------|---------|
| Manifest V3 Structure | ✅ Complete | Service worker, content scripts |
| Meeting URL Detection | ✅ Complete | Detects meet.google.com URLs |
| Popup Interface | ✅ Complete | Session control UI |
| Options Page | ✅ Complete | Settings and authentication |
| Local Storage (IndexedDB) | ✅ Complete | Offline data persistence |
| Chrome Storage API | ✅ Complete | Token and settings storage |
| Message Passing | ✅ Complete | Content → Service Worker |
| API Client | ✅ Complete | HTTP requests with auth |
| Sync Queue | ✅ Complete | Retry failed requests |

**Files Involved:**
- `_extension/manifest.json`
- `_extension/background/service-worker.js`
- `_extension/popup/popup.jsx`
- `_extension/options/options.jsx`

### 1.9 Web Dashboard

| Feature | Status | Details |
|---------|--------|---------|
| Landing Page | ✅ Complete | Public page with login/register |
| Home Dashboard | ✅ Complete | Overview with stats |
| Live Feed Page | ✅ Complete | Real-time event display |
| My Classes Page | ✅ Complete | Class list and management |
| Class Details Page | ✅ Complete | Students, sessions, settings |
| Sessions Page | ✅ Complete | History and calendar |
| Session Detail Page | ✅ Complete | Attendance and participation |
| Analytics Page | ✅ Complete | Basic metrics display |
| Settings Page | ✅ Complete | Profile and extension tokens |
| Notifications Page | ✅ Complete | System notifications |
| Responsive Design | ✅ Complete | Tailwind CSS responsive |

**Files Involved:**
- `frontend/src/pages/*.jsx`
- `frontend/src/components/**`

---

## 2. Components Under Development 🔄

These components have implementation code but require field testing and validation.

### 2.1 Chat Message Detection

| Aspect | Status | Notes |
|--------|--------|-------|
| DOM Observer | 🔄 Implemented | Watches for Chat Panel changes |
| Message Extraction | 🔄 Implemented | Extracts sender, text, timestamp |
| Backend Integration | 🔄 Implemented | Stores in participation_logs |
| Dashboard Display | 🔄 Implemented | Shows in session detail |

**Known Limitations:**
- Chat Panel must be open for detection
- Google Meet DOM structure may change
- Deduplication may miss edge cases

**Validation Needed:**
- Test with various chat message formats
- Verify accuracy across different meeting scenarios
- Confirm message ordering is preserved

**Files:**
- `_extension/content/google-meet/chat-monitor.js`

### 2.2 Reaction Detection

| Aspect | Status | Notes |
|--------|--------|-------|
| Toast Observer | 🔄 Implemented | Watches for "[Name] reacted with..." |
| Emoji Mapping | 🔄 Implemented | Maps descriptions to emoji |
| Backend Integration | 🔄 Implemented | Stores in participation_logs |
| Deduplication | 🔄 Implemented | 3-second window |

**Known Limitations:**
- Relies on toast notification text
- Toast may not appear for all reactions
- Emoji description mapping may be incomplete

**Validation Needed:**
- Test all Google Meet reaction types
- Verify emoji mapping completeness
- Test rapid reaction scenarios

**Files:**
- `_extension/content/google-meet/reaction-detector.js`

### 2.3 Hand Raise Detection

| Aspect | Status | Notes |
|--------|--------|-------|
| Raised Hands Section | 🔄 Implemented | Monitors People Panel section |
| Toast Observer | 🔄 Implemented | "[Name] has raised a hand" |
| Hand Lower Detection | 🔄 Implemented | Tracks when hands are lowered |
| Backend Integration | 🔄 Implemented | Stores in participation_logs |

**Known Limitations:**
- People Panel must be open
- Requires "Raised hands" section to be visible
- May miss quick raise/lower cycles

**Validation Needed:**
- Test with multiple simultaneous hand raises
- Verify timing accuracy
- Test "Lower all hands" host action

**Files:**
- `_extension/content/google-meet/hand-raise-detector.js`

### 2.4 Microphone Toggle Detection

| Aspect | Status | Notes |
|--------|--------|-------|
| Button State Observer | 🔄 Implemented | Monitors unmute button disabled state |
| Unmute Detection | 🔄 Implemented | Only tracks mic turning ON |
| Backend Integration | 🔄 Implemented | Stores in participation_logs |

**Known Limitations:**
- Only detects unmute (not mute)
- Requires People Panel to be open
- Button state may not update immediately

**Validation Needed:**
- Test accuracy of unmute detection
- Verify no false positives from UI interactions
- Test with rapid mute/unmute cycles

**Files:**
- `_extension/content/google-meet/media-state-detector.js`

---

## 3. Planned Enhancements ⏳

These features are on the roadmap but not yet implemented.

### 3.1 Data Export

| Feature | Priority | Description |
|---------|----------|-------------|
| CSV Export - Attendance | High | Export attendance records to CSV |
| CSV Export - Participation | High | Export participation logs to CSV |
| PDF Reports | Medium | Generate formatted PDF reports |
| Bulk Export | Medium | Export all class data at once |

### 3.2 Advanced Analytics

| Feature | Priority | Description |
|---------|----------|-------------|
| Attendance Trends | High | Line charts over time |
| Participation Heatmaps | Medium | Visual engagement patterns |
| Student Engagement Scores | Medium | Composite participation metrics |
| Comparative Analytics | Low | Compare across classes/students |
| Predictive Alerts | Low | Identify at-risk students |

### 3.3 Session Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Session Summaries | Medium | Auto-generated session recap |
| Session Templates | Low | Reusable session configurations |
| Recurring Sessions | Low | Schedule repeating sessions |
| Session Notes | Low | Instructor notes per session |

### 3.4 Platform Support

| Feature | Priority | Description |
|---------|----------|-------------|
| Zoom Integration | Medium | Extend to Zoom meetings |
| Microsoft Teams | Low | Extend to Teams meetings |
| Cross-Platform | Low | Support multiple platforms per class |

### 3.5 Notification System

| Feature | Priority | Description |
|---------|----------|-------------|
| Email Notifications | Medium | Session reminders, alerts |
| Push Notifications | Low | Browser push for events |
| Notification Preferences | Low | Customizable notification settings |

### 3.6 User Experience

| Feature | Priority | Description |
|---------|----------|-------------|
| Dark Mode | Low | Toggle between light/dark themes |
| Keyboard Shortcuts | Low | Quick actions via keyboard |
| Mobile Optimization | Low | Improved mobile experience |
| Accessibility | Medium | ARIA labels, screen reader support |

### 3.7 Administration

| Feature | Priority | Description |
|---------|----------|-------------|
| Admin Dashboard | Low | Multi-tenant administration |
| Usage Analytics | Low | System-wide usage metrics |
| User Management | Low | Admin user CRUD |

### 3.8 API & Integration

| Feature | Priority | Description |
|---------|----------|-------------|
| API Documentation | Medium | OpenAPI/Swagger docs |
| Webhook Support | Low | External system integration |
| LMS Integration | Low | Canvas, Moodle connectors |

---

## 4. Testing Status

### 4.1 Completed Testing

| Test Type | Status | Coverage |
|-----------|--------|----------|
| Backend API Routes | ✅ Manual testing | All endpoints |
| Frontend Navigation | ✅ Manual testing | All pages |
| Extension Installation | ✅ Manual testing | Chrome |
| Session Start/End | ✅ Manual testing | Happy path |
| Attendance Tracking | ✅ Manual testing | Basic scenarios |

### 4.2 Testing Needed

| Test Type | Status | Priority |
|-----------|--------|----------|
| Participation Detection | 🔄 In progress | High |
| Edge Case Handling | ⏳ Not started | High |
| Load Testing | ⏳ Not started | Medium |
| Cross-Browser | ⏳ Not started | Low |
| Automated Tests | ⏳ Not started | Medium |

---

## 5. Technical Debt

| Item | Priority | Description |
|------|----------|-------------|
| Error Handling | Medium | Improve error messages and recovery |
| Input Validation | Medium | Strengthen server-side validation |
| Code Documentation | Low | Add JSDoc comments |
| Component Refactoring | Low | Extract reusable components |
| Test Coverage | Medium | Add unit and integration tests |

---

## 6. Development Timeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT PROGRESS TIMELINE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

     October 2025           November 2025           December 2025
          │                      │                       │
          │                      │                       │
          ▼                      ▼                       ▼
    ┌───────────┐          ┌───────────┐          ┌───────────┐
    │ Phase 1   │          │ Phase 2   │          │ Phase 3   │
    │           │          │           │          │           │
    │ - Backend │          │ - Extension│         │ - Thesis  │
    │   setup   │          │   develop │          │   docs    │
    │ - DB      │          │ - Frontend│          │ - Testing │
    │   schema  │          │   pages   │          │ - Validate│
    │ - Auth    │          │ - Real-   │          │   detect- │
    │   system  │          │   time    │          │   ors     │
    │ - Basic   │          │ - Parti-  │          │           │
    │   CRUD    │          │   cipation│          │           │
    │           │          │   detect  │          │           │
    └───────────┘          └───────────┘          └───────────┘
          │                      │                       │
          │                      │                       │
          └──────────────────────┴───────────────────────┘
                                 │
                                 ▼
                    Current State: December 2025
                    
                    ✅ Core functionality complete
                    🔄 Participation detection needs validation
                    ⏳ Advanced features planned for future
```

---

## 7. Known Issues

| Issue | Severity | Description | Workaround |
|-------|----------|-------------|------------|
| Google Meet DOM Changes | High | DOM structure may change with updates | Monitor and update selectors |
| People Panel Required | Medium | Participant detection needs panel open | Instruct users to keep panel open |
| Chat Panel Required | Medium | Chat detection needs panel open | Instruct users to open chat panel |
| Extension Sleep | Low | Service worker may sleep (MV3) | Implemented keep-alive logic |
| Name Matching | Low | Fuzzy matching may have false positives | Manual correction in dashboard |

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | October 2025 | Initial backend and database setup |
| 0.2.0 | November 2025 | Extension core and frontend dashboard |
| 0.2.1 | November 2025 | Attendance interval tracking |
| 0.2.2 | December 2025 | Participation detectors (chat, reaction, hand raise, mic) |
| 0.2.3 | December 2025 | Documentation and thesis materials |

---

---

# Section B: Risk Assessment and Mitigation

## Risk Assessment Matrix

| Risk ID | Risk Description | Likelihood | Impact | Risk Level | Mitigation Strategy |
|---------|------------------|------------|--------|------------|---------------------|
| R01 | Google Meet UI/DOM changes | High | High | **Critical** | Modular DOM selectors in config file; regular monitoring of Google Meet updates; fallback detection methods |
| R02 | Chrome extension API changes | Medium | High | **High** | Use stable Manifest V3 APIs; avoid deprecated features; monitor Chrome release notes |
| R03 | Browser throttling of background scripts | Medium | Medium | **Medium** | Implement keep-alive mechanisms; use service worker efficiently; batch API calls |
| R04 | Internet connectivity issues | Medium | Medium | **Medium** | Offline-first architecture with IndexedDB; sync queue for failed requests; automatic retry with exponential backoff |
| R05 | Incomplete participation detection | High | Medium | **High** | Clearly document detection requirements (panels must be open); provide user guidance; mark as "under development" features |
| R06 | Name matching inaccuracies | Medium | Low | **Low** | Fuzzy matching algorithm; manual correction UI in dashboard; student roster management |
| R07 | Database performance degradation | Low | High | **Medium** | Proper indexing; query optimization; pagination for large datasets |
| R08 | Authentication token compromise | Low | High | **Medium** | Short-lived access tokens; secure token storage; HTTPS enforcement; token revocation capability |
| R09 | WebSocket connection instability | Medium | Medium | **Medium** | Automatic reconnection logic; fallback to HTTP polling; connection status indicators |
| R10 | Limited testing sample size | High | Medium | **High** | Maximize faculty participation; document limitations; use statistical methods appropriate for sample size |
| R11 | Time constraints for development | Medium | Medium | **Medium** | Prioritize core features (MVP approach); iterative development; clear scope boundaries |
| R12 | Cross-browser compatibility issues | Medium | Low | **Low** | Focus on Chrome (primary target); document browser requirements; test on latest stable versions |

---

## Detailed Risk Analysis

### R01: Google Meet UI/DOM Changes

**Description:** Google frequently updates the Google Meet interface, which may change the DOM structure that the extension relies on for detecting participants and events.

**Impact:** Detection of participants, chat messages, reactions, and hand raises may fail completely or produce inaccurate results.

**Mitigation Strategies:**
1. **Centralized Selectors:** All DOM selectors are stored in `config.js` for easy updates
2. **ARIA-based Detection:** Use accessibility attributes (role, aria-label) which are more stable than class names
3. **Multiple Detection Methods:** Implement fallback detection strategies (e.g., toast notifications + panel monitoring)
4. **Monitoring:** Regular testing against live Google Meet to catch changes early
5. **Graceful Degradation:** System continues to function with reduced features if some detection fails

---

### R02: Chrome Extension API Changes

**Description:** Chrome may deprecate or modify extension APIs, particularly as Manifest V3 evolves.

**Impact:** Extension may stop functioning or require significant refactoring.

**Mitigation Strategies:**
1. **Manifest V3 Compliance:** Already using the latest manifest version
2. **Stable APIs Only:** Avoid experimental or deprecated APIs
3. **Documentation Review:** Monitor Chrome developer documentation for announcements
4. **Modular Architecture:** Service worker and content scripts are decoupled for easier updates

---

### R03: Browser Throttling of Background Scripts

**Description:** Chrome aggressively suspends service workers to conserve resources, which may interrupt tracking during long sessions.

**Impact:** Events may be missed if service worker is suspended at critical moments.

**Mitigation Strategies:**
1. **Keep-alive Mechanisms:** Periodic alarms to prevent suspension
2. **Content Script Primary:** Critical detection runs in content scripts (not affected by service worker suspension)
3. **Local Storage:** IndexedDB stores events before service worker processes them
4. **Event Batching:** Batch events to reduce wake-up frequency

---

### R04: Internet Connectivity Issues

**Description:** Users may experience network interruptions during online classes.

**Impact:** Participation events may fail to sync to the backend.

**Mitigation Strategies:**
1. **Offline-First Design:** All events stored locally in IndexedDB first
2. **Sync Queue:** Failed API requests are queued for retry
3. **Exponential Backoff:** Retry logic prevents overwhelming the server
4. **Status Indicators:** UI shows sync status to user
5. **Session Recovery:** Events are preserved even if browser closes unexpectedly

---

### R05: Incomplete Participation Detection

**Description:** Some participation types (chat, reactions, hand raises, mic toggles) require specific UI panels to be open and may not detect all events accurately.

**Impact:** Participation data may be incomplete, affecting accuracy metrics.

**Mitigation Strategies:**
1. **Clear Documentation:** User guide explains requirements (e.g., "Keep People Panel open")
2. **Visual Indicators:** Extension shows what is being tracked
3. **Attendance Priority:** Focus on attendance (join/leave) as primary, most reliable metric
4. **Status Labeling:** Mark participation features as "Beta" or "Under Development"
5. **User Feedback:** Provide mechanism for users to report detection issues

---

### R06: Name Matching Inaccuracies

**Description:** Participant display names in Google Meet may not exactly match student roster names.

**Impact:** Attendance records may not link to correct students, requiring manual correction.

**Mitigation Strategies:**
1. **Fuzzy Matching:** Algorithm tolerates minor variations (extra spaces, nicknames)
2. **Manual Linking:** Dashboard allows instructor to manually link participants to students
3. **Learning:** System can remember previous name mappings
4. **Unmatched Tracking:** Unmatched participants are still tracked, just not linked to roster

---

### R07: Database Performance Degradation

**Description:** As data accumulates over time, database queries may slow down.

**Impact:** Dashboard loading times increase, affecting user experience.

**Mitigation Strategies:**
1. **Proper Indexing:** All foreign keys and frequently queried columns are indexed
2. **Pagination:** Large result sets are paginated
3. **Query Optimization:** Use efficient JOIN patterns and avoid N+1 queries
4. **Archival:** Old sessions can be archived to separate tables (future enhancement)

---

### R08: Authentication Token Compromise

**Description:** Access tokens or extension tokens could be intercepted or stolen.

**Impact:** Unauthorized access to instructor's class and student data.

**Mitigation Strategies:**
1. **Short-lived Tokens:** Access tokens expire in 15 minutes
2. **HTTPS Only:** All API communication encrypted
3. **Token Revocation:** Users can revoke extension tokens from dashboard
4. **Secure Storage:** Tokens stored in Chrome's secure storage API
5. **No Sensitive Data in Tokens:** JWTs contain only user ID, not sensitive information

---

### R09: WebSocket Connection Instability

**Description:** WebSocket connections may drop due to network issues or server restarts.

**Impact:** Real-time updates stop appearing in dashboard.

**Mitigation Strategies:**
1. **Auto-Reconnection:** Socket.io automatically attempts to reconnect
2. **Connection Status:** UI indicates connection state
3. **Data Refresh:** Dashboard can manually refresh data if connection issues persist
4. **Graceful Fallback:** Core functionality works without real-time updates (just delayed)

---

### R10: Limited Testing Sample Size

**Description:** Small number of faculty testers may limit statistical validity of usability findings.

**Impact:** Survey results may not be generalizable; may not discover all usability issues.

**Mitigation Strategies:**
1. **Maximize Participation:** Coordinate with institution to encourage faculty participation
2. **Appropriate Statistics:** Use statistical methods suitable for small samples
3. **Qualitative Data:** Supplement quantitative data with qualitative feedback
4. **Document Limitations:** Clearly state sample size limitations in findings
5. **Multiple Testing Rounds:** If possible, conduct multiple testing sessions

---

### R11: Time Constraints for Development

**Description:** Academic timeline may not allow completion of all planned features.

**Impact:** Some features may be incomplete or untested.

**Mitigation Strategies:**
1. **MVP Approach:** Prioritize core features (attendance tracking) over advanced features
2. **Feature Prioritization:** Clear categorization of must-have vs nice-to-have
3. **Iterative Development:** Deliver working increments rather than big-bang release
4. **Scope Management:** Document planned vs implemented features clearly
5. **Technical Debt Tracking:** Acknowledge and document incomplete items

---

### R12: Cross-Browser Compatibility Issues

**Description:** Extension may not work correctly on browsers other than Chrome.

**Impact:** Users on other browsers cannot use the extension.

**Mitigation Strategies:**
1. **Primary Target:** Focus on Chrome as the primary supported browser
2. **Clear Requirements:** Document Chrome as required browser
3. **Standard APIs:** Use standard web APIs where possible for potential future porting
4. **Version Requirements:** Specify minimum Chrome version (120+)

---

## Risk Response Summary

| Response Type | Risks |
|---------------|-------|
| **Mitigate** | R01, R02, R03, R04, R05, R06, R07, R08, R09 |
| **Accept** | R10, R11, R12 |
| **Transfer** | None |
| **Avoid** | None |

---

## Contingency Plans

### If Google Meet DOM Changes Significantly
1. Pause tracking features temporarily
2. Analyze new DOM structure
3. Update selectors in config.js
4. Test thoroughly before re-enabling
5. Notify users of temporary service interruption

### If Extension Token is Compromised
1. User revokes all tokens from Settings page
2. Generate new extension token
3. Re-authenticate extension
4. Review access logs if available

### If Participation Detection Fails
1. Fall back to attendance-only tracking
2. Document which features are affected
3. Provide manual participation entry option
4. Work on updated detection logic

---

## Monitoring and Review

| Activity | Frequency |
|----------|-----------|
| Test extension against live Google Meet | Before each release |
| Review Chrome extension documentation | Monthly |
| Check database query performance | After significant data growth |
| Review error logs | Weekly during active testing |
| User feedback collection | Ongoing during testing phase |

---

---

# Appendix: Quick Reference

## File Structure Summary

```
engagium_v0.2/
├── _extension/                    # Chrome Extension
│   ├── manifest.json              # Extension manifest (V3)
│   ├── background/                # Service worker scripts
│   │   ├── service-worker.js      # Main coordinator
│   │   ├── session-manager.js     # Session state management
│   │   ├── api-client.js          # HTTP client
│   │   ├── socket-client.js       # WebSocket client
│   │   └── sync-queue.js          # Offline queue
│   ├── content/                   # Content scripts
│   │   └── google-meet/           # 14 detector modules
│   ├── popup/                     # Extension popup UI
│   ├── options/                   # Extension settings UI
│   └── utils/                     # Shared utilities
│
├── backend/                       # Node.js Backend
│   ├── server.js                  # Express server entry
│   └── src/
│       ├── controllers/           # 9 API controllers
│       ├── routes/                # Route definitions
│       ├── middleware/            # Auth middleware
│       ├── services/              # Email service
│       ├── socket/                # Socket.io handler
│       └── config/                # Database config
│
├── frontend/                      # React Dashboard
│   ├── src/
│   │   ├── App.jsx               # Root component
│   │   ├── pages/                # 12 page components
│   │   ├── components/           # UI components
│   │   ├── contexts/             # Auth, WebSocket
│   │   └── services/             # API services
│   └── vite.config.js            # Build config
│
└── database/                      # PostgreSQL
    ├── schema.sql                # 13 tables, 3 ENUMs
    └── migrations/               # Schema migrations
```

## Technology Summary

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18.2, Vite 6.1, Tailwind 3.3, React Query 4.24 |
| Backend | Node.js 18+, Express 4.18, Socket.io 4.6 |
| Database | PostgreSQL 14+, pg 8.8 |
| Extension | Manifest V3, React 18.2, Vite 7.2, idb 7.1 |

## Database Statistics

| Metric | Count |
|--------|-------|
| Tables | 13 |
| ENUM Types | 3 |
| Foreign Keys | 18 |
| Indexes | 24 |

## Participation Types

| Type | Detection Source | Status |
|------|------------------|--------|
| Attendance (Join/Leave) | People Panel | ✅ Complete |
| Chat Messages | Chat Panel | 🔄 Needs validation |
| Reactions | Toast notifications | 🔄 Needs validation |
| Hand Raises | People Panel | 🔄 Needs validation |
| Mic Unmute | People Panel | 🔄 Needs validation |

---

*End of Engagium System Framework (Part 4 of 4)*

*This comprehensive documentation was compiled from 8 source files in the techspecs folder and reflects the system state as of December 2025.*