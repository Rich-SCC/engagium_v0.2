# Risk Assessment and Mitigation
## Engagium System - Current Risk Profile

**Last Updated:** April 18, 2026  
**Scope:** Risks tied to currently implemented architecture

---

## 1. Risk Matrix

| ID | Risk | Likelihood | Impact | Mitigation Status |
|----|------|------------|--------|-------------------|
| R1 | Google Meet DOM changes break detectors | High | High | Active mitigation in modular detector architecture |
| R2 | Meeting-side event loss during network interruptions | Medium | High | IndexedDB queue and retry logic implemented |
| R3 | Token misuse (JWT or extension token) | Low | High | JWT validation + hashed extension tokens + revocation |
| R4 | Realtime disconnects causing stale live UI | Medium | Medium | Socket reconnect behavior + API refresh paths |
| R5 | Name matching inaccuracies for roster linkage | Medium | Medium | Linking endpoints and manual correction workflows |
| R6 | Data drift between docs and implementation | Medium | Medium | Source-of-truth architecture docs and audit updates |
| R7 | Query latency growth with long-term data accumulation | Medium | Medium | Indexed schema + aggregation endpoints + optimization review |
| R8 | Zoom bridge integration dependency changes | Medium | Medium | Keep Zoom path isolated in dedicated bridge services |

---

## 2. Detailed Risks and Controls

### R1. Google Meet DOM volatility

Risk:

- DOM selectors and accessibility attributes can change without notice.

Controls in codebase:

- Detector modules are separated by event type for targeted fixes.
- Shared selector/config utilities reduce blast radius of DOM updates.
- Tracking failures can degrade to partial mode instead of complete failure.

### R2. Offline/unstable network during active sessions

Risk:

- Event writes can fail while classes are live.

Controls in codebase:

- Extension stores failed work locally (IndexedDB via sync queue).
- Retry logic replays queued events after connectivity recovery.

### R3. Authentication/token compromise

Risk:

- Unauthorized access if tokens leak.

Controls in codebase:

- JWT verification and refresh flow separation.
- Extension token hashes persisted server-side (not plaintext).
- Token revocation endpoints including revoke-all support.
- Rate limiting with identity-aware key generation in backend.

### R4. Realtime sync inconsistency

Risk:

- Users may temporarily see stale live feed/session state when sockets drop.

Controls in codebase:

- Socket room model isolates updates by instructor/session.
- Frontend can rehydrate state from REST endpoints.
- Session status request/response events support quick sync checks.

### R5. Participant-to-student matching errors

Risk:

- Display names in meetings may not exactly match roster names.

Controls in codebase:

- Student matching utilities on extension side.
- Link participant-to-student endpoint in sessions API.
- Student merge/from-participant workflows in class APIs.

### R6. Documentation drift

Risk:

- Thesis docs become inconsistent with active code.

Controls in process:

- Architecture/framework docs treated as canonical overviews.
- Route/schema/module audits performed during doc updates.

### R7. Data volume and performance pressure

Risk:

- Growing participation and attendance logs can affect response times.

Controls in codebase:

- Indexed query columns across session/attendance/participation tables.
- Dedicated summary endpoints reduce expensive frontend-side aggregation.

### R8. External Zoom platform dependency

Risk:

- Zoom Apps SDK behavior or requirements can change.

Controls in codebase:

- Zoom functionality isolated to bridge pages/services.
- Shared backend contract allows Zoom-specific changes without redesigning core schema.

---

## 3. Contingency Plans

1. Detector break from Meet DOM update:
- Freeze broken detector path.
- Patch selectors/config in detector module.
- Validate with controlled test meeting before release.

2. Token compromise response:
- Revoke token(s) through existing API endpoints.
- Rotate secrets where applicable.
- Re-authenticate affected clients.

3. Realtime outage:
- Rely on REST polling/refresh for critical views.
- Restore socket service and rejoin instructor/session rooms.

---

## 4. Monitoring Focus

- Extension queue backlog size and retry success rates.
- Session/attendance API error rates.
- Socket connection churn and reconnect frequency.
- Token verification failures and suspicious auth patterns.
- Slow query hotspots in session/participation endpoints.

