# APPENDIX A
DIAGRAMS AND SYSTEM MODELS

**Last Updated:** April 18, 2026

This appendix presents the current diagrams and system models for the ENGAGIUM implementation in the repository.

---

## A.1 Context Diagram

The context diagram shows the single external entity that revolves within the current system: **Instructor (User)**.

```mermaid
flowchart LR
    instructor((Instructor\nUser))
    system[Engagium System]

    instructor -->|email/password, sign-up data, forgot/reset password requests| system
    system -->|auth session, tokens, reset confirmation, landing/dashboard routing| instructor

    instructor -->|profile edits, password change, logout| system
    system -->|updated profile state, password change confirmation, session end| instructor

    instructor -->|create/edit/archive/delete class, update schedule| system
    system -->|class list, class detail state, schedule-aware views| instructor

    instructor -->|manage session links, exemptions| system
    system -->|link list, primary-link state, exemption list| instructor

    instructor -->|add/edit/delete/import/export/merge students, create from participant| system
    system -->|updated roster, duplicate warnings, export file, merge/link confirmation| instructor

    instructor -->|manage student tags and notes| system
    system -->|updated tag assignments, recent notes, note timeline| instructor

    instructor -->|start session from meeting, end session with timestamp| system
    system -->|active session record, finalized session record, session status updates| instructor

    instructor -->|submit live participation, record join/leave, link participant, bulk attendance/participation| system
    system -->|live feed updates, attendance intervals, duration totals, validation feedback| instructor

    instructor -->|open session history, detail, bundled detail, calendar, date-range, active-session views| system
    system -->|session list, attendance view, bundled session view, calendar grouping, active summary| instructor

    instructor -->|review attendance, participation, analytics| system
    system -->|attendance roster, participation log, live feed, charts, analytics summaries| instructor

    instructor -->|generate, list, revoke extension tokens| system
    system -->|token preview list, revocation confirmation| instructor

    instructor -->|open Zoom bridge, complete OAuth flow| system
    system -->|bridge state, authenticated bridge access| instructor

    classDef entity fill:#ffffff,stroke:#111111,stroke-width:2px;
    classDef process fill:#f4f4f4,stroke:#111111,stroke-width:1.5px;

    class instructor entity;
    class system process;
```

### Input / Output Table

| Instructor input | System output |
|---|---|
| Email/password sign-in | Authenticated dashboard session, JWT access token, refresh token |
| Sign-up data | Account creation confirmation and authenticated entry |
| Forgot-password email request | Password reset email / reset request confirmation |
| Reset-password submission | Password reset success or validation error |
| Profile edits | Updated profile state |
| Password change | Password change confirmation |
| Logout | Session termination and return to landing page |
| Create/edit/archive/delete class | Updated class list and class detail state |
| Update class schedule | Schedule-aware class listing and session grouping output |
| Manage session links | Updated meeting link list and primary-link state |
| Manage exemptions | Updated exemption list |
| Add/edit/delete/import/export/merge students | Updated roster, duplicate warnings, export file, merge result |
| Create student from participant | New student record or linked student confirmation |
| Manage student tags | Updated tag definitions and assignments |
| Manage student notes | Updated note timeline and recent-note list |
| Start session from meeting | Active session record and live dashboard visibility |
| End session with timestamp | Finalized session record and ended-session confirmation |
| Submit live participation events | Live feed updates and persisted participation entries |
| Record participant join/leave | Attendance interval updates and duration totals |
| Link participant to student | Matched roster linkage or manual link confirmation |
| Submit bulk attendance or participation | Stored bulk records and validation feedback |
| Open session history / detail / bundled detail | Session list, attendance view, bundled session view |
| Open calendar / date-range / active-session views | Calendar grouping, active-session summary, filtered history |
| Review attendance and participation | Attendance roster, participation log, live feed entries |
| Review analytics | Class analytics charts and student analytics output |
| Generate / list / revoke extension tokens | Token preview list and revocation confirmation |
| Open Zoom bridge / complete OAuth flow | Zoom bridge state and authenticated bridge access |

---

## A.2 Level-1 Data Flow Diagram (Exploded Diagram)

The Level-1 DFD decomposes the ENGAGIUM system into major implemented processes. Due to the system's complex data flows and to maintain readability within standard document constraints, the diagram is not presented as a single monolithic figure. Instead, the model is separated into four continuous, interconnected modules—each representing a distinct functional area of the system architecture.

### Module A — User & Security

```mermaid
flowchart LR
    instructor((Instructor\nUser))
    p1[1.0 Authentication and profile management]
    p2[2.0 Extension token lifecycle]
    p10[10.0 Zoom bridge and bridge-auth support]

    d1["d1: users"]
    d2["d2: refresh_token_sessions"]
    d3["d3: extension_tokens"]

    instructor -->|login sign-up refresh profile edit password change logout| p1
    p1 -->|authenticated session profile state| instructor
    p1 -->|write id email password_hash first_name last_name role| d1
    p1 -->|write id user_id token_hash expires_at device_id| d2

    instructor -->|generate list revoke extension tokens| p2
    p2 -->|token preview list revocation confirmation| instructor
    p2 -->|write id user_id token_hash token_preview expires_at revoked| d3
    p2 -->|associate token with user via user_id| d1

    instructor -->|open Zoom bridge complete OAuth bridge flow verify bridge token| p10
    p10 -->|authenticated bridge access Zoom bridge state| instructor
    p10 -->|read and update extension_tokens validate last_used_at revoked| d3
```

