# Database Schema
## Engagium System - Chapter 3.3.2 Reference (Data Structures)

This document describes the complete database schema for the Engagium system.

---

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

*This document reflects the database schema as defined in `database/schema.sql` as of December 2025.*
