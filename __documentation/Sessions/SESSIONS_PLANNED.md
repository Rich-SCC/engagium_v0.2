# Sessions Management - Planned Features

**Priority Levels:**
- 🔥 **P0** - Critical for MVP completion
- ⭐ **P1** - High priority, next sprint
- 📌 **P2** - Medium priority, future release
- 💡 **P3** - Nice to have, backlog

---

## 🔥 P0 - MVP Completion (Current Sprint)

### 1. Sessions Tab in ClassDetailsPage
**Status:** Not Started  
**Effort:** 2-3 hours  
**Description:** Add sessions view within class detail page

**Requirements:**
- New tab alongside "Students" tab
- List upcoming and past sessions for the class
- Quick "Schedule Session" button
- Link to session detail pages
- Show session count in tab badge
- Filter by date range

**Technical:**
- Use `classesAPI.getSessions(classId)` (already exists in backend)
- Create `ClassSessionsList` component
- Integrate with existing ClassDetailsPage tabs

---

### 2. SessionAnalytics Component
**Status:** Not Started  
**Effort:** 4-6 hours  
**Description:** Basic analytics dashboard for sessions

**Requirements:**
- Attendance trends over time (line chart)
- Participation distribution (bar chart)
- Session comparison table
- Class-wide statistics summary
- Export data as CSV

**Technical:**
- Choose chart library: **Recharts** (recommended - lightweight, React-native)
- Use existing `AttendanceRecord.getAttendanceTrends()` method
- Create reusable chart components
- Add to SessionDetailPage as new tab OR separate Analytics page

**MVP Scope (Keep Simple):**
- Line chart: Attendance rate per session
- Bar chart: Total present vs absent
- Summary cards: Average attendance, total sessions, trends
- Skip: Complex filters, date range pickers, drill-downs

---

## ⭐ P1 - High Priority Enhancements

### 3. Session Templates
**Status:** Planned  
**Effort:** 3-4 hours  
**Description:** Save and reuse session configurations

**Requirements:**
- Save session as template (title, topic, description, time)
- List templates per class
- Create session from template (auto-fill form)
- Edit/delete templates
- Use template → modify before creating

**Technical:**
- New table: `session_templates`
- Model, controller, routes
- Add "Save as Template" button in SessionFormModal
- Add "Use Template" dropdown in create modal

---

### 4. Recurring Sessions
**Status:** Planned  
**Effort:** 4-5 hours  
**Description:** Auto-create sessions based on class schedule

**Requirements:**
- "Create Recurring Sessions" wizard
- Select: start date, end date, days of week, time
- Preview generated sessions before creating
- Bulk create all sessions at once
- Option to skip specific dates (holidays)

**Technical:**
- Frontend: Multi-step wizard component
- Backend: Bulk session creation endpoint
- Date logic: Generate dates based on pattern
- Use existing `Session.create()` in loop (or batch)

---

### 5. Attendance Export
**Status:** Planned  
**Effort:** 2-3 hours  
**Description:** Export attendance data to CSV/Excel

**Requirements:**
- Export single session attendance
- Export class attendance summary (all sessions)
- Export student attendance history
- Choose format: CSV or Excel (.xlsx)
- Include: student info, dates, status, duration

**Technical:**
- Backend: New export endpoints
- Use library: `csv-writer` (CSV) or `exceljs` (Excel)
- Return file as download (Blob)
- Frontend: Download button on AttendanceRoster

---

### 6. Email Notifications
**Status:** Planned  
**Effort:** 3-4 hours  
**Description:** Automated email alerts

**Requirements:**
- Notify instructor when session starts
- Notify instructor when attendance submitted
- Weekly attendance summary email
- Configurable in settings (opt-in/out)

**Technical:**
- Use existing `emailService.js`
- Trigger on session status change
- Schedule cron job for weekly summary
- Add notification preferences to user settings

---

## 📌 P2 - Medium Priority Features

### 7. Manual Attendance Entry
**Status:** Planned  
**Effort:** 3-4 hours  
**Description:** Allow instructors to manually mark attendance (fallback if extension fails)

