# Database Schema
## Engagium System - Current Data Model Reference

**Last Updated:** April 18, 2026  
**Source of truth:** `backend/db/schema.sql`

---

## 1. Schema Overview

The current PostgreSQL schema supports instructor-owned classes, meeting-driven session tracking, attendance interval accounting, and participation logging.

Core domains:

- Identity and authentication.
- Classes and roster management.
- Session lifecycle and attendance.
- Participation events.
- Student organization metadata (tags/notes).

---

## 2. Enum Types

### 2.1 `user_role`

- `instructor`
- `admin`

### 2.2 `session_status`

- `scheduled`
- `active`
- `ended`

### 2.3 `interaction_type`

- `manual_entry`
- `chat`
- `reaction`
- `mic_toggle`
- `camera_toggle`
- `hand_raise`
- `join`
- `leave`

---

## 3. Core Tables

### 3.1 Identity/Auth

- `users`
- `refresh_token_sessions`
- `extension_tokens`

`users` stores account profile and password hash. Refresh sessions and extension tokens are persisted separately for web and meeting-side auth models.

### 3.2 Class/Roster Domain

- `classes`
- `students`
- `session_links`
- `exempted_accounts`

Key details:

- `students.deleted_at` implements soft delete.
- `(class_id, student_id)` uniqueness is enforced.
- Session links support provider metadata and Zoom fields.

### 3.3 Session/Attendance Domain

- `sessions`
- `attendance_records`
- `attendance_intervals`

Key details:

- Sessions carry actual `started_at` and `ended_at` timestamps.
- Attendance uses both final records and interval rows.
- `attendance_records` enforces uniqueness per `(session_id, participant_name)`.

### 3.4 Participation Domain

- `participation_logs`

Key details:

- `student_id` is nullable for unmatched participants.
- `interaction_type` is enum-backed.
- `additional_data` (JSONB) stores event-specific metadata.

### 3.5 Student Organization Domain

- `student_tags`
- `student_tag_assignments`
- `student_notes`

Key details:

- Class-scoped tag uniqueness is enforced.
- Student-tag assignment uniqueness is enforced.
- Notes are user-authored records tied to students.

---

## 4. Table-by-Table Summary

| Table | Purpose |
|------|---------|
| `users` | Instructor/admin account records |
| `refresh_token_sessions` | Per-session refresh token persistence |
| `extension_tokens` | Hashed meeting-side auth tokens with revocation/expiry |
| `classes` | Instructor-owned class metadata and schedules |
| `students` | Roster entries with soft-delete support |
| `sessions` | Meeting session lifecycle records |
| `attendance_records` | Final per-participant attendance state |
| `attendance_intervals` | Join/leave interval history for duration calculations |
| `participation_logs` | Event-level participation interactions |
| `session_links` | Class-linked meeting URLs and platform metadata |
| `exempted_accounts` | Accounts excluded from attendance tracking |
| `student_tags` | Class-level tag definitions |
| `student_tag_assignments` | Many-to-many student-tag mapping |
| `student_notes` | Instructor notes on students |

---

## 5. Integrity and Performance Rules

Implemented integrity controls:

- Foreign keys across all ownership boundaries.
- Unique constraints for links, student IDs, tag assignments, attendance participants, and exemption identifiers.
- Check constraints for class/attendance status values.

Implemented performance controls:

- Indexes on class/session/student foreign keys.
- Indexes on attendance and participation query paths.
- Token lookup and expiry indexes.
- Trigger-based `updated_at` maintenance on mutable tables.

---

## 6. Observed Behavioral Semantics

- Authorization is centered on instructor ownership of classes and derived resources.
- Sessions are primarily started from meeting contexts, then updated/ended via APIs.
- Attendance duration is interval-driven rather than single timestamp-diff assumptions.
- Participation events can exist even when roster matching is not resolved.

---

## 7. Notes for Chapter 3 Consistency

When referencing this schema in thesis sections, avoid mentioning non-existent current tables such as a standalone `notifications` table. The active schema entities are exactly those listed above.

