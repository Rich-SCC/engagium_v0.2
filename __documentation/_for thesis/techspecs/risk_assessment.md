# Risk Assessment and Mitigation
## Engagium System - Chapter 3.12 Reference

This document identifies potential risks during development and testing of the Engagium system, along with mitigation strategies.

---

## Risk Assessment Matrix

| Risk ID | Risk Description | Likelihood | Impact | Risk Level | Mitigation Strategy |
|---------|------------------|------------|--------|------------|---------------------|
| R01 | Google Meet UI/DOM changes | High | High | **Critical** | Modular DOM selectors in config file; regular monitoring of Google Meet updates; fallback detection methods |
| R02 | Chrome extension API changes | Medium | High | **High** | Use stable Manifest V3 APIs; avoid deprecated features; monitor Chrome release notes |
| R03 | Browser throttling of background scripts | Medium | Medium | **Medium** | Implement keep-alive mechanisms; use service worker efficiently; batch API calls |
| R04 | Internet connectivity issues | Medium | Medium | **Medium** | Offline-first architecture with IndexedDB; sync queue for failed requests; automatic retry with exponential backoff |
| R05 | Incomplete participation detection | High | Medium | **High** | Clearly document detection requirements (panels must be open); provide user guidance; mark as "under development" features |
| R06 | Name matching inaccuracies | Medium | Low | **Low** | Fuzzy matching algorithm; manual correction UI in dashboard; student roster management |
| R07 | Database performance degradation | Low | High | **Medium** | Proper indexing; query optimization; pagination for large datasets |
| R08 | Authentication token compromise | Low | High | **Medium** | Short-lived access tokens; secure token storage; HTTPS enforcement; token revocation capability |
| R09 | WebSocket connection instability | Medium | Medium | **Medium** | Automatic reconnection logic; fallback to HTTP polling; connection status indicators |
| R10 | Limited testing sample size | High | Medium | **High** | Maximize faculty participation; document limitations; use statistical methods appropriate for sample size |
| R11 | Time constraints for development | Medium | Medium | **Medium** | Prioritize core features (MVP approach); iterative development; clear scope boundaries |
| R12 | Cross-browser compatibility issues | Medium | Low | **Low** | Focus on Chrome (primary target); document browser requirements; test on latest stable versions |

---

## Detailed Risk Analysis

### R01: Google Meet UI/DOM Changes

**Description:** Google frequently updates the Google Meet interface, which may change the DOM structure that the extension relies on for detecting participants and events.

**Impact:** Detection of participants, chat messages, reactions, and hand raises may fail completely or produce inaccurate results.

**Mitigation Strategies:**
1. **Centralized Selectors:** All DOM selectors are stored in `config.js` for easy updates
2. **ARIA-based Detection:** Use accessibility attributes (role, aria-label) which are more stable than class names
3. **Multiple Detection Methods:** Implement fallback detection strategies (e.g., toast notifications + panel monitoring)
4. **Monitoring:** Regular testing against live Google Meet to catch changes early
5. **Graceful Degradation:** System continues to function with reduced features if some detection fails

---

### R02: Chrome Extension API Changes

**Description:** Chrome may deprecate or modify extension APIs, particularly as Manifest V3 evolves.

**Impact:** Extension may stop functioning or require significant refactoring.

**Mitigation Strategies:**
1. **Manifest V3 Compliance:** Already using the latest manifest version
2. **Stable APIs Only:** Avoid experimental or deprecated APIs
3. **Documentation Review:** Monitor Chrome developer documentation for announcements
4. **Modular Architecture:** Service worker and content scripts are decoupled for easier updates

---

### R03: Browser Throttling of Background Scripts

**Description:** Chrome aggressively suspends service workers to conserve resources, which may interrupt tracking during long sessions.

**Impact:** Events may be missed if service worker is suspended at critical moments.

**Mitigation Strategies:**
1. **Keep-alive Mechanisms:** Periodic alarms to prevent suspension
2. **Content Script Primary:** Critical detection runs in content scripts (not affected by service worker suspension)
3. **Local Storage:** IndexedDB stores events before service worker processes them
4. **Event Batching:** Batch events to reduce wake-up frequency

---

### R04: Internet Connectivity Issues

**Description:** Users may experience network interruptions during online classes.

**Impact:** Participation events may fail to sync to the backend.

**Mitigation Strategies:**
1. **Offline-First Design:** All events stored locally in IndexedDB first
2. **Sync Queue:** Failed API requests are queued for retry
3. **Exponential Backoff:** Retry logic prevents overwhelming the server
4. **Status Indicators:** UI shows sync status to user
5. **Session Recovery:** Events are preserved even if browser closes unexpectedly

---

### R05: Incomplete Participation Detection

**Description:** Some participation types (chat, reactions, hand raises, mic toggles) require specific UI panels to be open and may not detect all events accurately.

**Impact:** Participation data may be incomplete, affecting accuracy metrics.

