# Frontend Testing Checklist

**Purpose:** Verify that all mock data has been removed and real backend integration is working.

---

## Prerequisites

- [ ] Backend server running on port 3001: `cd backend && npm start`
- [ ] Frontend dev server running: `cd frontend && npm run dev`
- [ ] Database properly set up with schema
- [ ] At least one instructor account created

---

## 1. Dashboard Page Testing

### Setup:
1. Login as instructor
2. Navigate to Dashboard (`/app/dashboard`)

### Verify:
- [ ] **Recent Activity Table** shows real sessions (not random data)
- [ ] Session durations are calculated correctly (no random seconds)
- [ ] Participation counts are real numbers (not `Math.random()`)
- [ ] Date/time formatting works properly
- [ ] "View All Activity" link works

- [ ] **Class Summary Card** displays:
  - [ ] Real class names (not "Class 1, Class 2")
  - [ ] Actual student counts (not fake percentages)
  - [ ] Correct status (Active/Archived)
  - [ ] Total Classes count matches reality
  - [ ] Total Students count is accurate

- [ ] **Calendar Widget** works and highlights current date
- [ ] Loading states appear while fetching data
- [ ] Empty state shows if no classes/sessions exist

**Expected API Calls:**
- `GET /api/sessions`
- `GET /api/sessions/stats`
- `GET /api/classes`
- `GET /api/classes/stats`

---

## 2. Analytics Page Testing

### Setup:
1. Navigate to Analytics (`/app/analytics`)

### Verify:
- [ ] **Top Stats Cards** show:
  - [ ] Real total classes count
  - [ ] Real total sessions count
  - [ ] Overall average (placeholder 77% until calculated)
  - [ ] Loading state ("...") appears briefly

- [ ] **"Coming Soon" Placeholder** displays:
  - [ ] Message about advanced analytics
  - [ ] Current tracking info (X sessions across Y classes)
  - [ ] No mock charts visible

- [ ] **Session Status Summary** shows:
  - [ ] Scheduled Sessions count (real number)
  - [ ] Active Sessions count (green, real-time)
  - [ ] Completed Sessions count (real number)

- [ ] No console errors about missing mock data
- [ ] No hardcoded chart data visible

**Expected API Calls:**
- `GET /api/classes`
- `GET /api/classes/stats`
- `GET /api/sessions`
- `GET /api/sessions/stats`

**What's NOT There (intentionally removed):**
- ❌ Mock line chart with microphone/reactions/chats
- ❌ Mock performance statistics bar chart
- ❌ Mock pie chart distribution
- ❌ Weekly/Monthly progress area charts

---

## 3. Password Reset Flow Testing

### Forgot Password:
1. Logout
2. On Landing Page, click "Log In"
3. Click "Forgot Password?" link (or navigate to `/forgot-password`)

### Verify:
- [ ] Page loads with email input form
- [ ] Email validation works (invalid email shows error)
- [ ] Submit button shows "Sending..." while processing
- [ ] Success message appears: "Password reset instructions sent"
- [ ] Backend sends email (check server logs)
- [ ] "Back to Login" link works

**Expected API Call:**
- `POST /api/auth/forgot-password`

### Reset Password:
1. Get reset token from email (or check backend logs for token)
2. Navigate to `/reset-password?token=<TOKEN>`

### Verify:
- [ ] Page loads with password fields
- [ ] Token validation works (invalid token shows error)
- [ ] Password validation works (minimum 6 chars)
- [ ] Password confirmation works (must match)
- [ ] Submit button shows "Resetting..." while processing
- [ ] Success message appears
- [ ] Redirects to login after 2 seconds
- [ ] Can login with new password

**Expected API Call:**
- `POST /api/auth/reset-password`

**What Changed:**
- ✅ Now uses `authAPI.resetPassword()` from services
- ✅ No more hardcoded `http://localhost:3001` URL
- ✅ Proper error handling from backend

---

## 4. Session Links Testing

### Setup:
1. Login as instructor
2. Navigate to My Classes
3. Click on a class or create new one
4. Click "Manage Links" action

### Verify:
- [ ] Modal opens showing existing session links
- [ ] Can add new link (Zoom/Meet/Teams/Other)
- [ ] Can set link as primary (star icon)
- [ ] Can update existing link
- [ ] Can delete link (with confirmation)
- [ ] Changes persist after closing modal
- [ ] Loading states work properly

**Expected API Calls:**
- `GET /api/classes/:id/links`
- `POST /api/classes/:id/links`
- `PUT /api/classes/:id/links/:linkId`
- `DELETE /api/classes/:id/links/:linkId`

**Backend Verified:**
- ✅ All 12 session link tests passing
- ✅ Frontend component properly integrated

---

## 5. Participation Tracking Testing

### Setup:
1. Create or select a session
2. Start the session
3. Navigate to session detail page
4. Click "Participation" tab

### Verify:
- [ ] **Participation Summary** displays:
  - [ ] Total Interactions count
  - [ ] Students Participated count (X / Y)
  - [ ] Participation Rate percentage
  - [ ] Progress bar matches percentage
  - [ ] Interaction type breakdown (chat/reactions/mic/camera)

- [ ] **Participation Logs List** shows:
  - [ ] All logged interactions
  - [ ] Sortable columns (timestamp, student, type)
  - [ ] Pagination if many logs
  - [ ] Expandable rows for details
  - [ ] Filter by interaction type works

