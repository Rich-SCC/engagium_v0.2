# APPENDIX A
DIAGRAMS AND SYSTEM MODELS

**Last Updated:** April 18, 2026

This appendix presents the current diagrams and system models for the ENGAGIUM implementation in the repository.

---

## A.1 Context Diagram

The context diagram follows Gane-Sarson notation: ENGAGIUM is modeled as one process (Process 0) with only the three external entities shown here.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                 ENGAGIUM CONTEXT DIAGRAM (GANE-SARSON STYLE)                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                                   ┌──────────────────────┐
                                   │      Instructor      │
                                   └──────────┬───────────┘
                      credentials, commands, edits │ dashboards, analytics, exports, live status
                                                  │
                                                  ▼
         ┌──────────────────────┐      ╭───────────────────────────────╮      ┌──────────────────────┐
         │     Google Meet      │◄─────┤            ENGAGIUM           ├─────►│         Zoom         │
         └──────────────────────┘      │     Online Class Participation │      └──────────────────────┘
              join/leave/chat/reaction │          Tracking System       │ authenticated session actions
              and hand/mic signals ───►╰───────────────────────────────╯ and live status
             live session prompts and status ◄───────────────────────────┘
                                                                 bridge context, participant data,
                                                                 meeting operations ◄───────────────
```

**External Entity Summary**

| Entity | Role | Data Flow |
|--------|------|-----------|
| Instructor | Authenticates, manages classes/students/sessions, reviews live and historical analytics | Inputs: credentials, commands, edits; Outputs: dashboards, analytics, exports, live status |
| Google Meet | Primary browser meeting source for extension-based detection | Inputs to system: join/leave/chat/reaction/hand/mic signals; Outputs from system: live session prompts and status |
| Zoom | Zoom meeting context consumed by the web bridge | Inputs to system: bridge context, participant data, meeting operations; Outputs from system: authenticated session actions and live status |

---

## A.2 Level-0 Data Flow Diagram (Exploded Diagram)

The Level-0 DFD decomposes the ENGAGIUM system into major implemented processes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             ENGAGIUM LEVEL-0 DFD                               │
└─────────────────────────────────────────────────────────────────────────────────┘
  ┌───────────────┐                        ┌───────────────┐    ┌───────────────┐
  │  INSTRUCTOR   │──────────────────────►│   1.0         │───►│   2.0         │
  │               │ credentials, commands │ AUTHENTICATE  │ user│ MANAGE        │
  └───────────────┘                        │ & AUTHORIZE   │ctx  │ CLASSES,      │
                                                                   └───────────────┘     │ STUDENTS,     │
                                                                                                   │ TAGS, NOTES,  │
                                                                                                   │ LINKS         │
                                                                                                        └────┬─────────┘
                                                                                                                │ setup
                                                                                                                ▼
                                         ┌────────────────────────────────────────────────────────────────┐
                                         │                                3.0                           │
                                         │                      MANAGE SESSION LIFECYCLE                  │
                                         └────────────────────────────────────────────────────────────────┘
                                                                                        │
                                                                                        │ active session context
                                                                                        ▼
                                 ┌──────────────────────┐    ┌──────────────────────┐    ┌───────────────┐
                                 │    Google Meet       │───►│      4.0             │───►│               │
                                 │  (external DOM events)│    │ DETECT MEETING EVENTS│    │               │
                                 └──────────────────────┘    └──────────────────────┘    │               │
                                                                                                                                 │
                                                                                                                                 │
                                 ┌──────────────────────┐    ┌──────────────────────┐    ┌──▼────────────┐
                                 │        Zoom          │───►│      5.0             │───►│    6.0         │
                                 │  (bridge context /    │    │ PROCESS BRIDGE EVENTS│    │ PROCESS &     │
                                 │   participant data)   │    └──────────────────────┘    │ STORE SESSION, │
                                 └──────────────────────┘                                │ ATTENDANCE &  │
                                                                                                                  events│ PARTICIPATION  │
                                                                                                                            └────┬─────────┘
                                                                                                                                    │
                                                                                                                                    │ writes/updates
                                                                                                                                    ▼
                                                                                                                            ┌────────────┐
                                                                                                                            │  D1 DB     │
                                                                                                                            │ (data store)│
                                                                                                                            └────────────┘
                                                                                                                                    ▲
                                                                                                                                    │ reads/lookups
                                                                                                                                    │
                                                                                                                                    ▼
                                                                                                                            ┌────────────┐
                                                                                                                            │   7.0      │
                                                                                                                            │ GENERATE    │
                                                                                                                            │ REPORTS     │
                                                                                                                            └────────────┘
                                                                                                                                    │
                                                                                                                                    │ live feed / analytics
                                                                                                                                    ▼
                                                                                                                            ┌────────────┐
                                                                                                                            │   OUTPUT   │
                                                                                                                            │ Live feed,  │
                                                                                                                            │ reports     │
                                                                                                                            └────────────┘
```

**Process Descriptions**

| Process | Description |
|---------|-------------|
| 1.0 Authenticate & Authorize | Handles web JWT auth, refresh flows, password reset, and extension token issuance/verification paths |
| 2.0 Manage Classes, Students, Tags, Notes, Links | Implements class/student CRUD, CSV import/export, merge/bulk operations, tags/notes, links, exemptions |
| 3.0 Manage Session Lifecycle | Supports start-from-meeting, active session retrieval, end-with-timestamp, session updates/deletes |
| 4.0 Detect Meeting Events (Extension) | Captures Google Meet events in content modules and forwards through service worker |
| 5.0 Process Bridge Events (Zoom) | Handles Zoom bridge page/service operations and routes them into shared backend flows |
| 6.0 Process & Store Data | Writes attendance intervals/records and participation logs; resolves matching/linking |
| 7.0 Generate Live Views & Reports | Serves dashboard realtime and historical analytics views and exports |

