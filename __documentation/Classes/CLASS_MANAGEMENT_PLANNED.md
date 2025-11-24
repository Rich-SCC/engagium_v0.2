# Class Management - Planned Features

## Features Not Yet Implemented

### 1. Auto-Capture Session Links via Extension
**Status:** 🔄 Planned for Post-MVP

**Description:**
Automatically detect and save meeting links when instructor toggles the browser extension during a session.

**Implementation Requirements:**
- Browser extension development
- Extension backend communication
- Link detection from current tab
- Auto-association with active class
- Permission handling

**Use Case:**
Instructor joins Zoom meeting → Extension detects link → Automatically saved to class links

---

### 2. Zoom Breakout Room Detection
**Status:** 🔄 Planned for Post-MVP

**Description:**
Detect and track which breakout room students are in during Zoom sessions.

**Implementation Requirements:**
- Zoom API integration
- OAuth authentication with Zoom
- Webhook setup for breakout room events
- Real-time breakout room assignment tracking
- UI for breakout room management

**Challenges:**
- Complex Zoom API integration
- Real-time data synchronization
- Permission requirements from Zoom

---

### 3. Student Self-Enrollment
**Status:** ❌ Deferred (No Student-Side App)

**Description:**
Class code/invite system for students to self-enroll in classes.

**Why Deferred:**
- No student-facing application in MVP
- Instructor manages all student data
- May be reconsidered in future versions

---

### 4. Real-Time Session Link Validation
**Status:** 🔄 Planned Enhancement

**Description:**
Validate meeting links are active/accessible before session starts.

**Implementation Requirements:**
- Link validation service
- HTTP request to verify link accessibility
- Status indicators (active/inactive/expired)
- Automated checks before scheduled sessions

---

### 5. Link Scheduling
**Status:** 🔄 Planned Enhancement

**Description:**
Associate specific links with specific days/times in schedule.

**Example:**
- Monday: Main lecture hall link
- Wednesday: Lab room link
- Friday: Review session link

**Implementation Requirements:**
- Enhanced schedule schema
- Link-to-schedule mapping
- UI for schedule-link association
- Auto-suggest link based on current day/time

---

### 6. Recurring Schedule Templates
**Status:** 🔄 Planned Enhancement

**Description:**
Pre-defined schedule templates (e.g., MWF 10am, TR 2pm).

**Implementation:**
- Common schedule patterns
- Quick-apply templates
- Custom template creation
- Template sharing across classes

---

### 7. Student Groups/Sections
**Status:** 🔄 Planned Enhancement

**Description:**
Divide class into groups for different activities, assignments, or breakout rooms.

**Features:**
- Create multiple groups per class
- Assign students to groups
- Group-specific links
- Group-based tracking

---

### 8. Class Capacity Limits
**Status:** 🔄 Planned Enhancement

**Description:**
Set maximum student capacity and enrollment limits.

**Features:**
- Define max capacity
- Warning when approaching limit
- Enrollment status tracking
- Waitlist functionality (future)

---

### 9. Co-Instructor Management
**Status:** 🔄 Planned Enhancement

**Description:**
Add multiple instructors to a class with different permission levels.

**Roles:**
- Owner (full access)
- Co-instructor (most access)
- TA (limited access)
- Observer (read-only)

**Implementation:**
- Class permissions table
- Role-based access control
- Permission inheritance
- Invitation system

---

### 10. Class Templates
**Status:** 🔄 Planned Enhancement

**Description:**
Save class configuration as template for quick creation of similar classes.

**Features:**
- Save as template (schedule, links, exemptions)
- Template library
- Apply template to new class
- Template versioning

---

### 11. Bulk Class Operations
**Status:** 🔄 Planned Enhancement

**Description:**
Perform operations on multiple classes at once.

**Operations:**
- Bulk archive/unarchive
- Bulk schedule updates
- Copy students between classes
- Mass email to classes

---

### 12. Advanced Student Import
**Status:** 🔄 Planned Enhancement

**Current:** Basic CSV import with first_name, last_name, email, student_id

