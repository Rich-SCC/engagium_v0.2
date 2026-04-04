# Analytics Page Specification

**Status:** Proposed
**Audience:** Instructors and admins
**Scope:** Web app analytics page for attendance and participation intelligence

---

## 1. Purpose

The analytics page should answer two core questions:

1. How much does a student show up and stay in class?
2. How much does a student participate, overall and in a specific class?

The page should transform raw meeting events into useful summaries without exposing chat content or other sensitive message payloads.

---

## 2. Primary User Questions

The page should make these questions easy to answer at a glance:

- Which students attend consistently and which drift in and out?
- How long does a student actually remain present in a session?
- Do students join late or leave early?
- Which students speak more often, raise hands, react, or chat?
- Is participation improving or declining across recent sessions?
- How does one student compare against the rest of the class?

---

## 3. Data Inputs

The page should use the following event streams:

- Attendance joins and leaves
- Attendance intervals per student per session
- Mic toggles for speaking-time proxy
- Hand raise events
- Chat activity counts, without message content
- Reaction events

### Notes on interpretation

- Mic toggles should be treated as a speaking proxy, not verified speech detection.
- Chat should be counted only as activity volume, not content.
- Reactions and hand raises are participation signals, not quality scores.
- Attendance must remain the anchor metric; participation should enrich it, not replace it.

---

## 4. Information Architecture

The page should have three layers:

### 4.1 Overview

Shows class-level and campus-wide patterns.

Primary components:

- Summary cards for total sessions, total students, average attendance minutes, average participation score
- Class selector
- Date-range filter
- Top engaged students leaderboard
- Class comparison tiles
- Trend chart for attendance and participation over time

### 4.2 Class View

Shows analytics for one selected class.

Primary components:

- Class summary cards
- Session-by-session trend chart
- Student ranking table
- Participation breakdown by event type
- Heatmap for class engagement by date/session
- Drill-down session list

### 4.3 Student View

Shows analytics for one selected student inside one selected class.

Primary components:

- Student summary header
- Presence timeline
- Participation timeline
- Session history table
- Compare-to-class panel
- Behavior flags and insights

---

## 5. Core Metrics

### 5.1 Attendance Metrics

- **Sessions Available**: total sessions in the selected class and date range
- **Sessions Attended**: sessions where the student has at least one valid attendance interval
- **Attendance Rate**: sessions attended divided by sessions available
- **Total Minutes Present**: sum of all attendance interval durations
- **Average Minutes Present Per Session**: total minutes present divided by sessions attended
- **Late Join Count**: sessions where first join time is after session start plus grace period
- **Early Leave Count**: sessions where last leave time is before session end minus grace period
- **Rejoin Count**: number of separate join/leave intervals within a session

### 5.2 Participation Metrics

- **Chat Count**: number of chat activity events
- **Reaction Count**: number of reaction events
- **Hand Raise Count**: number of hand raise events
- **Mic Toggle Count**: number of mute/unmute transitions
- **Speaking Proxy Minutes**: total minutes inferred from unmuted mic intervals
- **Participation Sessions**: sessions with at least one participation event
- **Participation Rate**: participation sessions divided by sessions attended

### 5.3 Composite Metrics

The page should include a simple computed score to support ranking and comparison:

- **Presence Score** = normalized attendance rate + normalized minutes present + stability score
- **Participation Score** = weighted sum of chat, reactions, hand raises, and speaking proxy minutes
- **Engagement Score** = blend of presence score and participation score

Suggested weighting:

- Presence score: 60%
- Participation score: 40%

Within participation score:

- Speaking proxy minutes: 40%
- Chat: 25%
- Hand raises: 20%
- Reactions: 15%

The exact weights should be configurable later, but these defaults are good for MVP.

---

## 6. Visual Layout Proposal

### 6.1 Header

- Page title: Analytics
- Class selector
- Student selector when a class is selected
- Date range selector
- Refresh button

### 6.2 Top Summary Strip

Show 4 to 6 cards depending on viewport:

- Attendance rate
- Total minutes present
- Participation score
- Speaking proxy minutes
- Chat activity
- Hand raises

### 6.3 Main Charts

Recommended charts:

- Line chart for attendance minutes over time
- Stacked bar chart for participation event counts over time
- Dual-axis chart for attendance rate versus interaction volume
- Heatmap for session-level engagement
- Ranking table for class members

### 6.4 Student Drill-Down

Show per-session rows with:

