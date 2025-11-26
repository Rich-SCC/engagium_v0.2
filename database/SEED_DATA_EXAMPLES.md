# Seed Data Examples

This document shows examples of the actual data that gets seeded into the database.

## Example User (Instructor)

```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "email": "john.doe@university.edu",
  "password": "Password123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "instructor"
}
```

## Example Class

```json
{
  "id": "10000000-0000-0000-0000-000000000001",
  "instructor_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "name": "Introduction to Computer Science",
  "subject": "Computer Science",
  "section": "CS101-A",
  "description": "Fundamentals of programming, algorithms, and problem-solving using Python.",
  "schedule": {
    "days": ["monday", "wednesday", "friday"],
    "time": "9:00 AM"
  },
  "status": "active"
}
```

## Example Students

```json
[
  {
    "id": "20000000-0000-0000-0000-000000000001",
    "class_id": "10000000-0000-0000-0000-000000000001",
    "first_name": "Emma",
    "last_name": "Wilson",
    "email": "emma.wilson@student.edu",
    "student_id": "STU001"
  },
  {
    "id": "20000000-0000-0000-0000-000000000002",
    "class_id": "10000000-0000-0000-0000-000000000001",
    "first_name": "Liam",
    "last_name": "Brown",
    "email": "liam.brown@student.edu",
    "student_id": "STU002"
  }
]
```

## Example Session

```json
{
  "id": "30000000-0000-0000-0000-000000000001",
  "class_id": "10000000-0000-0000-0000-000000000001",
  "title": "Week 1: Introduction to Python",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "started_at": "2025-11-12T09:00:00Z",
  "ended_at": "2025-11-12T09:50:00Z",
  "status": "ended"
}
```

## Example Participation Logs

### Highly Active Student (Emma)

```json
[
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000001",
    "interaction_type": "chat",
    "interaction_value": "Great introduction!",
    "timestamp": "2025-11-12T09:15:00Z"
  },
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000001",
    "interaction_type": "mic_toggle",
    "interaction_value": "on",
    "timestamp": "2025-11-12T09:20:00Z"
  },
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000001",
    "interaction_type": "chat",
    "interaction_value": "Can you explain that again?",
    "timestamp": "2025-11-12T09:35:00Z"
  },
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000001",
    "interaction_type": "reaction",
    "interaction_value": "👍",
    "timestamp": "2025-11-12T09:40:00Z"
  }
]
```

### Moderately Active Student (Olivia)

```json
[
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000003",
    "interaction_type": "chat",
    "interaction_value": "Thanks for the explanation",
    "timestamp": "2025-11-12T09:45:00Z"
  }
]
```

### Low Activity Student (Ethan)

```json
[
  {
    "session_id": "30000000-0000-0000-0000-000000000001",
    "student_id": "20000000-0000-0000-0000-000000000006",
    "interaction_type": "camera_toggle",
    "interaction_value": "on",
    "timestamp": "2025-11-12T09:05:00Z"
  }
]
```

## Example Session Links

```json
[
  {
    "class_id": "10000000-0000-0000-0000-000000000001",
    "link_url": "https://meet.google.com/abc-defg-hij",
    "link_type": "meet",
    "label": "CS101 Main Meeting Room",
    "is_primary": true
  },
  {
    "class_id": "10000000-0000-0000-0000-000000000001",
    "link_url": "https://meet.google.com/backup-room-123",
    "link_type": "meet",
    "label": "CS101 Backup Room",
    "is_primary": false
  }
]
```

## Example Student Tags

```json
[
  {
    "id": "40000000-0000-0000-0000-000000000001",
    "class_id": "10000000-0000-0000-0000-000000000001",
    "tag_name": "Needs Help",
    "tag_color": "#EF4444"
  },
  {
    "id": "40000000-0000-0000-0000-000000000002",
    "class_id": "10000000-0000-0000-0000-000000000001",
    "tag_name": "Highly Engaged",
    "tag_color": "#10B981"
  }
]
```

## Example Tag Assignments

```json
[
  {
    "student_id": "20000000-0000-0000-0000-000000000001",
    "tag_id": "40000000-0000-0000-0000-000000000002"
  },
  {
    "student_id": "20000000-0000-0000-0000-000000000001",
    "tag_id": "40000000-0000-0000-0000-000000000003"
  }
]
```

Emma has both "Highly Engaged" and "Group Leader" tags.

