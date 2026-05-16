# Engagium Context DFD

**Notation:** Gane-Sarson style, represented with SSADM-friendly Mermaid shapes for ease of diagram generation.

## Scope

The context diagram shows the single external entity used by the current system: **Instructor (User)**.

## Instructor Input / Output Catalogue

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

## Context Diagram

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
