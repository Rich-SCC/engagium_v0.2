# Google Meet DOM Structure Reference

> **Last Updated:** November 29, 2025  
> **Purpose:** DOM structure documentation for Engagium Chrome Extension development  
> **Target:** Student participation monitoring for professors

---

## Table of Contents

1. [Overview](#overview)
2. [Detection Architecture](#detection-architecture)
3. [Participant Detection](#participant-detection)
4. [Microphone Status](#microphone-status)
5. [Camera Status](#camera-status)
6. [Raised Hands](#raised-hands)
7. [Reactions](#reactions)
8. [Chat Messages](#chat-messages)
9. [Screen Sharing](#screen-sharing)
10. [Toast Notifications](#toast-notifications)
11. [Recommended Implementation](#recommended-implementation)
12. [Known Limitations](#known-limitations)

---

## Overview

This document provides the complete DOM structure reference for Google Meet as of November 2025. Engagium is a monitoring tool used by professors to track student participation, so the focus is on **monitoring other participants**, not self-tracking.

### Key Changes from Previous Implementation

| Old Selector (Broken) | Status | Replacement Strategy |
|----------------------|--------|---------------------|
| `[data-participant-id]` | ❌ Not Found | Use People Panel `listitem` elements |
| `[data-self-name]` | ❌ Not Found | Use accessible names in listitem |
| `[data-requested-participant-id]` | ❌ Not Found | Use People Panel list |
| `[data-tooltip]` | ❌ Not Found | Use `tooltip` role elements |
| `[data-allocation-index]` | ❌ Not Found | Use `main` element for video grid |
| `[data-panel-id="2"]` | ❌ Not Found | Use `complementary "Side panel"` |

**Google Meet now uses ARIA-based accessibility structure instead of data attributes.**

---

## Detection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENGAGIUM DETECTION SOURCES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │     PEOPLE PANEL        │    │    TOAST NOTIFICATIONS      │ │
│  │     (PRIMARY)           │    │    (EVENT TIMESTAMPS)       │ │
│  ├─────────────────────────┤    ├─────────────────────────────┤ │
│  │ ✓ All students          │    │ ✓ "[Name] joined"           │ │
│  │ ✓ Mic status (muted)    │    │ ✓ "[Name] left"             │ │
│  │ ✓ Raised hands section  │    │ ✓ "[Name] has raised hand"  │ │
│  │ ✓ Names & roles         │    │ ✓ "[Name] reacted with X"   │ │
│  │ ✓ Always complete list  │    │ ✓ Exact event timing        │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │     VIDEO TILES         │    │      CHAT PANEL             │ │
│  │     (SUPPLEMENTARY)     │    │      (MESSAGES)             │ │
│  ├─────────────────────────┤    ├─────────────────────────────┤ │
│  │ ✓ Active reactions      │    │ ✓ Sender name               │ │
│  │ ✓ Hand icons on tiles   │    │ ✓ Timestamp                 │ │
│  │ ⚠ Limited to visible    │    │ ✓ Message text              │ │
│  │ ⚠ Changes with layout   │    │ ✓ Complete history          │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why People Panel is Primary

1. **Complete List** - Shows ALL participants regardless of video grid layout
2. **Consistent** - Not affected by screen sharing, spotlight, or grid view
3. **Status Indicators** - Shows mic muted status directly
4. **Raised Hands** - Has dedicated section with queue order
5. **No View Modification** - Doesn't require changing professor's view

---

## Participant Detection

### People Panel Structure (Primary Source)

```yaml
complementary "Side panel":
  - heading "People" [level=2]
  - button "Add people"
  - textbox "Search for people"
  - heading "In the meeting" [level=3]
  
  # Raised Hands Section (appears when hands are raised)
  - button "Raised hands X" [expanded]
  - region "Raised hands":
    - button "Lower all hands"
    - list "X raised hand(s)":
      - listitem "[Participant Name]"
  
  # Main Participants Section
  - button "Contributors X" [expanded]
  - region "In call":
    - list "Participants":
      - listitem "[Participant Name]":
        - img                              # Avatar
        - generic: "[Name]"
        - generic: "(You)"                 # Only on self
        - generic: "Meeting host"          # Only on host
        - button "You can't unmute..." [disabled]  # If muted
        - button "More actions"
```

### Participant Entry Patterns

#### Regular Student (Muted)
```yaml
listitem "Student Name":
  - img                                    # Avatar
  - generic: "Student Name"
  - button "You can't unmute someone else" [disabled]  # ← MUTED
  - button "More actions"
```

#### Regular Student (Unmuted)
```yaml
listitem "Student Name":
  - img                                    # Avatar
  - generic: "Student Name"
  # No mute button = NOT MUTED
  - button "More actions"
```

#### Professor/Host (Self)
```yaml
listitem "Professor Name":
  - img
  - generic: "Professor Name"
  - generic: "(You)"                       # Self indicator
  - generic: "Meeting host"                # Host role
  - button "More actions"
```

#### Screen Share Entry
```yaml
listitem "Professor Name":
  - img
  - generic: "Professor Name"
  - generic: "Your presentation"           # ← Presentation indicator
  - button "More actions"
```

### Participant Count
```yaml
button "People - X joined"                 # X = total count
generic: "X"                               # Badge number
```

---

## Microphone Status

### Student Mic Status (People Panel)

| Status | DOM Pattern |
|--------|-------------|
| **MUTED** | `button "You can't unmute someone else" [disabled]` present |
| **UNMUTED** | `button "Mute [Name]'s microphone"` present (NOT disabled) |

> **Key Discovery (Nov 29, 2025):** When a student is unmuted, the button text changes from "You can't unmute someone else" (disabled) to "Mute [Name]'s microphone" (clickable). This is a reliable way to detect unmuted state.

#### Muted Student Example
```yaml
listitem "DE GUZMAN, RICH A._BSCS 4D":
  - img
  - generic: "DE GUZMAN, RICH A._BSCS 4D"
  - button "You can't unmute someone else" [disabled]  # ← MUTED
  - button "More actions"
```

#### Unmuted Student Example
```yaml
listitem "DE GUZMAN, RICH A._BSCS 4D":
  - img
  - generic: "DE GUZMAN, RICH A._BSCS 4D"
  - button "Mute DE GUZMAN, RICH A._BSCS 4D's microphone"  # ← UNMUTED (clickable!)
  - button "More actions"
```

```javascript
// Detection logic
function isStudentMuted(listitem) {
  // Check for disabled "can't unmute" button = MUTED
  const cantUnmuteButton = listitem.querySelector('button[disabled]');
  if (cantUnmuteButton?.textContent?.includes("can't unmute")) {
    return true;
  }
  
  // Check for active "Mute [Name]'s microphone" button = UNMUTED
  const muteButton = Array.from(listitem.querySelectorAll('button')).find(
    btn => btn.textContent?.includes("'s microphone") && !btn.disabled
  );
  if (muteButton) {
    return false;  // They have an active mute button, so they're unmuted
  }
  
  // Default to muted if no button found
  return true;
}
```

### Self Mic Status (Control Bar) - Less Relevant for Monitoring

```yaml
# MIC OFF:
button "Turn on microphone":
  - generic: mic_off

# MIC ON:
button "Turn off microphone":
  - generic: mic
```

---

## Camera Status

### ⚠️ Limitation: No Direct Camera Indicator

Google Meet's accessibility tree does **not expose camera status** for other participants. The `img` elements in the People Panel don't indicate camera on/off state.

### Possible Workarounds

1. **Video Tile Inspection** (Complex)
   - Compare if tile shows live video vs static avatar
   - Requires actual DOM inspection, not accessibility tree
   - Not reliable with screen sharing active

2. **Accept Limitation**
   - Focus on mic status (more important for verbal participation)
   - Camera off doesn't necessarily indicate disengagement

### Recommendation
**Do not implement camera tracking** - mic status is the more meaningful engagement metric, and camera tracking would be unreliable.

---

## Raised Hands

### People Panel - Raised Hands Section

When one or more students raise their hands, a dedicated section appears:

```yaml
button "Raised hands X" [expanded]:        # X = count
  - generic: "Raised hands"
  - generic: "X"

region "Raised hands":
  - button "Lower all hands"
  - list "X raised hand(s)":
    - listitem "[Student Name]":
      - img                                # Avatar
      - generic: "[Student Name]"
      - generic: front_hand                # Hand icon
      - button "Lower [Name]'s hand"
```

### Video Tile Indicator

```yaml
generic:
  - generic: front_hand                    # Hand icon on tile
  - generic: "[Student Name]"
```

### Toast Notification (For Timestamp)

```yaml
generic:
  - img                                    # Avatar
  - text: "[Student Name] has raised a hand"
  - button "Open queue"
  - button "Close"
```

### Detection Strategy

```javascript
// 1. Watch for toast to get exact timestamp
// Toast text: "[Name] has raised a hand"

// 2. Query People Panel for current state
const raisedHandsRegion = document.querySelector('[role="region"][aria-label="Raised hands"]');
const raisedHandsList = raisedHandsRegion?.querySelectorAll('[role="listitem"]');
```

---

## Reactions

### On Video Tiles

Reactions appear on the participant's video tile:

```yaml
generic:
  - img "👍"                               # Emoji with alt text
  - generic: "[Student Name]"              # Participant name nearby
```

### Multiple Reactions Stack

```yaml
main:
  - generic:
    - generic:
      - img "👍"
      - generic: "Student A"
    - generic:
      - img "💖"
      - generic: "Student A"
    - generic:
      - img "🎉"
      - generic: "Student B"
```

### Available Reactions

| Emoji | Button Text |
|-------|-------------|
| 💖 | Heart |
| 👍 | Thumbs up |
| 🎉 | Party |
| 👏 | Clap |
| 😂 | Laugh |
| 😮 | Surprised |
| 😢 | Sad |
| 🤔 | Thinking |
| 👎 | Thumbs down |

### Toast Notification (For Others' Reactions)

```yaml
# When another participant reacts:
generic: "[Student Name] reacted with 👍"
```

### Detection Strategy

```javascript
// Watch for emoji images on video tiles
const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;

function detectReaction(imgElement) {
  const emoji = imgElement.alt;
  if (emojiRegex.test(emoji)) {
    const participantName = imgElement.closest('div')?.textContent;
    return { participant: participantName, emoji, timestamp: new Date() };
  }
}
```

---

## Chat Messages

### Chat Panel Structure

```yaml
complementary "Side panel":
  - heading "In-call messages" [level=2]
  - switch "Let participants send messages" [checked]
  - heading "Continuous chat is OFF" [level=3]
  
  # Message Container:
  - generic:
    # Student's message (has sender name):
    - generic:
      - generic:
        - generic: "[Student Name]"        # Sender
        - generic: "2:44 PM"               # Timestamp
      - generic: "message text here"       # Message content
    
    # Host's own message (no sender shown):
    - generic:
      - generic: "2:44 PM"                 # Timestamp only
      - generic: "message text"            # Message content
      - button "Pin message"

  # Input Area:
  - textbox "Send a message"
  - button "Send a message" [disabled]
```

### Message Data Structure

| Field | Location |
|-------|----------|
| **Sender** | First nested generic (for others' messages) |
| **Timestamp** | Generic with time format "X:XX PM/AM" |
| **Content** | Deepest generic text |
| **Pinned** | Button "Pin message" / "Unpin message" |

---

## Screen Sharing

### When Professor is Presenting

#### Presentation Region
```yaml
region "Presentation":
  - generic: present_to_all                # Icon
  - heading "[Name] (You, presenting)" [level=2]
  - button "Stop presenting"
```

#### Control Bar Indicator
```yaml
button "You are presenting":
  - generic: computer_arrow_up
```

#### People Panel Entry
```yaml
listitem "[Professor Name]":
  - img
  - generic: "[Name]"
  - generic: "Your presentation"           # ← Identifies as presentation
```

### Auto-Unpin Recommendation

When the professor is presenting, they may want to see all student tiles. The extension can offer to:

1. **Auto-unpin own presentation** - Switch view to show student grid
2. **Keep People Panel visible** - Ensure all students are monitored

This is **not intrusive** because:
- Professor initiated the screen share
- They likely want to monitor students while presenting
- Easy to re-pin if needed

```javascript
// Optional: Detect own presentation and offer to unpin
const presentationEntry = Array.from(
  document.querySelectorAll('[role="listitem"]')
).find(el => el.textContent.includes('Your presentation'));

if (presentationEntry) {
  // Could auto-click "Unpin" or show notification to professor
}
```

---

## Toast Notifications

Toasts appear at the bottom-left and provide **event timestamps**.

### Toast Patterns

| Event | Text Pattern |
|-------|-------------|
| **Join** | `"[Name] joined"` |
| **Leave** | `"[Name] left"` |
| **Raised Hand** | `"[Name] has raised a hand"` |
| **Reaction** | `"[Name] reacted with [emoji]"` |
| **Chat Message** | `"[Name] says in chat: [message]"` |
| **Mic Reminder** | `dialog "Are you talking? Your mic is off."` |
| **Panel Open** | `"People panel is open"` |

### Toast Structure

```yaml
# Join Toast:
generic:
  - img                                    # Avatar
  - text: "DE GUZMAN, RICH A._BSCS 4D joined"
  - button "Close"

# Leave Toast:
generic:
  - img                                    # Avatar  
  - text: "DE GUZMAN, RICH A._BSCS 4D left"
  - button "Close"

# Raised Hand Toast:
generic:
  - img                                    # Avatar
  - text: "[Name] has raised a hand"
  - button "Open queue"                    # Opens People Panel
  - button "Close"

# Chat Toast (NEW - Nov 29, 2025):
generic:
  - img                                    # Avatar
  - text: "DE GUZMAN, RICH A._BSCS 4D says in chat: hello eveveryone"
  - button "Close"

# Status Toast:
generic: "Your microphone is on."
generic: "People panel is open"
```

### Toast Observer Implementation

```javascript
const toastObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      
      const text = node.textContent || '';
      const timestamp = new Date();
      
      if (text.includes(' joined')) {
        const name = text.replace(' joined', '').replace('Close', '').trim();
        // Emit: PARTICIPANT_JOINED { name, timestamp }
      }
      
      if (text.includes(' left')) {
        const name = text.replace(' left', '').replace('Close', '').trim();
        // Emit: PARTICIPANT_LEFT { name, timestamp }
      }
      
      if (text.includes(' has raised a hand')) {
        const name = text.replace(' has raised a hand', '').replace('Open queueClose', '').trim();
        // Emit: HAND_RAISED { name, timestamp }
      }
      
      if (text.includes(' reacted with ')) {
        const match = text.match(/(.+) reacted with (.+)/);
        if (match) {
          // Emit: REACTION { name: match[1], emoji: match[2], timestamp }
        }
      }
      
      // NEW: Chat message toast detection
      if (text.includes(' says in chat: ')) {
        const match = text.match(/(.+) says in chat: (.+?)(?:Close)?$/);
        if (match) {
          // Emit: CHAT_MESSAGE { name: match[1], message: match[2], timestamp }
        }
      }
    }
  }
});

toastObserver.observe(document.body, { childList: true, subtree: true });
```

---

## Recommended Implementation

### 1. Primary: People Panel Observer

```javascript
function setupPeoplePanelObserver() {
  // Find the participants list
  const findParticipantsList = () => {
    return document.querySelector('[role="list"][aria-label="Participants"]');
  };
  
  const observer = new MutationObserver(() => {
    const list = findParticipantsList();
    if (!list) return;
    
    const participants = Array.from(list.querySelectorAll('[role="listitem"]'));
    
    participants.forEach(p => {
      const name = p.getAttribute('aria-label') || 
                   p.querySelector('[role="generic"]')?.textContent;
      
      // Skip self and presentations
      if (p.textContent.includes('(You)')) return;
      if (p.textContent.includes('presentation')) return;
      
      const isMuted = !!p.querySelector('button[disabled]');
      
      // Update participant state
      updateParticipant({ name, isMuted });
    });
  });
  
  // Observe side panel for changes
  const sidePanel = document.querySelector('[role="complementary"]');
  if (sidePanel) {
    observer.observe(sidePanel, { childList: true, subtree: true });
  }
}
```

### 2. Raised Hands Observer

```javascript
function setupRaisedHandsObserver() {
  const observer = new MutationObserver(() => {
    const raisedHandsRegion = document.querySelector(
      '[role="region"][aria-label="Raised hands"]'
    );
    
    if (raisedHandsRegion) {
      const handsList = raisedHandsRegion.querySelectorAll('[role="listitem"]');
      const raisedHands = Array.from(handsList).map(item => ({
        name: item.getAttribute('aria-label'),
        // Order in list = queue order
      }));
      
      updateRaisedHands(raisedHands);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}
```

### 3. Toast Observer (For Timestamps)

```javascript
function setupToastObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const text = node.textContent?.toLowerCase() || '';
        const timestamp = new Date();
        
        // Join/Leave detection
        if (text.includes('joined')) {
          emitEvent('PARTICIPANT_JOINED', { text, timestamp });
        }
        if (text.includes('left')) {
          emitEvent('PARTICIPANT_LEFT', { text, timestamp });
        }
        
        // Raised hand detection
        if (text.includes('has raised a hand')) {
          emitEvent('HAND_RAISED', { text, timestamp });
        }
        
        // Reaction detection
        if (text.includes('reacted with')) {
          emitEvent('REACTION', { text, timestamp });
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}
```

### 4. Reactions Observer (Video Tiles)

```javascript
function setupReactionsObserver() {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const emojiImgs = node.querySelectorAll?.('img[alt]') || [];
        
        emojiImgs.forEach(img => {
          if (emojiRegex.test(img.alt)) {
            const emoji = img.alt;
            const container = img.closest('[role="generic"]');
            const name = container?.textContent?.replace(emoji, '').trim();
            
            emitEvent('REACTION_ON_TILE', { name, emoji, timestamp: new Date() });
          }
        });
      }
    }
  });
  
  const main = document.querySelector('[role="main"]');
  if (main) {
    observer.observe(main, { childList: true, subtree: true });
  }
}
```

---

## Known Limitations

### 1. Camera Status Not Detectable
- Accessibility tree doesn't expose camera on/off for other participants
- Would require actual DOM inspection with class/attribute checking
- **Recommendation:** Skip camera tracking, focus on mic status

### 2. Exact Participant IDs Not Available
- Old `data-participant-id` attributes no longer exist
- Use participant name as identifier (may have duplicates)
- Consider using name + join timestamp for uniqueness

### 3. Video Grid Limited
- Only shows subset of participants (9-16 max)
- Changes based on who's speaking, screen sharing, etc.
- **Recommendation:** Use People Panel as primary source

### 4. Rate Limiting Observers
- Too many mutation observers can impact performance
- Debounce callbacks when processing frequent changes
- Batch updates to backend

### 5. Google Meet Updates
- DOM structure may change with Google updates
- Monitor for selector failures
- Consider fallback detection methods

---

## Summary: What Engagium Can Track

| Feature | Trackable | Source | Notes |
|---------|-----------|--------|-------|
| **All Students Present** | ✅ Yes | People Panel | Complete list always |
| **Student Join** | ✅ Yes | Toast + Panel | With timestamp |
| **Student Leave** | ✅ Yes | Toast + Panel | With timestamp |
| **Mic Muted** | ✅ Yes | People Panel | Per-student |
| **Raised Hand** | ✅ Yes | Panel + Toast | With queue order & timestamp |
| **Reactions** | ✅ Yes | Tiles + Toast | With timestamp |
| **Chat Messages** | ✅ Yes | Chat Panel | Sender, time, content |
| **Screen Sharing** | ✅ Yes | Panel + Region | Who is presenting |
| **Camera Status** | ❌ No | N/A | Not exposed in accessibility tree |

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-29 | 1.0 | Initial documentation based on live DOM inspection |
| 2025-11-29 | 1.1 | Updated mic detection: unmuted shows "Mute [Name]'s microphone" button |
| 2025-11-29 | 1.2 | Added chat toast pattern: "[Name] says in chat: [message]" |
