# **CHAPTER 3 – METHODOLOGY APPENDICES**

---

# **APPENDIX A: Statistical Treatment Details**

## **A.1 Likert Scale Interpretation Table**

| **Mean Range** | **Verbal Interpretation** | **Descriptive Equivalent** |
|----------------|---------------------------|----------------------------|
| 4.21 – 5.00 | Strongly Agree | Very High |
| 3.41 – 4.20 | Agree | High |
| 2.61 – 3.40 | Neutral | Moderate |
| 1.81 – 2.60 | Disagree | Low |
| 1.00 – 1.80 | Strongly Disagree | Very Low |

## **A.2 System Usability Scale (SUS) Scoring Procedure**

The SUS consists of 10 items with 5-point Likert scale responses (1 = Strongly Disagree, 5 = Strongly Agree).

### **Step 1: Convert Item Scores**

For **odd-numbered items** (1, 3, 5, 7, 9):
- **Score contribution** = (item score - 1)

For **even-numbered items** (2, 4, 6, 8, 10):
- **Score contribution** = (5 - item score)

### **Step 2: Calculate Total Score**

Sum all converted scores from Step 1.

### **Step 3: Calculate Final SUS Score**

**Final SUS Score** = (Sum of converted scores) × 2.5

This yields a score ranging from 0 to 100.

### **Interpretation Guidelines**

| **SUS Score** | **Grade** | **Interpretation** |
|---------------|-----------|---------------------|
| 85 – 100 | A | Excellent usability |
| 73 – 84 | B | Good usability |
| 68 – 72 | C | Above average |
| 51 – 67 | D | Below average |
| 0 – 50 | F | Poor usability |

**Note**: A score of 68 represents the 50th percentile (average usability).

## **A.3 Accuracy Metrics Formulas**

### **Precision (Positive Predictive Value)**

Measures the proportion of detected events that were genuine events:

$$\text{Precision} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Positives (FP)}}$$

**Where:**
- **True Positives (TP)**: Events correctly detected by the system
- **False Positives (FP)**: Non-events incorrectly detected as events

### **Recall (Sensitivity)**

Measures the proportion of actual events successfully detected:

$$\text{Recall} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Negatives (FN)}}$$

**Where:**
- **False Negatives (FN)**: Actual events missed by the system

### **F1 Score**

The harmonic mean of precision and recall, providing a balanced accuracy measure:

$$F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

Alternatively:

$$F1 = \frac{2 \times \text{TP}}{2 \times \text{TP} + \text{FP} + \text{FN}}$$

### **Example Calculation**

Given:
- True Positives (TP) = 85
- False Positives (FP) = 5
- False Negatives (FN) = 10

**Precision** = 85 / (85 + 5) = 85 / 90 = **0.944** or **94.4%**

**Recall** = 85 / (85 + 10) = 85 / 95 = **0.895** or **89.5%**

**F1 Score** = 2 × (0.944 × 0.895) / (0.944 + 0.895) = **0.919** or **91.9%**

## **A.4 Cronbach's Alpha Formula**

Cronbach's Alpha (α) measures the internal consistency of multi-item scales:

$$\alpha = \frac{k}{k-1} \left(1 - \frac{\sum_{i=1}^{k} \sigma_i^2}{\sigma_T^2}\right)$$

**Where:**
- **k** = number of items in the scale
- **σᵢ²** = variance of item i
- **σ_T²** = variance of the total scale scores

### **Interpretation**

| **Cronbach's Alpha** | **Internal Consistency** |
|----------------------|--------------------------|
| α ≥ 0.90 | Excellent |
| 0.80 ≤ α < 0.90 | Good |
| 0.70 ≤ α < 0.80 | Acceptable |
| 0.60 ≤ α < 0.70 | Questionable |
| α < 0.60 | Poor |

---

# **APPENDIX B: Agile SDLC Detailed Phase Diagram**