**Requirements:**
- Checkbox grid: students (rows) x sessions (columns)
- Bulk mark all present/absent
- Individual student attendance edit
- Timestamp editing (joined_at, left_at)
- Warning if extension data exists

**Technical:**
- Add to SessionDetailPage (Attendance tab)
- PATCH endpoint for updating attendance
- Optimistic updates with React Query

---

### 8. Late Arrival Tracking
**Status:** Planned  
**Effort:** 2 hours  
**Description:** Track students who join late

**Requirements:**
- New status: 'late' (in addition to present/absent)
- Configurable threshold (e.g., > 5 minutes late)
- Extension auto-detects based on joined_at timestamp
- Display late count in stats
- Late badge in attendance roster

**Technical:**
- Update `attendance_records.status` ENUM
- Add `late_threshold_minutes` to sessions or classes table
- Logic: Compare joined_at to session start time

---

### 9. Session Notes/Minutes
**Status:** Planned  
**Effort:** 3-4 hours  
**Description:** Rich text notes attached to sessions

**Requirements:**
- Rich text editor (Markdown or WYSIWYG)
- Auto-save drafts
- Version history (optional)
- Share notes with students (optional)
- Print/export notes

**Technical:**
- Use library: `react-quill` or `TipTap`
- Store in `sessions.description` or new `session_notes` table
- Add "Notes" tab to SessionDetailPage

---

### 10. Attendance Heatmap
**Status:** Planned  
**Effort:** 4-5 hours  
**Description:** Visual heatmap showing attendance patterns

**Requirements:**
- Grid: students (rows) x sessions (columns)
- Color intensity: attendance rate
- Click cell → see details
- Filter by date range, class
- Identify at-risk students (low attendance)

**Technical:**
- Use chart library with heatmap support
- Query: Aggregate attendance by student x session
- Color scale: Red (absent) → Yellow → Green (present)

---

### 11. Participation Leaderboard
**Status:** Planned  
**Effort:** 3 hours  
**Description:** Gamification for engagement

**Requirements:**
- Top participants per session
- Top participants per class (all-time)
- Sortable by different metrics
- Privacy toggle (show names or anonymous)
- Exportable

**Technical:**
- Use existing `participation_logs` data
- Aggregate by student: COUNT(interactions)
- Display in SessionAnalytics or separate page

---

## 💡 P3 - Nice to Have (Backlog)

### 12. Student-Facing Session View
**Status:** Idea Phase  
**Effort:** 6-8 hours  
**Description:** Students can see their attendance history

**Requirements:**
- Public student dashboard
- Login with student email or ID
- View attendance for all sessions
- See participation count
- No editing (read-only)

**Technical:**
- New public routes (no auth required OR student auth)
- Separate student role
- Privacy settings per class

---

### 13. LMS Integration (Canvas, Blackboard)
**Status:** Idea Phase  
**Effort:** 10+ hours  
**Description:** Sync sessions and attendance to LMS gradebook

**Requirements:**
- OAuth connection to LMS
- Map Engagium classes to LMS courses
- Sync attendance as grade column
- Sync participation as assignments
- Two-way sync (optional)

**Technical:**
- Use LMS APIs (Canvas REST API, Blackboard Learn API)
- OAuth 2.0 integration
- Webhook listeners for updates
- Background job for syncing

---

### 14. Mobile App (React Native)
**Status:** Idea Phase  
**Effort:** 40+ hours  
**Description:** Native mobile app for instructors

**Requirements:**
- View sessions, attendance, participation
- Start/end sessions
- QR code attendance check-in (alternative to extension)
- Push notifications
- Works on iOS and Android

**Technical:**
- React Native + Expo
- Reuse existing API
- Camera for QR scanning
- Push notifications via Firebase

---

### 15. AI-Powered Insights
**Status:** Idea Phase  
**Effort:** 20+ hours  
**Description:** ML-based predictions and recommendations

**Requirements:**
- Predict at-risk students (low attendance pattern)
- Suggest optimal session times (based on attendance)
- Anomaly detection (unusual attendance drop)
- Engagement recommendations
- Natural language reports

**Technical:**
- ML model training (Python, TensorFlow/PyTorch)
- API for predictions
- Data pipeline for training data
- Frontend visualizations

---

