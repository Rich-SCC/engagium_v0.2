# Engagium Level 1 DFD

**Notation:** Gane-Sarson style, represented with SSADM-friendly Mermaid shapes for ease of diagram generation.

## Process and Data-Store Mapping

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

## Level 1 Diagram

### Data store field summaries (highlights)

- `users`: id, email, password_hash, first_name, last_name, role, refresh_token
- `refresh_token_sessions`: id, user_id, token_hash, expires_at, device_id
- `extension_tokens`: id, user_id, token_hash, token_preview, expires_at, revoked
- `classes`: id, instructor_id, name, schedule (jsonb), status
- `session_links`: id, class_id, link_url, link_type, is_primary
- `exempted_accounts`: id, class_id, account_identifier, reason
- `students`: id, class_id, full_name, student_id, deleted_at
- `student_tags`: id, class_id, tag_name, tag_color
- `student_tag_assignments`: id, student_id, tag_id, assigned_at
- `student_notes`: id, student_id, note_text, created_by, created_at
- `sessions`: id, class_id, title, meeting_link, started_at, ended_at, status
- `attendance_records`: id, session_id, student_id, participant_name, status, total_duration_minutes, first_joined_at, last_left_at
- `attendance_intervals`: id, session_id, student_id, participant_name, joined_at, left_at
- `participation_logs`: id, session_id, student_id, interaction_type, interaction_value, timestamp, additional_data


```mermaid
flowchart LR
    instructor((Instructor\nUser))

    p1[1.0 Authentication\nand profile management]
    p2[2.0 Extension token\nlifecycle]
    p3[3.0 Class and schedule\nmanagement]
    p4[4.0 Session link and\nexemption management]
    p5[5.0 Student roster and\nannotations]
    p6[6.0 Session lifecycle and\ncalendar views]
    p7[7.0 Attendance tracking and\nparticipant linking]
    p8[8.0 Participation ingestion and\nlive feed]
    p9[9.0 Analytics and\nreporting]
    p10[10.0 Zoom bridge and\nbridge-auth support]

    d1[users]
    d2[refresh_token_sessions]
    d3[extension_tokens]
    d4[classes]
    d5[session_links]
    d6[exempted_accounts]
    d7[students]
    d8[student_tags]
    d9[student_tag_assignments]
    d10[student_notes]
    d11[sessions]
    d12[attendance_records]
    d13[attendance_intervals]
    d14[participation_logs]

    instructor -->|login, sign-up, refresh, profile edit, password change, logout| p1
    p1 -->|authenticated session, profile state| instructor
    p1 -->|write: id,email,password_hash,first_name,last_name,role| d1
    p1 -->|write: id,user_id,token_hash,expires_at,device_id| d2

    instructor -->|generate, list, revoke extension tokens| p2
    p2 -->|token preview list, revocation confirmation| instructor
    p2 -->|write: id,user_id,token_hash,token_preview,expires_at,revoked| d3
    p2 -->|associate token with user via user_id| d1

    instructor -->|create/edit/archive/delete class, update schedule| p3
    p3 -->|updated class list, class detail state| instructor
    p3 -->|write: id,instructor_id,name,schedule,status| d4

    instructor -->|manage session links, manage exemptions| p4
    p4 -->|link list, primary-link state, exemption list| instructor
    p4 -->|write: id,class_id,link_url,link_type,is_primary| d5
    p4 -->|write: id,class_id,account_identifier,reason| d6
    p4 -->|update classes with link references| d4

    instructor -->|add/edit/delete/import/export/merge students, create from participant, manage tags, manage notes| p5
    p5 -->|roster updates, duplicate warnings, export file, tag state, note timeline| instructor
    p5 -->|write: id,class_id,full_name,student_id| d7
    p5 -->|write: id,class_id,tag_name,tag_color| d8
    p5 -->|write: id,student_id,tag_id,assigned_at| d9
    p5 -->|write: id,student_id,note_text,created_by,created_at| d10
    p5 -->|update: classes.roster metadata| d4

    instructor -->|start session from meeting, end session with timestamp, open history/detail/bundled/calendar/date-range views| p6
    p6 -->|active session record, ended session record, session history, calendar grouping| instructor
    p6 -->|write: id,class_id,title,meeting_link,started_at,ended_at,status| d11
    p6 -->|update: classes.last_session_at| d4

    %% Multiple processes write/read the same stores -> show multi-process flows
    %% Session creation (p6) and Zoom bridge (p10) both write to `sessions`
    p10 -->|write: id,class_id,title,meeting_link,started_at,ended_at,status| d11
    p6 -->|write: id,class_id,title,meeting_link,started_at,ended_at,status| d11

    %% Attendance processes write both summary records and intervals
    p7 -->|write: session_id,student_id,participant_name,status,total_duration_minutes,first_joined_at,last_left_at| d12
    p7 -->|write: session_id,student_id,participant_name,joined_at,left_at| d13

    %% Live participation writes logs; analytics reads them
    p8 -->|write: session_id,student_id,interaction_type,interaction_value,timestamp,additional_data| d14
    p8 -->|feeds analytics event stream| p9 

    instructor -->|record join/leave, link participant, submit bulk attendance, open attendance views| p7
    p7 -->|attendance roster, interval history, duration totals, matched participant state| instructor
    p7 -->|write attendance summary into attendance_records| d12
    p7 -->|write attendance intervals into attendance_intervals| d13
    p7 -->|update: sessions.attendance_summary| d11
    p7 -->|associate: student_id mapping| d7

    instructor -->|submit live participation, submit bulk participation, open participation views| p8
    p8 -->|live feed updates, persisted participation log, recent activity| instructor
    p8 -->|write participation_logs with session_id student_id interaction fields| d14
    p8 -->|link participation to session via session_id| d11
    p8 -->|associate participation to student via student_id| d7

    %% Analytics reads many stores (no direct writes)
    p9 -->|read classes fields id name schedule| d4
    p9 -->|read students fields id full_name student_id| d7
    p9 -->|read sessions fields id started_at ended_at status| d11
    p9 -->|read attendance_records fields status total_duration_minutes first_joined_at last_left_at| d12
    p9 -->|read attendance_intervals fields joined_at left_at| d13
    p9 -->|read participation_logs fields interaction_type interaction_value timestamp| d14
    p9 -->|read student_tags fields tag_name tag_color| d8
    p9 -->|read student_notes fields note_text created_by created_at| d10

    instructor -->|review attendance, participation, analytics, session stats| p9
    p9 -->|charts, summaries, class analytics, student analytics, attendance stats| instructor

    instructor -->|open Zoom bridge, complete OAuth bridge flow, verify bridge token context| p10
    p10 -->|authenticated bridge access, Zoom bridge state, Zoom session actions| instructor
    p10 -->|read and update extension_tokens validate last_used_at revoked| d3
    p10 -->|write sessions fields id class_id title meeting_link started_at ended_at status| d11
    p10 -->|update classes bridge related flags| d4

    classDef entity fill:#ffffff,stroke:#111111,stroke-width:2px;
    classDef process fill:#f4f4f4,stroke:#111111,stroke-width:1.5px;
    classDef store fill:#ffffff,stroke:#111111,stroke-width:1px;

    class instructor entity;
    class p1,p2,p3,p4,p5,p6,p7,p8,p9,p10 process;
    class d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14 store;
```