**Planned Enhancements:**
- Excel file support (.xlsx)
- Import from LMS (Canvas, Blackboard, Moodle)
- Field mapping interface
- Import history and rollback
- Duplicate detection and merge
- Photo import
- Custom field import

---

### 13. Student Photos/Avatars
**Status:** 🔄 Planned Enhancement

**Features:**
- Upload student photos
- Import from CSV/LMS
- Display in roster and sessions
- Face recognition for attendance (future)

---

### 14. Class Analytics Dashboard
**Status:** 🔄 Planned Enhancement

**Metrics:**
- Student attendance trends
- Participation over time
- Most/least engaged students
- Link usage statistics
- Session frequency

---

### 15. Class Communication
**Status:** 🔄 Planned Enhancement

**Features:**
- Announcement system
- Email integration
- SMS notifications (optional)
- In-app messaging
- Read receipts

---

### 16. Integration with Learning Management Systems
**Status:** 🔄 Planned Enhancement

**LMS Support:**
- Canvas
- Blackboard
- Moodle
- Google Classroom

**Features:**
- Import class roster
- Sync grades
- Assignment integration
- Single sign-on (SSO)

---

### 17. Custom Fields for Students
**Status:** 🔄 Planned Enhancement

**Description:**
Allow instructors to add custom fields to student profiles.

**Examples:**
- Major
- Year level
- Preferred name
- Pronouns
- Special accommodations
- Custom IDs

---

### 18. Class Cloning
**Status:** 🔄 Planned Enhancement

**Description:**
Duplicate an entire class including students, links, and settings.

**Use Case:**
- New semester with same students
- Multiple sections of same course
- Backup/test environments

---

### 19. Archive Management
**Status:** 🔄 Planned Enhancement

**Current:** Simple archive toggle

**Planned:**
- Auto-archive after date
- Archive with reason
- Bulk archive by semester
- Export archived data
- Permanent deletion after X months

---

### 20. Exemption Auto-Rules
**Status:** 🔄 Planned Enhancement

**Description:**
Automated rules for exempting accounts.

**Examples:**
- Auto-exempt emails matching pattern (@ta.university.edu)
- Auto-exempt based on role
- Import exemption lists
- Temporary exemptions with expiry

---

## Integration Requirements (Future)

### Browser Extension
- Link capture functionality
- Session detection
- Auto-class association
- Permission management

### Zoom Integration
- OAuth authentication
- Breakout room API
- Participant tracking
- Meeting controls

### Email Service
- SMTP configuration
- Email templates
- Bulk sending
- Bounce handling

### LMS Integration
- API credentials management
- Data synchronization
- Field mapping
- Error handling

---

## Technical Debt & Improvements

### Backend
- [ ] Add request rate limiting
- [ ] Implement caching for frequently accessed data
- [ ] Add comprehensive logging
- [ ] API versioning
- [ ] GraphQL support (consideration)

### Frontend
- [ ] Offline support (Progressive Web App)
- [ ] Mobile responsive improvements
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop for CSV import
- [ ] Dark mode support

### Database
- [ ] Add full-text search for students
- [ ] Implement soft deletes for all tables
- [ ] Add audit trail/history tables
- [ ] Optimize queries with materialized views

### Testing
- [ ] Unit tests for models
- [ ] Integration tests for API
- [ ] E2E tests for critical workflows
- [ ] Performance testing
- [ ] Load testing

---

## Priority Ranking

### High Priority (Next Sprint)
1. Real-time session link validation
2. Advanced CSV import (Excel support)
3. Class analytics dashboard

### Medium Priority
1. Link scheduling
2. Student groups/sections
3. Co-instructor management
4. Class templates

### Low Priority (Future Consideration)
1. LMS integration
2. Student photos
3. Class communication system
4. Auto-capture via extension

---

## Notes
- Extension-based features require separate browser extension project
- Zoom integration requires Zoom App Marketplace approval
- LMS integration requires partner agreements in some cases
- Face recognition features require careful privacy considerations