### Module B — Academic Management

```mermaid
flowchart LR
    instructor((Instructor\nUser))
    p3[3.0 Class and schedule management]
    p4[4.0 Session link and exemption management]
    p5[5.0 Student roster and annotations]

    d4["d4: classes"]
    d5["d5: session_links"]
    d6["d6: exempted_accounts"]
    d7["d7: students"]
    d8["d8: student_tags"]
    d9["d9: student_tag_assignments"]
    d10["d10: student_notes"]

    instructor -->|create edit archive delete class update schedule| p3
    p3 -->|write id instructor_id name schedule status| d4

    instructor -->|manage session links manage exemptions| p4
    p4 -->|write id class_id link_url link_type is_primary| d5
    p4 -->|write id class_id account_identifier reason| d6
    p4 -->|update classes with link references| d4

    instructor -->|add edit delete import export merge students manage tags notes| p5
    p5 -->|write students roster entries| d7
    p5 -->|write student_tags tag assignments notes| d8
    p5 -->|write student_tag_assignments mapping between students and tags| d9
    p5 -->|write student_notes entries| d10
    p5 -->|update classes roster metadata| d4
```

### Module C — Session & Participation

```mermaid
flowchart LR
    instructor((Instructor\nUser))
    p6[6.0 Session lifecycle and calendar views]
    p7[7.0 Attendance tracking and participant linking]
    p8[8.0 Participation ingestion and live feed]

    d11["d11: sessions"]
    d12["d12: attendance_records"]
    d13["d13: attendance_intervals"]
    d14["d14: participation_logs"]

    instructor -->|start session end session open views| p6
    p6 -->|write sessions id class_id title meeting_link started_at ended_at status| d11

    instructor -->|record join leave link participant submit bulk attendance| p7
    p7 -->|write attendance summary into attendance_records| d12
    p7 -->|write attendance intervals into attendance_intervals| d13
    p7 -->|update sessions attendance summary| d11

    instructor -->|submit live participation submit bulk participation open participation views| p8
    p8 -->|write participation_logs with session_id student_id interaction fields| d14
    p8 -->|link participation to session via session_id| d11
```

### Module D — Intelligence (Analytics & Reporting)

```mermaid
flowchart LR
    instructor((Instructor\nUser))
    p9[9.0 Analytics and reporting]

    %% Only show stores that Analytics reads to reduce clutter
    d4["d4: classes"]
    d7["d7: students"]
    d8["d8: student_tags"]
    d10["d10: student_notes"]
    d11["d11: sessions"]
    d12["d12: attendance_records"]
    d13["d13: attendance_intervals"]
    d14["d14: participation_logs"]

    instructor -->|review attendance participation analytics session stats| p9

    p9 -->|read classes fields id name schedule| d4
    p9 -->|read students fields id full_name student_id| d7
    p9 -->|read sessions fields id started_at ended_at status| d11
    p9 -->|read attendance_records fields status total_duration_minutes first_joined_at last_left_at| d12
    p9 -->|read attendance_intervals fields joined_at left_at| d13
    p9 -->|read participation_logs fields interaction_type interaction_value timestamp| d14
    p9 -->|read student_tags fields tag_name tag_color| d8
    p9 -->|read student_notes fields note_text created_by created_at| d10

    p9 -->|produce charts summaries class analytics student analytics attendance stats| instructor
```

**Process and Data-Store Mapping**