## **B.1 Complete Agile SDLC Flowchart**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AGILE SDLC PHASES - ENGAGIUM                              │
│                           (Complete Development Flow)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │         PHASE 1                         │
    │   REQUIREMENTS ANALYSIS                 │
    │                                         │
    │  • Problem Identification               │
    │  • Stakeholder Consultation             │
    │  • Functional Requirements              │
    │  • Non-Functional Requirements          │
    │  • Technical Constraints                │
    └───────────────┬─────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────┐
    │         PHASE 2                         │
    │      SYSTEM DESIGN                      │
    │                                         │
    │  • Three-Tier Architecture Design       │
    │  • Database Schema (ERD)                │
    │  • API Endpoint Design                  │
    │  • Extension Module Design              │
    │  • WebSocket Architecture               │
    └───────────────┬─────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │         PHASE 3: INCREMENTAL DEVELOPMENT                                │
    │              (7 Iterative Cycles with Continuous Feedback)              │
    ├─────────────────────────────────────────────────────────────────────────┤
    │                                                                         │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 1 (Week 1-2): Infrastructure                       │     │
    │  │  • PostgreSQL database setup & schema implementation          │     │
    │  │  • Express server initialization & configuration              │     │
    │  │  • JWT authentication system development                      │     │
    │  │  • Basic user model & auth endpoints                          │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 2 (Week 3-4): Core CRUD Operations                 │     │
    │  │  • Class management (Create, Read, Update, Delete)            │     │
    │  │  • Student roster management & CSV import                     │     │
    │  │  • Session lifecycle handling (create, activate, end)         │     │
    │  │  • Frontend dashboard initial structure (React setup)         │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 3 (Week 5-7): Extension Core Functionality         │     │
    │  │  • Chrome extension Manifest V3 setup                         │     │
    │  │  • Google Meet session detection logic                        │     │
    │  │  • Content scripts for DOM observation                        │     │
    │  │  • Service worker for background processing                   │     │
    │  │  • Extension-backend communication protocol (HTTP + storage)  │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 4 (Week 8-10): Attendance Tracking                 │     │
    │  │  • Two-table model (attendance_records, attendance_intervals) │     │
    │  │  • Participant join/leave detection & logging                 │     │
    │  │  • Duration calculation algorithms                            │     │
    │  │  • Fuzzy name matching for participant-student correlation    │     │
    │  │  • IndexedDB storage for offline-first architecture           │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 5 (Week 11-13): Real-Time Communication            │     │
    │  │  • Socket.io server integration                               │     │
    │  │  • Room-based broadcasting architecture                       │     │
    │  │  • WebSocket client in extension service worker               │     │
    │  │  • WebSocket client in dashboard (React context)              │     │
    │  │  • Live feed component for real-time participation display    │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 6 (Week 14-16): Extended Participation Detection   │     │
    │  │  • Chat message detection (DOM observation)                   │     │
    │  │  • Reaction detection (emoji, thumbs up, applause, etc.)      │     │
    │  │  • Hand raise detection (ARIA attributes + toast monitoring)  │     │
    │  │  • Microphone toggle detection (participant list observation) │     │
    │  │  • Deduplication logic for event accuracy                     │     │
    │  │  • Comprehensive participation logging system                 │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                  ▼                                      │
    │  ┌───────────────────────────────────────────────────────────────┐     │
    │  │  ITERATION 7 (Week 17-18): System Refinement                  │     │
    │  │  • Error handling & exception management improvements         │     │
    │  │  • User feedback mechanisms (notifications, toasts, alerts)   │     │
    │  │  • UI/UX polish & responsive design enhancements              │     │
    │  │  • Performance optimization (query optimization, caching)     │     │
    │  │  • Code documentation & inline comments                       │     │
    │  │  • Developer documentation preparation                        │     │
    │  └───────────────────────────────────────────────────────────────┘     │
    │                                                                         │
    │                 ▲                                    │                  │
    │                 │                                    │                  │
    │                 │      Feedback & Refinement Loop    │                  │
    │                 │         (Continuous Testing)       │                  │
    │                 └────────────────────────────────────┘                  │
    │                                                                         │
    └─────────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          ▼
    ┌─────────────────────────────────────────┐
    │         PHASE 4                         │
    │         TESTING                         │
    │                                         │
    │  • Functional Testing (Manual)          │
    │  • Integration Testing                  │
    │  • System Testing (End-to-End)          │
    │  • Accuracy Testing (vs Ground Truth)   │
    │  • Usability Testing (Task-based)       │
    │  • Performance Testing                  │
    └───────────────┬─────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────┐
    │         PHASE 5                         │
    │       DEPLOYMENT                        │
    │                                         │
    │  • Local Development Environment        │
    │  • Testing Environment Setup            │
    │  • Chrome Extension Unpacked Loading    │
    │  • Backend Server Deployment            │
    │  • Database Migration & Seeding         │
    └─────────────────────────────────────────┘
