# Engagium Level 1 DFD — Modular View

This document splits the Level 1 DFD into four printable modules for clearer presentation on Letter-sized pages.

## Module A — User & Security

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
    %% Note: p10 writes sessions (d11) — sessions box is shown in Module C to avoid cross-module node duplication
    %% p10 writes: d11 (sessions)
```

_Stores referenced:_ `d1` `d2` `d3`

---

## Module B — Academic Management

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

_Stores referenced:_ `d4` `d5` `d6` `d7` `d8` `d9` `d10`

---

## Module C — Session & Participation

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

_Stores referenced:_ `d11` `d12` `d13` `d14`

---

## Module D — Intelligence (Analytics & Reporting)

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

_Stores referenced by Analytics:_ `d4`, `d7`, `d8`, `d10`, `d11`, `d12`, `d13`, `d14`

---

Notes:
- Each module is intended to fit on a single Letter-sized page when rendered. You can shorten arrow labels if you prefer more whitespace for node labels.
- These module diagrams preserve the same naming and store references as the consolidated Level 1 DFD.
