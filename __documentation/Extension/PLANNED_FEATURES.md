# Planned Features for Future Implementation

## Overview
This document tracks features that have been temporarily removed from the extension to focus on core join/leave tracking functionality. These features are planned for future implementation.

**Date Removed:** December 9, 2025  
**Reason:** Simplify extension to focus on core attendance tracking (participant joins/leaves only)

---

## Participation Event Detectors (Removed)

The following 5 detector modules were removed from `_extension/content/google-meet/`:

### 1. **Chat Message Tracking** (`chat-monitor.js`)
- **Functionality:** Monitored Google Meet chat panel for messages
- **Detection Method:** ARIA-based DOM monitoring of "In-call messages" panel
- **Events Tracked:** 
  - Chat messages sent by participants
  - Sender name, message content, timestamp
- **Future Use Case:** 
  - Track student engagement via chat participation
  - Generate chat transcripts for session review
  - Identify students who actively participate in discussion

### 2. **Emoji Reaction Tracking** (`reaction-detector.js`)
- **Functionality:** Detected emoji reactions from participants
- **Detection Method:** 
  - Toast notifications: "[Name] reacted with [emoji]"
  - Reaction overlays on video tiles
- **Events Tracked:**
  - Emoji reactions (👍, 👏, 😂, ❤️, 🤔, 🎉, etc.)
  - Participant name and timestamp
- **Future Use Case:**
  - Quick engagement metrics (positive reactions = engaged students)
  - Non-verbal feedback during lectures
  - Fun participation statistics

### 3. **Hand Raise Detection** (`hand-raise-detector.js`)
- **Functionality:** Tracked when students raised hands
- **Detection Method:**
  - People Panel "Raised hands" section
  - Toast notifications: "[Name] has raised a hand"
  - Video tile hand icons
- **Events Tracked:**
  - Hand raise timestamp
  - Duration hand was raised
- **Future Use Case:**
  - Track which students actively seek to participate
  - Identify students who raise hands but don't get called on
  - Ensure equitable participation opportunities

### 4. **Microphone State Tracking** (`media-state-detector.js`)
- **Functionality:** Monitored mic mute/unmute status
- **Detection Method:**
  - People Panel mic button states
  - Toast notifications for mute changes
- **Events Tracked:**
  - Mic muted/unmuted events
  - Duration mic was active
- **Note:** Camera status NOT detectable for other participants in Google Meet
- **Future Use Case:**
  - Track verbal participation
  - Identify students who speak vs. stay silent
  - Microphone-on time as engagement metric

### 5. **Screen Share Detection** (`screen-share-detector.js`)
- **Functionality:** Detected when participants shared screens
- **Detection Method:**
  - Toast notification: "[Name] is presenting"
  - People Panel separate "presentation" entry
- **Events Tracked:**
  - Screen share start/stop
  - Presenter name and duration
- **Future Use Case:**
  - Track student presentations
  - Identify technical issues (frequent screen share drops)
  - Presentation time tracking for grading

---

## Related Code Removed

### Message Types (from `utils/constants.js`)
```javascript
// Removed from MESSAGE_TYPES:
CHAT_MESSAGE: 'CHAT_MESSAGE',
REACTION: 'REACTION',
HAND_RAISE: 'HAND_RAISE',
MIC_TOGGLE: 'MIC_TOGGLE',
CAMERA_TOGGLE: 'CAMERA_TOGGLE',
SCREEN_SHARE: 'SCREEN_SHARE',

// Removed from INTERACTION_TYPES:
CHAT: 'chat',
REACTION: 'reaction',
HAND_RAISE: 'hand_raise',
MIC_ON: 'mic_on',
CAMERA_ON: 'camera_on',
```

### Background Handler
- **File Removed:** `background/handlers/event-handler.js`
- **Purpose:** Handled participation events (not join/leave)
- **Will Need:** Re-implement when adding participation tracking back

### State Management
- **Removed from `state.js`:**
  - `lastReactions` Map - tracked recent reactions
  - Other participation event state tracking

---

## Email Field Removal

### Context
Google Meet DOM does not expose participant email addresses through scraping. Email fields were placeholders that were always `null`.

### Removed From:
1. `participant-detector.js` - Participant objects
2. `socket-client.js` - WebSocket event payloads
3. `session-manager.js` - Session participant data
4. `service-worker.js` - Message handling
5. `participant-handler.js` - Join/leave events
6. `student-matcher.js` - Matching logic

### Kept In:
- `users` table (database) - Instructor login still uses email
- Backend authentication - Email-based login unchanged

---

## Implementation Priority (Future)

### Phase 2 - Basic Participation Tracking
1. **Hand Raise Detection** (High Value)
   - Shows active engagement
   - Easy to implement
   - Clear user benefit

2. **Chat Message Tracking** (High Value)
   - Important engagement metric
   - Requires chat panel to be open

### Phase 3 - Advanced Participation
3. **Emoji Reactions** (Medium Value)
   - Fun engagement metric
   - Low effort to re-implement

4. **Microphone State** (Medium Value)
   - Verbal participation tracking
   - More complex to track reliably

### Phase 4 - Presentation Features
5. **Screen Share Detection** (Lower Priority)
   - Useful for presentation tracking
   - Niche use case

---

## Notes for Re-Implementation

### Technical Considerations
1. All detectors use **ARIA-based DOM monitoring** (see `GOOGLE_MEET_DOM_REFERENCE.md`)
2. Toast notifications provide exact timestamps for events
3. Event deduplication is critical (same event can trigger multiple times)
4. People Panel must be open for some detections to work

### Database Schema
Current `participation_logs` table supports these event types:
```sql
interaction_type interaction_type NOT NULL,
-- ENUM: 'manual_entry', 'chat', 'reaction', 'mic_toggle', 
--       'camera_toggle', 'hand_raise', 'join', 'leave'
```

Schema is already prepared for future participation events.

### WebSocket Events
Backend `socketHandler.js` already has handlers for:
- `emitChatMessage()` - Chat events
- `emitParticipation()` - General participation events

Re-enable when participation tracking returns.

---

## Current Focus

**MVP Scope:** Track attendance only (joins/leaves)
- Participant joins meeting → record timestamp
- Participant leaves meeting → record timestamp  
- Calculate total attendance duration
- Match participants to student roster

**Out of Scope:** All other participation events (listed above)

This focused approach ensures:
- ✅ Simpler codebase
- ✅ Easier maintenance
- ✅ Fewer edge cases
- ✅ Core value delivered quickly
- ✅ Foundation for future features

---

*Last Updated: December 9, 2025*