```

## **B.2 Iteration Summary Table**

| **Iteration** | **Duration** | **Focus Area** | **Key Deliverables** |
|---------------|--------------|----------------|----------------------|
| 1 | Week 1-2 | Infrastructure | Database schema, Express server, JWT authentication |
| 2 | Week 3-4 | Core CRUD | Class management, student roster, session lifecycle |
| 3 | Week 5-7 | Extension Core | Chrome extension, Google Meet detection, DOM observation |
| 4 | Week 8-10 | Attendance | Two-table model, join/leave tracking, fuzzy matching |
| 5 | Week 11-13 | Real-Time | Socket.io integration, WebSocket clients, live feed |
| 6 | Week 14-16 | Participation | Chat, reactions, hand raises, microphone detection |
| 7 | Week 17-18 | Refinement | Error handling, UI polish, documentation |

---

# **APPENDIX C: System Architecture Diagrams**

## **C.1 Complete System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     ENGAGIUM COMPLETE SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                            PRESENTATION TIER                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────┐                ┌──────────────────────────┐
│   BROWSER EXTENSION      │                │   WEB DASHBOARD          │
│   (Chrome Manifest V3)   │                │   (React SPA)            │
├──────────────────────────┤                ├──────────────────────────┤
│                          │                │                          │
│ ┌──────────────────────┐ │                │ ┌──────────────────────┐ │
│ │   Content Scripts    │ │                │ │  Authentication UI   │ │
│ │  • Google Meet DOM   │ │                │ │  • Login/Register    │ │
│ │  • Participant       │ │                │ └──────────────────────┘ │
│ │    Detection         │ │                │                          │
│ │  • Chat Monitor      │ │                │ ┌──────────────────────┐ │
│ │  • Reaction Tracker  │ │                │ │  Class Management    │ │
│ │  • Hand Raise        │ │                │ │  • Create/Edit Class │ │
│ │  • Mic Toggle        │ │                │ │  • Import Students   │ │
│ └──────────────────────┘ │                │ └──────────────────────┘ │
│                          │                │                          │
│ ┌──────────────────────┐ │                │ ┌──────────────────────┐ │
│ │   Service Worker     │ │                │ │  Session Management  │ │
│ │  • API Client        │ │                │ │  • Create Session    │ │
│ │  • Socket Client     │ │                │ │  • Live Feed View    │ │
│ │  • Sync Queue        │ │                │ │  • End Session       │ │
│ │  • IndexedDB Storage │ │                │ └──────────────────────┘ │
│ └──────────────────────┘ │                │                          │
│                          │                │ ┌──────────────────────┐ │
│ ┌──────────────────────┐ │                │ │  Analytics & Reports │ │
│ │   Popup & Options    │ │                │ │  • Attendance Report │ │
│ │  • Session Controls  │ │                │ │  • Participation     │ │
│ │  • Quick Stats       │ │                │ │    Analytics         │ │
│ │  • Token Management  │ │                │ │  • Export Functions  │ │
│ └──────────────────────┘ │                │ └──────────────────────┘ │
└────────────┬─────────────┘                └──────────┬───────────────┘
             │                                         │
             │  HTTP/HTTPS (REST API)                  │
             │  + WebSocket (Socket.io)                │
             │                                         │
             └──────────────────┬──────────────────────┘
                                │
╔═══════════════════════════════▼═══════════════════════════════════════════════╗
║                           APPLICATION TIER                                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────────────────────────┐
                    │    NODE.JS + EXPRESS SERVER         │
                    ├─────────────────────────────────────┤
                    │                                     │
   ┌────────────────┼──────────────────────┬──────────────┼────────────────┐
   │                │                      │              │                │
   ▼                ▼                      ▼              ▼                ▼
┌─────────┐  ┌────────────┐  ┌──────────────────┐  ┌──────────┐  ┌──────────┐
│  Auth   │  │   Class    │  │    Session       │  │  Student │  │  Partici-│
│ Routes  │  │  Routes    │  │    Routes        │  │  Routes  │  │  pation  │
│         │  │            │  │                  │  │          │  │  Routes  │
│ /login  │  │ /classes   │  │ /sessions        │  │ /students│  │ /partici-│
│ /register│ │ /classes/  │  │ /sessions/:id    │  │ /students│  │  pation  │
│ /refresh│  │  :id       │  │ /sessions/:id/   │  │  /:id    │  │ /logs    │
│ /token  │  │            │  │  participants    │  │          │  │          │
└────┬────┘  └─────┬──────┘  └────────┬─────────┘  └─────┬────┘  └────┬─────┘
     │             │                  │                  │            │
     └─────────────┴──────────────────┴──────────────────┴────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │     MIDDLEWARE LAYER              │
                    ├───────────────────────────────────┤
                    │ • flexibleAuth (JWT + Extension)  │
                    │ • Error Handler                   │
                    │ • Request Logger                  │
                    │ • CORS Configuration              │
                    │ • Body Parser                     │
                    └─────────────────┬─────────────────┘
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     │                                │                                │
     ▼                                ▼                                ▼
┌──────────────┐          ┌──────────────────────┐         ┌────────────────┐
│  Controllers │          │  Business Logic /    │         │  Socket.io     │
│              │          │  Services            │         │  Server        │
│ • Auth       │          │                      │         │                │
│ • Class      │────────► │ • Name Matching     │         │ Room-Based     │
│ • Session    │          │ • Attendance Calc    │         │ Broadcasting:  │
│ • Student    │          │ • Duration Totals    │         │                │
│ • Particip.  │          │ • Data Validation    │         │ • instructor:  │
│              │          │ • Event Processing   │◄────────│   {userId}     │
└──────────────┘          └──────────────────────┘         │ • session:     │
                                      │                    │   {sessionId}  │
                                      │                    │                │
                                      │                    │ Events:        │
                                      │                    │ • session:     │
                                      │                    │   started      │
                                      │                    │ • attendance:  │
                                      │                    │   updated      │
                                      │                    │ • particip:    │
                                      │                    │   logged       │
                                      │                    └────────────────┘
                                      │
╔═════════════════════════════════════▼═════════════════════════════════════════╗
║                              DATA TIER                                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────────────────────────┐
                    │      POSTGRESQL DATABASE            │
                    ├─────────────────────────────────────┤
                    │                                     │
                    │  ┌─────────────────────────────┐    │
                    │  │  Core Tables                │    │
                    │  ├─────────────────────────────┤    │
                    │  │ • users                     │    │
                    │  │ • extension_tokens          │    │
                    │  │ • refresh_tokens            │    │
                    │  │ • classes                   │    │
                    │  │ • students                  │    │
                    │  │ • sessions                  │    │
                    │  └─────────────────────────────┘    │
                    │                                     │
                    │  ┌─────────────────────────────┐    │
                    │  │  Attendance Tables          │    │
                    │  ├─────────────────────────────┤    │
                    │  │ • attendance_records        │    │
                    │  │   (summary: student+session)│    │
                    │  │                             │    │
                    │  │ • attendance_intervals      │    │
                    │  │   (detail: join/leave times)│    │
                    │  └─────────────────────────────┘    │
                    │                                     │
                    │  ┌─────────────────────────────┐    │
                    │  │  Participation Tables       │    │
                    │  ├─────────────────────────────┤    │
                    │  │ • participation_logs        │    │
                    │  │   (chat, reactions, hand    │    │
                    │  │    raises, mic toggles)     │    │
                    │  └─────────────────────────────┘    │
                    │                                     │
                    │  ┌─────────────────────────────┐    │
                    │  │  Database Features          │    │
                    │  ├─────────────────────────────┤    │
                    │  │ • Foreign Key Constraints   │    │
                    │  │ • Cascade Deletes           │    │
                    │  │ • Indexes on Common Queries │    │
                    │  │ • ENUM Types for Categories │    │
                    │  │ • Triggers for Timestamps   │    │
                    │  └─────────────────────────────┘    │
                    │                                     │
                    └─────────────────────────────────────┘
```

