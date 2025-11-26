# Participation Tracking - Testing Checklist

**Feature:** Participation Tracking & Analytics  
**Test Date:** ___________  
**Tester:** ___________  
**Version:** 0.2.0

---

## Pre-Test Setup

- [ ] Backend server running on correct port
- [ ] Frontend dev server running
- [ ] Database migrations applied
- [ ] Test user account created (instructor role)
- [ ] Test class created with students
- [ ] Test session created (active status)
- [ ] Browser extension configured (for bulk data testing)

---

## Backend API Testing

### Participation Log Creation

#### Single Log Entry
- [ ] POST `/api/participation/sessions/:id/logs` with valid data
- [ ] Verify log created in database
- [ ] Check response contains created log
- [ ] Try with non-existent session - expect 404
- [ ] Try with non-existent student - expect 404
- [ ] Try with invalid interaction_type - expect 400
- [ ] Try with student from different class - expect 400
- [ ] Try on inactive session - expect 400
- [ ] Try without authentication - expect 401
- [ ] Try on session owned by another instructor - expect 403

#### Bulk Log Entry
- [ ] POST `/api/participation/sessions/:id/logs/bulk` with multiple logs
- [ ] Verify all valid logs created
- [ ] Check response shows correct added count
- [ ] Submit mix of valid/invalid logs
- [ ] Verify only valid logs created
- [ ] Check errors array contains failed log details
- [ ] Verify response shows correct added/failed counts
- [ ] Try with empty logs array - expect 400
- [ ] Try with 50+ logs (performance test)

---

### Participation Log Retrieval

#### Get Logs
- [ ] GET `/api/participation/sessions/:id/logs`
- [ ] Verify returns logs with student info
- [ ] Check logs ordered by timestamp DESC
- [ ] Test pagination: `?page=1&limit=10`
- [ ] Test pagination: `?page=2&limit=10`
- [ ] Verify pagination metadata correct
- [ ] Filter by type: `?interaction_type=chat`
- [ ] Verify only chat logs returned
- [ ] Test each interaction type filter
- [ ] Try with non-existent session - expect 404
- [ ] Try on session owned by another instructor - expect 403

#### Get Summary
- [ ] GET `/api/participation/sessions/:id/summary`
- [ ] Verify returns session info
- [ ] Check stats (total_students, participated_students, total_participation)
- [ ] Verify interactionSummary has breakdown by type
- [ ] Check studentSummary includes all class students
- [ ] Verify students with 0 interactions included
- [ ] Check counts per interaction type accurate
- [ ] Verify unique_students count correct
- [ ] Try with session with no logs
- [ ] Try with non-existent session - expect 404

#### Get Recent Activity
- [ ] GET `/api/participation/sessions/:id/recent`
- [ ] Verify returns recent logs (default 5 min)
- [ ] Test custom minutes: `?minutes=10`
- [ ] Create log, verify appears in recent
- [ ] Wait 6 minutes, verify log not in default recent
- [ ] Try with non-existent session - expect 404

---

### Access Control

#### Instructor Access
- [ ] Instructor can access own session logs
- [ ] Instructor can access own session summary
- [ ] Instructor cannot access other instructor's sessions
- [ ] Verify 403 response for unauthorized access

#### Admin Access
- [ ] Admin can access any session logs
- [ ] Admin can access any session summary
- [ ] Admin can create logs on any session

---

### Cascade Deletes

- [ ] Create session with participation logs
- [ ] Delete session
- [ ] Verify all participation logs deleted
- [ ] Create student with participation logs
- [ ] Delete student
- [ ] Verify all student's participation logs deleted

---

## Frontend Component Testing

### Navigation
- [ ] Open session detail page
- [ ] Click "Participation" tab
- [ ] Verify tab becomes active
- [ ] Verify data loads automatically
- [ ] Switch back to "Attendance" tab
- [ ] Switch to "Participation" again
- [ ] Verify data doesn't reload unnecessarily (cached)

---

### ParticipationSummary Component

#### Stats Display
- [ ] Verify "Total Interactions" displays correctly
- [ ] Verify "Students Participated" shows X / Y format
- [ ] Verify "Participation Rate" shows percentage
- [ ] Verify progress bar width matches percentage
- [ ] Verify "Most Active" shows student name
- [ ] Verify "Most Active" shows interaction count
- [ ] Check stats with zero logs - should handle gracefully

#### Interaction Breakdown
- [ ] Verify each interaction type listed
- [ ] Check icons display correctly (chat, reaction, mic, camera)
- [ ] Verify counts accurate per type
- [ ] Verify percentages add up correctly
- [ ] Check progress bars display proportionally
- [ ] Test with only one interaction type
- [ ] Test with zero interactions - verify empty state

---

### ParticipationFilters Component

#### Search Functionality
- [ ] Type student name in search box
- [ ] Verify real-time filtering works
- [ ] Try partial name match
- [ ] Try full name
- [ ] Try student ID
- [ ] Clear search box
- [ ] Verify all logs return