| Process | Reads | Writes | Main instructor inputs | Main outputs |
|---|---|---|---|---|
| 1.0 Authentication and profile management | `users`, `refresh_token_sessions` | `users`, `refresh_token_sessions` | login, sign-up, refresh, profile edit, password change, logout | authenticated session, profile state, password-change confirmation |
| 2.0 Extension token lifecycle | `extension_tokens`, `users` | `extension_tokens` | generate token, list tokens, revoke token, revoke all | token preview list, revocation confirmation |
| 3.0 Class and schedule management | `classes` | `classes` | create/edit/archive/delete class, update schedule | class list, class detail, schedule-aware views |
| 4.0 Session link and exemption management | `session_links`, `exempted_accounts`, `classes` | `session_links`, `exempted_accounts` | manage meeting links, manage exemptions | updated link list, primary-link state, exemption list |
| 5.0 Student roster and annotations | `students`, `student_tags`, `student_tag_assignments`, `student_notes`, `classes` | `students`, `student_tags`, `student_tag_assignments`, `student_notes` | add/edit/delete/import/export/merge students, create from participant, manage tags, manage notes | roster updates, duplicate warnings, export file, link confirmation, tag state, note timeline |
| 6.0 Session lifecycle and calendar views | `sessions`, `classes` | `sessions` | start session from meeting, end session with timestamp, open active/history/detail/bundled/calendar/date-range views | active session record, ended session record, session history, calendar grouping |
| 7.0 Attendance tracking and participant linking | `attendance_records`, `attendance_intervals`, `sessions`, `students` | `attendance_records`, `attendance_intervals` | record join/leave, link participant to student, submit bulk attendance, open attendance views | attendance roster, interval history, duration totals, matched participant state |
| 8.0 Participation ingestion and live feed | `participation_logs`, `sessions`, `students` | `participation_logs` | submit live participation, submit bulk participation, open participation views | live feed updates, persisted participation log, recent activity |
| 9.0 Analytics and reporting | `classes`, `students`, `sessions`, `attendance_records`, `attendance_intervals`, `participation_logs`, `student_tags`, `student_notes` | none | review attendance, participation, analytics, session stats | charts, summaries, class analytics, student analytics, attendance stats |
| 10.0 Zoom bridge and bridge-auth support | `classes`, `sessions`, `extension_tokens` | `sessions`, `extension_tokens` | open Zoom bridge, complete OAuth bridge flow, verify bridge token context | authenticated bridge access, Zoom bridge state, Zoom session actions |

---

## A.3 User Program Flowchart

The program flowchart set illustrates the instructor's workflow through the ENGAGIUM system using binary decision points. It is split by area of concern.

### A.3.1 Auth and Recovery Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> Landing["Input: Landing page credentials or account details"]
    Landing --> NeedAccount{"Need a new account?"}

    NeedAccount -- Yes --> SignUp["Input: Sign-up form"]
    SignUp --> SignUpValid{"Sign-up valid?"}
    SignUpValid -- Yes --> Dashboard["Output: Authenticated dashboard session"]
    SignUpValid -- No --> Landing

    NeedAccount -- No --> SignIn["Input: Sign-in form"]
    SignIn --> CredentialsValid{"Credentials valid?"}
    CredentialsValid -- Yes --> Dashboard
    CredentialsValid -- No --> ForgotPath{"Forgot password?"}

    ForgotPath -- Yes --> ForgotRequest["Input: Password reset email request"]
    ForgotRequest --> ResetEmail["Document: Reset instructions email"]
    ResetEmail --> ResetPage["Input: Reset password page"]
    ResetPage --> ResetValid{"New password valid?"}
    ResetValid -- Yes --> SignIn
    ResetValid -- No --> ResetPage

    ForgotPath -- No --> SignIn
    Dashboard --> End(["End"])

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class Landing,SignUp,SignIn,ForgotRequest,ResetEmail,ResetPage,Dashboard io;
    class NeedAccount,SignUpValid,CredentialsValid,ForgotPath,ResetValid decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User navigates to Engagium login page
2. **Landing Page**: Display login/sign-up interface with credential input fields
3. **Need a New Account?**: User decision point
   - **Yes** → Proceed to sign-up form
   - **No** → Proceed to sign-in form
4. **Sign-up Form**: Input email, password, first/last name
5. **Sign-up Valid?**: Backend validates new account credentials
   - **Yes** → Create user record, authenticate session
   - **No** → Return to landing page with error message
6. **Sign-in Form**: Input email and password
7. **Credentials Valid?**: Backend validates credentials against stored hash
   - **Yes** → Authenticate session, proceed to dashboard
   - **No** → Prompt password recovery or retry
8. **Forgot Password?**: User decision point
   - **Yes** → Request password reset
   - **No** → Return to sign-in form to retry
9. **Password Reset Email Request**: Submit email address to receive reset link
10. **Reset Instructions Email**: Output email document with secure reset link
11. **Reset Password Page**: Enter new password via secure token-validated form
12. **New Password Valid?**: Backend validates new password criteria
    - **Yes** → Save new password, return to sign-in
    - **No** → Return to reset page with validation feedback
13. **Authenticated Dashboard Session**: Output authenticated session token and redirect to dashboard
14. **End**: Login flow complete

#### Key Features Mapped

- **Account creation**: New professor sign-up with validation (lines 3-5)
- **Credential validation**: Secure password verification with error handling (lines 6-7)
- **Password recovery**: Email-based reset flow with token security (lines 8-12)
- **Session authentication**: JWT token generation and storage on successful login (line 13)

---