## **C.2 Data Flow: Session Lifecycle**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: COMPLETE SESSION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────┐
│ Instructor │
│   Opens    │
│ Google Meet│
└──────┬─────┘
       │
       ▼
┌─────────────────┐
│ Content Script  │
│ Detects Meeting │
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│ Instructor Clicks    │
│ "Start Session"      │
│ (Extension Popup)    │
└──────┬───────────────┘
       │
       │ POST /api/sessions
       ▼
┌──────────────────────┐         ┌─────────────────────┐
│ Backend Creates      │────────►│ DB: Insert Session  │
│ Session Record       │         │ (status = 'active') │
└──────┬───────────────┘         └─────────────────────┘
       │
       │ Emit: session:started
       ▼
┌──────────────────────┐         ┌─────────────────────┐
│ WebSocket Broadcast  │────────►│ Dashboard Updates   │
│ to instructor room   │         │ (Live Feed Active)  │
└──────────────────────┘         └─────────────────────┘
       │
       │ [DURING SESSION: Multiple Participants Join/Leave]
       ▼
┌──────────────────────────────────────────────────────┐
│ For Each Participant Join Event:                    │
│ • Content Script Detects DOM Change                 │
│ • POST /api/sessions/:id/participants               │
│ • DB: Insert attendance_interval (left_at = NULL)   │
│ • Emit: attendance:updated                          │
│ • Dashboard: Show participant in live list          │
└──────────────────────────────────────────────────────┘
       │
       │ [Instructor Ends Session]
       ▼