- Session date
- Minutes present
- Join time
- Leave time
- Rejoin count
- Chat count
- Reactions
- Hand raises
- Mic toggles
- Speaking proxy minutes

---

## 7. Insights and Callouts

The page should generate short, explainable insights, such as:

- Consistently late arrivals
- Frequent early exits
- High presence but low participation
- High participation in short attendance windows
- Students with strong chat/reaction engagement but low speaking proxy time
- Students who raise hands frequently but rarely speak

These callouts should be descriptive, not punitive.

---

## 8. Filters

Minimum viable filters:

- Class
- Student
- Date range
- Session status
- Interaction type

Optional later filters:

- Weekday vs weekend
- Session duration range
- Attendance threshold
- Participation threshold

---

## 9. Backend Data Contract

The page should rely on pre-aggregated analytics responses rather than computing all metrics in the browser.

### 9.1 Class Analytics Response

Proposed shape:

```json
{
  "overallStats": {
    "totalSessions": 12,
    "avgAttendanceRate": 84.2,
    "avgDuration": 41.8,
    "totalStudents": 28,
    "avgParticipationScore": 63.4
  },
  "sessionTrends": [
    {
      "session_date": "2026-03-20",
      "attendance_rate": 87.5,
      "avg_duration_minutes": 42,
      "chat_count": 11,
      "reaction_count": 8,
      "hand_raise_count": 3,
      "mic_toggle_count": 18,
      "speaking_proxy_minutes": 31
    }
  ],
  "studentPerformance": [
    {
      "id": "student-uuid",
      "full_name": "Student Name",
      "sessions_attended": 10,
      "attendance_rate": 83.3,
      "total_minutes_present": 412,
      "chat_count": 9,
      "reaction_count": 4,
      "hand_raise_count": 2,
      "mic_toggle_count": 15,
      "speaking_proxy_minutes": 26,
      "engagement_score": 71.8
    }
  ],
  "heatmapData": []
}
```

### 9.2 Student Analytics Response

Proposed shape:

```json
{
  "overallStats": {
    "totalSessions": 12,
    "sessionsAttended": 10,
    "attendanceRate": 83.3,
    "totalDurationMinutes": 412,
    "avgDurationMinutes": 41.2,
    "lateJoins": 3,
    "earlyLeaves": 2,
    "rejoinCount": 4,
    "chatCount": 9,
    "reactionCount": 4,
    "handRaiseCount": 2,
    "micToggleCount": 15,
    "speakingProxyMinutes": 26,
    "participationScore": 68.1,
    "engagementScore": 71.8
  },
  "sessionHistory": [
    {
      "id": "session-uuid",
      "title": "Week 4 Lecture",
      "session_date": "2026-03-20",
      "attendance_status": "present",
      "total_duration_minutes": 44,
      "first_joined_at": "2026-03-20T09:02:00Z",
      "last_left_at": "2026-03-20T09:46:00Z",
      "intervals": [],
      "chat_count": 2,
      "reaction_count": 1,
      "hand_raise_count": 1,
      "mic_toggle_count": 3,
      "speaking_proxy_minutes": 8
    }
  ],
  "timeline": []
}
```

---

## 10. Empty States

The page should explicitly handle these states:

- No classes yet
- Class selected but no sessions in the date range
- Student selected but no attendance records
- Sessions exist but participation tracking is absent

Empty states should explain what data is missing and what the user needs to do next.

---

## 11. UX Rules

- Keep attendance and participation visually distinct.
- Never show chat content in the analytics board.
- Label mic activity as a proxy unless actual speech detection exists.
- Make class comparisons obvious and stable across sessions.
- Prefer readable aggregates over dense raw logs.
- Use rank and trend sparingly so the page stays interpretable.

---

## 12. Implementation Phases

### Phase 1: Attendance-first analytics

- Class summary cards
- Student summary cards
- Minutes present
- Attendance rate
- Join/leave patterns

### Phase 2: Participation analytics

- Chat, reaction, hand raise, and mic summaries
- Participation timeline
- Session-level event breakdown

### Phase 3: Composite engagement analytics

- Engagement score
- Class ranking table
- Insight callouts
- Compare-to-class panels

### Phase 4: Refinement

- Configurable weights
- More detailed trends
- Export and reporting

---

## 13. Success Criteria

The page is successful if an instructor can answer these questions in under a minute:

- Who attended most consistently?
- Who stayed for the longest time?
- Who participated the most?
- Who is present but disengaged?
- Which sessions had the best engagement?
- How does this student compare to the rest of the class?
