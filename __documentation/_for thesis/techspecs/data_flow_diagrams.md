# Data Flow Diagrams
## Engagium System - Chapter 3.3.3 Reference

This document provides detailed data flow diagrams showing how information moves through the Engagium system.

---

## 1. Complete Session Lifecycle Flow

This diagram shows the entire flow from when an instructor joins a Google Meet session until the session ends.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SESSION LIFECYCLE DATA FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: MEETING DETECTION
═══════════════════════════

    Instructor opens Google Meet
              │
              ▼
    ┌─────────────────────┐
    │ URL Monitor detects │
    │ meet.google.com/*   │
    │ URL pattern         │
    └──────────┬──────────┘
               │
               │ Extracts meeting ID from URL
               ▼
    ┌─────────────────────┐
    │ Content Script      │
    │ sends message:      │
    │ MEETING_DETECTED    │
    │ { meetingId, url }  │
    └──────────┬──────────┘
               │
               │ chrome.runtime.sendMessage
               ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ checks meeting URL  │
    │ against class links │
    └──────────┬──────────┘
               │
               │ Found matching class?
               ▼
         ┌─────┴─────┐
         │           │
        YES          NO
         │           │
         ▼           ▼
    ┌─────────┐  ┌─────────┐
    │ Ready   │  │ Unknown │
    │ to      │  │ meeting │
    │ track   │  │ prompt  │
    └────┬────┘  │ user    │
         │       └─────────┘


PHASE 2: SESSION START
═══════════════════════

    Instructor clicks "Start Session" in popup
              │
              ▼
    ┌─────────────────────┐
    │ Popup sends message │
    │ START_SESSION       │
    │ { classId,          │
    │   meetingUrl }      │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ POST /sessions/     │
    │ start-from-meeting  │
    │                     │
    │ Headers:            │
    │ X-Extension-Token   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │  1. Verify extension token               │
    │  2. Find class by instructor_id          │
    │  3. Create session record:               │
    │     - status: 'active'                   │
    │     - started_at: NOW()                  │
    │     - meeting_link: url                  │
    │  4. Broadcast socket event               │
    │                                          │
    └──────────────────────┬──────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Response to │ │ Store in    │ │ Socket emit │
    │ Extension   │ │ PostgreSQL  │ │ session:    │
    │ { session } │ │             │ │ started     │
    └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │                               │
           ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │ Service     │                 │ Dashboard   │
    │ Worker      │                 │ receives    │
    │ stores in   │                 │ notification│
    │ IndexedDB   │                 │ shows new   │
    │ starts      │                 │ active      │
    │ tracking    │                 │ session     │
    └─────────────┘                 └─────────────┘


PHASE 3: PARTICIPANT TRACKING (During Session)
══════════════════════════════════════════════

    People Panel in Google Meet
              │
              │ MutationObserver detects DOM change
              ▼
    ┌─────────────────────┐
    │ Participant         │
    │ Detector compares   │
    │ current vs tracked  │
    │ participants        │
    └──────────┬──────────┘
               │
        ┌──────┴──────┐
        │             │
   NEW PARTICIPANT    PARTICIPANT LEFT
        │                    │
        ▼                    ▼
    ┌─────────────┐    ┌─────────────┐
    │ PARTICIPANT_│    │ PARTICIPANT_│
    │ JOINED      │    │ LEFT        │
    │ { name,     │    │ { id,       │
    │   timestamp }│    │   timestamp}│
    └──────┬──────┘    └──────┬──────┘
           │                  │
           └────────┬─────────┘
                    │
                    ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │                     │
    │ 1. Store locally    │
    │ 2. Match to student │
    │ 3. Send to backend  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │ JOIN EVENT:                              │
    │ 1. Create/update attendance_record       │
    │    - status: 'present'                   │
    │    - first_joined_at: timestamp          │
    │ 2. Create attendance_interval            │
    │    - joined_at: timestamp                │
    │    - left_at: NULL                       │
    │                                          │
    │ LEAVE EVENT:                             │
    │ 1. Update attendance_interval            │
    │    - left_at: timestamp                  │
    │ 2. Update attendance_record              │
    │    - last_left_at: timestamp             │
    │    - total_duration_minutes: calculated  │
    │                                          │
    │ 3. Socket broadcast to session room      │
    └──────────────────────┬──────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Dashboard   │
                    │ Live Feed   │
                    │ updates     │
                    │ attendance  │
                    │ list        │
                    └─────────────┘


PHASE 4: SESSION END
════════════════════

    Instructor clicks "End Session" OR leaves meeting
              │
              ▼
    ┌─────────────────────┐
    │ Service Worker      │
    │ PUT /sessions/:id/  │
    │ end-with-timestamp  │
    │                     │
    │ { endedAt: ISO }    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │              BACKEND SERVER              │
    │                                          │
    │ 1. Update session:                       │
    │    - status: 'ended'                     │
    │    - ended_at: timestamp                 │
    │                                          │
    │ 2. Close all open intervals:             │
    │    UPDATE attendance_intervals           │
    │    SET left_at = ended_at                │
    │    WHERE session_id = ? AND left_at NULL │
    │                                          │
    │ 3. Recalculate all durations:            │
    │    For each participant, sum intervals   │
    │                                          │
    │ 4. Mark absent students:                 │
    │    Students in class roster not in       │
    │    attendance_records → status: 'absent' │
    │                                          │
    │ 5. Socket broadcast session:ended        │
    └──────────────────────┬──────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Extension   │ │ Database    │ │ Dashboard   │
    │ clears      │ │ has final   │ │ moves       │
    │ local state │ │ attendance  │ │ session to  │
    │             │ │ records     │ │ history     │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Participation Event Detection Flow

This diagram details how each type of participation event is detected and processed.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PARTICIPATION EVENT DETECTION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                         GOOGLE MEET PAGE DOM
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ PEOPLE  │                 │  CHAT   │                 │ TOAST   │
│ PANEL   │                 │ PANEL   │                 │ NOTIFS  │
└────┬────┘                 └────┬────┘                 └────┬────┘
     │                           │                           │
     ▼                           ▼                           ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│ Participant │           │ Chat        │           │ Reaction    │
│ Detector    │           │ Monitor     │           │ Detector    │
│             │           │             │           │             │
│ Detects:    │           │ Detects:    │           │ Detects:    │
│ - Join      │           │ - Messages  │           │ - Emoji     │
│ - Leave     │           │ - Sender    │           │ - Who       │
│ - Mic state │           │ - Text      │           │             │
└──────┬──────┘           └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       │                         │                         │
       │                    ┌────┴─────┐                   │
       │                    │          │                   │
       │              ┌─────┴────┐ ┌───┴───────┐          │
       │              ▼          ▼ ▼           │          │
       │        ┌─────────┐  ┌─────────┐       │          │
       │        │Hand Raise│  │ Media   │       │          │
       │        │Detector │  │ State   │       │          │
       │        │         │  │Detector │       │          │
       │        │Detects: │  │         │       │          │
       │        │- Raised │  │Detects: │       │          │
       │        │- Lowered│  │- Mic on │       │          │
       │        └────┬────┘  └────┬────┘       │          │
       │             │            │            │          │
       └─────────────┴────────────┴────────────┴──────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │      EVENT EMITTER       │
                    │                          │
                    │ queueEvent(type, data)   │
                    │                          │
                    │ Responsibilities:        │
                    │ - Deduplicate events     │
                    │ - Add timestamps         │
                    │ - Format payload         │
                    │ - Send to Service Worker │
                    └────────────┬─────────────┘
                                 │
                                 │ chrome.runtime.sendMessage
                                 ▼
                    ┌──────────────────────────┐
                    │     SERVICE WORKER       │
                    │                          │
                    │ Message Handler:         │
                    │                          │
                    │ switch(message.type) {   │
                    │   case PARTICIPANT_JOINED│
                    │   case PARTICIPANT_LEFT  │
                    │   case CHAT_MESSAGE      │
                    │   case REACTION          │
                    │   case HAND_RAISE        │
                    │   case MIC_TOGGLE        │
                    │ }                        │
                    └────────────┬─────────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │             │             │
                   ▼             ▼             ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │ Store in    │ │ Match to    │ │ Send to     │
          │ IndexedDB   │ │ Student     │ │ Backend     │
          │ (offline    │ │ (by name    │ │ API         │
          │  support)   │ │  matching)  │ │             │
          └─────────────┘ └─────────────┘ └──────┬──────┘
                                                 │
                                                 ▼
                    ┌──────────────────────────────────────┐
                    │           BACKEND SERVER              │
                    │                                       │
                    │ POST /sessions/:id/live-event         │
                    │                                       │
                    │ Body:                                 │
                    │ {                                     │
                    │   eventType: "chat" | "reaction" |    │
                    │              "hand_raise" | "mic_on"  │
                    │   participantName: "John Doe",        │
                    │   timestamp: "2025-12-03T10:30:00Z",  │
                    │   data: { message: "..." } // varies  │
                    │ }                                     │
                    │                                       │
                    │ Processing:                           │
                    │ 1. Validate event data                │
                    │ 2. Find/match student_id              │
                    │ 3. INSERT into participation_logs     │
                    │ 4. Broadcast via Socket.io            │
                    └───────────────────┬──────────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                        ▼               ▼               ▼
                  ┌─────────┐     ┌─────────┐     ┌─────────┐
                  │ Database│     │ Socket  │     │ Response│
                  │ INSERT  │     │ Emit    │     │ to      │
                  │         │     │ partici-│     │ Extension│
                  │ partic- │     │ pation: │     │         │
                  │ ipation_│     │ logged  │     │ {success}│
                  │ logs    │     │         │     │         │
                  └─────────┘     └────┬────┘     └─────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Dashboard   │
                              │ Live Feed   │
                              │             │
                              │ Real-time   │
                              │ display of  │
                              │ event       │
                              └─────────────┘
```

---

## 3. Attendance Interval Tracking Flow

This diagram shows the precision attendance tracking with duration calculation.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ATTENDANCE INTERVAL TRACKING FLOW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

SCENARIO: Student joins, leaves for break, rejoins, session ends
═══════════════════════════════════════════════════════════════

Timeline:
    10:00 AM         10:30 AM         10:45 AM         11:00 AM
       │                │                │                │
       ▼                ▼                ▼                ▼
    Student          Student          Student          Session
    JOINS            LEAVES           REJOINS          ENDS


STEP 1: First Join (10:00 AM)
─────────────────────────────
    Event: PARTICIPANT_JOINED
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Check attendance_records for student  │
    │    → NOT FOUND (first time)              │
    │                                          │
    │ 2. INSERT attendance_records:            │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    student_id: stud-456 (if matched)     │
    │    status: 'present'                     │
    │    first_joined_at: 10:00:00             │
    │    total_duration_minutes: 0             │
    │                                          │
    │ 3. INSERT attendance_intervals:          │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    joined_at: 10:00:00                   │
    │    left_at: NULL  ◄── Still in meeting   │
    └─────────────────────────────────────────┘


STEP 2: Leave for Break (10:30 AM)
──────────────────────────────────
    Event: PARTICIPANT_LEFT
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Find open interval (left_at IS NULL)  │
    │                                          │
    │ 2. UPDATE attendance_intervals:          │
    │    SET left_at = 10:30:00                │
    │    WHERE session_id = sess-123           │
    │      AND participant_name = "Juan..."    │
    │      AND left_at IS NULL                 │
    │                                          │
    │ 3. Calculate interval duration:          │
    │    10:30 - 10:00 = 30 minutes            │
    │                                          │
    │ 4. UPDATE attendance_records:            │
    │    last_left_at: 10:30:00                │
    │    total_duration_minutes: 30            │
    └─────────────────────────────────────────┘


Database State After Step 2:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_records                                                               │
├────────────┬──────────────────┬─────────┬──────────────┬───────────┬───────────┤
│ session_id │ participant_name │ status  │ first_joined │ last_left │ duration  │
├────────────┼──────────────────┼─────────┼──────────────┼───────────┼───────────┤
│ sess-123   │ Juan Dela Cruz   │ present │ 10:00:00     │ 10:30:00  │ 30 min    │
└────────────┴──────────────────┴─────────┴──────────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals                                                             │
├────────────┬──────────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │
├────────────┼──────────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │  ◄── Interval 1 (closed)
└────────────┴──────────────────┴────────────┴────────────┘


STEP 3: Rejoin After Break (10:45 AM)
─────────────────────────────────────
    Event: PARTICIPANT_JOINED
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. Check attendance_records              │
    │    → FOUND (already tracked)             │
    │                                          │
    │ 2. INSERT NEW attendance_intervals:      │
    │    session_id: sess-123                  │
    │    participant_name: "Juan Dela Cruz"    │
    │    joined_at: 10:45:00                   │
    │    left_at: NULL  ◄── New open interval  │
    │                                          │
    │ 3. attendance_records unchanged          │
    │    (will update when leaves again)       │
    └─────────────────────────────────────────┘


Database State After Step 3:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals                                                             │
├────────────┬──────────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │
├────────────┼──────────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │  ◄── Interval 1 (closed)
│ sess-123   │ Juan Dela Cruz   │ 10:45:00   │ NULL       │  ◄── Interval 2 (OPEN)
└────────────┴──────────────────┴────────────┴────────────┘


STEP 4: Session Ends (11:00 AM)
───────────────────────────────
    Event: SESSION_END
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ Backend Processing:                      │
    │                                          │
    │ 1. UPDATE session:                       │
    │    status = 'ended'                      │
    │    ended_at = 11:00:00                   │
    │                                          │
    │ 2. Close ALL open intervals:             │
    │    UPDATE attendance_intervals           │
    │    SET left_at = 11:00:00                │
    │    WHERE session_id = sess-123           │
    │      AND left_at IS NULL                 │
    │                                          │
    │ 3. Recalculate total durations:          │
    │    For each participant:                 │
    │    SUM of (left_at - joined_at)          │
    │    across all their intervals            │
    │                                          │
    │    Juan Dela Cruz:                       │
    │    Interval 1: 30 min (10:00-10:30)      │
    │    Interval 2: 15 min (10:45-11:00)      │
    │    TOTAL: 45 minutes                     │
    │                                          │
    │ 4. UPDATE attendance_records:            │
    │    total_duration_minutes = 45           │
    │    last_left_at = 11:00:00               │
    │                                          │
    │ 5. Mark absent students:                 │
    │    For students in class roster          │
    │    NOT in attendance_records:            │
    │    INSERT with status = 'absent'         │
    └─────────────────────────────────────────┘


FINAL Database State:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_records                                                               │
├────────────┬──────────────────┬─────────┬──────────────┬───────────┬───────────┤
│ session_id │ participant_name │ status  │ first_joined │ last_left │ duration  │
├────────────┼──────────────────┼─────────┼──────────────┼───────────┼───────────┤
│ sess-123   │ Juan Dela Cruz   │ present │ 10:00:00     │ 11:00:00  │ 45 min    │
│ sess-123   │ Maria Santos     │ absent  │ NULL         │ NULL      │ 0 min     │
│ sess-123   │ Pedro Reyes      │ present │ 10:05:00     │ 11:00:00  │ 55 min    │
└────────────┴──────────────────┴─────────┴──────────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ attendance_intervals (for Juan Dela Cruz)                                        │
├────────────┬──────────────────┬────────────┬────────────┬────────────┐
│ session_id │ participant_name │ joined_at  │ left_at    │ duration   │
├────────────┼──────────────────┼────────────┼────────────┼────────────┤
│ sess-123   │ Juan Dela Cruz   │ 10:00:00   │ 10:30:00   │ 30 min     │
│ sess-123   │ Juan Dela Cruz   │ 10:45:00   │ 11:00:00   │ 15 min     │
├────────────┴──────────────────┴────────────┴────────────┼────────────┤
│                                               TOTAL     │ 45 min     │
└─────────────────────────────────────────────────────────┴────────────┘
```

---

## 4. Dashboard Real-Time Update Flow

This diagram shows how the dashboard receives and displays real-time updates.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD REAL-TIME UPDATE FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Instructor opens Dashboard
              │
              ▼
    ┌─────────────────────┐
    │ React App mounts    │
    │                     │
    │ AuthContext checks  │
    │ for valid JWT       │
    └──────────┬──────────┘
               │
               │ Valid token
               ▼
    ┌─────────────────────┐
    │ WebSocketContext    │
    │ initializes         │
    │                     │
    │ socket.connect()    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐        ┌─────────────────────┐
    │ Emit:               │        │                     │
    │ join_instructor_room├───────►│   Backend Socket    │
    │ { userId }          │        │                     │
    └─────────────────────┘        │   Joins room:       │
                                   │   instructor:{id}   │
                                   └─────────────────────┘


WHEN EXTENSION SENDS EVENT:
═══════════════════════════

    Extension POST /sessions/:id/live-event
              │
              ▼
    ┌─────────────────────┐
    │ Backend processes   │
    │ event               │
    │                     │
    │ Stores in database  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Socket.io broadcast │
    │                     │
    │ io.to(`instructor:  │
    │   ${instructorId}`) │
    │   .emit('partici-   │
    │   pation:logged',   │
    │   eventData)        │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                          DASHBOARD (React)                                   │
    │                                                                              │
    │  ┌─────────────────────────────────────────────────────────────────────┐    │
    │  │ WebSocketContext                                                     │    │
    │  │                                                                      │    │
    │  │ socket.on('participation:logged', (data) => {                        │    │
    │  │   // Update React state                                              │    │
    │  │   addParticipationEvent(data);                                       │    │
    │  │ });                                                                  │    │
    │  └────────────────────────────────────┬────────────────────────────────┘    │
    │                                       │                                      │
    │                                       │ Context update triggers re-render    │
    │                                       ▼                                      │
    │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
    │  │ LiveFeed.jsx        │  │ SessionDetail.jsx   │  │ Home.jsx            │  │
    │  │                     │  │                     │  │                     │  │
    │  │ Shows event in      │  │ Updates attendance  │  │ Updates stats       │  │
    │  │ real-time feed      │  │ list if viewing     │  │ counters            │  │
    │  │ with animation      │  │ that session        │  │                     │  │
    │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
    │                                                                              │
    └──────────────────────────────────────────────────────────────────────────────┘


EVENT TYPES AND UI UPDATES:
═══════════════════════════

    ┌──────────────────────┬──────────────────────────────────────────────────────┐
    │ Socket Event         │ UI Update                                            │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ session:started      │ - New card appears in Active Sessions                │
    │                      │ - Notification badge increments                      │
    │                      │ - Live Feed shows "Session started" message          │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ session:ended        │ - Card moves to Session History                      │
    │                      │ - Stats recalculate                                  │
    │                      │ - Live Feed shows "Session ended" message            │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participant:joined   │ - Attendance list adds row                           │
    │                      │ - Participant count increments                       │
    │                      │ - Live Feed shows join event                         │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participant:left     │ - Attendance row updates duration                    │
    │                      │ - Live Feed shows leave event                        │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows interaction                        │
    │ (chat)               │ - Chat icon appears on participant row               │
    │                      │ - Session participation count increments             │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows reaction with emoji                │
    │ (reaction)           │ - Reaction count increments                          │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows hand raise                         │
    │ (hand_raise)         │ - Hand icon appears on participant row               │
    ├──────────────────────┼──────────────────────────────────────────────────────┤
    │ participation:logged │ - Live Feed shows mic activity                       │
    │ (mic_toggle)         │ - Mic icon updates on participant row                │
    └──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. Summary: End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE DATA FLOW SUMMARY                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   GOOGLE MEET   │
    │   (DOM Events)  │
    └────────┬────────┘
             │
             │ MutationObserver
             ▼
    ┌─────────────────┐
    │ CONTENT SCRIPTS │
    │ (Detectors)     │
    └────────┬────────┘
             │
             │ chrome.runtime.sendMessage
             ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ SERVICE WORKER  │────►│    IndexedDB    │
    │ (Coordinator)   │     │ (Local Storage) │
    └────────┬────────┘     └─────────────────┘
             │
             │ HTTP POST (X-Extension-Token)
             ▼
    ┌─────────────────┐
    │ BACKEND SERVER  │
    │ (Express.js)    │
    └────────┬────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐
│ PSQL  │ │Socket │ │HTTP   │
│ Store │ │Broad- │ │Resp-  │
│       │ │cast   │ │onse   │
└───────┘ └───┬───┘ └───────┘
              │
              │ WebSocket
              ▼
    ┌─────────────────┐
    │   DASHBOARD     │
    │   (React SPA)   │
    │                 │
    │ Real-time UI    │
    │ updates         │
    └─────────────────┘
```

---

*This document describes the data flow as implemented in the Engagium codebase as of December 2025.*
