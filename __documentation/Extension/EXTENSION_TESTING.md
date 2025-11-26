# Engagium Extension - Testing Guide

## MVP Testing Checklist

### Prerequisites
✅ Extension built successfully (`npm run build`)  
✅ Extension loaded in Chrome (`chrome://extensions/`)  
✅ Backend server running (`http://localhost:3000`)  
✅ Test account with at least one class created  

---

## Test 1: Extension Installation

**Steps:**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select `_extension/dist/` folder
5. Extension should appear with "Engagium Attendance Tracker" name

**Expected Result:**
- ✅ Extension loads without errors
- ✅ Extension icon appears in toolbar
- ✅ No console errors in background service worker

**Check Console Logs:**
- Right-click extension icon → "Inspect popup" → Console tab
- Click "service worker" link in chrome://extensions/ → Console tab

---

## Test 2: Options Page - Authentication (OAuth Flow)

**Steps:**
1. Click extension icon
2. Click "Open Settings"
3. Go to **Authentication** tab
4. Click "Login with Engagium" button
5. New tab opens to http://localhost:3000/extension/auth
6. Login with your credentials (if not already logged in)
7. Click "Authorize Extension" button on the web app
8. Tab closes automatically and returns to options page

**Expected Result:**
- ✅ New tab opens to authentication page
- ✅ After authorization, tab closes automatically
- ✅ Options page shows "Successfully authenticated!" message
- ✅ Status changes to "Connected" with your email/username
- ✅ Classes load in Class Mapping tab
- ✅ Token stored in chrome.storage.local

**Troubleshooting:**
- If tab doesn't open: Check popup blockers in browser
- If "Authentication failed": Check backend is running at localhost:3000
- If tab doesn't close: Check that extension ID matches in redirect URL
- If CORS error: Check backend CORS configuration allows extension origin
- Check console in both options page and callback page for errors

---

## Test 3: Options Page - Class Mapping

**Steps:**
1. In Options → **Class Mapping** tab
2. Enter Google Meet ID: `abc-defg-hij` (any format)
3. Select a class from dropdown
4. Click "Add Mapping"

**Expected Result:**
- ✅ Mapping appears in "Existing Mappings" list
- ✅ Success message: "Mapping added successfully"
- ✅ Mapping persists after closing/reopening options

**Test Deletion:**
- Click ×  button on mapping
- Mapping should be removed immediately

---

## Test 4: Google Meet Detection

**Steps:**
1. Join a Google Meet: https://meet.google.com/new
2. Note the meeting ID from URL (e.g., `abc-defg-hij`)
3. Make sure this meeting ID is NOT mapped to a class yet
4. Look for indicator in top-right of Meet page

**Expected Result:**
- ✅ Small indicator appears: "Engagium: Idle" (gray dot)
- ✅ Content script loaded (check Meet page Console)
- ✅ No errors in console

**Check Console:**
- Open DevTools on Google Meet page
- Look for: `[GoogleMeet] Content script loaded`
- Look for: `[GoogleMeet] Meeting ID: abc-defg-hij`

---

## Test 5: Auto-Start Tracking (with Mapping)

**Steps:**
1. In Options → **Preferences**, enable "Auto-start tracking"
2. Save preferences
3. Go back to Options → **Class Mapping**
4. Add mapping: Meet ID (from current meeting) → Select class
5. Refresh the Google Meet page
6. Indicator should change to "Engagium: Tracking (0)" (green dot)

**Expected Result:**
- ✅ Auto-start works when meeting is mapped
- ✅ Indicator shows green dot
- ✅ Participant count shows (starts at 0)

**Check Background Logs:**
- Go to chrome://extensions/
- Click "service worker" link
- Look for: `[Background] Meeting detected: google-meet abc-defg-hij`
- Look for: `[Background] Session started: <session-id>`

---

## Test 6: Participant Tracking

**Steps:**
1. With tracking active, add yourself to participant list:
   - Click "Show everyone" button in Google Meet
   - Your name should appear in participant panel
2. Click extension icon → Popup should open
3. Observe participant count

**Expected Result:**
- ✅ Participant count increases
- ✅ Your name appears in "Recent Joins" list
- ✅ Status shows "Matched" or "Unmatched" badge
- ✅ Join time displayed (e.g., "2:30 PM")

**Check Logs:**
- Content script: `[GoogleMeet] Participant joined: Your Name`
- Background: `[SessionManager] Participant tracked: { name, matched, confidence }`

---

## Test 7: Popup UI

**Steps:**
1. With active session, click extension icon
2. Popup should show active session

