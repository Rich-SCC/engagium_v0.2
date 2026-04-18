# Agile SDLC Methodology
## Engagium System - Current Implementation Reference

**Last Updated:** April 18, 2026  
**Scope:** Methodology used to deliver the currently implemented Engagium codebase

---

## Overview

Engagium was delivered using an iterative Agile SDLC process focused on shipping working slices across three runtime surfaces:

1. React web dashboard.
2. Chrome Manifest V3 Google Meet extension.
3. Node.js + Express + PostgreSQL + Socket.io backend.

As implementation evolved, Zoom support was added through a web bridge path (Zoom Apps SDK in the frontend), not through an extension content script bot.

---

## 1. Agile Model Used

The project followed short implementation cycles with continuous reconciliation between:

- Product behavior visible in UI.
- API contract behavior in backend routes/controllers.
- Database truth in `backend/db/schema.sql`.

Primary Agile practices used:

- Incremental feature slicing (auth, classes, sessions, tracking, analytics).
- Frequent scope correction based on technical feasibility (especially DOM-driven Meet detection).
- Refactoring documentation after each major architecture shift.
- Prioritization of reliability over speculative feature breadth.

---

## 2. Phase Progression (Implemented)

## 2.1 Phase 1: Requirements and Constraints

Validated needs that remain true in the current build:

- Instructor-owned class and session management.
- Attendance and participation tracking for online meetings.
- Real-time monitoring for live classes.
- Persistent analytics and historical reporting.

Constraints captured early and still relevant:

- Google Meet has no official attendance API for this use case.
- Browser extension tracking depends on evolving DOM patterns.
- Meeting-side ingestion requires resilient offline behavior.

## 2.2 Phase 2: System Design

Architecture decisions that were implemented:

- Dual auth model: JWT for web + extension tokens for meeting-side clients.
- Shared backend APIs for web dashboard, extension, and Zoom bridge.
- Session-first data model (`sessions`, `attendance_records`, `attendance_intervals`, `participation_logs`).
- Room-based real-time model in Socket.io.

## 2.3 Phase 3: Iterative Development

Major completed increments:

1. Account/auth foundation (`/api/auth/*`, refresh/reset/profile flows).
2. Class and roster management (`/api/classes/*`, import, merge, bulk actions).
3. Session lifecycle APIs (`/api/sessions/start-from-meeting`, attendance and live-event flows).
4. Participation ingestion (`/api/participation/*`, bulk + summary/recent endpoints).
5. Extension token lifecycle (`/api/extension-tokens/*`).
6. Real-time dashboard synchronization (Socket.io events + frontend context).
7. Zoom bridge routes and SDK-facing frontend services.

## 2.4 Phase 4: Validation and Hardening

Validation strategy used in current codebase:

- Route-level API verification against real controllers.
- End-to-end manual flow testing (Meet extension -> backend -> dashboard).
- Schema consistency checks for attendance/participation calculations.
- Runtime hardening with CORS constraints, Helmet, and rate limiting.

## 2.5 Phase 5: Deployment Readiness

Current deployment model supports:

- Docker-based development and production compose flows.
- Vite frontend build deployment behind web server/reverse proxy.
- Node backend startup with schema readiness checks.

---

## 3. Backlog Evolution Summary

The Agile backlog shifted from thesis-era assumptions to current implementation reality:

- Removed as primary path: manual-first session creation.
- Removed: notification-center feature surface.
- Refined: extension only targets Google Meet.
- Added and stabilized: Zoom Apps SDK web bridge path.
- Expanded: roster bulk operations, tags, notes, exemptions, session bundling UX.

---

## 4. Current Agile Outcomes

Current outcomes visible in code:

- Feature completeness across core instructor workflows.
- Single shared system of record in PostgreSQL.
- Real-time and batch ingestion paths for meeting events.
- Recoverable meeting-side behavior through offline queue and retries.

Remaining Agile focus is operational quality:

- Regression testing depth.
- Documentation synchronization discipline.
- Production telemetry and reliability feedback loops.

---

## 5. Methodology Conclusion

The Agile approach succeeded for this project because it supported repeated adaptation to platform constraints (Google Meet DOM behavior, token models, and realtime synchronization) while continuously keeping deliverables anchored to working code.

This document should be read together with:

- `system_architecture.md`
- `module_descriptions.md`
- `database_schema.md`
- `development_progress.md`