### A.3.2 Dashboard Hub and Navigation Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> Home["Output: Home dashboard"]
    Home --> ActiveSession{"Active session visible?"}

    ActiveSession -- Yes --> LiveFeed["Open live feed"]
    LiveFeed --> Monitor["Review live attendance and participation"]
    Monitor --> ReturnHome["Return to dashboard hub"]

    ActiveSession -- No --> ChooseArea{"Need another task?"}
    ChooseArea -- Yes --> Classes["Open My Classes"]
    ChooseArea -- No --> Sessions["Open Sessions"]

    Classes --> SessionsChoice{"Need history or review?"}
    SessionsChoice -- Yes --> Sessions
    SessionsChoice -- No --> Analytics["Open Analytics"]

    Sessions --> AnalyticsChoice{"Need metrics or reports?"}
    AnalyticsChoice -- Yes --> Analytics
    AnalyticsChoice -- No --> Settings["Open Settings"]

    Analytics --> SettingsChoice{"Need profile or tokens?"}
    SettingsChoice -- Yes --> Settings
    SettingsChoice -- No --> End(["End"])

    Settings --> End
    ReturnHome --> ChooseArea

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class Home,LiveFeed,Monitor,ReturnHome,Classes,Sessions,Analytics,Settings io;
    class ActiveSession,ChooseArea,SessionsChoice,AnalyticsChoice,SettingsChoice decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User logs in or returns to dashboard
2. **Home Dashboard**: Output dashboard hub showing overview cards, quick actions, and navigation
3. **Active Session Visible?**: Check if a meeting is currently in progress
   - **Yes** → Display live session card with quick access to live feed
   - **No** → Show historical options
4. **Open Live Feed**: Display real-time attendance and participation monitoring interface (if active session)
5. **Review Live Attendance and Participation**: Monitor current meeting with live participant updates
6. **Return to Dashboard Hub**: Exit live feed view
7. **Need Another Task?**: User decision at hub (navigation choice)
   - **Yes** → Present area selection menu
   - **No** → Begin task selection chain
8. **Open My Classes**: Navigate to class management interface
9. **Need History or Review?**: User decision
   - **Yes** → Jump to Sessions area
   - **No** → Continue to Analytics
10. **Open Sessions**: Navigate to session history and session detail views
11. **Need Metrics or Reports?**: User decision
    - **Yes** → Jump to Analytics area
    - **No** → Continue to Settings
12. **Open Analytics**: Navigate to analytics dashboard with class-level metrics
13. **Need Profile or Tokens?**: User decision
    - **Yes** → Jump to Settings area
    - **No** → End flow
14. **Open Settings**: Navigate to profile, password, and extension token management
15. **End**: User exits dashboard or closes session

#### Key Features Mapped

- **Hub navigation**: Central dashboard with links to all major features (lines 2-14)
- **Active session quick access**: Live feed shortcut when meeting in progress (lines 3-5)
- **Sequential task navigation**: Chained decision points for browsing multiple areas (lines 8-13)
- **Non-blocking flow**: User can exit from any point or return to hub (line 6)

---

### A.3.3 Class and Roster Management Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> Classes["Open My Classes"]
    Classes --> NeedNewClass{"Need to create a class?"}

    NeedNewClass -- Yes --> CreateClass["Input: Create class form"]
    CreateClass --> ClassSaved["Output: Saved class record"]
    ClassSaved --> ClassDetail["Open class detail page"]

    NeedNewClass -- No --> ClassDetail
    ClassDetail --> NeedRosterChange{"Need roster or class setup change?"}

    NeedRosterChange -- Yes --> ImportChoice{"Import from CSV?"}
    ImportChoice -- Yes --> ImportStudents["Input: CSV import"]
    ImportChoice -- No --> ManualChoice{"Add or edit student?"}
    ManualChoice -- Yes --> EditStudent["Input: Add or edit student"]
    ManualChoice -- No --> MergeStudents["Input: Merge duplicate students"]

    ImportStudents --> RosterUpdated["Output: Updated roster"]
    EditStudent --> RosterUpdated
    MergeStudents --> RosterUpdated

    RosterUpdated --> NeedStudentOrganization{"Need tags, notes, or bulk actions?"}
    NeedStudentOrganization -- Yes --> OrganizeStudents["Manage tags, notes, bulk actions"]
    NeedStudentOrganization -- No --> ManageLinks["Manage session links and exemptions"]

    OrganizeStudents --> ManageLinks
    ManageLinks --> ClassReady["Output: Ready for meeting sessions"]

    NeedRosterChange -- No --> ManageLinks
    ClassReady --> End(["End"])

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class Classes,CreateClass,ClassSaved,ClassDetail,ImportStudents,EditStudent,MergeStudents,RosterUpdated,OrganizeStudents,ManageLinks,ClassReady io;
    class NeedNewClass,NeedRosterChange,NeedStudentOrganization decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User navigates to class management from dashboard
2. **Open My Classes**: Display list of professor's classes with options to create, edit, or archive
3. **Need to Create a Class?**: User decision
   - **Yes** → Class creation form
   - **No** → Skip to existing class detail
4. **Create Class Form**: Input class code, name, semester, section, institution
5. **Saved Class Record**: Output class record to database and receive class ID
6. **Open Class Detail Page**: Display class settings, roster, session history, links, and exemptions
7. **Need Roster or Class Setup Change?**: User decision
   - **Yes** → Proceed to roster import/edit/merge options
   - **No** → Skip to student organization