- [ ] **Filters** work:
  - [ ] Search by student name
  - [ ] Filter by interaction type
  - [ ] Logs update when filters change

- [ ] Loading states appear while fetching
- [ ] Empty state shows if no participation yet

**Expected API Calls:**
- `GET /api/participation/sessions/:id/summary`
- `GET /api/participation/sessions/:id/logs`
- `GET /api/participation/sessions/:id/logs?interaction_type=chat`

**Backend Verified:**
- ✅ All participation controller tests passing
- ✅ Summary calculation correct
- ✅ Log filtering works

---

## 6. Extension Integration Endpoints

### Backend API Testing (using Postman/curl):

**Test Bulk Attendance Submission:**
```bash
POST /api/sessions/:sessionId/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "attendance": [
    { "student_id": 1, "status": "present" },
    { "student_id": 2, "status": "present" },
    { "student_id": 3, "status": "absent" }
  ]
}
```

### Verify:
- [ ] Endpoint returns 200 OK
- [ ] All attendance records created
- [ ] Session attendance count updates

**Test Bulk Participation Logs:**
```bash
POST /api/participation/sessions/:sessionId/logs/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "logs": [
    {
      "student_id": 1,
      "interaction_type": "chat",
      "timestamp": "2024-12-01T10:30:00Z",
      "details": { "message": "Question about lecture" }
    },
    {
      "student_id": 2,
      "interaction_type": "reaction",
      "timestamp": "2024-12-01T10:31:00Z",
      "details": { "emoji": "👍" }
    }
  ]
}
```

### Verify:
- [ ] Endpoint returns 201 Created
- [ ] All logs created successfully
- [ ] Participation summary updates
- [ ] Logs appear in frontend UI

**Extension Integration Verified:**
- ✅ Both bulk endpoints exist in backend
- ✅ Frontend API service has methods defined
- ✅ Extension architecture supports bulk submission
- ✅ IndexedDB + sync queue ready

---

## 7. General Frontend Quality

### Check All Pages For:
- [ ] No `console.error()` messages
- [ ] No `console.warn()` about missing data
- [ ] No "undefined" or "NaN" displayed in UI
- [ ] Loading spinners appear during data fetch
- [ ] Error messages display properly if API fails
- [ ] Empty states show when no data exists
- [ ] Navigation works between all pages
- [ ] Responsive design works on mobile

### Code Quality:
- [ ] No hardcoded URLs (all use `/api` from axios)
- [ ] No `Math.random()` in production code
- [ ] No mock data arrays
- [ ] All API calls use services layer
- [ ] React Query properly caches data
- [ ] Error boundaries catch errors

---

## 8. Performance Testing

### Load Testing:
- [ ] Dashboard loads < 2 seconds with 100 sessions
- [ ] Class page loads < 2 seconds with 50 students
- [ ] Participation logs scroll smoothly with 500+ logs
- [ ] No memory leaks during navigation
- [ ] Network tab shows efficient API calls (no duplicates)

### Optimization Check:
- [ ] React Query caching reduces API calls
- [ ] No unnecessary re-renders (use React DevTools)
- [ ] Images/assets load properly
- [ ] No console warnings about performance

---

## 9. Edge Cases & Error Handling

### Test These Scenarios:
- [ ] Login with wrong credentials → shows error
- [ ] Forgot password with non-existent email → graceful error
- [ ] Reset password with expired token → shows error
- [ ] Create session without required fields → validation works
- [ ] Delete class with sessions → shows appropriate error
- [ ] Network failure during API call → shows error message
- [ ] Token expires during session → auto-refreshes
- [ ] Refresh token expires → redirects to login

---

## 10. Cross-Browser Testing

### Test in Multiple Browsers:
- [ ] Chrome (primary dev browser)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

### Verify:
- [ ] All features work in each browser
- [ ] UI renders correctly
- [ ] No browser-specific console errors
- [ ] API calls work properly

---

## Summary Checklist

**Critical Items (Must Pass):**
- [ ] No mock data visible in Dashboard
- [ ] No mock data visible in Analytics
- [ ] All API calls succeed (check Network tab)
- [ ] Password reset flow works end-to-end
- [ ] Participation tracking displays real data
- [ ] No console errors

**Important Items (Should Pass):**
- [ ] Loading states work properly
- [ ] Error handling displays messages
- [ ] Empty states show correctly
- [ ] All navigation works
- [ ] Extension bulk endpoints tested

**Nice to Have:**
- [ ] Performance is good
- [ ] Cross-browser compatible
- [ ] Responsive design works
- [ ] No accessibility warnings

---

## If Tests Fail

### Common Issues:

1. **"Cannot read property of undefined"**
   - Check API response structure matches frontend expectations
   - Add optional chaining (`?.`) or default values

2. **"Network Error" or "404 Not Found"**
   - Verify backend is running
   - Check API endpoint routes match frontend calls
   - Verify authentication token is valid

3. **Data doesn't update**
   - Check React Query cache invalidation
   - Verify backend properly returns updated data
   - Check WebSocket connection for real-time updates

4. **Loading state never ends**
   - Check for infinite loading loops
   - Verify API call completes (check Network tab)
   - Add error handling for failed requests

---

## Sign-off

Once all tests pass:

- [ ] All critical items ✅
- [ ] All important items ✅
- [ ] Documentation updated ✅
- [ ] Code committed to git ✅
- [ ] Ready for deployment 🚀

**Tested by:** _______________  
**Date:** _______________  
**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:** _______________________________________________
