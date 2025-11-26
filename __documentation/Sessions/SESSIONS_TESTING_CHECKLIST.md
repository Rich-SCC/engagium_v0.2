# Sessions Management - Testing Checklist

## Test Environment Setup

### Prerequisites
- [ ] PostgreSQL database running
- [ ] Backend server running on port 3000
- [ ] Frontend dev server running on port 5173
- [ ] Test user accounts created (instructor + students)
- [ ] At least 2 test classes created
- [ ] At least 5 test students enrolled in each class

### Test Data Setup
```sql
-- Create test class
INSERT INTO classes (name, code, instructor_id) 
VALUES ('CS101 Testing', 'TEST-101', '<instructor_id>');

-- Enroll test students
INSERT INTO students (name, email, class_id) 
VALUES 
  ('Alice Test', 'alice@test.edu', '<class_id>'),
  ('Bob Test', 'bob@test.edu', '<class_id>'),
  ('Carol Test', 'carol@test.edu', '<class_id>'),
  ('Dave Test', 'dave@test.edu', '<class_id>'),
  ('Eve Test', 'eve@test.edu', '<class_id>');
```

---

## 1. Session CRUD Operations

### Create Session
- [ ] **Happy Path:** Create session with all required fields
  - Navigate to Sessions page
  - Click "New Session" button
  - Fill: Class, Title, Date (future)
  - Optional: Time, Topic, Description, Meeting Link
  - Submit → Success toast appears
  - Session appears in list view

- [ ] **Validation:** Required fields enforced
  - Leave Title empty → Error message shows
  - Leave Date empty → Error message shows
  - Leave Class empty → Error message shows
  - Error messages are clear and helpful

- [ ] **Date Validation:** Cannot create past sessions
  - Select yesterday's date → Error/warning
  - Select today → Allowed
  - Select future date → Allowed

- [ ] **Meeting Link Validation:** Valid URL format
  - Enter "invalid-url" → Error
  - Enter "https://zoom.us/j/123" → Accepted
  - Enter "https://meet.google.com/abc" → Accepted

### Read/View Sessions
- [ ] **List View:** Sessions display correctly
  - All created sessions appear
  - Columns: Title, Class, Date, Time, Status
  - Sorted by date (newest first)
  - Status badges show correct color
  - Empty state shows when no sessions

- [ ] **Calendar View:** Sessions appear on calendar
  - Toggle to calendar view
  - Sessions appear on correct dates
  - Multiple sessions per day stacked
  - Color coding by status (scheduled=blue, active=green, ended=gray)
  - Month navigation (prev/next) works
  - Today's date highlighted

- [ ] **Session Detail:** Full information displayed
  - Click session → Navigate to detail page
  - All fields displayed: Title, Class, Date, Time, Topic, Description, Link
  - Status badge correct
  - Tabs: Attendance, Participation visible
  - Back button returns to previous page

### Update Session
- [ ] **Edit Session:** Changes saved correctly
  - Click "Edit" button on detail page
  - Modal opens with pre-filled data
  - Change Title → Save → Updated in list
  - Change Date → Save → Moves in calendar
  - Change Topic → Save → Reflected in detail view
  - Cancel → No changes applied

- [ ] **Edit Validation:** Cannot break required fields
  - Clear Title → Error
  - Clear Date → Error
  - Invalid link → Error

- [ ] **Cannot Edit Ended Sessions:** Edit disabled
  - Session with status=ended → Edit button hidden/disabled

### Delete Session
- [ ] **Delete Confirmation:** Requires confirmation
  - Click "Delete" button
  - Confirmation dialog appears
  - Cancel → Session not deleted
  - Confirm → Session deleted + success toast

- [ ] **Cascade Delete:** Associated data removed
  - Delete session with attendance records
  - Verify attendance_records deleted (check DB)
  - Delete session with participation logs
  - Verify participation_logs deleted (check DB)

- [ ] **Cannot Delete Active Sessions:** Delete disabled
  - Session with status=active → Delete button disabled/warning

---

## 2. Session Lifecycle Management

### Start Session
- [ ] **Manual Start:** Instructor clicks "Start Session"
  - Navigate to scheduled session detail page
  - Click "Start Session" button
  - Status changes: scheduled → active
  - Badge color changes to green
  - "Start Session" button replaced with "End Session"
  - Success toast appears