**Expected Result:**
- ✅ Status card shows: "Tracking Active" with green dot
- ✅ Class name displayed
- ✅ Duration timer counting up (e.g., "1h 23m")
- ✅ Participant stats correct (Total, Matched, Unmatched)
- ✅ Recent joins list populated
- ✅ "End Session & Submit" button visible

**Test when idle:**
- Close all Google Meet tabs
- Open popup
- Should show "No Active Session" with tips

---

## Test 8: End Session & Data Submission

**Steps:**
1. With active session, click "End Session & Submit"
2. Confirm the dialog
3. Wait for submission to complete

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Success message or error message
- ✅ Popup returns to idle state
- ✅ Backend receives attendance data (check backend logs)

**Check Backend:**
- Backend console: `POST /api/sessions/:id/attendance/bulk`
- Response should be: `{ success: true, processed: X }`

**Check Database:**
```sql
SELECT * FROM attendance_records 
WHERE session_id = '<session-id>' 
ORDER BY joined_at DESC;
```

---

## Test 9: Offline Queue

**Steps:**
1. Start tracking in Google Meet
2. Add participants
3. **Disconnect internet** (turn off WiFi)
4. End session (will fail to submit)
5. **Reconnect internet**
6. Wait 30 seconds

**Expected Result:**
- ✅ Error message when offline: "Failed to submit"
- ✅ Data queued for retry
- ✅ When online, data automatically syncs
- ✅ Success notification appears

**Check Sync Queue:**
- Background console: `[SyncQueue] Item added: <id> attendance`
- Background console: `[SyncQueue] Processing queue: 1 items`
- Background console: `[SyncQueue] Item synced successfully`

---

## Test 10: Multiple Participants (Realistic Test)

**Steps:**
1. Open 2-3 browser windows in Incognito mode
2. Each joins the same Google Meet
3. Use different names for each participant
4. In main window (with extension), track the meeting
5. Have participants chat in the meeting
6. End session

**Expected Result:**
- ✅ All participants tracked
- ✅ Matched to students if names similar
- ✅ Unmatched flagged with warning badge
- ✅ Chat messages logged (if accessible)
- ✅ All attendance submitted to backend

---

## Known Limitations (MVP)

### Google Meet DOM Selectors
- ❌ Google Meet UI changes frequently
- ❌ Selectors may break with Meet updates
- ❌ Chat access may be limited by Meet's security

### Student Matching
- ⚠️ Fuzzy matching may mis-match similar names
- ⚠️ Guests without roster entry show as "Unmatched"
- ⚠️ Manual matching not yet implemented in UI

### Participation Tracking
- ⚠️ Chat messages may not be accessible in all cases
- ⚠️ Reactions/hand raises depend on DOM structure
- ⚠️ Mic/camera toggles not yet tracked

---

## Common Issues & Solutions

### Issue: "Content script not loading"
**Solution:**
- Check manifest.json has correct match pattern
- Refresh Google Meet page
- Reload extension in chrome://extensions/

### Issue: "Authentication failed"
**Solution:**
- Verify backend is running at localhost:3000
- Check backend allows CORS from `chrome-extension://`
- Get fresh auth token from backend

### Issue: "Participants not appearing"
**Solution:**
- Click "Show everyone" button in Google Meet
- Wait 2-3 seconds for DOM to load
- Check content script console for errors

### Issue: "Data not submitting"
**Solution:**
- Check network connectivity
- Verify backend session exists
- Check background console for API errors
- Data will queue and retry automatically

---

## Performance Checks

### Memory Usage
- Extension should use < 50MB
- Check: chrome://extensions/ → "Inspect views: service worker" → Memory tab

### CPU Usage
- Should be minimal when idle
- < 5% CPU during active tracking
- Check: Chrome Task Manager (Shift+Esc)

### Network Usage
- Only API calls during session end
- No polling or constant requests
- Check: DevTools → Network tab

---

## Success Criteria

MVP is ready when:
- ✅ Extension loads without errors
- ✅ Can authenticate with backend
- ✅ Can map meetings to classes
- ✅ Tracks at least 1 participant correctly
- ✅ Submits attendance to backend successfully
- ✅ Data appears in backend database
- ✅ Popup UI shows correct information
- ✅ Options page saves settings

---

## Next Steps After MVP

1. **Test with real class** (10+ students)
2. **Add Zoom support** (content/zoom.js)
3. **Improve matching algorithm** (manual overrides)
4. **Add participation tracking** (chat, reactions)
5. **Add analytics** (session summaries)
6. **Submit to Chrome Web Store**

---

**Last Updated:** November 25, 2025  
**Tester:** QA Team  
**Version:** 1.0.0 MVP
