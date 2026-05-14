# APPENDIX: DIAGRAMS WITH MERMAID CODE

**Last Updated:** April 22, 2026

This file consolidates the thesis appendix diagrams and provides Mermaid source code for each one.

---

## A.1 Context Diagram

```mermaid
---
config:
  layout: elk
---
flowchart LR
    INS["Instructor"] -- credentials, commands, edits --> P0["0.0 ENGAGIUM\nParticipation Tracking System"]
    P0 -- dashboards, analytics, exports, live feed --> INS
    P0 -- validation feedback, live status --> INS

    GME["Google Meet"] -- join/leave events --> P0
    GME -- chat, reaction, hand, mic signals --> P0
    P0 -- live session prompts, participant status --> GME

    ZOOM["Zoom"] -- meeting context --> P0
    ZOOM -- participant data, bridge events --> P0
    P0 -- authenticated session actions --> ZOOM
    P0 -- live status, control responses --> ZOOM
```

---

## A.2 Level-0 Data Flow Diagram (Exploded Diagram)

```plantuml
@startuml
!theme plain
top to bottom direction

skinparam shadowing false
skinparam defaultFontName Arial
skinparam ArrowColor Black
skinparam ArrowThickness 1
skinparam nodesep 70
skinparam ranksep 70

' Gane-Sarson style approximation
skinparam rectangle {
  BackgroundColor White
  BorderColor Black
  RoundCorner 18
}

skinparam rectangle<<entity>> {
  RoundCorner 0
}

skinparam rectangle<<datastore>> {
  RoundCorner 0
  BackgroundColor #FAFAFA
}

rectangle "Instructor" as IN <<entity>>
rectangle "Google Meet" as GM <<entity>>
rectangle "Zoom Context" as ZC <<entity>>
rectangle "Live feed, session detail, analytics, exports" as OUT <<entity>>

rectangle "1.0\nAuthenticate and Authorize" as P1
rectangle "2.0\nManage Classes, Students,\nTags, Notes, Links" as P2
rectangle "3.0\nManage Session Lifecycle" as P3
rectangle "4.0\nDetect Meeting Events\n(Extension)" as P4
rectangle "5.0\nProcess Bridge Events\n(Zoom)" as P5
rectangle "6.0\nProcess and Store Session,\nAttendance, Participation Data" as P6
rectangle "7.0\nGenerate Live Views\nand Reports" as P7

rectangle "D1 Data Store\nusers, refresh_tokens, extension_tokens\nclasses, students, sessions, attendance\nparticipation_logs, links, tags, notes" as D1 <<datastore>>

IN --> P1 : credentials, commands
P1 --> P2 : user context
P2 --> P3 : class/session setup

GM --> P4 : DOM events
ZC --> P5 : bridge context

P4 --> P6 : normalized events
P5 --> P6 : normalized events
P3 --> P6 : active session context

P6 --> D1 : writes/updates
D1 --> P6 : reads/lookups

P6 --> P7 : processed attendance\nand participation data
P7 --> OUT : dashboard and export outputs
@enduml
```

---

## A.3 User Decision Tree (ISO 5807 — professor-only)

Notation: Follows ISO-5807 conventions for user-facing flows — decisions are binary (Yes/No) and explicit. See: https://cdn.standards.iteh.ai/samples/11955/1b7dd254a2a54fd7a89d616dc0570e18/ISO-5807-1985.pdf

Note: Engagium is professor-only. There is no student or participant login surface. This tree shows the instructor workflow only.

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> InputCreds["Input: Credentials<br>(email, password)"]
    InputCreds --> Login["Log in"]
    Login --> SelectOrCreate{"Class exists?"}
    SelectOrCreate -- Yes --> SelectClass["Select class"]
    SelectOrCreate -- No --> CreateClass["Create class"]
    CreateClass --> InputRoster["Input: Roster data<br>(CSV or manual entry)"]
    InputRoster --> ImportRoster["Import/manage roster"]
    SelectClass --> OpenMeeting["Open meeting<br>(Google Meet or Zoom)"]
    ImportRoster --> OpenMeeting
    OpenMeeting --> InputMeeting["Input: Meeting context<br>(URL, participant data)"]
    InputMeeting --> StartTracking["Start session tracking"]
    StartTracking --> DuringSession["During session: monitor<br>attendance, participation, live feed"]
    DuringSession --> ContinueTracking{"Continue session?"}
    ContinueTracking -- Yes --> DuringSession
    ContinueTracking -- No --> EndSession["End session"]
    EndSession --> ViewAnalytics{"View analytics now?"}
    ViewAnalytics -- Yes --> OutputAnalytics["Output: Session/class analytics<br>(reports, export data)"]
    ViewAnalytics -- No --> Done(["Done"])
    OutputAnalytics --> Done

    InputRoster@{ shape: lean-r}
    InputMeeting@{ shape: lean-r}
    OutputAnalytics@{ shape: lean-r}
    style InputCreds stroke-width:2px
    style SelectOrCreate stroke:#333,stroke-width:1.5px
    style InputRoster stroke-width:2px
    style InputMeeting stroke-width:2px
    style ContinueTracking stroke:#333,stroke-width:1.5px
    style ViewAnalytics stroke:#333,stroke-width:1.5px
    style OutputAnalytics stroke-width:2px
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
  theme: neutral
  look: classic
  layout: elk
  fontFamily: '''Recursive Variable'', sans-serif'
  themeVariables:
    fontFamily: '''Recursive Variable'', sans-serif'