- [ ] **Cannot Start Twice:** Idempotent
  - Try starting active session → Button disabled

- [ ] **Cannot Start Ended Session:** Prevented
  - Try starting ended session → Button not visible

### End Session
- [ ] **Manual End:** Instructor clicks "End Session"
  - Navigate to active session detail page
  - Click "End Session" button
  - Status changes: active → ended
  - Badge color changes to gray
  - "End Session" button disappears
  - Success toast appears

- [ ] **Cannot End Twice:** Idempotent
  - Try ending ended session → Button disabled

- [ ] **Attendance Lock:** Cannot edit after end
  - End session → Try submitting attendance → Error/warning

---

## 3. Attendance Tracking

### Submit Bulk Attendance (Simulating Extension)
- [ ] **API Endpoint Test:** POST /sessions/:id/attendance/bulk
  ```bash
  curl -X POST http://localhost:3000/api/sessions/<session_id>/attendance/bulk \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "attendance": [
        {
          "student_id": "<student1_id>",
          "status": "present",
          "joined_at": "2025-01-15T10:05:00Z",
          "left_at": "2025-01-15T11:50:00Z"
        },
        {
          "student_id": "<student2_id>",
          "status": "absent"
        }
      ]
    }'
  ```
  - Response: 201 Created
  - Response body: `{ success: true, processed: 2 }`

- [ ] **Bulk Insert Performance:** Handle 50+ students
  - Submit attendance for 50 students
  - Response time < 2 seconds
  - All records inserted correctly

- [ ] **Duplicate Handling:** Upsert on conflict
  - Submit attendance for same student twice
  - Only one record in DB (updated)
  - No duplicate key error

### View Attendance Roster
- [ ] **Roster Display:** Shows all enrolled students
  - Navigate to session detail → Attendance tab
  - All class students appear (even if no attendance record)
  - Missing attendance shows "No Data" or "-"
  - Students with attendance show status badge

- [ ] **Status Badges:** Correct colors
  - Present → Green badge
  - Absent → Red/gray badge
  - Late → Yellow badge (if implemented)

- [ ] **Timestamps:** Formatted correctly
  - Joined At: "10:05 AM" or similar
  - Left At: "11:50 AM"
  - Duration calculated: "1h 45m"

- [ ] **Empty State:** No attendance submitted yet
  - Message: "No attendance data for this session"
  - Helpful hint to use extension

### Attendance Statistics
- [ ] **Summary Cards:** Correct calculations
  - Total Students: Count of enrolled students
  - Present Count: Count where status=present
  - Attendance Rate: (Present / Total) * 100
  - Numbers match manual count

- [ ] **Edge Cases:** Handle zero/null
  - No students enrolled → Total = 0
  - No attendance submitted → Present = 0, Rate = 0%
  - Partial attendance → Correct percentage

### Attendance Trends (API Exists, Frontend Not Implemented)
- [ ] **API Test:** GET /sessions/:id/attendance/stats
  ```bash
  curl http://localhost:3000/api/sessions/<session_id>/attendance/stats \
    -H "Authorization: Bearer <token>"
  ```
  - Response includes: average_attendance, trend_direction, etc.

---

## 4. Calendar Functionality

### Month Navigation
- [ ] **Previous Month:** Loads correctly
  - Click "< Prev" → Shows previous month
  - Sessions from that month appear
  - No current month sessions visible

- [ ] **Next Month:** Loads correctly
  - Click "Next >" → Shows next month
  - Sessions from that month appear
  - Can navigate forward multiple months

- [ ] **Today Button:** Jumps to current month (if implemented)
  - Click "Today" → Returns to current month
  - Current date highlighted

### Date Range Filtering
- [ ] **API Test:** GET /sessions/date-range?start=...&end=...
  ```bash
  curl "http://localhost:3000/api/sessions/date-range?start=2025-01-01&end=2025-01-31&class_id=<class_id>" \
    -H "Authorization: Bearer <token>"
  ```
  - Returns only sessions in range
  - Empty array if no sessions

- [ ] **Calendar Data:** GET /sessions/calendar?year=...&month=...
  ```bash
  curl "http://localhost:3000/api/sessions/calendar?year=2025&month=1&class_id=<class_id>" \
    -H "Authorization: Bearer <token>"
  ```
  - Returns sessions grouped by date
  - Format: `{ "2025-01-15": [session1, session2], ... }`