┌──────────────────────┐
│ PUT /api/sessions/   │
│     :id/end          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend Attendance Calculation:                              │
│                                                              │
│ 1. Close all open intervals (SET left_at = NOW())           │
│ 2. Calculate duration for each interval                     │
│ 3. Group by participant, SUM durations                      │
│ 4. Match participant names to students (fuzzy matching)     │
│ 5. INSERT/UPDATE attendance_records with totals             │
│ 6. Mark absent students (no intervals)                      │
│ 7. SET session.status = 'ended'                             │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ Emit: session:ended
       ▼
┌──────────────────────┐         ┌─────────────────────┐
│ WebSocket Broadcast  │────────►│ Dashboard Updates   │
│ with final summary   │         │ (Show Final Report) │
└──────────────────────┘         └─────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Instructor Views     │
│ Attendance Report    │
│ • Present (duration) │
│ • Absent students    │
│ • Participation logs │
└──────────────────────┘
```

---

# **APPENDIX D: Technology Stack Specifications**

## **D.1 Frontend Technologies**

| **Technology** | **Version** | **Purpose** | **Justification** |
|----------------|-------------|-------------|-------------------|
| React | 18.2.0 | UI library for dashboard | Component-based architecture, virtual DOM efficiency, large ecosystem |
| Vite | 4.1.0 | Build tool & dev server | Fast HMR, optimized bundling, native ES modules |
| Tailwind CSS | 3.3.0 | Utility-first styling | Rapid prototyping, consistent design, responsive utilities |
| React Router DOM | 6.8.0 | Client-side routing | SPA navigation, protected routes, declarative routing |
| TanStack Query (React Query) | 4.24.0 | Server state management | Automatic caching, background refetching, optimistic updates |
| Socket.io Client | 4.6.0 | WebSocket client | Real-time event handling, automatic reconnection |
| Axios | 1.3.0 | HTTP client | Promise-based API, interceptors, request/response transformation |
| date-fns | 2.29.0 | Date manipulation | Lightweight, functional approach to date operations |

## **D.2 Backend Technologies**

| **Technology** | **Version** | **Purpose** | **Justification** |
|----------------|-------------|-------------|-------------------|
| Node.js | 18.x LTS | Runtime environment | Asynchronous I/O, unified JavaScript ecosystem, large community |
| Express | 4.18.2 | Web framework | Minimal, flexible, middleware architecture, extensive plugins |
| Socket.io | 4.6.0 | WebSocket server | Real-time bidirectional communication, room-based broadcasting |
| PostgreSQL | 14+ | Relational database | ACID compliance, complex queries, JSONB support, data integrity |
| pg (node-postgres) | 8.8.0 | PostgreSQL client | Non-blocking queries, connection pooling, prepared statements |
| jsonwebtoken | 9.0.0 | JWT generation/verification | Stateless authentication, compact token size, standard compliance |
| bcrypt | 5.1.0 | Password hashing | Adaptive hashing, salt generation, brute-force resistant |
| cors | 2.8.5 | CORS middleware | Cross-origin request handling for frontend-backend communication |
| dotenv | 16.0.3 | Environment configuration | Secure credential management, environment-specific settings |

## **D.3 Browser Extension Technologies**

| **Technology** | **Version** | **Purpose** | **Justification** |
|----------------|-------------|-------------|-------------------|
| Chrome Manifest V3 | — | Extension platform | Latest standard, service workers, enhanced security model |
| idb | 7.1.1 | IndexedDB wrapper | Promise-based API, offline storage, sync queue management |
| React (Popup/Options) | 18.2.0 | Extension UI | Consistent component architecture with dashboard |
| Vite | 4.1.0 | Extension bundling | Fast development, code splitting, optimized builds |

## **D.4 Development & Testing Tools**

| **Tool** | **Purpose** |
|----------|-------------|
| Visual Studio Code | Code editor & debugging |
| Git | Version control |
| Postman / Thunder Client | API endpoint testing |
| Chrome DevTools | Extension debugging & DOM inspection |
| pgAdmin | Database management & query testing |
| ESLint | Code linting & style enforcement |
| Prettier | Code formatting |

## **D.5 System Requirements**

### **Development Environment**

- **Operating System**: Windows 10/11, macOS Ventura+, or Linux (Ubuntu 20.04+)
- **Processor**: Intel Core i5 / AMD Ryzen 5 or higher
- **RAM**: Minimum 8 GB (16 GB recommended)
- **Storage**: 10 GB free space for development environment and dependencies
- **Network**: Stable broadband connection (5 Mbps+ recommended)

### **Production/Testing Environment**

- **Browser**: Google Chrome 120+ (required for Manifest V3)
- **Node.js**: Version 18.x LTS or higher
- **PostgreSQL**: Version 14 or higher
- **Operating System**: Windows 10/11, macOS, or Linux with Chrome support

---

# **APPENDIX E: Database Schema ERD**

## **E.1 Entity-Relationship Diagram**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        ENGAGIUM DATABASE SCHEMA (ERD)                           │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│         USERS               │
├─────────────────────────────┤
│ PK: id (UUID)               │
│     username (UNIQUE)       │
│     email (UNIQUE)          │
│     password_hash           │
│     full_name               │
│     role (ENUM)             │
│     created_at              │
│     updated_at              │
└──────────────┬──────────────┘
               │ 1
               │
               │ 1:N (User has many Classes)
               │
               ▼ N
┌─────────────────────────────┐              ┌─────────────────────────────┐
│         CLASSES             │              │    EXTENSION_TOKENS         │
├─────────────────────────────┤              ├─────────────────────────────┤
│ PK: id (UUID)               │◄─────────────┤ PK: id (UUID)               │
│ FK: instructor_id → users   │    1:N       │ FK: user_id → users         │
│     name                    │              │     token (UNIQUE)          │
│     section                 │              │     created_at              │
│     term                    │              │     last_used_at            │
│     schedule (JSONB)        │              │     is_revoked              │
│     is_archived             │              └─────────────────────────────┘
│     created_at              │
│     updated_at              │
└──────────────┬──────────────┘
               │ 1
               │
     ┌─────────┴─────────────────────┐
     │                               │
     │ 1:N                           │ 1:N
     │ (Class has many Students)     │ (Class has many Sessions)
     │                               │
     ▼ N                             ▼ N
┌─────────────────────────────┐   ┌─────────────────────────────┐
│         STUDENTS            │   │        SESSIONS             │
├─────────────────────────────┤   ├─────────────────────────────┤
│ PK: id (UUID)               │   │ PK: id (UUID)               │
│ FK: class_id → classes      │   │ FK: class_id → classes      │
│     student_id_number       │   │ FK: instructor_id → users   │
│     first_name              │   │     meeting_url             │
│     last_name               │   │     status (ENUM: active/   │
│     email                   │   │             ended/scheduled)│
│     created_at              │   │     started_at              │
│     updated_at              │   │     ended_at                │
└──────────────┬──────────────┘   │     created_at              │
               │                  │     updated_at              │
               │                  └──────────────┬──────────────┘
               │ 1                               │ 1
               │                                 │
               │                      ┌──────────┴──────────────────┐
               │                      │                             │
               │ 1:N                  │ 1:N                         │ 1:N
               │ (Student has many    │ (Session has many           │ (Session has many
               │  Attendance Records) │  Attendance Intervals)      │  Participation Logs)
               │                      │                             │
               ▼ N                    ▼ N                           ▼ N
┌─────────────────────────────┐   ┌─────────────────────────────┐   ┌─────────────────────────────┐
│   ATTENDANCE_RECORDS        │   │   ATTENDANCE_INTERVALS      │   │   PARTICIPATION_LOGS        │
│   (Summary Table)           │   │   (Detail Table)            │   ├─────────────────────────────┤
├─────────────────────────────┤   ├─────────────────────────────┤   │ PK: id (UUID)               │
│ PK: id (UUID)               │   │ PK: id (UUID)               │   │ FK: session_id → sessions   │
│ FK: student_id → students   │   │ FK: session_id → sessions   │   │     participant_name        │
│ FK: session_id → sessions   │   │     participant_name        │   │     interaction_type (ENUM: │
│     status (ENUM: Present/  │   │     joined_at (TIMESTAMP)   │   │       chat, reaction,       │
│             Absent/Excused) │   │     left_at (TIMESTAMP NULL)│   │       hand_raise, mic_on)   │
│     total_duration_seconds  │   │     duration_seconds        │   │     timestamp               │
│     created_at              │   │     created_at              │   │     metadata (JSONB)        │
│     updated_at              │   └─────────────────────────────┘   │     created_at              │
│                             │                                     └─────────────────────────────┘
│ UNIQUE: (student_id,        │
│         session_id)         │
└─────────────────────────────┘

┌─────────────────────────────┐
│    REFRESH_TOKENS           │
├─────────────────────────────┤
│ PK: id (UUID)               │
│ FK: user_id → users         │
│     token (UNIQUE)          │
│     expires_at              │
│     created_at              │
│     is_revoked              │
└─────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│                              KEY RELATIONSHIPS                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│ • Users → Classes (1:N): One instructor creates/manages multiple classes       │
│ • Classes → Students (1:N): One class has many enrolled students               │
│ • Classes → Sessions (1:N): One class has many recorded sessions               │
│ • Sessions → Attendance_Records (1:N): One session tracks many student records │
│ • Sessions → Attendance_Intervals (1:N): One session has many join/leave logs  │
│ • Sessions → Participation_Logs (1:N): One session records many interactions   │
│ • Students → Attendance_Records (1:N): One student has records across sessions │
│                                                                                │
│ CASCADE DELETE RULES:                                                          │
│ • Deleting a Class → Cascades to Students, Sessions                            │
│ • Deleting a Session → Cascades to Attendance_Records, Intervals, Logs         │
│ • Deleting a Student → Cascades to Attendance_Records                          │
└────────────────────────────────────────────────────────────────────────────────┘
```