8. **Import from CSV?**: User choice for roster population method
   - **Yes** → CSV import workflow
   - **No** → Present manual add/edit/merge options
9. **CSV Import**: Input and parse CSV file with student names/IDs
10. **Add or Edit Student?**: User choice if not importing
    - **Yes** → Manual student add/edit form
    - **No** → Proceed to merge duplicates
11. **Input: Add or Edit Student**: Form to add individual student or update existing student record
12. **Input: Merge Duplicate Students**: Select duplicate student records and merge identities
13. **Output: Updated Roster**: Display new or modified roster with all students
14. **Need Tags, Notes, or Bulk Actions?**: User decision for advanced roster organization
    - **Yes** → Student organization interface
    - **No** → Skip to session link management
15. **Manage Tags, Notes, Bulk Actions**: Assign tags, add notes, bulk operations on student records
16. **Manage Session Links and Exemptions**: Link meeting URLs to automatic class detection, mark exempt students
17. **Output: Ready for Meeting Sessions**: Class and roster fully configured for attendance tracking
18. **End**: Class setup complete

#### Key Features Mapped

- **Class creation**: New class form with semester/section info (lines 3-5)
- **Roster import hierarchy**: Import (Yes) vs. manual entry chain (No) (lines 8-12)
- **Student organization**: Tags, notes, and bulk operations for roster management (line 15)
- **Session link mapping**: Link meeting URLs for automatic detection in extension (line 16)
- **Exemption handling**: Mark students exempt from attendance tracking (line 16)

---

### A.3.4 Session Monitoring and History Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> SessionHub["Open Sessions or dashboard live card"]
    SessionHub --> ActiveNow{"Active session available?"}

    ActiveNow -- Yes --> LiveFeed["Open live feed"]
    LiveFeed --> DuringSession["Monitor attendance and participation in real time"]
    DuringSession --> NeedParticipantLink{"Need to match a participant?"}
    NeedParticipantLink -- Yes --> LinkStudent["Link participant to student or create student"]
    NeedParticipantLink -- No --> EndSession{"Session ended?"}
    LinkStudent --> EndSession

    ActiveNow -- No --> HistoryChoice{"Review raw sessions or bundled sessions?"}
    HistoryChoice -- Yes --> RawSessions["Open session detail page"]
    HistoryChoice -- No --> BundledSessions["Open bundled session detail page"]

    RawSessions --> ReviewSession["Review attendance and participation logs"]
    BundledSessions --> ReviewBundle["Review stitched attendance and participation"]
    ReviewSession --> ExportChoice{"Need export or report?"}
    ReviewBundle --> ExportChoice

    EndSession -- Yes --> CloseSession["End session and finalize records"]
    EndSession -- No --> DuringSession
    CloseSession --> EndChoice{"Need to continue elsewhere?"}

    ExportChoice -- Yes --> ExportReport["Output: Reports and export files"]
    ExportChoice -- No --> EndChoice
    EndChoice -- Yes --> Analytics["Open analytics or settings"]
    EndChoice -- No --> End(["End"])

    ExportReport --> EndChoice
    Analytics --> End

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class SessionHub,LiveFeed,DuringSession,LinkStudent,RawSessions,BundledSessions,ReviewSession,ReviewBundle,CloseSession,ExportReport,Analytics io;
    class ActiveNow,NeedParticipantLink,EndSession,HistoryChoice,ExportChoice,EndChoice decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User accesses session monitoring from dashboard or active live card
2. **Open Sessions or Dashboard Live Card**: Display session hub with active/past session list
3. **Active Session Available?**: Check if a meeting is currently in progress
   - **Yes** → Jump to live feed
   - **No** → Present history options
4. **Open Live Feed**: Display real-time monitoring interface with live participant updates (during active session)
5. **Monitor Attendance and Participation in Real Time**: Display current attendees, join/leave events, chat, reactions, hand raises, mic toggles
6. **Need to Match a Participant?**: User decision during session
   - **Yes** → Manual participant matching interface
   - **No** → Check if session has ended
7. **Link Participant to Student or Create Student**: Resolve unmatched participant names to student roster or create new student record
8. **Session Ended?**: Check if meeting is still active
   - **Yes** → Proceed to close session
   - **No** → Loop back to live monitoring (line 5)
9. **Review Raw Sessions or Bundled Sessions?**: User choice for history view
   - **Yes** → Raw session detail with individual sessions
   - **No** → Bundled view with stitched attendance
10. **Open Session Detail Page**: Display single session with attendance roster and participation logs
11. **Open Bundled Session Detail Page**: Display merged view across multiple sessions (e.g., all sessions from one class in a day)
12. **Review Attendance and Participation Logs**: Display detailed attendance status and engagement activity from raw session
13. **Review Stitched Attendance and Participation**: Display merged attendance and engagement from bundled sessions
14. **Need Export or Report?**: User decision
    - **Yes** → Generate and download export
    - **No** → Check for next action