---

## A.3 User Decision Tree

The decision tree illustrates the professor's workflow from login through session lifecycle to analytics review.



Refer to Appendix A.3 in *Diagrams with Mermaid Code* for the complete flowchart rendering.

---

## A.4 Visual Table of Contents (VTOC) Diagram

The VTOC diagram presents an updated module hierarchy mapped to current implementation.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENGAGIUM VTOC DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                                ┌───────────────────┐
                                │ ENGAGIUM SYSTEM   │
                                │       (0.0)       │
                                └─────────┬─────────┘
                                          │
       ┌────────────────────┬─────────────┼─────────────┬────────────────────┐
       │                    │             │             │                    │
       ▼                    ▼             ▼             ▼                    ▼
┌───────────────┐   ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Browser        │   │Backend API    │ │Web Dashboard │ │Database Layer│ │Realtime Layer│
│Extension (1.0)│   │(2.0)          │ │(3.0)         │ │(4.0)         │ │(5.0)         │
└───────┬───────┘   └───────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
        │                   │                │                │                │
        ▼                   ▼                ▼                ▼                ▼
┌───────────────┐   ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Meet detectors │   │Routes: auth,  │ │Pages: Home,  │ │Tables: users,│ │Socket events │
│background core│   │classes,sessions│ │Classes,      │ │classes,      │ │and rooms     │
│popup/options  │   │participation, │ │Sessions,     │ │students,     │ │(instructor_, │
│utils          │   │ext-tokens     │ │LiveFeed,etc. │ │sessions,etc. │ │session:)     │
└───────────────┘   └───────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Module Hierarchy Summary**

| Level 0 | Level 1 | Level 2 | Description |
|---------|---------|---------|-------------|
| 0.0 Engagium System | 1.0 Browser Extension | Detection/Core/DOM/UI modules + background runtime | Google Meet event capture and meeting-side submission |
| 0.0 Engagium System | 2.0 Backend API | Auth, classes, sessions, participation, extension-token routes/controllers | Business logic, persistence, and auth enforcement |
| 0.0 Engagium System | 3.0 Web Dashboard | Public auth pages, protected `/app/*` pages, zoom bridge pages | Instructor-facing management, monitoring, analytics |
| 0.0 Engagium System | 4.0 Database Layer | Auth, class, session, attendance, participation, tag/note tables | System of record |
| 0.0 Engagium System | 5.0 Realtime Layer | Socket handler + frontend WebSocket context | Live updates and room-based synchronization |

---

## A.5 Input-Process-Output (IPO) Diagram

The IPO diagram below includes a **Feedback** part (IPOF behavior) while keeping the section title as IPO Diagram.

The model reflects the implemented integration strategy in which Google Meet tracking is extension-based, Zoom support is bridge-based, session creation is meeting-driven, and realtime synchronization is delivered through instructor/session room communication.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ENGAGIUM IPO DIAGRAM (WITH FEEDBACK)                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌────────────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐
│ INPUTS               │  │ PROCESSING                 │  │ OUTPUTS              │  │ FEEDBACK                 │
├──────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────────┤
│ • User credentials   │  │ 1) Auth and token handling │  │ • Authenticated app  │  │ • Invalid login/token    │
│   (web + ext token)  │─►│    (JWT + extension token) │─►│   sessions           │─►│   errors returned to UI  │
├──────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────────┤
│ • Class/student data │  │ 2) Class/roster workflows  │  │ • Class + roster     │  │ • Validation and duplicate│
│   (manual + CSV)     │─►│    (CRUD/import/merge)     │─►│   records            │─►│   check prompts           │
├──────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────────┤
│ • Meeting context    │  │ 3) Session lifecycle       │  │ • Active/ended       │  │ • Session status updates │
│   (Meet/Zoom)        │─►│    start/end/update flows  │─►│   sessions           │─►│   for user actions       │
├──────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────────┤
│ • Event stream       │  │ 4) Attendance +            │  │ • Attendance records │  │ • Unmatched participants │
│   (join/leave/chat/  │─►│    participation ingestion │─►│ • Participation logs │─►│   can be linked/matched  │
│   reaction/hand/mic) │  │    + matching              │  │ • Live feed updates  │  │   by instructor          │
├──────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────────┤
│ • Historical data    │  │ 5) Aggregation and         │  │ • Analytics, summary │  │ • Instructor insights    │
│   (DB records)       │─►│    dashboard composition   │─►│   and export data    │─►│   drive next class setup │
└──────────────────────┘  └────────────────────────────┘  └──────────────────────┘  └──────────────────────────┘

             └────────────────────────────── Feedback loops back to Inputs ───────────────────────────────┘
```

**IPO Summary (with Feedback)**

| Category | Input | Process | Output | Feedback |
|----------|-------|---------|--------|----------|
| Authentication | Email/password/JWT/extension token | Validate credentials and tokens | Authenticated session and API access | Error responses and token refresh prompts |
| Class/Roster Management | Class metadata and roster uploads | CRUD, import, dedupe, merge | Updated class/student/tag/note state | Validation results and conflict prompts |
| Session Lifecycle | Meeting URL/context + commands | Start, track status, end/finalize | Session records with timestamps/status | Live status messages and corrective actions |
| Attendance & Participation | Detected meeting events | Normalize, match, store, broadcast | Attendance intervals/records and participation logs | Unmatched participant linking and manual adjustments |
| Analytics | Stored attendance/participation/session data | Aggregate by class/session/student | Dashboard metrics and report/export data | Instructor decisions for next sessions and roster updates/participant linking |