## **E.2 Key Database Constraints**

### **Primary Keys**
All tables use UUID primary keys for distributed system compatibility and non-sequential identification.

### **Foreign Key Constraints**
- All foreign keys include `ON DELETE CASCADE` or `ON DELETE SET NULL` to maintain referential integrity
- Composite unique constraints prevent duplicate entries (e.g., one attendance record per student per session)

### **ENUM Types**
- `user_role`: `'instructor'`, `'admin'`
- `session_status`: `'scheduled'`, `'active'`, `'ended'`
- `attendance_status`: `'present'`, `'absent'`, `'excused'`
- `interaction_type`: `'chat'`, `'reaction'`, `'hand_raise'`, `'mic_on'`

### **Indexes**
- Indexed columns: `instructor_id`, `class_id`, `session_id`, `student_id`, `username`, `email`, `token`
- Composite indexes on frequently queried combinations (e.g., `session_id + participant_name`)

---

# **APPENDIX F: API Endpoint Reference**

## **F.1 Authentication Endpoints**

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/api/auth/register` | Register new user account | No |
| POST | `/api/auth/login` | Authenticate and receive JWT tokens | No |
| POST | `/api/auth/refresh` | Refresh access token using refresh token | Yes (Refresh Token) |
| POST | `/api/auth/logout` | Revoke refresh token | Yes |
| POST | `/api/auth/extension-token` | Generate long-lived extension token | Yes (JWT) |
| DELETE | `/api/auth/extension-token` | Revoke extension token | Yes |

## **F.2 Class Management Endpoints**

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| GET | `/api/classes` | Get all classes for authenticated user | Yes |
| GET | `/api/classes/:id` | Get single class details | Yes |
| POST | `/api/classes` | Create new class | Yes |
| PUT | `/api/classes/:id` | Update class information | Yes |
| DELETE | `/api/classes/:id` | Delete class (cascade to students/sessions) | Yes |

## **F.3 Student Management Endpoints**

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| GET | `/api/classes/:classId/students` | Get all students in a class | Yes |
| POST | `/api/classes/:classId/students` | Add single student to class | Yes |
| POST | `/api/classes/:classId/students/import` | Bulk import students via CSV | Yes |
| PUT | `/api/students/:id` | Update student information | Yes |
| DELETE | `/api/students/:id` | Remove student from class | Yes |

## **F.4 Session Management Endpoints**

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| GET | `/api/classes/:classId/sessions` | Get all sessions for a class | Yes |
| GET | `/api/sessions/:id` | Get session details with attendance | Yes |
| POST | `/api/sessions` | Create/start new session | Yes |
| PUT | `/api/sessions/:id/end` | End session and calculate attendance | Yes |
| DELETE | `/api/sessions/:id` | Delete session (cascade to attendance logs) | Yes |

## **F.5 Participation Tracking Endpoints**

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/api/sessions/:id/participants` | Log participant join/leave event | Yes (Extension) |
| POST | `/api/participation/log` | Log interaction event (chat, reaction, etc.) | Yes (Extension) |
| GET | `/api/sessions/:id/participation` | Get all participation logs for session | Yes |