15. **End Session and Finalize Records**: Close active session, calculate final attendance, submit data
16. **Output: Reports and Export Files**: Generate CSV/PDF exports with attendance records
17. **Need to Continue Elsewhere?**: User decision
    - **Yes** → Jump to Analytics or Settings
    - **No** → Exit
18. **Open Analytics or Settings**: Navigate to other areas from session context
19. **End**: Session monitoring complete

#### Key Features Mapped

- **Live monitoring**: Real-time participant tracking with engagement events (lines 4-8)
- **Manual matching**: Link unmatched participants to roster during session (line 7)
- **Session history**: Raw vs. bundled views for historical analysis (lines 9-13)
- **Export workflow**: Generate reports on demand (lines 14, 16)
- **Flexible navigation**: Can exit to analytics or settings without re-entering main flow (line 17)

---

### A.3.5 Analytics and Review Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> AnalyticsPage["Open Analytics page"]
    AnalyticsPage --> SelectClass{"Select a class?"}

    SelectClass -- Yes --> ClassAnalytics["Open class analytics view"]
    ClassAnalytics --> NeedDrillDown{"Need to drill into sessions?"}
    NeedDrillDown -- Yes --> SessionReview["Open session detail or bundled detail"]
    NeedDrillDown -- No --> NeedExport{"Need export or summary?"}

    SelectClass -- No --> End(["End"])

    SessionReview --> ReviewLogs["Review attendance roster and participation logs"]
    ReviewLogs --> NeedExport
    NeedExport -- Yes --> ExportDocs["Output: Analytics report or export data"]
    NeedExport -- No --> NeedAnotherClass{"Review another class?"}
    ExportDocs --> NeedAnotherClass

    NeedAnotherClass -- Yes --> SelectClass
    NeedAnotherClass -- No --> End

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class AnalyticsPage,ClassAnalytics,SessionReview,ReviewLogs,ExportDocs io;
    class SelectClass,NeedDrillDown,NeedExport,NeedAnotherClass decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User navigates to Analytics from dashboard or session context
2. **Open Analytics Page**: Display analytics hub with class selector and summary metrics
3. **Select a Class?**: User decision
   - **Yes** → Proceed to class-level analytics
   - **No** → Exit analytics (line 19)
4. **Open Class Analytics View**: Display class-level metrics with attendance trends, participation patterns, and session summary
5. **Need to Drill Into Sessions?**: User decision for detail level
   - **Yes** → Open detailed session views
   - **No** → Skip to export decision
6. **Open Session Detail or Bundled Detail**: Display individual session records or bundled session view (multiple sessions merged)
7. **Review Attendance Roster and Participation Logs**: Display detailed attendance records and engagement activity for selected session(s)
8. **Need Export or Summary?**: User decision
   - **Yes** → Generate export document
   - **No** → Check for additional class review
9. **Output: Analytics Report or Export Data**: Generate and output CSV/PDF report with attendance and participation data
10. **Review Another Class?**: User decision
    - **Yes** → Return to class selection
    - **No** → Exit analytics
11. **End**: Analytics review complete

#### Key Features Mapped

- **Class-level aggregation**: Summary metrics and trends across all sessions in class (line 4)
- **Drill-down hierarchy**: Optional session-level detail view from class summary (lines 5-7)
- **Export generation**: On-demand report generation with attendance and participation (line 9)
- **Multi-class browsing**: Loop back to class selector for comparative analysis (line 10)

---

### A.3.6 Settings and Extension Token Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> SettingsPage["Open Settings page"]
    SettingsPage --> NeedProfileChange{"Change profile details?"}

    NeedProfileChange -- Yes --> EditProfile["Input: Profile form"]
    EditProfile --> ProfileSaved["Output: Updated profile state"]
    NeedProfileChange -- No --> NeedPasswordChange{"Change password?"}

    ProfileSaved --> NeedPasswordChange
    NeedPasswordChange -- Yes --> EditPassword["Input: Password change form"]
    EditPassword --> PasswordSaved["Output: Password change confirmation"]
    NeedPasswordChange -- No --> NeedTokenAction{"Manage extension token?"}

    PasswordSaved --> NeedTokenAction
    NeedTokenAction -- Yes --> TokenChoice{"Generate a new token?"}
    TokenChoice -- Yes --> GenerateToken["Input: Generate extension token"]
    TokenChoice -- No --> RevokeToken["Input: Revoke extension token"]

    GenerateToken --> TokenPreview["Output: Token preview and vault entry"]
    RevokeToken --> TokenRevoked["Output: Revocation confirmation"]
    TokenPreview --> ReturnHub["Return to dashboard hub"]
    TokenRevoked --> ReturnHub

    NeedTokenAction -- No --> ReturnHub
    ReturnHub --> End(["End"])

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class SettingsPage,EditProfile,ProfileSaved,EditPassword,PasswordSaved,GenerateToken,RevokeToken,TokenPreview,TokenRevoked,ReturnHub io;
    class NeedProfileChange,NeedPasswordChange,NeedTokenAction,TokenChoice decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User navigates to Settings from dashboard
