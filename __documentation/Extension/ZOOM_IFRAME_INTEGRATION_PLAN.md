# Zoom App Iframe Integration Plan

Date: 2026-04-05

## Goal
Create an iframe-ready route in the web app that behaves like the extension pipeline:
- Start/end a tracking session
- Stream participant join/leave and participation activity
- Reuse existing backend contracts (no new session schema)

Implemented route:
- /zoom/bridge

## Existing Engagium Contracts Reused

### Session lifecycle
- POST /api/sessions/start-from-meeting
- PUT /api/sessions/:id/end-with-timestamp

### Realtime ingestion
- POST /api/sessions/live-event

Accepted live-event payload already supports:
- participant:joined
- participant:left
- participation:logged
- session:extension_connected
- session:extension_disconnected

### Auth mode
Use flexible auth via header:
- X-Extension-Token: <token>

This works for classes + sessions endpoints already used by the extension.

## Zoom SDK Methods and Events To Use

Reference surface: Zoom Apps SDK (class ZoomSdk, v0.16.x)

### Required setup
- zoomSdk.config({ capabilities: [...] })
- zoomSdk.getRunningContext()
- zoomSdk.getSupportedJsApis() (recommended runtime capability check)

### Meeting identity/context
- zoomSdk.getMeetingJoinUrl() (host/co-host availability constraints)
- zoomSdk.getMeetingUUID()
- zoomSdk.getMeetingContext()
- zoomSdk.getUserContext()

### Participant tracking
- zoomSdk.onParticipantChange(handler)
- zoomSdk.getMeetingParticipants() for initial snapshot where role allows

### Participation signals (chat intentionally excluded)
- zoomSdk.onReaction(handler)
- zoomSdk.onEmojiReaction(handler)
- zoomSdk.onMyReaction(handler)
- zoomSdk.onMyMediaChange(handler) for mic mute/unmute state

### Session end/disconnect signals
- zoomSdk.onMeeting(handler) and close on action ended/leave
- zoomSdk.onRunningContextChange(handler) for context transitions
- zoomSdk.onMyUserContextChange(handler) and re-configure if needed

## Event Mapping to Backend

### Participant joined
Zoom source:
- onParticipantChange action includes join

Backend event:
- eventType: participant:joined
- data:
  - participant.id = participantUUID (if available)
  - participant.name = displayName/screenName
  - participant.joinedAt = ISO timestamp

### Participant left
Zoom source:
- onParticipantChange action includes left/leave

Backend event:
- eventType: participant:left
- data:
  - participantId = participantUUID
  - participant_name = displayName/screenName
  - leftAt = ISO timestamp

### Reaction
Zoom source:
- onReaction / onEmojiReaction / onMyReaction

Backend event:
- eventType: participation:logged
- data:
  - interactionType: reaction
  - interactionValue: emoji/reaction name
  - studentName: participant name (unmatched-safe)
  - metadata:
    - participant_name
    - participant_id
    - reaction
    - source: zoom_sdk
    - source_event_id: generated id

### Mic toggle
Zoom source:
- onMyMediaChange (audio muted/unmuted)

Backend event:
- eventType: participation:logged
- data:
  - interactionType: mic_toggle
  - interactionValue: muted|unmuted
  - studentName: participant name
  - metadata:
    - participant_name
    - participant_id
    - isMuted: boolean
    - source: zoom_sdk
    - source_event_id: generated id

## Known Zoom Constraints

- Some APIs/events are role-gated (for example participant list/context details may be host/co-host only in some contexts).
- Chat retrieval was intentionally excluded per requirement.
- If join URL is unavailable, fallback to meeting UUID-based synthetic link can still keep session continuity.
- Zoom recommends re-calling config after context/user-context changes.

## Current Implementation Files

- frontend/src/pages/ZoomIframeBridge.jsx
- frontend/src/services/zoomIframeApi.js
- frontend/src/services/zoomSdkBridge.js
- frontend/src/App.jsx

## Suggested Next Backend Additions (Optional, Not Required for MVP)

- Add a dedicated route group alias (for example /api/zoom/...) that forwards to current session/live-event handlers for cleaner separation.
- Add source field indexing for participation logs to support Zoom-vs-Meet analytics segmentation.
- Add idempotency key support on participant join/leave similar to participation source_event_id to harden retries.