## **F.6 WebSocket Events**

### **Emitted by Server**

| **Event Name** | **Room** | **Payload** | **Description** |
|----------------|----------|-------------|-----------------|
| `session:started` | `instructor:{userId}` | `{ session }` | Session initiated |
| `session:ended` | `session:{sessionId}` | `{ session, summary }` | Session concluded with final stats |
| `attendance:updated` | `session:{sessionId}` | `{ participant, action }` | Participant joined/left |
| `participation:logged` | `session:{sessionId}` | `{ participant, type }` | Interaction event detected |
| `error` | Individual client | `{ message, code }` | Error notification |

### **Emitted by Client**

| **Event Name** | **Payload** | **Description** |
|----------------|-------------|-----------------|
| `join-instructor-room` | `{ userId }` | Subscribe to instructor-specific events |
| `join-session-room` | `{ sessionId }` | Subscribe to session-specific events |
| `leave-session-room` | `{ sessionId }` | Unsubscribe from session events |

---

# **APPENDIX G: Offline Synchronization Algorithm**

## **G.1 Sync Queue Data Structure**

```javascript
// IndexedDB Schema for Sync Queue
{
  storeName: 'syncQueue',
  keyPath: 'id',
  indexes: [
    { name: 'timestamp', keyPath: 'timestamp' },
    { name: 'status', keyPath: 'status' }
  ]
}

// Queue Entry Structure
{
  id: 'uuid-v4-string',
  eventType: 'participant_join' | 'participant_leave' | 'participation_log',
  payload: {
    // Event-specific data
  },
  timestamp: 'ISO 8601 datetime',
  status: 'pending' | 'synced' | 'failed',
  retryCount: number,
  lastAttemptAt: 'ISO 8601 datetime' | null,
  error: string | null
}
```

