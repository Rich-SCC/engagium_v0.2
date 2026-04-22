# APPENDIX: DIAGRAMS WITH MERMAID CODE

**Last Updated:** April 22, 2026

This file consolidates the thesis appendix diagrams and provides Mermaid source code for each one.

---

## A.1 Context Diagram

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    I["INSTRUCTOR<br>Primary User"] --> WD["Web Dashboard<br>(React App)"] & CE["Chrome Extension<br>(Google Meet)"] & CSV["CSV Roster Data<br>(Import Flow)"]
    WD --> SYS["ENGAGIUM<br>Participation Tracking System"]
    CE --> SYS
    CSV --> SYS
    SYS --> GM["Google Meet<br>(DOM Event Source via Extension)"] & ZM["Zoom Meeting Context<br>(Zoom Apps SDK Bridge)"] & EM["Email Service<br>(Password Reset)"]
    SYS <--> DB[("PostgreSQL DB<br>(System of Record)")]
```

---

## A.2 Level-0 Data Flow Diagram (Exploded Diagram)

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    IN["Instructor"] -- Credentials and commands --> P1["1.0 Authenticate and Authorize"]
    P1 -- User context --> P2["2.0 Manage Classes Students Tags Notes Links"]
    P2 --> P3["3.0 Manage Session Lifecycle"]
    GM["Google Meet"] -- DOM events --> P4["4.0 Detect Meeting Events Extension"]
    ZC["Zoom Context"] -- Bridge context --> P5["5.0 Process Bridge Events Zoom"]
    P4 -- Normalized events --> P6["6.0 Process and Store Session Attendance Participation"]
    P5 -- Normalized events --> P6
    P3 --> P6
    P6 <--> D1[("D1 Database<br>users <br>refresh_tokens <br>extension_tokens<br>classes <br>students <br>sessions <br>attendance<br>participation logs <br>links <br>tags <br>notes")]
    P6 --> P7["7.0 Generate Live Views and Reports"]
    P7 --> OUT["Live feed session detail analytics exports"]
```

---

## A.3 Program Flowchart

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    S(["Start"]) --> Ctx["Instructor enters meeting context<br>Meet or Zoom"]
    Ctx --> Split{"Entry path"}
    Split -- Google Meet --> MeetPath["Extension path"]
    Split -- Zoom --> ZoomPath["Zoom bridge path"]
    MeetPath --> StartSession["POST /sessions/start-from-meeting"]
    ZoomPath --> StartSession
    StartSession --> Active["Backend creates or updates<br>active session"]
    Active --> Loop{"Session live?"}
    Loop -- Yes --> EventFork{"Incoming event type"}
    EventFork --> AJ["Attendance join"] & AL["Attendance leave"] & PE["Participation event<br>chat reaction hand mic"]
    AJ --> AWrite["Attendance endpoints and interval writes"]
    AL --> AWrite
    PE --> PWrite["Live-event or bulk participation writes"]
    AWrite --> Realtime["Socket.io emits updates<br>to instructor and session rooms"]
    PWrite --> Realtime
    Realtime --> UI["Dashboard live feed and session views update"]
    UI --> Loop
    Loop -- No --> EndReq["PUT /sessions/:id/end-with-timestamp"]
    EndReq --> Finalize["Finalize intervals and attendance totals"]
    Finalize --> E(["End"])
```

---

## A.4 Visual Table of Contents (VTOC) Diagram

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    SYS["ENGAGIUM SYSTEM<br>0.0"] --> EXT["Browser Extension<br>1.0"] & API["Backend API<br>2.0"] & WEB["Web Dashboard<br>3.0"] & DATA["Database Layer<br>4.0"] & RT["Realtime Layer<br>5.0"]
    EXT --> EXT2["Meet detectors background<br>core<br>popup<br>options<br>utils"]
    API --> API2["Routes<br>auth<br>classes<br>sessions<br>participation<br>ext tokens"]
    WEB --> WEB2["Pages<br>home<br>classes<br>sessions<br>live feed<br>analytics<br>settings<br>zoom"]
    DATA --> DATA2["Tables<br>users<br>classes<br>students<br>sessions<br>attendance<br>participation"]
    RT --> RT2["Socket<br>events and rooms<br>instructor and session"]
```

---

## A.5 Input-Process-Output (IPO) Diagram (with Feedback)