### Multiple Sessions Per Day
- [ ] **Display:** Multiple sessions stacked
  - Create 3 sessions on same day
  - All 3 appear in calendar grid cell
  - Scrollable if too many

- [ ] **Click Behavior:** Navigates to first/selected
  - Click day with multiple sessions
  - Should navigate to session detail OR show list

---

## 5. Authorization & Security

### Instructor-Only Access
- [ ] **Protected Routes:** Cannot access without login
  - Logout → Try accessing /sessions → Redirect to login
  - Try accessing API without token → 401 Unauthorized

- [ ] **Ownership Check:** Can only see own classes' sessions
  - Login as Instructor A
  - Try accessing Instructor B's session → 403 Forbidden
  - Try viewing Instructor B's class sessions → Empty or error

### Session Ownership Validation
- [ ] **Create Session:** Must own class
  - Try creating session for another instructor's class → Error

- [ ] **Edit Session:** Must own class
  - Try editing another instructor's session → 403 Forbidden

- [ ] **Delete Session:** Must own class
  - Try deleting another instructor's session → 403 Forbidden

- [ ] **Submit Attendance:** Must own session
  - Try submitting attendance for another's session → 403 Forbidden

---

## 6. Error Handling

### Network Errors
- [ ] **Server Offline:** Graceful error message
  - Stop backend server
  - Try creating session → Error toast: "Unable to connect"
  - Try loading sessions → Loading spinner → Error state

- [ ] **Timeout:** Handles slow responses
  - Simulate slow network (DevTools throttling)
  - Request times out → User-friendly error

### Validation Errors
- [ ] **Backend Validation:** API returns 400
  - Submit invalid data
  - Error message displayed in UI
  - Field-level errors highlighted

- [ ] **Frontend Validation:** Prevents bad requests
  - Client-side validation catches errors before API call
  - No unnecessary 400 errors logged

### Edge Cases
- [ ] **Deleted Class:** Session references deleted class
  - Delete class → Associated sessions handled (cascade or error)

- [ ] **Deleted Student:** Attendance record references deleted student
  - Delete student → Attendance records handled (cascade)

- [ ] **Concurrent Edits:** Two users edit same session
  - User A saves → User B saves
  - Optimistic locking or last-write-wins

---

## 7. UI/UX Testing

### Responsive Design
- [ ] **Desktop (1920x1080):** Layout correct
  - Calendar grid not cramped
  - Tables readable
  - Modals centered

- [ ] **Laptop (1366x768):** Layout adapts
  - No horizontal scroll
  - Text readable
  - Buttons accessible

- [ ] **Tablet (768x1024):** Mobile-friendly
  - Calendar grid stacks or scrolls
  - Touch-friendly buttons
  - Modals full-width if needed

- [ ] **Mobile (375x667):** Fully responsive
  - Calendar view usable or hidden
  - List view prioritized
  - Forms stack vertically

### Loading States
- [ ] **Skeleton Screens:** Show while loading
  - Sessions list → Skeleton rows
  - Calendar → Skeleton grid
  - Detail page → Skeleton layout

- [ ] **Spinners:** Indicate async actions
  - Submitting form → Button spinner
  - Deleting session → Spinner overlay

- [ ] **No Flash of Empty State:** Avoid premature empty states
  - Don't show "No sessions" while loading
  - Show loading indicator first

### Empty States
- [ ] **No Sessions Created:** Helpful message
  - "You haven't created any sessions yet"
  - "Click 'New Session' to get started"
  - Illustrative icon/image

- [ ] **No Attendance Data:** Clear explanation
  - "No attendance has been submitted for this session"
  - "Use the browser extension to track attendance automatically"

### Toast Notifications
- [ ] **Success Toasts:** Appear and auto-dismiss
  - "Session created successfully" (green)
  - "Session updated" (green)
  - Auto-dismiss after 3-5 seconds

- [ ] **Error Toasts:** Appear and remain (or longer)
  - "Failed to create session" (red)
  - Shows error message from API
  - Dismissible manually

---

## 8. Performance Testing

### Load Times
- [ ] **Sessions List:** Loads < 1 second
  - 50 sessions → Page renders quickly
  - Pagination if > 100 sessions

- [ ] **Calendar View:** Loads < 2 seconds
  - Month with 30 sessions → Renders quickly
  - No lag when navigating months