---
erDiagram
	direction TB
	USERS {
		uuid id PK ""  
		string email UK ""  
		string password_hash  ""  
		string first_name  ""  
		string last_name  ""  
		user_role role  ""  
		string reset_token  ""  
		timestamp reset_token_expires  ""  
		text refresh_token  ""  
		timestamp created_at  ""  
		timestamp updated_at  ""  
	}

	CLASSES {
		uuid id PK ""  
		uuid instructor_id FK ""  
		string name  ""  
		string subject  ""  
		string section  ""  
		text description  ""  
		jsonb schedule  ""  
		string status  ""  
		timestamp created_at  ""  
		timestamp updated_at  ""  
	}

	REFRESH_TOKEN_SESSIONS {
		uuid id PK ""  
		uuid user_id FK ""  
		string token_hash UK ""  
		timestamp expires_at  ""  
		string device_id  ""  
		text user_agent  ""  
		string ip_address  ""  
		boolean revoked  ""  
		timestamp created_at  ""  
		timestamp last_used_at  ""  
	}

	EXTENSION_TOKENS {
		uuid id PK ""  
		uuid user_id FK ""  
		string token_hash UK ""  
		string token_preview  ""  
		timestamp expires_at  ""  
		timestamp last_used_at  ""  
		boolean revoked  ""  
		timestamp created_at  ""  
	}

	STUDENT_NOTES {
		uuid id PK ""  
		uuid student_id FK ""  
		text note_text  ""  
		uuid created_by FK ""  
		timestamp created_at  ""  
	}

	STUDENTS {
		uuid id PK ""  
		uuid class_id FK ""  
		string full_name  ""  
		string student_id  ""  
		timestamp deleted_at  ""  
		timestamp created_at  ""  
	}

	SESSIONS {
		uuid id PK ""  
		uuid class_id FK ""  
		string title  ""  
		string meeting_link  ""  
		timestamp started_at  ""  
		timestamp ended_at  ""  
		session_status status  ""  
		timestamp created_at  ""  
	}

	SESSION_LINKS {
		uuid id PK ""  
		uuid class_id FK ""  
		string link_url  ""  
		string link_type  ""  
		string label  ""  
		string zoom_meeting_id  ""  
		string zoom_passcode  ""  
		boolean is_primary  ""  
		timestamp created_at  ""  
		timestamp updated_at  ""  
	}

	EXEMPTED_ACCOUNTS {
		uuid id PK ""  
		uuid class_id FK ""  
		string account_identifier  ""  
		string reason  ""  
		timestamp created_at  ""  
	}

	STUDENT_TAGS {
		uuid id PK ""  
		uuid class_id FK ""  
		string tag_name  ""  
		string tag_color  ""  
		timestamp created_at  ""  
	}

	STUDENT_TAG_ASSIGNMENTS {
		uuid id PK ""  
		uuid student_id FK ""  
		uuid tag_id FK ""  
		timestamp assigned_at  ""  
	}

	ATTENDANCE_RECORDS {
		uuid id PK ""  
		uuid session_id FK ""  
		uuid student_id FK ""  
		string participant_name  ""  
		string status  ""  
		integer total_duration_minutes  ""  
		timestamp first_joined_at  ""  
		timestamp last_left_at  ""  
		timestamp created_at  ""  
		timestamp updated_at  ""  
	}

	ATTENDANCE_INTERVALS {
		uuid id PK ""  
		uuid session_id FK ""  
		uuid student_id FK ""  
		string participant_name  ""  
		timestamp joined_at  ""  
		timestamp left_at  ""  
		timestamp created_at  ""  
	}

	PARTICIPATION_LOGS {
		uuid id PK ""  
		uuid session_id FK ""  
		uuid student_id FK ""  
		interaction_type interaction_type  ""  
		string interaction_value  ""  
		timestamp timestamp  ""  
		jsonb additional_data  ""  
	}

	USERS||--o{CLASSES:"owns"
	USERS||--o{REFRESH_TOKEN_SESSIONS:"has"
	USERS||--o{EXTENSION_TOKENS:"has"
	USERS||--o{STUDENT_NOTES:"created_by"
	CLASSES||--o{STUDENTS:"contains"
	CLASSES||--o{SESSIONS:"schedules"
	CLASSES||--o{SESSION_LINKS:"has"
	CLASSES||--o{EXEMPTED_ACCOUNTS:"has"
	CLASSES||--o{STUDENT_TAGS:"defines"
	STUDENTS||--o{STUDENT_NOTES:"has"
	STUDENTS||--o{STUDENT_TAG_ASSIGNMENTS:"tagged_with"
	STUDENT_TAGS||--o{STUDENT_TAG_ASSIGNMENTS:"assigned_to"
	SESSIONS||--o{ATTENDANCE_RECORDS:"records"
	SESSIONS||--o{ATTENDANCE_INTERVALS:"intervals"
	SESSIONS||--o{PARTICIPATION_LOGS:"logs"
	STUDENTS|o--o{ATTENDANCE_RECORDS:"may_link"
	STUDENTS|o--o{ATTENDANCE_INTERVALS:"may_link"
	STUDENTS|o--o{PARTICIPATION_LOGS:"may_link"
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