## Example Student Notes

```json
[
  {
    "student_id": "20000000-0000-0000-0000-000000000001",
    "note_text": "Excellent participation in class discussions. Shows strong understanding of concepts.",
    "created_by": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "created_at": "2025-11-19T10:00:00Z"
  },
  {
    "student_id": "20000000-0000-0000-0000-000000000001",
    "note_text": "Led group discussion on recursion. Great leadership skills.",
    "created_by": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "created_at": "2025-11-23T14:30:00Z"
  }
]
```

## Example Exempted Accounts

```json
[
  {
    "class_id": "10000000-0000-0000-0000-000000000001",
    "account_identifier": "ta.john@university.edu",
    "reason": "Teaching Assistant"
  },
  {
    "class_id": "10000000-0000-0000-0000-000000000001",
    "account_identifier": "john.doe@university.edu",
    "reason": "Instructor"
  }
]
```

## Example Notifications

```json
[
  {
    "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "type": "session_ended",
    "title": "Session Ended",
    "message": "Your session \"Week 6: Data Structures - Dictionaries\" has ended.",
    "action_url": "/sessions/30000000-0000-0000-0000-000000000006",
    "read": false,
    "created_at": "2025-11-23T10:50:00Z"
  },
  {
    "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "type": "low_participation",
    "title": "Low Participation Alert",
    "message": "3 students had minimal participation in the last session.",
    "action_url": "/classes/10000000-0000-0000-0000-000000000001/analytics",
    "read": false,
    "created_at": "2025-11-23T10:51:00Z"
  }
]
```

## Data Relationships

### John Doe's Complete Profile

```
👤 John Doe (john.doe@university.edu)
├── 📚 Classes (2)
│   ├── Introduction to Computer Science (CS101-A)
│   │   ├── 🎓 Students (15)
│   │   │   ├── Emma Wilson (STU001) - Highly Engaged, Group Leader
│   │   │   ├── Liam Brown (STU002) - Highly Engaged
│   │   │   ├── Olivia Garcia (STU003)
│   │   │   ├── Noah Martinez (STU004)
│   │   │   ├── Ava Rodriguez (STU005)
│   │   │   ├── Ethan Davis (STU006) - Needs Help
│   │   │   └── ... 9 more students
│   │   ├── 📅 Sessions (6)
│   │   │   ├── Week 1: Introduction to Python (14 days ago)
│   │   │   ├── Week 2: Variables and Data Types (12 days ago)
│   │   │   ├── Week 3: Control Flow (10 days ago)
│   │   │   ├── Week 4: Functions and Modules (7 days ago)
│   │   │   ├── Week 5: Data Structures - Lists (5 days ago)
│   │   │   └── Week 6: Data Structures - Dictionaries (3 days ago)
│   │   ├── 💬 Participation (varies by session)
│   │   ├── 🏷️ Tags (3)
│   │   │   ├── Needs Help
│   │   │   ├── Highly Engaged
│   │   │   └── Group Leader
│   │   └── 🔗 Meeting Links (2)
│   └── Data Structures and Algorithms (CS201-B)
│       ├── 🎓 Students (10)
│       └── 📅 Sessions (3)
└── 🔔 Notifications (3)
```

## Statistics

- **Total Interaction Types:** 5 (chat, mic_toggle, camera_toggle, reaction, manual_entry)
- **Most Active Student:** Emma Wilson (4 interactions in Week 1 session alone)
- **Largest Class:** Introduction to Computer Science (15 students)
- **Most Sessions:** Introduction to Computer Science (6 sessions)
- **Tag Colors:** Red (#EF4444), Green (#10B981), Purple (#8B5CF6), Orange (#F59E0B)

## Use Cases Covered

1. ✅ **High engagement tracking** - Emma, Liam
2. ✅ **Low engagement detection** - Ethan, others with minimal activity
3. ✅ **Multiple interaction types** - chat, mic, camera, reactions
4. ✅ **Student tagging** - performance and behavior labels
5. ✅ **Note taking** - longitudinal observations
6. ✅ **Multiple meeting platforms** - Google Meet, Zoom, Teams
7. ✅ **Exempted accounts** - TAs and instructors
8. ✅ **Multiple classes per instructor** - realistic teaching load
9. ✅ **Archived classes** - historical data
10. ✅ **Notifications** - system alerts and warnings
