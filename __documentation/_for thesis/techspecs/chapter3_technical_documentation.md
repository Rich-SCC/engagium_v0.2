# Engagium System - Chapter 3 Technical Documentation
## Consolidated Current Implementation Reference

**Last Updated:** April 18, 2026  
**Purpose:** Consolidated Chapter 3 technical reference aligned to live codebase

---

## 1. Scope

This file is the umbrella reference for Chapter 3 technical content and maps to the supporting techspec files in this folder.

System scope reflected here:

- React instructor dashboard.
- Google Meet Chrome extension (Manifest V3).
- Zoom Apps SDK bridge flow in frontend.
- Node.js/Express/PostgreSQL/Socket.io backend.

---

## 2. Reference Map

- `agile_sdlc_methodology.md` - Delivery method and iteration model used for implemented features.
- `system_architecture.md` - Runtime surfaces, auth split, module boundaries.
- `module_descriptions.md` - Current module inventory by backend/frontend/extension.
- `data_flow_diagrams.md` - Current operational flows for session, attendance, participation, auth, and offline retry.
- `technology_stack.md` - Current package and runtime stack with versions.
- `database_schema.md` - Active tables, enums, constraints, and semantics.
- `development_progress.md` - Current implementation status and scope boundaries.
- `risk_assessment.md` - Risks and mitigation tied to present architecture.

---

## 3. Current Architecture Summary

### 3.1 Product surfaces

1. Dashboard web app for instructor workflows.
2. Google Meet extension for event capture.
3. Zoom bridge pages/services for Zoom context.

### 3.2 Backend core

- REST APIs for auth, classes, sessions, participation, extension tokens.
- Socket.io room-based realtime layer.
- PostgreSQL schema as shared system of record.

### 3.3 Auth model

- JWT access/refresh for web clients.
- Extension tokens for meeting-side clients.
- `flexibleAuth` for mixed-client routes.

---

## 4. Current Functional Coverage

Implemented and active:

- Instructor account/auth flows.
- Class and roster lifecycle with bulk tools.
- Session lifecycle from meeting context.
- Attendance interval tracking and reconciliation.
- Participation event logging (single and bulk).
- Real-time live feed and session synchronization.
- Zoom bridge route/service integration.

Not active as current implementation:

- Notification-center product module.
- Zoom extension bot/content script path.

---

## 5. Chapter 3 Writing Guidance

When preparing thesis sections, use current route/module/table names exactly as implemented.

Avoid outdated references such as:

- `notificationRoutes` or notification controller claims.
- Legacy socket event names not emitted by current handler.
- Assumptions that extension content scripts match all Meet URLs (content script is narrower than web-accessible resource matches).

---

## 6. Validation Basis

This consolidated document is aligned against:

- Backend route declarations in `backend/src/routes/`.
- Frontend route declarations in `frontend/src/App.jsx`.
- Extension manifest and module tree in `_extension/`.
- PostgreSQL schema in `backend/db/schema.sql`.
- Dependency versions in package manifests.

---

## 7. Conclusion

Chapter 3 technical documentation should now be treated as implementation-led: every claim should map directly to a live module, route, schema object, or runtime behavior visible in the current codebase.