#### Type Filter
- [ ] Select "Chat" from dropdown
- [ ] Verify only chat logs shown
- [ ] Try each interaction type
- [ ] Select "All Types"
- [ ] Verify all logs return

#### Combined Filters
- [ ] Apply search + type filter together
- [ ] Verify both filters active
- [ ] Check active filters badge displays
- [ ] Click X on search badge - verify search clears
- [ ] Click X on type badge - verify type filter clears
- [ ] Click "Clear all" - verify all filters clear

#### Refresh Button
- [ ] Click "Refresh" button
- [ ] Verify button shows "Refreshing..." with spinner
- [ ] Verify data reloads
- [ ] Check button returns to normal state
- [ ] Refresh while filters active - verify filters persist

---

### ParticipationLogsList Component

#### Table Display
- [ ] Verify table shows all columns
- [ ] Check student names display (Last, First format)
- [ ] Check student IDs display below names
- [ ] Verify interaction type badges display with correct colors
- [ ] Check interaction values display
- [ ] Verify timestamps formatted correctly
- [ ] Check "Additional Data" column

#### Sorting
- [ ] Click "Student Name" header - verify sorts ascending
- [ ] Click again - verify sorts descending
- [ ] Verify sort direction indicator (chevron)
- [ ] Click "Interaction Type" - verify sorts correctly
- [ ] Click "Value" - verify sorts
- [ ] Click "Timestamp" - verify chronological sort
- [ ] Verify sort persists when changing pages
- [ ] Change sort, verify resets to page 1

#### Pagination
- [ ] Verify shows "Showing 1 to 50 of X logs"
- [ ] Click "Next" - verify page 2 loads
- [ ] Verify range updates "Showing 51 to 100..."
- [ ] Click "Previous" - verify returns to page 1
- [ ] Click page number directly (e.g., "3")
- [ ] Verify ellipsis (...) for many pages
- [ ] Verify first/last pages always shown
- [ ] Test "Previous" disabled on page 1
- [ ] Test "Next" disabled on last page
- [ ] Create 100+ logs and test pagination smoothness

#### Additional Data Expansion
- [ ] Find log with additional_data
- [ ] Click "View" button
- [ ] Verify row expands
- [ ] Check JSON formatted nicely
- [ ] Click "Hide" button
- [ ] Verify row collapses
- [ ] Expand multiple rows simultaneously
- [ ] Verify all stay expanded independently

#### Empty State
- [ ] View session with no participation logs
- [ ] Verify empty state displays
- [ ] Check icon, heading, and message present
- [ ] Verify message mentions extension capture

#### Loading State
- [ ] Open participation tab with slow connection (throttle)
- [ ] Verify loading spinner displays
- [ ] Check loading message present

---

## Integration Testing

### Full User Flow
- [ ] Login as instructor
- [ ] Navigate to class
- [ ] Open session
- [ ] Click "Participation" tab
- [ ] Verify summary loads
- [ ] Verify filters display
- [ ] Verify logs table loads
- [ ] Apply search filter
- [ ] Apply type filter
- [ ] Sort by different column
- [ ] Navigate to page 2
- [ ] Expand additional data
- [ ] Click refresh
- [ ] Verify everything updates correctly

### With Extension Data
- [ ] Start active session
- [ ] Use extension to capture data
- [ ] Extension submits bulk logs
- [ ] Open participation tab in web app
- [ ] Verify new logs appear
- [ ] Check summary stats updated
- [ ] Verify interaction breakdown accurate
- [ ] Test filter by captured type
- [ ] Verify student names match
- [ ] Check timestamps accurate

---

## Data Accuracy Testing

### Summary Statistics
- [ ] Manually count total interactions
- [ ] Verify matches "Total Interactions" stat
- [ ] Count unique participating students
- [ ] Verify matches "Students Participated"
- [ ] Calculate participation rate manually
- [ ] Verify matches displayed percentage
- [ ] Find most active student manually
- [ ] Verify matches "Most Active" display

### Interaction Breakdown
- [ ] Count chat messages manually
- [ ] Verify matches breakdown count
- [ ] Repeat for each interaction type
- [ ] Calculate percentages manually
- [ ] Verify match displayed percentages
- [ ] Verify progress bar widths proportional

### Student Summary
- [ ] Check studentSummary includes all class students
- [ ] Verify students with 0 interactions listed
- [ ] Count interactions for one student manually
- [ ] Verify matches student summary total_interactions
- [ ] Check breakdown per type for student
- [ ] Verify accurate per interaction type

---

## Performance Testing

### Large Datasets
- [ ] Create 100 participation logs
- [ ] Verify table loads smoothly
- [ ] Test pagination performance
- [ ] Test sorting speed
- [ ] Create 500 participation logs
- [ ] Verify UI remains responsive
- [ ] Test filter performance
- [ ] Test search performance