2. **Open Settings Page**: Display settings interface with tabs/sections for profile, password, and extension tokens
3. **Change Profile Details?**: User decision
   - **Yes** → Open profile edit form
   - **No** → Skip to password change
4. **Profile Form**: Input form for name, email, institution, contact information
5. **Output: Updated Profile State**: Save profile changes to database and display confirmation
6. **Change Password?**: User decision
   - **Yes** → Open password change form
   - **No** → Skip to token management
7. **Password Change Form**: Input current password and new password with confirmation
8. **Output: Password Change Confirmation**: Hash and save new password, display success message
9. **Manage Extension Token?**: User decision for extension setup
   - **Yes** → Proceed to token actions
   - **No** → Return to dashboard
10. **Generate a New Token?**: User choice for token action
    - **Yes** → Generate new extension token
    - **No** → Proceed to revoke option
11. **Input: Generate Extension Token**: Create new cryptographic token tied to professor account
12. **Input: Revoke Extension Token**: Invalidate existing token(s) from database
13. **Output: Token Preview and Vault Entry**: Output token one-time display with copy-to-clipboard and vault entry instructions
14. **Output: Revocation Confirmation**: Display confirmation that token(s) have been revoked
15. **Return to Dashboard Hub**: Exit settings and return to main dashboard
16. **End**: Settings configuration complete

#### Key Features Mapped

- **Profile editing**: Updateable user information (lines 3-5)
- **Password management**: Secure password change with current password verification (lines 6-8)
- **Token generation**: Create new extension auth tokens (line 11)
- **Token revocation**: Invalidate compromised or unused tokens (line 12)
- **One-time token display**: Token shown once for vault/secure storage (line 13)

---

### A.3.7 Zoom Bridge and OAuth Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Start(["Start"]) --> OAuthCallback["Open Zoom OAuth callback page"]
    OAuthCallback --> OAuthError{"OAuth error present?"}

    OAuthError -- Yes --> ErrorPage["Output: OAuth failure message"]
    ErrorPage --> BackToBridge["Return to Zoom bridge"]

    OAuthError -- No --> BridgePage["Open Zoom bridge page"]
    BridgePage --> TokenReady{"Bridge token available?"}

    TokenReady -- No --> TokenPrompt["Input: Bridge token or meeting access"]
    TokenPrompt --> TokenReady

    TokenReady -- Yes --> ContextReady{"Meeting context ready?"}
    ContextReady -- Yes --> StartTracking["Output: Start session tracking from meeting"]
    ContextReady -- No --> BridgePage

    StartTracking --> NeedLiveControl{"Need live control or monitoring?"}
    NeedLiveControl -- Yes --> LiveActions["Update session state and live events"]
    NeedLiveControl -- No --> End(["End"])

    LiveActions --> End
    BackToBridge --> BridgePage

    classDef io fill:#f8fafc,stroke:#111827,stroke-width:1.5px;
    classDef decision fill:#ffffff,stroke:#111827,stroke-width:1.5px;
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff;

    class OAuthCallback,ErrorPage,BackToBridge,BridgePage,TokenPrompt,StartTracking,LiveActions io;
    class OAuthError,TokenReady,ContextReady,NeedLiveControl decision;
    class Start,End terminal;