```mermaid
---
config:
  layout: dagre
---
flowchart LR
    I1["Input 1<br>User credentials web and extension token"] --> P1["Process 1<br>Auth and token handling"]
    P1 --> O1["Output 1<br>Authenticated app sessions"]
    O1 --> F1["Feedback 1<br>Invalid login and token errors"]
    I2["Input 2<br>Class and student data manual and CSV"] --> P2["Process 2<br>Class and roster workflows"]
    P2 --> O2["Output 2<br>Class and roster records"]
    O2 --> F2["Feedback 2<br>Validation and duplicate prompts"]
    I3["Input 3<br>Meeting context Meet or Zoom"] --> P3["Process 3<br>Session lifecycle flows"]
    P3 --> O3["Output 3<br>Active and ended sessions"]
    O3 --> F3["Feedback 3<br>Session status updates"]
    I4["Input 4<br>Event stream join leave chat reaction hand mic"] --> P4["Process 4<br>Attendance and participation ingestion and matching"]
    P4 --> O4["Output 4<br>Attendance records participation logs live feed"]
    O4 --> F4["Feedback 4<br>Unmatched participants can be linked"]
    I5["Input 5<br>Historical database records"] --> P5["Process 5<br>Aggregation and dashboard composition"]
    P5 --> O5["Output 5<br>Analytics summary export data"]
    O5 --> F5["Feedback 5<br>Instructor insights for next setup"]
    F1 -.-> I1
    F2 -.-> I2
    F3 -.-> I3
    F4 -.-> I4
    F5 -.-> I5
```

---

## B.2 System Architecture (3-Tier Model)

```mermaid
---
config:
  layout: dagre
---
flowchart TB
 subgraph P["Presentation Tier"]
        EXT["Chrome Extension<br>Google Meet"]
        APP["Web Application<br>React Dashboard and Zoom Bridge"]
  end
 subgraph A["Application Tier"]
        BE["Node.js Express Socket.io Backend<br>Auth Classes Sessions Participation Extension Tokens"]
  end
 subgraph D["Data Tier"]
        PG[("PostgreSQL<br>Auth Class Session Attendance Participation Tables")]
  end
    EXT --> BE
    APP --> BE
    BE --> PG
```

---

## B.4 Browser Extension Architecture

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    D1["Meet detectors<br>participant chat reaction hand mic exit"] --> N1["Normalize events"]
    N1 --> BG["Background service worker runtime"]
    BG -- API available --> APIWrite["Immediate REST write"]
    BG -- API unavailable --> Queue["Sync queue persists event"]
    Queue --> Retry["Retry scheduler"]
    Retry --> APIWrite
    APIWrite --> BE["Backend API endpoints"]
    BE --> DB[("PostgreSQL")]
```

---

## B.5 Zoom Bridge Architecture

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    UI["Zoom route in web app<br>ZoomIframeBridge"] --> SDK["zoom/appssdk client"]
    SDK --> Ctx["Meeting context and participant data"]
    Ctx --> Build["Normalize Zoom events"]
    Build --> Rest["REST calls as authenticated instructor"]
    Rest --> BE["Backend APIs"]
    BE --> DB[("PostgreSQL")] & SO["Socket.io broadcast"]
    SO --> DASH["Instructor dashboard live views"]
    Lim["Known SDK limits<br>No chat content<br>No chat activity stream<br>No mic toggle stream"] -. constrains .-> Build
```

---

## B.7 Database Schema (ERD + Table Definitions)

```mermaid
---
config:
  layout: elk
---
erDiagram
    USERS ||--o{ CLASSES : owns
    CLASSES ||--o{ STUDENTS : contains
    CLASSES ||--o{ SESSIONS : schedules
    CLASSES ||--o{ SESSION_LINKS : has
    CLASSES ||--o{ EXEMPTED_ACCOUNTS : has
    CLASSES ||--o{ STUDENT_TAGS : defines

    STUDENTS ||--o{ STUDENT_NOTES : has
    STUDENTS ||--o{ STUDENT_TAG_ASSIGNMENTS : tagged_with
    STUDENT_TAGS ||--o{ STUDENT_TAG_ASSIGNMENTS : assigned_to

    SESSIONS ||--o{ ATTENDANCE_RECORDS : records
    SESSIONS ||--o{ ATTENDANCE_INTERVALS : intervals
    SESSIONS ||--o{ PARTICIPATION_LOGS : logs

    STUDENTS o|--o{ ATTENDANCE_RECORDS : may_link
    STUDENTS o|--o{ ATTENDANCE_INTERVALS : may_link
    STUDENTS o|--o{ PARTICIPATION_LOGS : may_link

    USERS ||--o{ REFRESH_TOKEN_SESSIONS : has
    USERS ||--o{ EXTENSION_TOKENS : has
```

---

## D.6 Zoom Bridge (Zoom Apps SDK) Architecture

```mermaid
---
config:
  layout: dagre
---
flowchart LR
 subgraph ZOOM_IFRAME["Zoom Apps SDK Iframe ZoomIframeBridge"]
        Feed["Realtime Participation Feed"]
        Ctrl["Session Controls<br>End session View analytics"]
  end
 subgraph ZOOM_MEETING["Zoom Meeting Browser Context"]
        ZOOM_IFRAME
        Main["Zoom meeting main area<br>video screen share participants"]
  end
    ZOOM_IFRAME -- WebSocket events --> Sock["Backend Socket Server<br>room session:{sessionId}"]
    Sock --> Feed
    ZOOM_IFRAME -- Authenticated REST calls --> BE["Backend API"]
    BE --> DB[("PostgreSQL")]
```

---

## Notes

1. Mermaid syntax is editable for thesis formatting preferences.
2. Some diagrams are conceptual simplifications of wider appendix discussions.
3. Zoom data-capture limitations shown above follow current documented SDK constraints.