### Multiple Sessions
- [ ] Create 5 sessions with logs
- [ ] Switch between sessions
- [ ] Verify data doesn't mix
- [ ] Check correct stats per session
- [ ] Verify filters reset per session

---

## Error Handling

### Network Errors
- [ ] Disable network
- [ ] Try to load participation tab
- [ ] Verify graceful error handling
- [ ] Re-enable network
- [ ] Click refresh
- [ ] Verify data loads

### Invalid Data
- [ ] Manually corrupt log data in database
- [ ] Load participation tab
- [ ] Verify doesn't crash
- [ ] Check error logged to console

---

## Responsive Design

### Desktop (1920x1080)
- [ ] Verify summary cards in 4-column grid
- [ ] Check filters in single row
- [ ] Verify table all columns visible
- [ ] Check pagination controls clear

### Tablet (768x1024)
- [ ] Verify summary cards adjust (2 columns)
- [ ] Check filters stack if needed
- [ ] Verify table scrolls horizontally if needed
- [ ] Check pagination still functional

### Mobile (375x667)
- [ ] Verify summary cards stack (1 column)
- [ ] Check filters stack vertically
- [ ] Verify table scrolls horizontally
- [ ] Check pagination buttons sized appropriately
- [ ] Verify all interactions still work
- [ ] Check expanded data readable

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] Icons display correctly
- [ ] Styling correct
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Icons display correctly
- [ ] Styling correct
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] Icons display correctly
- [ ] Styling correct
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] Icons display correctly
- [ ] Styling correct
- [ ] No console errors

---

## Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Press Enter on buttons - verify works
- [ ] Navigate pagination with keyboard
- [ ] Expand/collapse additional data with keyboard

### Screen Readers
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify headings announced correctly
- [ ] Check table headers associated
- [ ] Verify button labels clear
- [ ] Check sort indicators announced

### Color Contrast
- [ ] Verify text readable (WCAG AA)
- [ ] Check badge colors have sufficient contrast
- [ ] Verify disabled states clear
- [ ] Check focus indicators visible

---

## Edge Cases

### Zero Data
- [ ] New session with no logs
- [ ] Verify empty states display
- [ ] Check no errors in console
- [ ] Verify "Refresh" still works

### Single Student
- [ ] Class with 1 student
- [ ] Student has 1 interaction
- [ ] Verify stats calculate correctly
- [ ] Check participation rate = 100%

### All Same Type
- [ ] Create 50 logs all "chat" type
- [ ] Verify breakdown shows 100% chat
- [ ] Check other types show 0
- [ ] Verify progress bar full width

### Long Text
- [ ] Create log with very long interaction_value
- [ ] Verify truncates in table
- [ ] Verify full text visible somewhere
- [ ] Check doesn't break layout

### Special Characters
- [ ] Student name with accents (José, Müller)
- [ ] Interaction value with emojis
- [ ] Search for student with special chars
- [ ] Verify all display correctly

---

## Security Testing

### Authentication
- [ ] Access participation without login - expect redirect
- [ ] Access with expired token - expect 401

### Authorization
- [ ] Instructor A creates session
- [ ] Login as Instructor B
- [ ] Try to access Instructor A's participation - expect 403
- [ ] Login as Admin
- [ ] Access any session - should work

### SQL Injection
- [ ] Try SQL in search box: `'; DROP TABLE--`
- [ ] Verify safe (parameterized queries)
- [ ] Try in interaction_value field
- [ ] Verify no SQL execution

### XSS
- [ ] Create log with `<script>alert('xss')</script>` in value
- [ ] View in participation list
- [ ] Verify script doesn't execute (escaped)
- [ ] Check additional_data with HTML
- [ ] Verify displayed as text, not executed

---

## Documentation Review

- [ ] Read PARTICIPATION_IMPLEMENTED.md
- [ ] Verify all described features exist
- [ ] Check API endpoints match documentation
- [ ] Verify component props match documentation
- [ ] Test example code snippets work
- [ ] Check file structure matches documentation

---

## Final Checks

- [ ] No console errors in normal usage
- [ ] No console warnings
- [ ] All loading states appropriate
- [ ] All error states handled gracefully
- [ ] Confirm all MVP features working
- [ ] Confirm non-MVP features NOT present
- [ ] Verify clean, simple UI
- [ ] Check performance acceptable
- [ ] Verify matches design expectations
- [ ] Ready for demo/presentation

---

## Notes

**Issues Found:**
_________________________
_________________________
_________________________

**Performance Notes:**
_________________________
_________________________
_________________________

**UX Observations:**
_________________________
_________________________
_________________________

**Recommendations:**
_________________________
_________________________
_________________________

---

**Test Completion:**
- Total Tests: _____
- Passed: _____
- Failed: _____
- Blocked: _____
- Pass Rate: _____%

**Overall Status:** ⬜ Pass | ⬜ Pass with Issues | ⬜ Fail

**Tester Signature:** _________________ **Date:** _________