```

#### Flow Description

1. **Start**: User clicks Zoom OAuth authorization link or redirects from Zoom app
2. **Open Zoom OAuth Callback Page**: Backend receives OAuth code and processes authorization
3. **OAuth Error Present?**: Check for Zoom authorization errors (user denied, invalid scope, etc.)
   - **Yes** → Display error message
   - **No** → Proceed to bridge setup
4. **Output: OAuth Failure Message**: Display error details and link back to bridge
5. **Return to Zoom Bridge**: User clicks link or uses back button
6. **Open Zoom Bridge Page**: Display Zoom bridge interface with token input and meeting context setup
7. **Bridge Token Available?**: Check if bridge token for Zoom meeting context exists in session storage
   - **No** → Prompt for token entry
   - **Yes** → Skip to context readiness check
8. **Input: Bridge Token or Meeting Access**: Paste bridge token from Zoom meeting or enter meeting access code
9. **Meeting Context Ready?**: Check if meeting ID, participant list, and attendee context are available
    - **Yes** → Proceed to start tracking
    - **No** → Return to bridge page for additional input
10. **Output: Start Session Tracking from Meeting**: Create session record linked to Zoom meeting, display tracking interface
11. **Need Live Control or Monitoring?**: User decision
    - **Yes** → Enable live session updates and event processing
    - **No** → End bridge flow
12. **Update Session State and Live Events**: Process Zoom participant events (join/leave), engagement signals, and sync to Engagium database
13. **End**: Zoom bridge flow complete or user disconnects

#### Key Features Mapped

- **OAuth authorization**: Zoom app integration with permission scope handling (lines 1-4)
- **Error handling**: Graceful error display with recovery path (lines 3-5)
- **Bridge token validation**: Meeting context security via bridge token (lines 7-8)
- **Live event sync**: Real-time Zoom participant and engagement data processing (line 12)
- **Stateful flow**: Token persistence across bridge page interactions (line 7)

---

### A.3.8 Chrome Extension Meeting Tracking Flow

```mermaid
flowchart TD
    Start([Start: Extension loaded on Google Meet])
    MeetingDetected{Meeting detected?}
    MappedBefore{Meeting link already mapped to class?}
    ClassesAvailable{Classes available in system?}
    SelectClass[Input: Select class manually or view auto-mapped]
    StartTracking{Start tracking attendance?}
    SessionMonitor[Monitor real-time participants and engagement]
    CheckEngagement{Need to monitor engagement or match students?}
    MatchStudents[Input: View unmatched participants]
    EndSession{End session and submit attendance?}
    SubmitData[Output: Submit attendance data to backend]
    Stop([End: Extension popup closes])

    Start --> MeetingDetected
    MeetingDetected -- Yes --> MappedBefore
    MeetingDetected -- No --> Stop
    
    MappedBefore -- Yes --> SelectClass
    MappedBefore -- No --> ClassesAvailable
    
    ClassesAvailable -- Yes --> SelectClass
    ClassesAvailable -- No --> Stop
    
    SelectClass --> StartTracking
    StartTracking -- Yes --> SessionMonitor
    StartTracking -- No --> Stop
    
    SessionMonitor --> CheckEngagement
    CheckEngagement -- Yes --> MatchStudents
    MatchStudents --> CheckEngagement
    CheckEngagement -- No --> EndSession
    
    EndSession -- Yes --> SubmitData
    EndSession -- No --> SessionMonitor
    
    SubmitData --> Stop
```

#### Flow Description

1. **Start**: Extension activates when professor opens Google Meet (manifest.json content script triggers)
2. **Meeting Detected?**: Extension's content script detects Google Meet DOM
   - **Yes** → Check if meeting was previously tracked
   - **No** → Wait or close extension (stop)
3. **Meeting Link Already Mapped?**: Check if this meeting URL was saved from previous session
   - **Yes** → Proceed to class selection with pre-selected class
   - **No** → Check for available classes
4. **Classes Available?**: Query backend for professor's active classes
   - **Yes** → Proceed to manual selection
   - **No** → Error message, dismiss extension (stop)
5. **Select Class**: Display class selector UI (auto-populated if mapped, manual dropdown if not)
   - Input: Professor selects class from dropdown or accepts auto-mapped suggestion
6. **Start Tracking?**: User clicks "Start Tracking" button
   - **Yes** → Create session, show monitoring interface
   - **No** → Dismiss meeting detection UI (stop)
7. **Session Monitor**: Display real-time tracking interface with:
   - Session duration timer
   - Total participant count
   - Matched students count
   - Unmatched/pending students list
8. **Need to Monitor Engagement?**: During active session, professor can check participants or match students
   - **Yes** → View unmatched participants, manually verify matches
   - **No** → Proceed to end session
9. **Manual Match Students** (loop): Professor can view unmatched participants and verify identity matches
   - Returns to engagement check until ready to end
10. **End Session?**: User clicks "End Tracking" button when meeting ends
    - **Yes** → Submit attendance data to backend
    - **No** → Continue monitoring (loop back to engagement check)
11. **Submit Data**: Output attendance records with matched/unmatched status to backend
12. **Stop**: Extension popup closes or loses focus

#### Key Features Mapped

- **Auto-mapping**: Meeting links remembered from previous sessions (lines 3-4)
- **Real-time sync**: Participants join/leave updates during session (line 8)
- **Unmatched handling**: Students without class roster matches viewable (line 9)
- **Error handling**: Graceful stop when no classes or meeting detection fails (lines 3, 6)
- **Session persistence**: Backend synchronization on end session (line 11)

---

---

## A.4 Visual Table of Contents (VTOC) Diagram

The VTOC diagram presents an updated module hierarchy mapped to current implementation.

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

**IPO Summary (with Feedback)**

| Category | Input | Process | Output | Feedback |
|----------|-------|---------|--------|----------|
| Authentication | Email/password/JWT/extension token | Validate credentials and tokens | Authenticated session and API access | Error responses and token refresh prompts |
| Class/Roster Management | Class metadata and roster uploads | CRUD, import, dedupe, merge | Updated class/student/tag/note state | Validation results and conflict prompts |
| Session Lifecycle | Meeting URL/context + commands | Start, track status, end/finalize | Session records with timestamps/status | Live status messages and corrective actions |
| Attendance & Participation | Detected meeting events | Normalize, match, store, broadcast | Attendance intervals/records and participation logs | Unmatched participant linking and manual adjustments |
| Analytics | Stored attendance/participation/session data | Aggregate by class/session/student | Dashboard metrics and report/export data | Instructor decisions for next sessions and roster updates/participant linking |