## Extension Development (Separate Project)

### Browser Extension Features
**Status:** Next Phase  
**Effort:** 30-40 hours

**Core Features:**
1. **Meeting Detection**
   - Detect Zoom, Google Meet, Teams pages
   - Extract meeting ID and participants
   - Prompt "Start tracking for [Class Name]?"

2. **Participant Tracking**
   - Monitor participant list
   - Track join/leave times
   - Match participants to student roster (by name/email)
   - Handle name variations

3. **Participation Logging**
   - Track chat messages
   - Track reactions (👍, ❤️, etc.)
   - Track mic/camera toggles (if accessible)
   - Track hand raises

4. **Data Submission**
   - Batch submit on session end
   - POST to `/sessions/:id/attendance/bulk`
   - POST to `/participation/sessions/:id/logs/bulk`
   - Retry on failure

5. **UI**
   - Popup: Session status, student count, timer
   - Options page: Settings, class mapping
   - Badge icon: Active session indicator

**Technical Stack:**
- Manifest V3 (Chrome Extension)
- React for popup/options UI
- Background service worker
- Content scripts for meeting pages
- IndexedDB for offline storage
- WebSocket for real-time sync (optional)

---

## Database Schema Changes (Future)

### New Tables Needed

```sql
-- Session templates
CREATE TABLE session_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title_template VARCHAR(255),
    topic_template VARCHAR(255),
    description_template TEXT,
    default_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session notes (if separate from description)
CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Late thresholds (if configurable per class)
ALTER TABLE classes ADD COLUMN late_threshold_minutes INTEGER DEFAULT 5;
```

### Enum Updates

```sql
-- Add more attendance statuses
ALTER TYPE attendance_status ADD VALUE 'excused';
ALTER TYPE attendance_status ADD VALUE 'late';
```

---

## Performance Considerations

### Optimization Needed For:

1. **Calendar Queries**
   - Current: Fetches full month
   - Future: Paginate if >100 sessions/month
   - Index: `idx_sessions_date` already exists

2. **Attendance Bulk Insert**
   - Current: Batch upsert (good)
   - Future: Consider PostgreSQL COPY for >1000 records

3. **Analytics Queries**
   - Add: Materialized views for attendance aggregates
   - Refresh: Nightly cron job
   - Benefit: Fast dashboard loading

4. **Frontend Caching**
   - Use React Query staleTime for calendar data
   - Cache sessions list for 5 minutes
   - Invalidate only on mutations

---

## Testing Strategy

### Unit Tests Needed
- [ ] AttendanceRecord.bulkUpsert() with 100+ records
- [ ] Session.getCalendarData() edge cases (leap year, month boundaries)
- [ ] Attendance statistics calculations (rounding, null handling)

### Integration Tests
- [ ] Full session lifecycle (create → start → end)
- [ ] Bulk attendance submission from extension
- [ ] Concurrent attendance updates (race conditions)

### E2E Tests
- [ ] Create session → view calendar → click session → see details
- [ ] Submit attendance → view roster → verify stats
- [ ] Export attendance → verify CSV format

---

## Migration Path

### From Current State → P0 Complete

**Week 1:**
1. Create SessionAnalytics component (basic charts)
2. Add Sessions tab to ClassDetailsPage
3. Write tests
4. Deploy to staging

**Week 2:**
1. Start extension development (meeting detection)
2. Build participant tracking
3. Test with live Zoom session

**Week 3:**
1. Complete extension data submission
2. End-to-end testing
3. Beta release to instructors

---

## Success Metrics

### KPIs to Track

1. **Adoption**
   - % of instructors using sessions feature
   - Average sessions created per instructor per week
   - Extension installation rate

2. **Engagement**
   - Attendance capture rate (% sessions with attendance data)
   - Time saved vs manual attendance
   - Feature usage (calendar view, analytics, exports)

3. **Quality**
   - Bug report rate
   - Support ticket volume
   - User satisfaction score (NPS)

4. **Performance**
   - Page load time (< 2s for calendar)
   - API response time (< 500ms for attendance endpoints)
   - Extension memory usage (< 50MB)

---

**Last Updated:** November 25, 2025  
**Next Review:** After P0 features complete