**Mitigation Strategies:**
1. **Clear Documentation:** User guide explains requirements (e.g., "Keep People Panel open")
2. **Visual Indicators:** Extension shows what is being tracked
3. **Attendance Priority:** Focus on attendance (join/leave) as primary, most reliable metric
4. **Status Labeling:** Mark participation features as "Beta" or "Under Development"
5. **User Feedback:** Provide mechanism for users to report detection issues

---

### R06: Name Matching Inaccuracies

**Description:** Participant display names in Google Meet may not exactly match student roster names.

**Impact:** Attendance records may not link to correct students, requiring manual correction.

**Mitigation Strategies:**
1. **Fuzzy Matching:** Algorithm tolerates minor variations (extra spaces, nicknames)
2. **Manual Linking:** Dashboard allows instructor to manually link participants to students
3. **Learning:** System can remember previous name mappings
4. **Unmatched Tracking:** Unmatched participants are still tracked, just not linked to roster

---

### R07: Database Performance Degradation

**Description:** As data accumulates over time, database queries may slow down.

**Impact:** Dashboard loading times increase, affecting user experience.

**Mitigation Strategies:**
1. **Proper Indexing:** All foreign keys and frequently queried columns are indexed
2. **Pagination:** Large result sets are paginated
3. **Query Optimization:** Use efficient JOIN patterns and avoid N+1 queries
4. **Archival:** Old sessions can be archived to separate tables (future enhancement)

---

### R08: Authentication Token Compromise

**Description:** Access tokens or extension tokens could be intercepted or stolen.

**Impact:** Unauthorized access to instructor's class and student data.

**Mitigation Strategies:**
1. **Short-lived Tokens:** Access tokens expire in 15 minutes
2. **HTTPS Only:** All API communication encrypted
3. **Token Revocation:** Users can revoke extension tokens from dashboard
4. **Secure Storage:** Tokens stored in Chrome's secure storage API
5. **No Sensitive Data in Tokens:** JWTs contain only user ID, not sensitive information

---

### R09: WebSocket Connection Instability

**Description:** WebSocket connections may drop due to network issues or server restarts.

**Impact:** Real-time updates stop appearing in dashboard.

**Mitigation Strategies:**
1. **Auto-Reconnection:** Socket.io automatically attempts to reconnect
2. **Connection Status:** UI indicates connection state
3. **Data Refresh:** Dashboard can manually refresh data if connection issues persist
4. **Graceful Fallback:** Core functionality works without real-time updates (just delayed)

---

### R10: Limited Testing Sample Size

**Description:** Small number of faculty testers may limit statistical validity of usability findings.

**Impact:** Survey results may not be generalizable; may not discover all usability issues.

**Mitigation Strategies:**
1. **Maximize Participation:** Coordinate with institution to encourage faculty participation
2. **Appropriate Statistics:** Use statistical methods suitable for small samples
3. **Qualitative Data:** Supplement quantitative data with qualitative feedback
4. **Document Limitations:** Clearly state sample size limitations in findings
5. **Multiple Testing Rounds:** If possible, conduct multiple testing sessions

---

### R11: Time Constraints for Development

**Description:** Academic timeline may not allow completion of all planned features.

**Impact:** Some features may be incomplete or untested.

**Mitigation Strategies:**
1. **MVP Approach:** Prioritize core features (attendance tracking) over advanced features
2. **Feature Prioritization:** Clear categorization of must-have vs nice-to-have
3. **Iterative Development:** Deliver working increments rather than big-bang release
4. **Scope Management:** Document planned vs implemented features clearly
5. **Technical Debt Tracking:** Acknowledge and document incomplete items

---

### R12: Cross-Browser Compatibility Issues

**Description:** Extension may not work correctly on browsers other than Chrome.

**Impact:** Users on other browsers cannot use the extension.

**Mitigation Strategies:**
1. **Primary Target:** Focus on Chrome as the primary supported browser
2. **Clear Requirements:** Document Chrome as required browser
3. **Standard APIs:** Use standard web APIs where possible for potential future porting
4. **Version Requirements:** Specify minimum Chrome version (120+)

---

## Risk Response Summary

| Response Type | Risks |
|---------------|-------|
| **Mitigate** | R01, R02, R03, R04, R05, R06, R07, R08, R09 |
| **Accept** | R10, R11, R12 |
| **Transfer** | None |
| **Avoid** | None |

---

## Contingency Plans

### If Google Meet DOM Changes Significantly
1. Pause tracking features temporarily
2. Analyze new DOM structure
3. Update selectors in config.js
4. Test thoroughly before re-enabling
5. Notify users of temporary service interruption

### If Extension Token is Compromised
1. User revokes all tokens from Settings page
2. Generate new extension token
3. Re-authenticate extension
4. Review access logs if available

### If Participation Detection Fails
1. Fall back to attendance-only tracking
2. Document which features are affected
3. Provide manual participation entry option
4. Work on updated detection logic

---

## Monitoring and Review

| Activity | Frequency |
|----------|-----------|
| Test extension against live Google Meet | Before each release |
| Review Chrome extension documentation | Monthly |
| Check database query performance | After significant data growth |
| Review error logs | Weekly during active testing |
| User feedback collection | Ongoing during testing phase |

---

*This risk assessment is based on the Engagium system architecture and development context as of December 2025.*