## **G.2 Synchronization Algorithm Pseudocode**

```
ALGORITHM: Offline-First Event Synchronization

1. ON_EVENT_DETECTED(event):
   a. Validate event data
   b. Create queue entry with status='pending'
   c. Store in IndexedDB syncQueue
   d. IF network_available:
        CALL SYNC_QUEUE()
   e. ELSE:
        Log "Event queued for later sync"

2. SYNC_QUEUE():
   a. Check network connectivity:
      - Ping backend health endpoint
      - IF timeout OR error: ABORT and schedule retry in 30s
   
   b. Retrieve all pending events:
      - Query syncQueue WHERE status='pending'
      - Sort by timestamp ASC (chronological order)
   
   c. FOR EACH event IN pending_events:
      i.   IF event.retryCount > MAX_RETRIES (default: 5):
             - SET event.status = 'failed'
             - LOG critical error
             - SKIP to next event
      
      ii.  TRY:
             - Send HTTP POST to appropriate endpoint
             - Include original timestamp in payload
             - AWAIT response with timeout (10s)
      
      iii. IF response.success:
             - SET event.status = 'synced'
             - SET event.syncedAt = NOW()
             - LOG success
      
      iv.  ELSE IF response.error:
             - INCREMENT event.retryCount
             - SET event.lastAttemptAt = NOW()
             - SET event.error = response.error.message
             - Apply exponential backoff: WAIT (2^retryCount seconds)
             - LOG retry scheduled
   
   d. Clean up synced events older than 7 days:
      - DELETE FROM syncQueue WHERE status='synced' AND syncedAt < (NOW() - 7 days)

3. PERIODIC_SYNC_CHECK():
   - Runs every 30 seconds when extension active
   - IF network_available AND syncQueue.pending.length > 0:
       CALL SYNC_QUEUE()

4. ON_NETWORK_RESTORED():
   - Browser detects network connection restored
   - IMMEDIATELY CALL SYNC_QUEUE()
   - Display user notification: "Syncing offline data..."

5. ERROR_HANDLING:
   - Network errors: Retry with exponential backoff
   - Server errors (500): Retry with backoff
   - Client errors (400, 401): Mark as failed, require manual intervention
   - Timeout errors: Treat as network error, retry
```

## **G.3 Exponential Backoff Formula**

```
retry_delay = min(2^retry_count * base_delay, max_delay)

Where:
  base_delay = 1 second
  max_delay = 300 seconds (5 minutes)
  retry_count = number of previous attempts

Example:
  Retry 1: 2^1 * 1 = 2 seconds
  Retry 2: 2^2 * 1 = 4 seconds
  Retry 3: 2^3 * 1 = 8 seconds
  Retry 4: 2^4 * 1 = 16 seconds
  Retry 5: 2^5 * 1 = 32 seconds
  Retry 6+: capped at 300 seconds
```
