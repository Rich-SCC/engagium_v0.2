# Mic Toggle Broadcasting Debug Guide

## Changes Made

### 1. **Extension (Backend) - Session Manager**
- **File**: `_extension/background/session-manager.js`
- **Change**: Added fallback mechanism for socket connection
  - If `socketClient.isSessionConnected()` returns false initially, the code now attempts to send via REST API as a fallback
  - Added comprehensive logging at each step of participation event processing
  - Logs participant name, session ID, type, matching results

### 2. **Extension - Socket Client**
- **File**: `_extension/background/socket-client.js`  
- **Change**: Enhanced logging for participation events
  - Added special highlighting for mic_toggle events in console  
  - Added confirmation log when mic toggle is successfully sent
  - Better visibility into REST request details

### 3. **Backend - Session Controller**
- **File**: `backend/src/controllers/sessionController.js`
- **Change**: Enhanced logging in `handleLiveEvent` for participation:logged events
  - Added specific mic_toggle detection and logging
  - Logs mic status (muted/unmuted), participant name, match status
  - Shows room membership before broadcasting

### 4. **Frontend - WebSocket Context**
- **File**: `frontend/src/contexts/WebSocketContext.jsx`
- **Change**: Enhanced logging for participation:logged events
  - Added specific mic_toggle detection and logging
  - Shows when mic toggle is received and added to feed
  - Logs mic status information

## How to Debug

### Step 1: Check Browser Extension Console
1. Open `chrome://extensions/`
2. Click "Details" on Engagium extension
3. Click "Errors" tab to see any runtime errors
4. Or click "Background page" to see real-time logs

**What to look for:**
```
🎙️ ========== EMITTING PARTICIPATION EVENT ==========
Event Type: mic_toggle
Student: [Student Name]
Session Connected: true
Session ID: [backend_session_id]
=================================================
```

### Step 2: Check Backend Logs
Watch the backend console for:
```
[LiveEvent] 🎙️ MIC_TOGGLE LOGIC
[LiveEvent] ✅ MIC_TOGGLE event detected!
[LiveEvent] MIC Toggle Details: {
  participantName: "...",
  isMuted: true/false,
  studentId: "...",
  isMatched: true/false
}
[LiveEvent] Room membership: {
  sessionRoom: X,
  instructorRoom: Y
}
[LiveEvent] ✅ MIC_TOGGLE broadcasted to Z clients
```

### Step 3: Check Frontend Browser Console
Look in DevTools console for:
```
[WebSocket] 📥 RECEIVED: participation:logged
[WebSocket] Type: mic_toggle
[WebSocket] 🎙️ MIC_TOGGLE RECEIVED!
[WebSocket] Mic Status: MUTED (or UNMUTED)
[WebSocket] ✅ MIC_TOGGLE added to feed!
```

## Troubleshooting

### Issue: "Socket not connected" message in extension logs

**Causes:**
1. Backend socket connection not established when first mic toggle occurs
2. Session not properly connected before events start firing

**Solution is already implemented:**
- Code now attempts fallback REST API send if socket not connected
- Socket should reconnect automatically on next event

### Issue: Backend shows room membership = 0

**Causes:**
1. Frontend hasn't joined the instructor room yet
2. Session room room not being joined by anyone

**Check:**
- Frontend should be emitting `join_instructor_room` on connection
- Verify WebSocket connection status in browser console

### Issue: Event received by backend but frontend sees 0 clients

**Causes:**
1. Frontend not in the right socket room
2. Socket.io namespace or room name mismatch

**Check:**
- Verify `instructor_${userId}` room name matches
- Check that frontend has correctly authenticated and joined

## Expected Log Flow

### Extension:
```
🔍 PROCESSING MIC_TOGGLE EVENT
├─ Participant: Alice Johnson
├─ Session: session_123
└─ Type: MIC_TOGGLE
Roster lookup: found 25 total participants
✅ MATCHED to student: Alice J.
📡 Socket connected, emitting participation event via WebSocket
REST fallback sent for: mic_toggle
```

### Backend:
```
[LiveEvent] 📥 RECEIVED FROM EXTENSION
[LiveEvent] Event Type: participation:logged
[LiveEvent] Session ID: session_123
[LiveEvent] Data: {...}
[LiveEvent] 🎙️ MIC_TOGGLE LOGIC
[LiveEvent] ✅ MIC_TOGGLE event detected!
[LiveEvent] Broadcasting participation:logged to rooms...
[LiveEvent] Room membership: { sessionRoom: 2, instructorRoom: 1 }
[LiveEvent] ✅ MIC_TOGGLE broadcasted to 3 clients
```

### Frontend:
```
[WebSocket] 📥 RECEIVED: participation:logged
[WebSocket] Type: mic_toggle
[WebSocket] 🎙️ MIC_TOGGLE RECEIVED!
[WebSocket] Mic Status: UNMUTED
[WebSocket] ✅ MIC_TOGGLE added to feed!
```

## Next Steps

1. **Test the flow**: Open a Google Meet, toggle mic while tracking, watch console logs
2. **Verify at each step**: Make sure events move through the entire pipeline
3. **Check live feed**: Verify mic toggle appears in frontend live event feed
4. **Monitor room membership**: Ensure broadcast destination has connected clients

If mic toggles are still not appearing after these changes, check:
- That `isSessionConnected()` is returning true (socket fully connected)
- That interaction_type is exactly 'mic_toggle' (case-sensitive)
- That participant name matching is working (should see MATCHED or NO MATCH log)