- [ ] **Session Detail:** Loads < 1 second
  - With 50 attendance records → Fast render

### API Response Times
- [ ] **GET /sessions:** < 500ms
  - 50 sessions → Response time
  - Check with DevTools Network tab

- [ ] **POST /sessions/:id/attendance/bulk:** < 2s
  - 50 students → Processing time
  - Database insert performance

- [ ] **GET /sessions/calendar:** < 1s
  - Full month query → Response time

### Caching
- [ ] **React Query Cache:** Avoids redundant requests
  - Navigate away and back → Uses cached data
  - No duplicate API calls logged

- [ ] **Stale Time:** Refreshes after 5 minutes
  - Wait 5+ minutes → Data refetched on revisit

---

## 9. Accessibility (a11y)

### Keyboard Navigation
- [ ] **Tab Order:** Logical flow
  - Tab through form fields in order
  - Tab to buttons and links
  - No tab traps

- [ ] **Enter Key:** Submits forms
  - Press Enter in form → Submits
  - Press Enter on button → Activates

- [ ] **Escape Key:** Closes modals
  - Press Escape → Modal closes
  - Returns focus to trigger element

### Screen Reader Support
- [ ] **Labels:** All inputs have labels
  - Form fields have `<label>` or `aria-label`
  - Buttons have descriptive text (not just icons)

- [ ] **ARIA Attributes:** Used correctly
  - Modal has `role="dialog"` and `aria-modal="true"`
  - Status badges have `aria-label` (e.g., "Status: Active")

- [ ] **Focus Management:** Logical focus flow
  - Opening modal → Focus moves to modal
  - Closing modal → Focus returns to trigger

### Color Contrast
- [ ] **WCAG AA Compliance:** Text readable
  - Status badges have sufficient contrast
  - Button text readable on background
  - Use WebAIM Contrast Checker

---

## 10. Integration Testing

### End-to-End Flows
- [ ] **Flow 1:** Create → Start → Submit Attendance → View → End
  1. Create new session for tomorrow
  2. Navigate to calendar → See session
  3. Click session → See detail page
  4. Click "Start Session"
  5. Submit bulk attendance via API
  6. Reload page → See attendance roster
  7. Verify statistics correct
  8. Click "End Session"
  9. Verify status=ended, no edit buttons

- [ ] **Flow 2:** Create Recurring Sessions (Manual Workaround)
  1. Create session for Monday
  2. Duplicate session (copy data)
  3. Change date to next Monday
  4. Create → Repeat for 10 weeks
  5. Calendar shows all 10 sessions

- [ ] **Flow 3:** Class Sessions Integration (When Implemented)
  1. Navigate to ClassDetailsPage
  2. Click "Sessions" tab
  3. See list of sessions for that class
  4. Click "Schedule Session" → Modal opens
  5. Pre-filled with class_id
  6. Create session → Appears in tab

---

## 11. Database Integrity

### Foreign Key Constraints
- [ ] **Delete Class → Cascade Sessions**
  - Delete class → All sessions deleted (ON DELETE CASCADE)
  - Verify in DB: `SELECT * FROM sessions WHERE class_id = <deleted_id>`

- [ ] **Delete Student → Cascade Attendance**
  - Delete student → All attendance records deleted
  - Verify: `SELECT * FROM attendance_records WHERE student_id = <deleted_id>`

- [ ] **Delete Session → Cascade Attendance**
  - Delete session → All attendance records deleted
  - Verify: `SELECT * FROM attendance_records WHERE session_id = <deleted_id>`

### Unique Constraints
- [ ] **Attendance Record Uniqueness:** One per student per session
  - Try inserting duplicate (student_id, session_id) → Error or upsert

### Data Types
- [ ] **Date/Time Storage:** Correct timezone handling
  - Create session at 2 PM EST
  - Store as UTC in DB
  - Display as local time in UI

---

## 12. Regression Testing

### After Each Code Change
- [ ] **Smoke Test:** Core functionality still works
  - Create session → Success
  - View sessions → List/calendar render
  - Navigate to detail → Page loads

### Before Deployment
- [ ] **Full Test Suite:** Run all tests
  - Unit tests: `npm test`
  - Backend tests: `npm run test:backend`
  - Frontend tests: `npm run test:frontend`
  - All pass → Safe to deploy

---

## 13. Browser Compatibility

### Supported Browsers
- [ ] **Chrome/Edge (Chromium):** Latest version
  - All features work
  - No console errors

- [ ] **Firefox:** Latest version
  - Calendar renders correctly
  - Date picker works

- [ ] **Safari:** Latest version
  - Date/time inputs work (may fallback to text)
  - Modals display correctly

### Known Issues
- [ ] Document Safari date input limitations
- [ ] Document IE 11 not supported (if applicable)

---

## 14. Manual QA Checklist (Final Pre-Release)

### Critical Path
- [x] Instructor can log in
- [ ] Instructor can create a class
- [ ] Instructor can enroll students
- [ ] Instructor can create a session
- [ ] Session appears in list view
- [ ] Session appears in calendar view
- [ ] Instructor can start a session
- [ ] Bulk attendance can be submitted (via API)
- [ ] Attendance roster displays correctly
- [ ] Attendance statistics are accurate
- [ ] Instructor can end a session
- [ ] Instructor can edit a session
- [ ] Instructor can delete a session

### Nice-to-Have
- [ ] Calendar month navigation
- [ ] Multiple sessions on same day
- [ ] Meeting link validation
- [ ] Responsive mobile view
- [ ] Empty states helpful

---

## 15. Automated Test Coverage

### Backend Unit Tests
```bash
cd backend
npm test
```

**Target Coverage:** 80%+ lines covered

**Test Files:**
- [ ] `models/Session.test.js`
  - create() with all fields
  - findByClassId() filters correctly
  - getCalendarData() groups by date
  - getAttendanceStats() calculates correctly

- [ ] `models/AttendanceRecord.test.js`
  - bulkUpsert() handles conflicts
  - findBySessionId() joins students
  - getStudentStats() aggregates correctly

- [ ] `controllers/sessionController.test.js`
  - createSession: 201 on success, 400 on validation error
  - updateSession: 200 on success, 403 if not owner
  - deleteSession: 204 on success, 403 if not owner
  - submitBulkAttendance: processes 50 records correctly

### Frontend Component Tests
```bash
cd frontend
npm test
```

**Test Files:**
- [ ] `components/Sessions/SessionFormModal.test.jsx`
  - Renders form fields
  - Validation errors display
  - Calls onSubmit with correct data

- [ ] `components/Sessions/SessionCalendarView.test.jsx`
  - Renders calendar grid
  - Sessions appear on correct dates
  - Month navigation updates data

- [ ] `components/Sessions/AttendanceRoster.test.jsx`
  - Displays all students
  - Status badges correct colors
  - Empty state shown if no attendance

---

## Testing Tools

### Recommended Tools
- **API Testing:** Postman or Insomnia (collections for all endpoints)
- **Performance:** Chrome DevTools Lighthouse
- **Accessibility:** axe DevTools browser extension
- **Load Testing:** k6 or Apache JMeter (for bulk attendance)
- **E2E Testing:** Playwright or Cypress (future investment)

### Mock Data Generators
- **Students:** Generate 50-100 test students
- **Sessions:** Generate sessions across 3 months
- **Attendance:** Randomize present/absent for realism

---

## Bug Tracking

### Severity Levels
- **P0 (Critical):** Blocks core functionality, fix immediately
- **P1 (High):** Major feature broken, fix in current sprint
- **P2 (Medium):** Minor issue, fix in next sprint
- **P3 (Low):** Cosmetic/edge case, backlog

### Bug Report Template
```
**Title:** [Short description]
**Priority:** P0/P1/P2/P3
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Environment:** Browser, OS, viewport size
**Screenshots:** [If applicable]
**Console Errors:** [Copy from DevTools]
```

---

## Sign-Off Checklist

Before marking sessions feature as "complete":
- [ ] All P0 planned features implemented
- [ ] All critical tests passing
- [ ] No P0 or P1 bugs open
- [ ] Documentation complete (IMPLEMENTED, PLANNED, TESTING)
- [ ] Code reviewed by peer
- [ ] Tested on staging environment
- [ ] User acceptance testing by instructor (dogfooding)
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Deployed to production
- [ ] Monitoring/alerts configured

---

**Last Updated:** November 25, 2025  
**Testing Owner:** QA Team / Lead Developer  
**Next Review:** After each sprint
